import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/server/auth/session";
import { GUEST_COOKIE, isValidGuestToken } from "@/server/guest/token";
import { toLegacyRecords, toPassportStamps } from "@/server/passport/map";

export const dynamic = "force-dynamic";

/**
 * The visitor's passport: B2C + B2B stamps.
 * Signed in -> account passport; otherwise the guest passport bound to the httpOnly guest cookie.
 * `records` (B2C only) is kept for the existing player context.
 */
export async function GET() {
  const { supabase, user } = await getSession();
  if (!supabase) return NextResponse.json({ stamps: [], records: [] });
  let rows: unknown = [];
  let guest = false;
  if (user) {
    const { data, error } = await supabase.rpc("my_passport_v2");
    if (error) return NextResponse.json({ stamps: [], records: [] }, { status: 500 });
    rows = data;
  } else {
    const token = (await cookies()).get(GUEST_COOKIE)?.value;
    if (isValidGuestToken(token)) {
      const { data, error } = await supabase.rpc("guest_passport", { p_token: token });
      if (error) return NextResponse.json({ stamps: [], records: [] }, { status: 500 });
      rows = data;
      guest = true;
    }
  }
  return NextResponse.json({ stamps: toPassportStamps(rows), records: toLegacyRecords(rows), guest });
}
