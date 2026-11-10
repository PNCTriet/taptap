import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { publicCodeSchema } from "@/lib/env";
import { getSession } from "@/server/auth/session";
import { mapDbError } from "@/server/quota/errors";
import { GUEST_COOKIE, guestCookieOptions, isValidGuestToken, newGuestToken } from "@/server/guest/token";

const bodySchema = z.object({ code: publicCodeSchema, source: z.enum(["nfc", "qr"]).default("nfc") });

/**
 * Server-validated, idempotent stamp collection (DB unique constraint per participant).
 * Signed in -> account participant. Otherwise -> guest participant bound to an httpOnly cookie
 * issued here; it can later be merged into an account via POST /api/participant/merge.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, code: "INVALID" }, { status: 422 });
  }
  const { supabase, user } = await getSession();
  if (!supabase) {
    return NextResponse.json({ ok: false, code: "UNAVAILABLE" }, { status: 503 });
  }
  const code = parsed.data.code.toLowerCase();

  let token: string | null = null;
  let issued = false;
  if (!user) {
    const existing = (await cookies()).get(GUEST_COOKIE)?.value;
    token = isValidGuestToken(existing) ? existing : newGuestToken();
    issued = token !== existing;
  }

  const { data, error } = user
    ? await supabase.rpc("collect_stamp_by_code", { p_code: code, p_source: parsed.data.source })
    : await supabase.rpc("collect_stamp_as_guest", { p_token: token, p_code: code, p_source: parsed.data.source });
  if (error) {
    const mapped = mapDbError(error);
    return NextResponse.json({ ok: false, ...mapped }, { status: mapped.status });
  }
  const result = data as { ok: boolean; status?: string };
  if (!result.ok) {
    return NextResponse.json({ ok: false, code: result.status ?? "UNAVAILABLE" }, { status: 409 });
  }
  const res = NextResponse.json({ ...result, guest: !user });
  if (issued && token) {
    res.cookies.set(GUEST_COOKIE, token, guestCookieOptions(new URL(request.url).protocol === "https:"));
  }
  return res;
}
