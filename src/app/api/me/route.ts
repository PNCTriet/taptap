import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

/** Who am I + which admin areas can I open. Also accepts pending tenant invitations. */
export async function GET() {
  const { supabase, user, isPlatformAdmin } = await getSession();
  if (!supabase || !user) {
    return NextResponse.json({ user: null, isPlatformAdmin: false, tenants: [] });
  }
  await supabase.rpc("accept_my_invitations");
  const { data } = await supabase
    .from("tenant_members")
    .select("role, tenant:tenants(id, slug, name, status, is_demo)")
    .eq("user_id", user.id);
  return NextResponse.json({
    user: { id: user.id, email: user.email ?? null },
    isPlatformAdmin,
    tenants: (data ?? []).map((row) => ({ role: row.role, ...(row.tenant as unknown as object) })),
  });
}
