"use client";

import { MembersPanel } from "@/components/b2b/members-panel";
import { useTenant } from "@/components/b2b/tenant-context";

export default function TenantMembersPage() {
  const { tenant, canManageMembers, canAssignOwner, refresh } = useTenant();
  if (!tenant) return null;
  return <MembersPanel key={tenant.id} tenantId={tenant.id} canManage={canManageMembers} canAssignOwner={canAssignOwner} onChange={refresh} />;
}
