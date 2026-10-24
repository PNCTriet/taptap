"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Building2,
  FolderKanban,
  LayoutDashboard,
  MapPin,
  Stamp,
} from "lucide-react";
import { useExplorer } from "@/context/explorer-context";

const ADMIN_LINKS = [
  { href: "/admin", labelEn: "Overview", labelVi: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/venues", labelEn: "Venues", labelVi: "Điểm đến", icon: Building2 },
  {
    href: "/admin/collections",
    labelEn: "Collections",
    labelVi: "Bộ sưu tập",
    icon: FolderKanban,
  },
  {
    href: "/admin/stations",
    labelEn: "Stations",
    labelVi: "Trạm & NFC",
    icon: MapPin,
  },
  { href: "/admin/stamps", labelEn: "Stamps", labelVi: "Con dấu", icon: Stamp },
  {
    href: "/admin/rewards",
    labelEn: "Rewards",
    labelVi: "Phần thưởng",
    icon: Award,
  },
];

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { locale } = useExplorer();

  return (
    <div className="space-y-6">
      {/* Compact Admin Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6DECB] pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {ADMIN_LINKS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-colors ${
                  active
                    ? "bg-[#176B61] text-white"
                    : "bg-white border border-[#E6DECB] text-[#525D58] hover:text-[#272E2B]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{locale === "vi" ? item.labelVi : item.labelEn}</span>
              </Link>
            );
          })}
        </div>

        <Link
          href="/health"
          className="rounded-full bg-[#EAF0FB] px-3 py-1 text-[11px] font-bold text-[#3256AE] hover:underline"
        >
          Health
        </Link>
      </div>

      {/* Compact Page Heading */}
      <div>
        <h1 className="font-display-serif text-2xl font-extrabold text-[#272E2B]">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-[#525D58] mt-0.5">{subtitle}</p>}
      </div>

      {children}
    </div>
  );
}
