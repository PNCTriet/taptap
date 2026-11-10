"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Compass,
  MapPin,
  Navigation as NavigationIcon,
} from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { StationIllustration } from "@/components/station-artwork";
import { AppIcon } from "@/components/ui/app-icon";
import {
  calculateDistanceMeters,
  formatDistance,
  getWalkingDirectionsUrl,
} from "@/lib/geo";
import type { StationResolutionResult } from "@/types/domain";

interface StationTapSheetProps {
  resolution: StationResolutionResult;
}

const CONFETTI_DOTS = [
  { left: "14%", top: "24%", bg: "bg-[#F2C653]", delay: "0ms" },
  { left: "28%", top: "16%", bg: "bg-[#F07861]", delay: "60ms" },
  { left: "48%", top: "12%", bg: "bg-[#176B61]", delay: "110ms" },
  { left: "68%", top: "18%", bg: "bg-[#F2C653]", delay: "40ms" },
  { left: "82%", top: "26%", bg: "bg-[#F07861]", delay: "90ms" },
  { left: "22%", top: "62%", bg: "bg-[#4D73CF]", delay: "70ms" },
  { left: "78%", top: "58%", bg: "bg-[#F2C653]", delay: "120ms" },
];

export function StationTapSheet({ resolution }: StationTapSheetProps) {
  const {
    locale,
    t,
    authLoading,
    isAuthenticated,
    stations,
    isStationCollected,
    collectStamp,
  } = useExplorer();

  const [justSlammed, setJustSlammed] = useState(false);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const autoCollectTriggeredRef = useRef(false);

  const liveStation = resolution.station
    ? stations.find((s) => s.id === resolution.station?.id) ?? resolution.station
    : undefined;

  const isLiveDisabled =
    resolution.status === "tag_disabled" ||
    (liveStation && liveStation.tag.status !== "active");

  const isLiveInactive =
    resolution.status === "station_inactive" ||
    (liveStation && liveStation.status !== "active");

  const hasError =
    resolution.status === "invalid_code" ||
    resolution.status === "not_found" ||
    isLiveDisabled ||
    isLiveInactive ||
    !liveStation;

  const collected = liveStation ? isStationCollected(liveStation.id) : false;

  // Auto-collect immediately once authenticated with Google
  useEffect(() => {
    if (authLoading || !isAuthenticated || hasError || !liveStation) return;
    if (autoCollectTriggeredRef.current) return;
    autoCollectTriggeredRef.current = true;

    void collectStamp(liveStation.id, "nfc", liveStation).then((result) => {
      if (result.newlyCollected) {
        setJustSlammed(true);
      }
    });
  }, [authLoading, isAuthenticated, hasError, liveStation, collectStamp]);

  // Measure live distance if geolocation is available
  useEffect(() => {
    if (
      !liveStation ||
      typeof window === "undefined" ||
      !("geolocation" in navigator) ||
      typeof liveStation.latitude !== "number" ||
      typeof liveStation.longitude !== "number"
    ) {
      return;
    }

    const lat = liveStation.latitude;
    const lng = liveStation.longitude;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDistanceMeters(
          calculateDistanceMeters(
            pos.coords.latitude,
            pos.coords.longitude,
            lat,
            lng
          )
        );
      },
      () => {
        // Ignore geolocation denial silently
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 15000 }
    );
  }, [liveStation]);

  if (hasError || !liveStation) {
    return (
      <div className="mx-auto max-w-md py-6">
        <div className="paper-card animate-card-enter p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDEAEA] text-[#C93B3B]">
            <AppIcon icon={AlertTriangle} size="lg" />
          </div>

          <h1 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
            {isLiveDisabled
              ? locale === "vi"
                ? "Thẻ NFC đã ngưng"
                : "Tag Disabled"
              : isLiveInactive
                ? locale === "vi"
                  ? "Trạm đang bảo trì"
                  : "Station Paused"
                : locale === "vi"
                  ? "Không tìm thấy trạm"
                  : "Station Not Found"}
          </h1>

          <p className="text-sm text-[#525D58]">
            {resolution.errorMessage
              ? t(resolution.errorMessage)
              : locale === "vi"
                ? "Mã trạm không hợp lệ hoặc tạm ngưng."
                : "This checkpoint is unavailable."}
          </p>

          <Link
            href="/passport"
            className="min-h-[48px] w-full inline-flex items-center justify-center rounded-full bg-[#176B61] text-white px-5 py-3 text-sm font-extrabold transition-transform active:scale-[0.97]"
          >
            {locale === "vi" ? "Mở hộ chiếu" : "Open Passport"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-2">
      <div
        className={`paper-card p-5 sm:p-6 space-y-5 ${
          justSlammed ? "animate-stamp-press" : "animate-card-enter"
        }`}
      >
        {/* 4:3 Cohesive Animal Illustration with Tactile Postmark Slam & Confetti */}
        <div className="relative overflow-hidden rounded-[18px] border border-[#E6DECB] bg-[#F5EFE2] aspect-[4/3]">
          <StationIllustration
            stationIdOrSlug={liveStation.id}
            variant="card"
            className="h-full w-full"
          />

          {isAuthenticated && (collected || justSlammed) && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
              {justSlammed && (
                <>
                  <div className="animate-ink-ring absolute h-28 w-28 rounded-full border-4 border-[#176B61]" />
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {CONFETTI_DOTS.map((dot, idx) => (
                      <span
                        key={idx}
                        style={{
                          left: dot.left,
                          top: dot.top,
                          animationDelay: dot.delay,
                        }}
                        className={`animate-confetti absolute h-3 w-3 rounded-full shadow-xs ${dot.bg}`}
                      />
                    ))}
                  </div>
                </>
              )}
              <div
                data-testid="postmark-seal"
                className={`${
                  justSlammed ? "animate-postmark" : "-rotate-6"
                } flex flex-col items-center justify-center rounded-full border-[3px] border-dashed border-[#FFFDF8] bg-[#176B61]/95 px-5 py-3 text-white shadow-xl`}
              >
                <div className="flex items-center gap-1 text-xs font-extrabold uppercase tracking-widest">
                  <AppIcon icon={Check} size="sm" strokeWidth={2.8} />
                  <span>{locale === "vi" ? "ĐÃ ĐÓNG DẤU" : "STAMPED"}</span>
                </div>
                <span className="type-mono text-[10px] opacity-85">
                  #{liveStation.stamp.sortOrder} • {liveStation.tag.publicCode}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Station Title + Location & GPS Pill */}
        <div className="space-y-2 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-[#176B61]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F3F1] px-2.5 py-0.5">
              <AppIcon icon={MapPin} size="xs" />
              <span>{t(liveStation.locationHint)}</span>
            </span>
            {distanceMeters !== null && (
              <span className="type-mono rounded-full bg-[#EAF0FB] px-2.5 py-0.5 text-[#4D73CF]">
                {formatDistance(distanceMeters, locale)}
              </span>
            )}
          </div>

          <h1 className="font-display-serif text-2xl font-extrabold text-[#272E2B]">
            {t(liveStation.name)}
          </h1>
          <p className="text-sm text-[#525D58] line-clamp-2">
            {t(liveStation.description)}
          </p>
        </div>

        {/* Primary Action: Google Sign-In Gate OR Open Passport */}
        {!isAuthenticated ? (
          <div className="space-y-2">
            <GoogleSignInButton
              nextPath={`/s/${liveStation.tag.publicCode}`}
              labelEn="Continue with Google to collect"
              labelVi="Đăng nhập Gmail để nhận tem"
            />
          </div>
        ) : (
          <Link
            href="/passport"
            data-testid="open-passport-cta"
            className="min-h-[52px] w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-6 py-3.5 text-base font-extrabold shadow-md transition-all duration-150 active:scale-[0.97] cursor-pointer"
          >
            <span>
              {justSlammed
                ? locale === "vi"
                  ? "Đã nhận tem • Mở hộ chiếu"
                  : "Stamp Collected • Open Passport"
                : locale === "vi"
                  ? "Đã lưu trong hộ chiếu • Mở hộ chiếu"
                  : "In Passport • Open Passport"}
            </span>
            <AppIcon icon={ArrowRight} size="sm" />
          </Link>
        )}

        {/* Map & Walking Directions Quick Row */}
        <div className="flex items-center justify-between gap-2 border-t border-[#E6DECB] pt-3 text-xs font-extrabold">
          <Link
            href={`/map?station=${liveStation.slug}`}
            className="inline-flex items-center gap-1.5 text-[#176B61] hover:underline"
          >
            <AppIcon icon={Compass} size="xs" />
            <span>{locale === "vi" ? "Xem trên bản đồ" : "View on Zoo Map"}</span>
          </Link>

          <a
            href={getWalkingDirectionsUrl(
              liveStation.latitude,
              liveStation.longitude
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#525D58] hover:text-[#272E2B]"
          >
            <AppIcon icon={NavigationIcon} size="xs" />
            <span>{locale === "vi" ? "Chỉ đường" : "Directions"}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
