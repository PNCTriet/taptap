"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, Lock, MapPin } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import type { PilotStation, StampVisualState } from "@/types/domain";
import { StationIllustration } from "@/components/station-artwork";
import { AppIcon } from "@/components/ui/app-icon";

interface StampCardProps {
  station: PilotStation;
  collectionName?: string;
  state: StampVisualState;
  collectedAt?: string;
  animatePress?: boolean;
  showTapLink?: boolean;
  distanceLabel?: string | null;
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
  distanceLabel,
}: StampCardProps) {
  const { locale, t } = useExplorer();

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
      data-testid={`stamp-card-${station.id}`}
      data-state={state}
      className={`animate-card-enter group relative rounded-[20px] p-2.5 transition-all duration-200 active:scale-[0.97] ${
        isCollected
          ? "bg-white border-2 border-[#176B61]/35 shadow-sm hover:-translate-y-0.5"
          : isFeatured
          ? "bg-white border-2 border-[#F2C653] shadow-md"
          : isLocked
          ? "bg-[#F5EFE2]/70 border border-dashed border-[#CFC4AB]"
          : "bg-white border border-[#E6DECB] shadow-xs hover:border-[#176B61]/40"
      } ${animatePress ? "animate-stamp-press" : ""}`}
    >
      <div className="rounded-[14px] border border-dashed border-[#CFC4AB] bg-[#FFFDF8] p-2">
        {/* Cohesive Animal Illustration Frame (4:3 Aspect Ratio) */}
        <div
          className={`relative overflow-hidden rounded-[10px] border ${
            isCollected || isFeatured ? borderClass : "border-[#E6DECB]"
          } bg-[#F5EFE2] aspect-[4/3] flex items-center justify-center`}
        >
          <StationIllustration
            stationIdOrSlug={station.id}
            variant="stamp"
            grayscale={isLocked}
            className="h-full w-full transition-transform duration-300 group-hover:scale-105"
          />

          {/* Live GPS Distance Badge */}
          {distanceLabel && (
            <div className="pointer-events-none absolute top-2 left-2">
              <span className="type-mono inline-flex items-center gap-1 rounded-full bg-[#272E2B]/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                <AppIcon icon={MapPin} size="xs" className="text-[#F2C653]" />
                {distanceLabel}
              </span>
            </div>
          )}

          {/* Postmark Seal when Collected */}
          {isCollected && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-2.5 right-2.5 flex items-center justify-center"
            >
              {animatePress && (
                <span className="absolute inset-0 rounded-full border-2 border-[#176B61] animate-ink-ring" />
              )}
              <div
                className={`rotate-[-8deg] rounded-full border-2 border-[#176B61] bg-[#FFF8EB]/95 px-3 py-1 shadow-sm ${
                  animatePress ? "animate-postmark" : ""
                }`}
              >
                <span className="type-mono text-[10px] font-extrabold uppercase tracking-wider text-[#176B61]">
                  STAMPED
                </span>
              </div>
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
              <AppIcon icon={CheckCircle2} size="xs" />
              <span>{formattedDate ?? (locale === "vi" ? "Đã đóng" : "Done")}</span>
            </span>
          ) : isLocked ? (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-[#78847E]">
              <AppIcon icon={Lock} size="xs" />
              <span className="type-mono">#{station.stamp.sortOrder}</span>
            </span>
          ) : (
            <span className="type-mono shrink-0 text-xs font-bold text-[#176B61]">
              NFC #{station.stamp.sortOrder}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Only link to /s/[code] when already collected so browsing uncollected cards
  // in the catalog never accidentally triggers NFC auto-collection.
  if (showTapLink && isCollected) {
    return (
      <Link href={`/s/${station.tag.publicCode}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
