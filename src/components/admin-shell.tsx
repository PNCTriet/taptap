"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { PLAYER_HOME } from "@/lib/routes";

const B2C_LINKS = [
  { href: "/admin", en: "Overview", vi: "Tổng quan" },
  { href: "/admin/venues", en: "Venues", vi: "Điểm đến" },
  { href: "/admin/collections", en: "Collections", vi: "Bộ sưu tập" },
  { href: "/admin/stations", en: "Stations", vi: "Trạm" },
  { href: "/admin/stamps", en: "Stamps", vi: "Con dấu" },
  { href: "/admin/tags", en: "NFC tags", vi: "Thẻ NFC" },
  { href: "/admin/rewards", en: "Rewards", vi: "Phần thưởng" },
];

const B2B_LINKS = [
  { href: "/admin/b2b", en: "Business", vi: "Doanh nghiệp" },
  { href: "/admin/b2b/packages", en: "Packages", vi: "Gói" },
  { href: "/admin/b2b/tenants", en: "Tenants", vi: "Tenant" },
];

/** Platform admin chrome: B2C CMS + B2B platform sections. */
export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { locale } = useExplorer();
  const isB2b = pathname?.startsWith("/admin/b2b");
  const links = isB2b ? B2B_LINKS : B2C_LINKS;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div role="tablist" className="inline-flex rounded-xl bg-[#F2F2F7] p-1 text-[13px] font-semibold">
          <Link href="/admin" role="tab" aria-selected={!isB2b} className={`rounded-lg px-3 py-1.5 ${!isB2b ? "bg-white shadow-sm text-[#1D1D1F]" : "text-[#6E6E73]"}`}>
            B2C CMS
          </Link>
          <Link href="/admin/b2b" role="tab" aria-selected={isB2b} className={`rounded-lg px-3 py-1.5 ${isB2b ? "bg-white shadow-sm text-[#1D1D1F]" : "text-[#6E6E73]"}`} data-testid="admin-tab-b2b">
            B2B
          </Link>
        </div>
        <Link
          href={PLAYER_HOME}
          target="_blank"
          data-testid="open-player-cta"
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#176B61] px-3 text-[13px] font-semibold text-white"
        >
          {locale === "vi" ? "Mở trải nghiệm B2C" : "Open B2C experience"}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
      <nav aria-label="Admin sections" className="-mx-4 overflow-x-auto px-4">
        <div className="flex w-max gap-1.5">
          {links.map((item) => {
            const active = item.href === "/admin" || item.href === "/admin/b2b" ? pathname === item.href : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${
                  active ? "bg-[#1D1D1F] text-white" : "bg-white text-[#3A3A3C] ring-1 ring-black/[0.08]"
                }`}
              >
                {locale === "vi" ? item.vi : item.en}
              </Link>
            );
          })}
        </div>
      </nav>
      {title ? (
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#1D1D1F]">{title}</h1>
          {subtitle ? <p className="text-[14px] text-[#6E6E73]">{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
