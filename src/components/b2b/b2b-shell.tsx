"use client";

import React, { Suspense } from "react";
import { Contact, DoorOpen, Gauge, LayoutDashboard, MapPin, Stamp, Tag, Users } from "lucide-react";
import { Select, useTx } from "@/components/console/kit";
import { CrmFrame, type CrmNavItem } from "@/components/crm/frame";
import { TenantProvider, useTenant } from "./tenant-context";

function ShellInner({ children }: { children: React.ReactNode }) {
  const tx = useTx();
  const { tenants, tenant, role, select, href, loading } = useTenant();
  const links: CrmNavItem[] = [
    { href: href("/b2b"), label: tx("Overview", "Tổng quan"), icon: LayoutDashboard, exact: true, tab: true },
    { href: href("/b2b/visitors"), label: tx("Visitors", "Khách"), icon: Users, tab: true },
    { href: href("/b2b/rooms"), label: tx("Rooms", "Phòng"), icon: DoorOpen, tab: true },
    { href: href("/b2b/stations"), label: tx("Stations", "Trạm"), icon: MapPin, tab: true },
    { href: href("/b2b/stamps"), label: tx("Stamps", "Con dấu"), icon: Stamp },
    { href: href("/b2b/tags"), label: tx("Tags", "Thẻ"), icon: Tag },
    { href: href("/b2b/members"), label: tx("Members", "Thành viên"), icon: Contact },
    { href: href("/b2b/plan"), label: tx("Plan", "Gói"), icon: Gauge },
  ];

  const switcher = tenants.length > 1 ? (
    <Select value={tenant?.slug ?? ""} onChange={(event) => select(event.target.value)} className="mt-1 min-h-11 font-semibold" data-testid="tenant-switcher">
      {tenants.map((item) => (
        <option key={item.id} value={item.slug}>{item.name}{item.is_demo ? " (demo)" : ""}</option>
      ))}
    </Select>
  ) : (
    <p className="truncate text-[15px] font-semibold text-[#1D1D1F]">{tenant?.name ?? (loading ? "…" : tx("No tenant", "Chưa có tenant"))}</p>
  );

  return (
    <CrmFrame
      testId="b2b-shell"
      product={tx("Business", "Doanh nghiệp")}
      title={tenant?.name ?? "TAPTAP"}
      switcher={switcher}
      role={role}
      links={links}
      moreLabel={tx("More", "Thêm")}
    >
      {tenant ? children : loading ? null : <p className="text-[14px] text-[#8E8E93]">{tx("No tenant access.", "Chưa có quyền tenant.")}</p>}
    </CrmFrame>
  );
}

export function B2bShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <TenantProvider>
        <ShellInner>{children}</ShellInner>
      </TenantProvider>
    </Suspense>
  );
}
