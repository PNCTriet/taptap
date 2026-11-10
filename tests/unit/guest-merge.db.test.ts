/**
 * Merge idempotency + ownership against the real Supabase RPCs.
 * Needs NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY and E2E_{VISITOR,EDITOR}_{EMAIL,PASSWORD}; skipped otherwise.
 */
import { describe, expect, it } from "vitest";
import { newGuestToken } from "@/server/guest/token";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ready = Boolean(URL_ && KEY && process.env.E2E_VISITOR_EMAIL && process.env.E2E_EDITOR_EMAIL);
const B2B_CODE = "tt-democube002";
const B2C_CODE = "tcv-k9x2m4p8";

async function token(who: "VISITOR" | "EDITOR") {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: KEY!, "content-type": "application/json" },
    body: JSON.stringify({ email: process.env[`E2E_${who}_EMAIL`], password: process.env[`E2E_${who}_PASSWORD`] }),
  });
  return ((await r.json()) as { access_token: string }).access_token;
}
async function rpc(fn: string, body: unknown, jwt?: string) {
  const r = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: KEY!, authorization: `Bearer ${jwt ?? KEY}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: r.status, json: (await r.json().catch(() => null)) as Record<string, unknown> | unknown[] | null };
}
async function removeMyStamp(jwt: string, stampName: string) {
  const list = (await rpc("my_passport_v2", {}, jwt)).json as { id: string; name: string }[];
  for (const s of list.filter((x) => x.name === stampName)) {
    await fetch(`${URL_}/rest/v1/collected_stamps?id=eq.${s.id}`, { method: "DELETE", headers: { apikey: KEY!, authorization: `Bearer ${jwt}` } });
  }
}

describe.skipIf(!ready)("guest -> account merge (database)", () => {
  it("is idempotent and dedupes stamps the account already owns", async () => {
    const editor = await token("EDITOR");
    await removeMyStamp(editor, "Puzzle Cube");
    // Account already owns the B2C stamp.
    await rpc("collect_stamp_by_code", { p_code: B2C_CODE }, editor);

    const guest = newGuestToken();
    expect((await rpc("collect_stamp_as_guest", { p_token: guest, p_code: B2B_CODE })).status).toBe(200);
    expect((await rpc("collect_stamp_as_guest", { p_token: guest, p_code: B2C_CODE })).status).toBe(200);
    // Guest collect is itself idempotent.
    const again = (await rpc("collect_stamp_as_guest", { p_token: guest, p_code: B2B_CODE })).json as { newly_collected: boolean };
    expect(again.newly_collected).toBe(false);
    expect(((await rpc("guest_passport", { p_token: guest })).json as unknown[]).length).toBe(2);

    const first = await rpc("merge_guest_into_me", { p_token: guest }, editor);
    expect(first.json).toEqual({ merged: 1, alreadyOwned: 1 });
    const second = await rpc("merge_guest_into_me", { p_token: guest }, editor);
    expect(second.json).toEqual({ merged: 0, alreadyOwned: 0 });

    const mine = (await rpc("my_passport_v2", {}, editor)).json as { name: string; source: string; tenantName?: string; roomName?: string }[];
    const cube = mine.filter((s) => s.name === "Puzzle Cube");
    expect(cube).toHaveLength(1);
    expect(cube[0]).toMatchObject({ source: "b2b", tenantName: "Demo Toy Studio" });
    expect(mine.filter((s) => s.source === "b2c" && s.name === "Asian Elephant")).toHaveLength(1);
    // The guest passport is emptied.
    expect((await rpc("guest_passport", { p_token: guest })).json).toEqual([]);
    await removeMyStamp(editor, "Puzzle Cube");
  });

  it("only the token holder can merge, only into themselves, and never when signed out", async () => {
    const [visitor, editor] = await Promise.all([token("VISITOR"), token("EDITOR")]);
    await removeMyStamp(editor, "Puzzle Cube");
    const guest = newGuestToken();
    await rpc("collect_stamp_as_guest", { p_token: guest, p_code: B2B_CODE });

    // Signed-out callers cannot merge.
    expect((await rpc("merge_guest_into_me", { p_token: guest })).status).toBeGreaterThanOrEqual(400);
    // A different (guessed) token merges nothing.
    expect((await rpc("merge_guest_into_me", { p_token: newGuestToken() }, visitor)).json).toEqual({ merged: 0, alreadyOwned: 0 });
    // Malformed tokens are rejected.
    expect((await rpc("merge_guest_into_me", { p_token: "nope" }, visitor)).status).toBe(400);

    // Editor (token holder) merges; afterwards the visitor cannot re-claim the same guest progress.
    expect(((await rpc("merge_guest_into_me", { p_token: guest }, editor)).json as { merged: number }).merged).toBe(1);
    expect((await rpc("merge_guest_into_me", { p_token: guest }, visitor)).json).toEqual({ merged: 0, alreadyOwned: 0 });
    // Guest RPCs cannot be used to read someone else's account passport.
    expect((await rpc("guest_passport", { p_token: guest })).json).toEqual([]);
    await removeMyStamp(editor, "Puzzle Cube");
  });
});
