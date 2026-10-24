"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Compass, Lock } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import type { PilotStation, StampVisualState } from "@/types/domain";

interface StampCardProps {
  station: PilotStation;
  collectionName?: string;
  state: StampVisualState;
  collectedAt?: string;
  animatePress?: boolean;
  showTapLink?: boolean;
}

const ACCENT_BORDER: Record<PilotStation["stamp"]["accentColor"], string> = {
  teal: "border-[#176B61]",
  coral: "border-[#F07861]",
  yellow: "border-[#D9A326]",
  blue: "border-[#4D73CF]",
};

export function StampCard({
  station,
  state,
  collectedAt,
  animatePress = false,
  showTapLink = true,
}: StampCardProps) {
  const { locale, t } = useExplorer();
  const [imageError, setImageError] = useState(false);

  const isCollected = state === "collected";
  const isLocked = state === "locked";
  const isFeatured = state === "featured";
  const borderClass = ACCENT_BORDER[station.stamp.accentColor];

  const formattedDate = collectedAt
    ? new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(collectedAt))
    : null;

  const content = (
    <div
      className={`group relative rounded-[20px] p-2.5 transition-all duration-200 ${
        isCollected
          ? "bg-white border-2 border-[#176B61]/35 shadow-sm"
          : isFeatured
          ? "bg-white border-2 border-[#F2C653] shadow-md"
          : isLocked
          ? "bg-[#F5EFE2]/70 border border-dashed border-[#CFC4AB]"
          : "bg-white border border-[#E6DECB] hover:border-[#176B61]/50 shadow-xs"
      } ${animatePress ? "animate-stamp-press" : ""}`}
    >
      <div className="rounded-[14px] border border-dashed border-[#CFC4AB] bg-[#FFFDF8] p-2">
        {/* Photo Frame (4:3 Aspect Ratio) */}
        <div
          className={`relative overflow-hidden rounded-[10px] border ${
            isCollected || isFeatured ? borderClass : "border-[#E6DECB]"
          } bg-[#F5EFE2] aspect-[4/3] flex items-center justify-center`}
        >
          {!imageError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={station.stamp.imageUrl}
              alt={t(station.name)}
              onError={() => setImageError(true)}
              className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${
                isLocked ? "grayscale opacity-55" : ""
              }`}
            />
          ) : (
            <Compass className="h-7 w-7 text-[#176B61]" />
          )}

          {/* Postmark Seal when Collected */}
          {isCollected && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-2 right-2 rotate-[-8deg] rounded-full border-2 border-[#176B61] bg-[#FFF8EB]/95 px-2.5 py-1 shadow-xs"
            >
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#176B61]">
                STAMPED
              </span>
            </div>
          )}
        </div>

        {/* Minimal Footer: Station Name + Compact Status/Date */}
        <div className="mt-2.5 px-0.5 flex items-center justify-between gap-2">
          <h3 className="font-display-serif text-base font-bold text-[#272E2B] truncate">
            {t(station.name)}
          </h3>

          {isCollected ? (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-extrabold text-[#1B7F5C]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{formattedDate ?? (locale === "vi" ? "Đã đóng" : "Done")}</span>
            </span>
          ) : isLocked ? (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#78847E]">
              <Lock className="h-3 w-3" />
              <span>#{station.stamp.sortOrder}</span>
            </span>
          ) : (
            <span className="shrink-0 font-mono text-xs font-bold text-[#176B61]">
              #{station.stamp.sortOrder}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (showTapLink) {
    return (
      <Link href={`/s/${station.tag.publicCode}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
