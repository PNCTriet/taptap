"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  MapPin,
  Navigation as NavigationIcon,
} from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { AppIcon } from "@/components/ui/app-icon";
import { CollectibleCard } from "@/components/ui/collectible-card";
import { TiltButton, TiltProvider } from "@/components/ui/tilt-provider";
import { cardArtSrc, resolveCardArt } from "@/lib/card-art";
import {
  calculateDistanceMeters,
  formatDistance,
  getWalkingDirectionsUrl,
} from "@/lib/geo";
import type { StationResolutionResult } from "@/types/domain";

interface StationTapSheetProps {
  resolution: StationResolutionResult;
}

const CARD_THEME = {
  teal: { pastel: "#cde6d0", accent: "#176b61" },
  coral: { pastel: "#ffd2b1", accent: "#d95b26" },
  yellow: { pastel: "#f4e894", accent: "#d97724" },
  blue: { pastel: "#d7e2fb", accent: "#4d73cf" },
} as const;

export function StationTapSheet({ resolution }: StationTapSheetProps) {
  const {
    locale,
    t,
    authLoading,
    isAuthenticated,
    stations,
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
            className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-gouache-ink px-5 py-3 text-sm font-extrabold text-gouache-cream transition-transform active:scale-[0.97]"
          >
            {locale === "vi" ? "Mở hộ chiếu" : "Open Passport"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <TiltProvider>
      <div className="mx-auto max-w-md space-y-4 py-2">
        <div className="flex justify-end">
          <TiltButton />
        </div>
        <div className="flex justify-center">
          <CollectibleCard
            name={t(liveStation.name)}
            series={locale === "vi" ? "Thảo Cầm Viên" : "Saigon Zoo"}
            fact={t(liveStation.funFact)}
            imageSrc={(() => {
              const art = resolveCardArt(liveStation.slug, t(liveStation.name), liveStation.stamp.name.en);
              return art ? cardArtSrc(art, true) : null;
            })()}
            pastel={CARD_THEME[liveStation.stamp.accentColor].pastel}
            accent={CARD_THEME[liveStation.stamp.accentColor].accent}
            code={liveStation.tag.publicCode}
            titleAs="h1"
            reveal={justSlammed}
            flipHint={locale === "vi" ? "Chạm để lật" : "Tap to flip"}
            className="h-[320px] w-[214px]"
          />
        </div>

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
            className="inline-flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gouache-ink px-6 py-3.5 text-base font-extrabold text-gouache-cream shadow-[0_8px_22px_rgba(44,34,30,0.22)] transition-transform active:scale-[0.97]"
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
    </TiltProvider>
  );
}
