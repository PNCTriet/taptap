"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  Building2,
  FolderKanban,
  MapPin,
  Stamp,
} from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { AdminShell } from "@/components/admin-shell";
import { QrCodeSvg } from "@/components/qr-code-svg";

export default function AdminDashboardPage() {
  const { locale, t, venues, collections, stations, rewards } = useExplorer();

  const cards = [
    {
      href: "/admin/venues",
      label: locale === "vi" ? "Điểm đến" : "Venues",
      count: venues.length,
      icon: Building2,
    },
    {
      href: "/admin/collections",
      label: locale === "vi" ? "Bộ sưu tập" : "Collections",
      count: collections.length,
      icon: FolderKanban,
    },
    {
      href: "/admin/stations",
      label: locale === "vi" ? "Trạm & NFC" : "Stations",
      count: stations.length,
      icon: MapPin,
    },
    {
      href: "/admin/stamps",
      label: locale === "vi" ? "Con dấu" : "Stamps",
      count: stations.length,
      icon: Stamp,
    },
    {
      href: "/admin/rewards",
      label: locale === "vi" ? "Phần thưởng" : "Rewards",
      count: rewards.length,
      icon: Award,
    },
  ];

  return (
    <AdminShell title="Admin">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="paper-card p-4 hover:border-[#176B61] transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-xl bg-[#E6F3F1] text-[#176B61] flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="font-display-serif text-xl font-extrabold text-[#272E2B]">
                  {card.count}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-extrabold text-[#272E2B] group-hover:text-[#176B61]">
                <span>{card.label}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Printable QR Codes */}
      <section className="paper-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display-serif text-lg font-extrabold text-[#272E2B]">
            {locale === "vi" ? "Mã QR Trạm" : "Station QR Codes"}
          </h2>
          <Link
            href="/admin/stations"
            className="text-xs font-extrabold text-[#176B61] hover:underline"
          >
            {locale === "vi" ? "Quản lý →" : "Manage →"}
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stations.map((st) => (
            <div
              key={st.id}
              className="rounded-2xl border border-[#E6DECB] bg-[#FFFDF8] p-3 flex flex-col items-center text-center gap-2"
            >
              <span className="font-display-serif text-sm font-extrabold text-[#272E2B]">
                {t(st.name)}
              </span>
              <QrCodeSvg
                value={`http://localhost:3000/s/${st.tag.publicCode}`}
                label={t(st.name)}
                code={st.tag.publicCode}
                size={112}
              />
            </div>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
