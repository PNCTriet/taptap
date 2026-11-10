import React from "react";
import { AccessDenied } from "@/components/console/access-gate";
import { B2bShell } from "@/components/b2b/b2b-shell";
import { BusinessChrome } from "@/components/b2b/b2b-chrome";
import { getSession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

/** Server-side guard: /b2b/** requires a tenant membership (or platform admin). */
export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, isPlatformAdmin } = await getSession();
  let body: React.ReactNode = <B2bShell>{children}</B2bShell>;
  if (!supabase || !user) {
    body = <AccessDenied signedIn={false} next="/b2b" />;
  } else if (!isPlatformAdmin) {
    await supabase.rpc("accept_my_invitations");
    const { count } = await supabase
      .from("tenant_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if (!count) body = <AccessDenied signedIn next="/b2b" />;
  }
  return <BusinessChrome>{body}</BusinessChrome>;
}
