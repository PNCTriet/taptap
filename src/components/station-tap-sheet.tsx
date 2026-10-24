"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Compass,
  Stamp,
} from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { StampCard } from "@/components/stamp-card";
import type { StationResolutionResult } from "@/types/domain";

interface StationTapSheetProps {
  resolution: StationResolutionResult;
}

export function StationTapSheet({ resolution }: StationTapSheetProps) {
  const {
    hydrated,
    locale,
    t,
    stations,
    collectedStamps,
    isStampCollected,
    getCollectedRecord,
    collectStamp,
  } = useExplorer();

  const [isCollecting, setIsCollecting] = useState(false);
  const [justCollected, setJustCollected] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const liveStation =
    stations.find(
      (s) => s.tag.publicCode.toLowerCase() === resolution.code.toLowerCase()
    ) ?? resolution.station;

  // Minimal Disabled / Invalid State
  if (
    resolution.status !== "ok" ||
    !liveStation ||
    !resolution.collection ||
    !resolution.venue
  ) {
    return (
      <div className="mx-auto max-w-md py-8 text-center space-y-5">
        <div className="paper-card p-8 space-y-4">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-[#FEF5E3] text-[#B87514] flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <h1 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
            {resolution.status === "tag_disabled"
              ? locale === "vi"
                ? "Thẻ NFC đã ngừng hoạt động"
                : "Station tag is inactive"
              : locale === "vi"
              ? "Không tìm thấy trạm"
              : "Station not found"}
          </h1>

          <Link
            href="/"
            className="min-h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-6 py-3 text-sm font-extrabold transition-colors"
          >
            <Compass className="h-4 w-4 text-[#F2C653]" />
            <span>{locale === "vi" ? "Khám phá" : "Explore"}</span>
          </Link>
        </div>
      </div>
    );
  }

  const collection = resolution.collection;
  const alreadyCollected = isStampCollected(liveStation.stamp.id);
  const collectedRecord = getCollectedRecord(liveStation.stamp.id);
  const totalStamps = collection.requiredStamps;
  const collectedCount = collectedStamps.length;

  const nextStation = stations.find(
    (s) =>
      s.id !== liveStation.id &&
      !isStampCollected(s.stamp.id) &&
      s.status === "active"
  );

  const handleCollectStamp = () => {
    setActionError(null);
    setIsCollecting(true);

    window.setTimeout(() => {
      const outcome = collectStamp(liveStation.id, "nfc");
      setIsCollecting(false);

      if (!outcome.ok) {
        setActionError(
          outcome.error
            ? t(outcome.error)
            : locale === "vi"
            ? "Không thể đóng dấu."
            : "Could not collect stamp."
        );
        return;
      }

      if (!outcome.alreadyCollected) {
        setJustCollected(true);
      }
    }, 260);
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      {/* Compact Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/collections/${collection.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#176B61] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t(collection.name)}</span>
        </Link>
        <span className="font-mono text-xs font-bold text-[#78847E]">
          {collectedCount} / {totalStamps}
        </span>
      </div>

      {/* Focused Station Card */}
      <div className="paper-card p-5 sm:p-6 space-y-5">
        {!alreadyCollected ? (
          <>
            {/* Station Photo (4:3 Aspect Ratio) */}
            <div className="overflow-hidden rounded-[16px] border border-[#E6DECB] bg-[#F5EFE2] aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={liveStation.imageUrl}
                alt={t(liveStation.name)}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Title + Single Short Sentence */}
            <div className="space-y-1 text-center">
              <h1 className="font-display-serif text-2xl sm:text-3xl font-extrabold text-[#272E2B]">
                {t(liveStation.name)}
              </h1>
              <p className="text-sm text-[#525D58]">
                {t(liveStation.description)}
              </p>
            </div>

            {actionError && (
              <p className="text-center text-xs font-bold text-[#C93B3B]">
                {actionError}
              </p>
            )}

            {/* Single Primary Action — Never auto-collects on load */}
            {!hydrated ? (
              <div className="min-h-[52px] w-full rounded-full bg-[#E6DECB]/50 animate-pulse" />
            ) : (
              <button
                type="button"
                disabled={isCollecting}
                onClick={handleCollectStamp}
                className="min-h-[54px] w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] active:bg-[#0E433D] disabled:opacity-60 text-white px-6 py-3.5 text-base font-extrabold shadow-sm transition-all cursor-pointer"
              >
                <Stamp className="h-5 w-5 text-[#F2C653]" />
                <span>
                  {isCollecting
                    ? locale === "vi"
                      ? "Đang đóng dấu..."
                      : "Stamping..."
                    : locale === "vi"
                    ? "Đóng dấu tem"
                    : "Collect stamp"}
                </span>
              </button>
            )}
          </>
        ) : (
          /* Collected State: Stamped Card + Progress + 2 Clean Buttons */
          <div className="space-y-5">
            <StampCard
              station={liveStation}
              state="collected"
              collectedAt={collectedRecord?.collectedAt}
              animatePress={justCollected}
              showTapLink={false}
            />

            <div className="text-center space-y-1">
              <p className="font-display-serif text-xl font-extrabold text-[#272E2B]">
                {justCollected
                  ? locale === "vi"
                    ? "Đã đóng dấu!"
                    : "Stamp collected!"
                  : locale === "vi"
                  ? "Đã có trong hộ chiếu"
                  : "In your passport"}
              </p>
              <p className="text-xs font-bold text-[#176B61]">
                {collectedCount} / {totalStamps}{" "}
                {locale === "vi" ? "con dấu" : "stamps"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/passport"
                className="min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-4 py-2.5 text-xs font-extrabold transition-colors"
              >
                <BookOpen className="h-4 w-4 text-[#F2C653]" />
                <span>{locale === "vi" ? "Hộ chiếu" : "Passport"}</span>
              </Link>

              {nextStation ? (
                <Link
                  href={`/s/${nextStation.tag.publicCode}`}
                  className="min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E6DECB] bg-[#FFF8EB] hover:bg-[#E6F3F1] text-[#176B61] px-4 py-2.5 text-xs font-extrabold transition-colors"
                >
                  <span className="truncate">
                    {locale === "vi" ? "Trạm tiếp" : "Next station"}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              ) : (
                <Link
                  href="/passport"
                  className="min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-full bg-[#F07861] hover:bg-[#DE634C] text-white px-4 py-2.5 text-xs font-extrabold transition-colors"
                >
                  <span>{locale === "vi" ? "Nhận quà" : "Claim reward"}</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
