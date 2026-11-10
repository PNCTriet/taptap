import React from "react";
import { AdminChrome } from "@/components/admin-chrome";
import { AccessDenied } from "@/components/console/access-gate";
import { getSession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

/** Server-side guard: /admin/** requires app_metadata.platform_role = platform_admin. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isPlatformAdmin } = await getSession();
  return (
    <AdminChrome>
      {isPlatformAdmin ? children : <AccessDenied signedIn={Boolean(user)} next="/admin" />}
    </AdminChrome>
  );
}
