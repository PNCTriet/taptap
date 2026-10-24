"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Building2,
  FolderKanban,
  MapPin,
  QrCode,
  Stamp,
} from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { AdminShell } from "@/components/admin-shell";
import { QrCodeSvg } from "@/components/qr-code-svg";

export default function AdminDashboardPage() {
  const { locale, t, venues, collections, stations, rewards, collectedStamps } =
    useExplorer();

  const cards = [
    {
      href: "/admin/venues",
      label: locale === "vi" ? "Điểm đến (Venues)" : "Venues",
      count: venues.length,
      icon: Building2,
      desc:
        locale === "vi"
          ? "Quản lý đối tác địa điểm và trạng thái hoạt động."
          : "Manage partner venues, slugs, and publication status.",
    },
    {
      href: "/admin/collections",
      label: locale === "vi" ? "Bộ sưu tập (Collections)" : "Collections",
      count: collections.length,
      icon: FolderKanban,
      desc:
        locale === "vi"
          ? "Thiết lập hành trình săn dấu và điều kiện hoàn thành."
          : "Configure stamp trails and completion criteria.",
    },
    {
      href: "/admin/stations",
      label: locale === "vi" ? "Trạm & Thẻ NFC (Stations)" : "Stations & NFC Tags",
      count: stations.length,
      icon: MapPin,
      desc:
        locale === "vi"
          ? "Quản lý URL NFC cố định (/s/[code]) và tải mã QR SVG."
          : "Manage checkpoint NFC URLs (/s/[code]) and SVG QR downloads.",
    },
    {
      href: "/admin/stamps",
      label: locale === "vi" ? "Con dấu (Stamps)" : "Stamps",
      count: stations.length,
      icon: Stamp,
      desc:
        locale === "vi"
          ? "Hình ảnh con dấu, thứ tự hiển thị và liên kết trạm."
          : "Manage stamp artwork, sort order, and station bindings.",
    },
    {
      href: "/admin/rewards",
      label: locale === "vi" ? "Phần thưởng (Rewards)" : "Rewards",
      count: rewards.length,
      icon: Award,
      desc:
        locale === "vi"
          ? "Cấu hình quà tặng hoàn thành và hướng dẫn đổi thưởng."
          : "Configure completion rewards and redemption instructions.",
    },
  ];

  return (
    <AdminShell
      title={
        locale === "vi"
          ? "Bảng Điều Khiển Quản Trị TAPTAP"
          : "TAPTAP Operator Console"
      }
      subtitle={
        locale === "vi"
          ? "Quản lý điểm đến, bộ sưu tập, trạm NFC/QR, con dấu và phần thưởng."
          : "Manage venues, collections, NFC/QR checkpoints, stamps, and rewards."
      }
    >
      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="paper-card p-5 hover:border-[#176B61] transition-all flex flex-col justify-between gap-4 group"
            >
              <div className="flex items-start justify-between">
                <div className="h-11 w-11 rounded-2xl bg-[#E6F3F1] text-[#176B61] flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-display-serif text-2xl font-extrabold text-[#272E2B]">
                  {card.count}
                </span>
              </div>
              <div>
                <h2 className="font-display-serif text-lg font-extrabold text-[#272E2B] group-hover:text-[#176B61] flex items-center justify-between">
                  <span>{card.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </h2>
                <p className="text-xs text-[#525D58] mt-1">{card.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick NFC / QR Station Sheet Preview */}
      <section className="paper-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display-serif text-xl font-extrabold text-[#272E2B] flex items-center gap-2">
              <QrCode className="h-5 w-5 text-[#176B61]" />
              <span>
                {locale === "vi"
                  ? "Mã QR & Đường Dẫn NFC Các Trạm Hiện Tại"
                  : "Active Station NFC Links & Printable SVG QR Codes"}
              </span>
            </h2>
            <p className="text-xs text-[#525D58] mt-0.5">
              {locale === "vi"
                ? `Đã ghi nhận ${collectedStamps.length} lượt đóng dấu trong phiên thử nghiệm hiện tại.`
                : `${collectedStamps.length} stamp collection(s) recorded in current preview session.`}
            </p>
          </div>
          <Link
            href="/admin/stations"
            className="text-xs font-extrabold text-[#176B61] hover:underline"
          >
            {locale === "vi" ? "Quản lý toàn bộ trạm →" : "Manage all stations →"}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stations.map((st) => (
            <div
              key={st.id}
              className="rounded-2xl border border-[#E6DECB] bg-[#FFFDF8] p-4 flex flex-col items-center text-center gap-3"
            >
              <div>
                <span className="font-display-serif text-base font-extrabold text-[#272E2B]">
                  {t(st.name)}
                </span>
                <p className="font-mono text-[11px] text-[#78847E]">
                  /s/{st.tag.publicCode}
                </p>
              </div>
              <QrCodeSvg
                value={`http://localhost:3000/s/${st.tag.publicCode}`}
                label={t(st.name)}
                code={st.tag.publicCode}
                size={120}
              />
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
