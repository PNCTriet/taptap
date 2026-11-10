"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Select, useTx } from "@/components/console/kit";
import { TenantProvider, useTenant } from "./tenant-context";

const LINKS = [
  { href: "/b2b", en: "Home", vi: "Tổng quan" },
  { href: "/b2b/rooms", en: "Rooms", vi: "Phòng" },
  { href: "/b2b/stations", en: "Stations", vi: "Trạm" },
  { href: "/b2b/members", en: "Members", vi: "Thành viên" },
  { href: "/b2b/plan", en: "Plan", vi: "Gói" },
];

function ShellInner({ children }: { children: React.ReactNode }) {
  const tx = useTx();
  const pathname = usePathname();
  const { tenants, tenant, role, select, href, loading } = useTenant();
  return (
    <div className="space-y-5" data-testid="b2b-shell">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-[#8E8E93]">TAPTAP Business</p>
          {tenants.length > 1 ? (
            <Select value={tenant?.slug ?? ""} onChange={(e) => select(e.target.value)} className="mt-1 w-auto min-h-[36px] font-semibold" data-testid="tenant-switcher">
              {tenants.map((t) => <option key={t.id} value={t.slug}>{t.name}{t.is_demo ? " (demo)" : ""}</option>)}
            </Select>
          ) : (
            <p className="text-[17px] font-semibold text-[#1D1D1F]">{tenant?.name ?? (loading ? "…" : tx("No tenant", "Chưa có tenant"))}</p>
          )}
        </div>
        {role ? <span className="rounded-full bg-[#F2F2F7] px-3 py-1 text-[13px] font-medium text-[#3A3A3C]" data-testid="tenant-role">{role}</span> : null}
      </div>
      <nav aria-label="Business sections" className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-1.5">
          {LINKS.map((l) => {
            const active = l.href === "/b2b" ? pathname === "/b2b" : pathname?.startsWith(l.href);
            return (
              <Link key={l.href} href={href(l.href)} className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${active ? "bg-[#1D1D1F] text-white" : "bg-white text-[#3A3A3C] ring-1 ring-black/[0.08]"}`}>
                {tx(l.en, l.vi)}
              </Link>
            );
          })}
        </div>
      </nav>
      {tenant ? children : loading ? null : <p className="text-[14px] text-[#8E8E93]">{tx("No tenant access.", "Chưa có quyền tenant.")}</p>}
    </div>
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
