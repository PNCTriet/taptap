"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Building2,
  Database,
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
    labelEn: "Stations & NFC",
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
  subtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { locale } = useExplorer();

  return (
    <div className="space-y-6">
      {/* Honest Data Persistence Banner */}
      <div className="rounded-2xl border border-[#4D73CF]/30 bg-[#EAF0FB] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#4D73CF] text-white flex items-center justify-center shrink-0">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#365EC2]">
              {locale === "vi"
                ? "Chế độ Dữ liệu Admin: Phiên Bản Thử Nghiệm (Seed Mode)"
                : "Admin Persistence Mode: Phase 0 / UI Seed Preview"}
            </p>
            <p className="text-xs text-[#272E2B] mt-0.5">
              {locale === "vi"
                ? "Thay đổi trong bảng điều khiển được lưu vào phiên trình duyệt cục bộ để kiểm thử tức thì và sẵn sàng kết nối RLS Supabase."
                : "Changes created or edited here persist in your active browser session for instant testing and map 1:1 to the Supabase PostgreSQL schema."}
            </p>
          </div>
        </div>
        <Link
          href="/health"
          className="shrink-0 inline-flex items-center justify-center rounded-full bg-white border border-[#4D73CF]/40 px-3.5 py-1.5 text-xs font-bold text-[#365EC2] hover:bg-[#4D73CF] hover:text-white transition-colors"
        >
          {locale === "vi" ? "Kiểm tra kết nối" : "Check Supabase Env"}
        </Link>
      </div>

      {/* Admin Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E6DECB] pb-4">
        {ADMIN_LINKS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold transition-colors ${
                active
                  ? "bg-[#176B61] text-white shadow-xs"
                  : "bg-white border border-[#E6DECB] text-[#525D58] hover:text-[#272E2B] hover:bg-[#F5EFE2]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{locale === "vi" ? item.labelVi : item.labelEn}</span>
            </Link>
          );
        })}
      </div>

      {/* Page Heading */}
      <div>
        <h1 className="font-display-serif text-2xl sm:text-3xl font-extrabold text-[#272E2B]">
          {title}
        </h1>
        <p className="text-sm text-[#525D58] mt-1">{subtitle}</p>
      </div>

      {children}
    </div>
  );
}
