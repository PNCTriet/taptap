import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

/** The signed-in visitor's B2C collected stamps (server-mapped to stations). */
export async function GET() {
  const { supabase, user } = await getSession();
  if (!supabase || !user) return NextResponse.json({ records: [] }, { status: 401 });
  const { data, error } = await supabase.rpc("my_passport");
  if (error) return NextResponse.json({ records: [] }, { status: 500 });
  return NextResponse.json({ records: data ?? [] });
}
