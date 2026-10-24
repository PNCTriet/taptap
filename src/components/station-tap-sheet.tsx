"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Info,
  MapPin,
  Radio,
  Sparkles,
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
    session,
    stations,
    isStampCollected,
    getCollectedRecord,
    collectStamp,
  } = useExplorer();

  const [isCollecting, setIsCollecting] = useState(false);
  const [justCollected, setJustCollected] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Also check if an admin updated this station in local session
  const liveStation =
    stations.find(
      (s) => s.tag.publicCode.toLowerCase() === resolution.code.toLowerCase()
    ) ?? resolution.station;

  // Handle Invalid / Disabled / Not Found / Inactive states
  if (resolution.status !== "ok" || !liveStation || !resolution.collection || !resolution.venue) {
    const isDisabled =
      resolution.status === "tag_disabled" ||
      liveStation?.tag.status === "disabled" ||
      liveStation?.status === "inactive";

    return (
      <div className="mx-auto max-w-xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#176B61] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{locale === "vi" ? "Quay về Khám phá" : "Back to Explore"}</span>
        </Link>

        <div className="paper-card p-6 sm:p-8 text-center space-y-4">
          <div
            className={`mx-auto h-14 w-14 rounded-2xl flex items-center justify-center ${
              isDisabled
                ? "bg-[#FEF5E3] text-[#B87514]"
                : "bg-[#FDEAEA] text-[#C93B3B]"
            }`}
          >
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#78847E]">
              /s/{resolution.code}
            </span>
            <h1 className="font-display-serif text-2xl font-extrabold text-[#272E2B]">
              {resolution.status === "tag_disabled"
                ? locale === "vi"
                  ? "Thẻ NFC Đã Ngừng Hoạt Động"
                  : "Checkpoint Tag Retired or Disabled"
                : resolution.status === "station_inactive"
                ? locale === "vi"
                  ? "Trạm Đang Bảo Trì"
                  : "Station Under Maintenance"
                : locale === "vi"
                ? "Không Tìm Thấy Trạm NFC/QR"
                : "Invalid or Unknown Station Code"}
            </h1>
          </div>

          <p className="text-sm text-[#525D58] leading-relaxed">
            {resolution.errorMessage
              ? t(resolution.errorMessage)
              : locale === "vi"
              ? "Mã trạm không hợp lệ hoặc không còn hoạt động."
              : "This checkpoint code is not active."}
          </p>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="min-h-[44px] inline-flex items-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-5 py-2.5 text-xs font-extrabold transition-colors"
            >
              <Compass className="h-4 w-4 text-[#F2C653]" />
              <span>{locale === "vi" ? "Khám phá các trạm đang mở" : "Explore Active Stations"}</span>
            </Link>
            <Link
              href="/passport"
              className="min-h-[44px] inline-flex items-center gap-2 rounded-full border border-[#E6DECB] bg-white hover:bg-[#F5EFE2] text-[#272E2B] px-5 py-2.5 text-xs font-extrabold transition-colors"
            >
              <BookOpen className="h-4 w-4 text-[#176B61]" />
              <span>{locale === "vi" ? "Mở Hộ chiếu" : "View My Passport"}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const venue = resolution.venue;
  const collection = resolution.collection;
  const alreadyCollected = isStampCollected(liveStation.stamp.id);
  const collectedRecord = getCollectedRecord(liveStation.stamp.id);

  // Next uncollected station for "Explore next" CTA
  const nextStation = stations.find(
    (s) => s.id !== liveStation.id && !isStampCollected(s.stamp.id) && s.status === "active"
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
            ? "Không thể đóng dấu mộc lúc này."
            : "Could not collect stamp right now."
        );
        return;
      }

      if (!outcome.alreadyCollected) {
        setJustCollected(true);
      }
    }, 320);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Top Breadcrumb & Direct-Entry Context Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/collections/${collection.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#176B61] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>
            {t(collection.name)} • {t(venue.name)}
          </span>
        </Link>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E6DECB] px-3 py-1 text-[11px] font-bold text-[#525D58]">
          <Radio className="h-3.5 w-3.5 text-[#176B61]" />
          <span>
            {locale === "vi" ? "Trạm NFC/QR:" : "NFC/QR Tag:"}{" "}
            <strong className="font-mono text-[#272E2B]">{liveStation.tag.publicCode}</strong>
          </span>
        </span>
      </div>

      {/* Main Station Sheet */}
      <div className="paper-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Left Column: Station Photo & Details */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F3F1] px-3 py-1 text-xs font-extrabold text-[#176B61]">
                  <MapPin className="h-3.5 w-3.5" />
                  {t(liveStation.locationHint)}
                </span>
                <span className="rounded-full bg-[#F5EFE2] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#525D58]">
                  #{String(liveStation.stamp.sortOrder).padStart(2, "0")} /{" "}
                  { String(collection.requiredStamps).padStart(2, "0") }
                </span>
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#F07861]">
                  {t(collection.name)}
                </p>
                <h1 className="font-display-serif text-3xl font-extrabold text-[#272E2B] mt-0.5">
                  {t(liveStation.name)}
                </h1>
              </div>

              {/* Station Photo Preserving Natural 4:3 Aspect Ratio */}
              <div className="overflow-hidden rounded-[16px] border border-[#E6DECB] bg-[#F5EFE2] aspect-[4/3]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={liveStation.imageUrl}
                  alt={t(liveStation.name)}
                  className="h-full w-full object-cover"
                />
              </div>

              <p className="text-sm text-[#272E2B] leading-relaxed">
                {t(liveStation.description)}
              </p>

              {/* Explorer Field Note / Fun Fact */}
              <div className="rounded-2xl bg-[#FFF8EB] border border-[#E6DECB] p-3.5 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-[#D9A326] shrink-0 mt-0.5" />
                <p className="text-xs text-[#525D58] leading-relaxed">
                  <strong className="text-[#272E2B]">
                    {locale === "vi" ? "Ghi chú khám phá: " : "Explorer Note: "}
                  </strong>
                  {t(liveStation.funFact)}
                </p>
              </div>
            </div>

            {/* Participant Session Bar */}
            <div className="pt-3 border-t border-[#E6DECB] flex items-center justify-between text-[11px] text-[#78847E]">
              <span>
                {locale === "vi" ? "Hộ chiếu khách:" : "Explorer Session:"}{" "}
                <strong className="text-[#272E2B]">{session.displayName}</strong>
              </span>
              <span>
                {resolution.dataSource === "supabase"
                  ? "Supabase Live"
                  : locale === "vi"
                  ? "Dữ liệu mẫu (Pilot Seed)"
                  : "Pilot Seed Mode"}
              </span>
            </div>
          </div>

          {/* Right Column: Stamp Preview & Explicit Collect Action */}
          <div className="md:col-span-5 bg-[#FFFDF8] p-6 sm:p-7 border-t md:border-t-0 md:border-l border-[#E6DECB] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#176B61]">
                  {locale === "vi" ? "Con dấu tại trạm" : "Station Passport Stamp"}
                </span>
                {justCollected && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E7F6F0] px-2.5 py-0.5 text-[11px] font-extrabold text-[#1B7F5C]">
                    <Sparkles className="h-3 w-3" />
                    {locale === "vi" ? "Mới đóng dấu!" : "Just Stamped!"}
                  </span>
                )}
              </div>

              <StampCard
                station={liveStation}
                collectionName={t(collection.name)}
                state={alreadyCollected ? "collected" : "featured"}
                collectedAt={collectedRecord?.collectedAt}
                animatePress={justCollected}
                showTapLink={false}
              />
            </div>

            {/* Action Area — NEVER auto-collects on page load */}
            <div className="space-y-3">
              {actionError && (
                <div className="rounded-xl bg-[#FDEAEA] border border-[#C93B3B]/30 p-3 text-xs font-bold text-[#C93B3B]">
                  {actionError}
                </div>
              )}

              {!hydrated ? (
                <div className="min-h-[52px] w-full rounded-full bg-[#E6DECB]/60 animate-pulse flex items-center justify-center text-xs font-bold text-[#525D58]">
                  {locale === "vi"
                    ? "Đang chuẩn bị hộ chiếu..."
                    : "Initializing explorer passport..."}
                </div>
              ) : !alreadyCollected ? (
                <>
                  <button
                    type="button"
                    disabled={isCollecting}
                    onClick={handleCollectStamp}
                    className="min-h-[54px] w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-[#176B61] hover:bg-[#12564E] active:bg-[#0E433D] disabled:opacity-60 text-white px-6 py-3.5 text-base font-extrabold shadow-md transition-all cursor-pointer"
                  >
                    <Stamp className="h-5 w-5 text-[#F2C653]" />
                    <span>
                      {isCollecting
                        ? locale === "vi"
                          ? "Đang đóng dấu mộc..."
                          : "Pressing ink stamp..."
                        : locale === "vi"
                        ? "Đóng dấu vào Hộ chiếu"
                        : "Collect stamp"}
                    </span>
                  </button>
                  <p className="text-[11px] text-center text-[#78847E] flex items-center justify-center gap-1">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {locale === "vi"
                        ? "Nhấn nút trên để xác nhận đóng dấu tại trạm."
                        : "Tap the button above to stamp your explorer passport."}
                    </span>
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-[#E7F6F0] border border-[#1B7F5C]/30 p-3.5 text-xs text-[#1B7F5C] flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold">
                        {justCollected
                          ? locale === "vi"
                            ? "Đóng dấu thành công!"
                            : "Stamp collected in your passport!"
                          : locale === "vi"
                          ? "Bạn đã sưu tầm con dấu này"
                          : "Already in your passport"}
                      </p>
                      <p className="text-[11px] mt-0.5 opacity-90">
                        {locale === "vi"
                          ? "Con dấu đã được lưu vào bộ sưu tập Zoo Explorer của bạn."
                          : "Saved to your Zoo Explorer collection."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    <Link
                      href="/passport"
                      className="min-h-[48px] w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-5 py-2.5 text-sm font-extrabold transition-colors"
                    >
                      <BookOpen className="h-4 w-4 text-[#F2C653]" />
                      <span>
                        {locale === "vi" ? "Xem Hộ chiếu của tôi" : "View my passport"}
                      </span>
                    </Link>

                    {nextStation ? (
                      <Link
                        href={`/s/${nextStation.tag.publicCode}`}
                        className="min-h-[46px] w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#176B61]/25 bg-white hover:bg-[#E6F3F1] text-[#176B61] px-5 py-2 text-xs font-extrabold transition-colors"
                      >
                        <span>
                          {locale === "vi"
                            ? `Khám phá tiếp: ${t(nextStation.name)}`
                            : `Explore next: ${t(nextStation.name)}`}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <Link
                        href="/passport"
                        className="min-h-[46px] w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#F07861] hover:bg-[#DE634C] text-white px-5 py-2 text-xs font-extrabold transition-colors"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>
                          {locale === "vi"
                            ? "Đã đủ bộ! Mở khóa phần thưởng"
                            : "Trail Complete! Claim Reward"}
                        </span>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
