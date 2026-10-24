"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Compass, Lock, Sparkles } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import type { PilotStation, StampVisualState } from "@/types/domain";

interface StampCardProps {
  station: PilotStation;
  collectionName: string;
  state: StampVisualState;
  collectedAt?: string;
  animatePress?: boolean;
  showTapLink?: boolean;
}

const ACCENT_RING_CLASSES: Record<
  PilotStation["stamp"]["accentColor"],
  { border: string; badgeBg: string; badgeText: string; postmark: string }
> = {
  teal: {
    border: "border-[#176B61]",
    badgeBg: "bg-[#E6F3F1]",
    badgeText: "text-[#176B61]",
    postmark: "#176B61",
  },
  coral: {
    border: "border-[#F07861]",
    badgeBg: "bg-[#FDECE8]",
    badgeText: "text-[#C84E37]",
    postmark: "#F07861",
  },
  yellow: {
    border: "border-[#D9A326]",
    badgeBg: "bg-[#FDF6DF]",
    badgeText: "text-[#8F6505]",
    postmark: "#B88412",
  },
  blue: {
    border: "border-[#4D73CF]",
    badgeBg: "bg-[#EAF0FB]",
    badgeText: "text-[#3256AE]",
    postmark: "#4D73CF",
  },
};

export function StampCard({
  station,
  collectionName,
  state,
  collectedAt,
  animatePress = false,
  showTapLink = true,
}: StampCardProps) {
  const { locale, t } = useExplorer();
  const [imageError, setImageError] = useState(false);

  const accent = ACCENT_RING_CLASSES[station.stamp.accentColor];
  const isCollected = state === "collected";
  const isLocked = state === "locked";
  const isFeatured = state === "featured";

  const formattedDate = collectedAt
    ? new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(collectedAt))
    : null;

  return (
    <div
      className={`relative rounded-[20px] p-3 transition-all duration-200 ${
        isCollected
          ? "bg-white border-2 border-[#176B61]/40 shadow-[0_6px_18px_-4px_rgba(23,107,97,0.14)]"
          : isFeatured
          ? "bg-white border-2 border-[#F2C653] shadow-[0_8px_24px_-4px_rgba(242,198,83,0.28)]"
          : isLocked
          ? "bg-[#F5EFE2]/80 border border-dashed border-[#CFC4AB] opacity-80"
          : "bg-white border border-[#E6DECB] shadow-[0_2px_10px_-2px_rgba(39,46,43,0.06)] hover:border-[#176B61]/50"
      } ${animatePress ? "animate-stamp-press" : ""}`}
    >
      {/* Postal Stamp Outer Perforation Frame */}
      <div className="relative rounded-[14px] border-2 border-dashed border-[#CFC4AB] bg-[#FFFDF8] p-2.5">
        {/* Top Stamp Header: Serial Number & State Badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#78847E]">
            #{String(station.stamp.sortOrder).padStart(2, "0")} • {station.tag.publicCode}
          </span>

          {isCollected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F6F0] px-2.5 py-0.5 text-[11px] font-bold text-[#1B7F5C]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {locale === "vi" ? "Đã đóng dấu" : "Collected"}
            </span>
          )}

          {state === "available" && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${accent.badgeBg} ${accent.badgeText}`}
            >
              <Compass className="h-3.5 w-3.5" />
              {locale === "vi" ? "Sẵn sàng" : "Available"}
            </span>
          )}

          {isLocked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E6DECB]/70 px-2.5 py-0.5 text-[11px] font-semibold text-[#525D58]">
              <Lock className="h-3 w-3" />
              {locale === "vi" ? "Chưa mở" : "Uncollected"}
            </span>
          )}

          {isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF6DF] px-2.5 py-0.5 text-[11px] font-bold text-[#8F6505]">
              <Sparkles className="h-3.5 w-3.5" />
              {locale === "vi" ? "Tiêu điểm" : "Featured"}
            </span>
          )}
        </div>

        {/* Wildlife Photo Frame — Preserves Natural Aspect Ratio (4:3) */}
        <div
          className={`relative overflow-hidden rounded-[10px] border-2 ${
            isCollected || isFeatured ? accent.border : "border-[#E6DECB]"
          } bg-[#F5EFE2] aspect-[4/3] flex items-center justify-center`}
        >
          {!imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={station.stamp.imageUrl}
              alt={t(station.stamp.name)}
              onError={() => setImageError(true)}
              className={`h-full w-full object-cover transition-all duration-300 ${
                isLocked ? "grayscale contrast-75 opacity-60" : ""
              }`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <Compass className="h-8 w-8 text-[#176B61] mb-1" />
              <span className="font-display-serif text-sm font-bold text-[#272E2B]">
                {t(station.name)}
              </span>
            </div>
          )}

          {/* Tactile Ink Cancellation Postmark Overlay when Collected */}
          {isCollected && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-2 -right-2 rotate-[-10deg] rounded-full border-2 border-[#176B61] bg-[#FFF8EB]/95 px-3 py-1.5 shadow-md"
            >
              <div className="flex flex-col items-center leading-none">
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#176B61]">
                  TAPTAP • VERIFIED
                </span>
                <span className="font-display-serif text-[11px] font-bold text-[#272E2B] mt-0.5">
                  {station.slug.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Stamp Caption & Editorial Details */}
        <div className="mt-3 flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display-serif text-base font-bold text-[#272E2B] leading-snug">
              {t(station.name)}
            </h3>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#78847E]">
              {collectionName}
            </span>
          </div>

          <p className="text-xs text-[#525D58] line-clamp-2">
            {t(station.stamp.description)}
          </p>

          <div className="mt-2 pt-2 border-t border-[#E6DECB] flex items-center justify-between gap-2 text-[11px]">
            {isCollected && formattedDate ? (
              <span className="font-medium text-[#176B61]">
                {locale === "vi" ? `Đóng dấu: ${formattedDate}` : `Stamped ${formattedDate}`}
              </span>
            ) : (
              <span className="text-[#78847E] truncate">{t(station.locationHint)}</span>
            )}

            {showTapLink && (
              <Link
                href={`/s/${station.tag.publicCode}`}
                className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#E6F3F1] hover:bg-[#176B61] text-[#176B61] hover:text-white px-2.5 py-1 font-bold transition-colors"
              >
                {isCollected
                  ? locale === "vi"
                    ? "Xem trạm"
                    : "View station"
                  : locale === "vi"
                  ? "Mở trạm"
                  : "Visit station"}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
