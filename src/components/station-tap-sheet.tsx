"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Check } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import type { StationResolutionResult } from "@/types/domain";

interface StationTapSheetProps {
  resolution: StationResolutionResult;
}

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

    const result = collectStamp(liveStation.id, "nfc");
    if (result.newlyCollected) {
      setJustSlammed(true);
    }
  }, [authLoading, isAuthenticated, hasError, liveStation, collectStamp]);

  if (hasError || !liveStation) {
    return (
      <div className="mx-auto max-w-md py-6">
        <div className="paper-card p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FDEAEA] text-[#C93B3B]">
            <AlertTriangle className="h-6 w-6" />
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
            className="min-h-[48px] w-full inline-flex items-center justify-center rounded-full bg-[#176B61] text-white px-5 py-3 text-sm font-extrabold"
          >
            {locale === "vi" ? "Mở hộ chiếu" : "Open Passport"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-2">
      <div className="paper-card p-5 sm:p-6 space-y-5">
        {/* 4:3 Station Photo with Tactile Postmark Slam Overlay */}
        <div className="relative overflow-hidden rounded-[18px] border border-[#E6DECB] bg-[#F5EFE2] aspect-[4/3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={liveStation.imageUrl}
            alt={t(liveStation.name)}
            className="h-full w-full object-cover"
          />

          {isAuthenticated && (collected || justSlammed) && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/15">
              {justSlammed && (
                <div className="animate-ink-ring absolute h-28 w-28 rounded-full border-4 border-[#176B61]" />
              )}
              <div
                data-testid="postmark-seal"
                className={`${
                  justSlammed ? "animate-postmark" : "-rotate-6"
                } flex flex-col items-center justify-center rounded-full border-[3px] border-dashed border-[#FFFDF8] bg-[#176B61]/95 px-5 py-3 text-white shadow-xl`}
              >
                <div className="flex items-center gap-1 text-xs font-extrabold uppercase tracking-widest">
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>{locale === "vi" ? "ĐÃ ĐÓNG DẤU" : "STAMPED"}</span>
                </div>
                <span className="font-mono text-[10px] opacity-85">
                  #{liveStation.stamp.sortOrder} • {liveStation.tag.publicCode}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Station Title + 1 Short Sentence */}
        <div className="space-y-1.5 text-center">
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
            className="min-h-[52px] w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-6 py-3.5 text-base font-extrabold shadow-md transition-all cursor-pointer"
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
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
