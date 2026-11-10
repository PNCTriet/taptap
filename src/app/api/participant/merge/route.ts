import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/server/auth/session";
import { mapDbError } from "@/server/quota/errors";
import { GUEST_COOKIE, isValidGuestToken } from "@/server/guest/token";
import { parseMergeResult } from "@/server/passport/map";

export const dynamic = "force-dynamic";

/**
 * Merge this browser's guest progress into the signed-in account.
 * The guest is identified only by the httpOnly cookie (never by request body), so a client
 * cannot point the merge at someone else's progress. The DB call is idempotent.
 */
export async function POST() {
  const { supabase, user } = await getSession();
  if (!supabase || !user) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED", merged: 0, alreadyOwned: 0 }, { status: 401 });
  }
  const jar = await cookies();
  const token = jar.get(GUEST_COOKIE)?.value;
  if (!isValidGuestToken(token)) {
    return NextResponse.json({ ok: true, merged: 0, alreadyOwned: 0 });
  }
  const { data, error } = await supabase.rpc("merge_guest_into_me", { p_token: token });
  if (error) {
    const mapped = mapDbError(error);
    return NextResponse.json({ ok: false, ...mapped, merged: 0, alreadyOwned: 0 }, { status: mapped.status });
  }
  const res = NextResponse.json({ ok: true, ...parseMergeResult(data) });
  res.cookies.delete(GUEST_COOKIE);
  return res;
}
