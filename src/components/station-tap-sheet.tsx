"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  Sparkles,
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
    rewards,
    collectedStamps,
    isStampCollected,
    getCollectedRecord,
    collectStamp,
  } = useExplorer();

  const [justCollected, setJustCollected] = useState(false);
  const [isAutoStamping, setIsAutoStamping] = useState(false);
  const autoTriggeredCodeRef = useRef<string | null>(null);

  const liveStation =
    stations.find(
      (s) => s.tag.publicCode.toLowerCase() === resolution.code.toLowerCase()
    ) ?? resolution.station;

  const isValidActiveStation =
    resolution.status === "ok" &&
    Boolean(liveStation) &&
    liveStation?.status === "active" &&
    liveStation?.tag.status === "active" &&
    Boolean(resolution.collection) &&
    Boolean(resolution.venue);

  // Auto-collect stamp when visiting a valid, active /s/[code] NFC URL
  useEffect(() => {
    if (!hydrated || !isValidActiveStation || !liveStation) {
      return;
    }

    const codeKey = liveStation.tag.publicCode.toLowerCase();
    if (autoTriggeredCodeRef.current === codeKey) {
      return;
    }
    autoTriggeredCodeRef.current = codeKey;

    // If already collected in a prior visit, render collected state immediately
    if (isStampCollected(liveStation.stamp.id)) {
      return;
    }

    setIsAutoStamping(true);
    const timer = window.setTimeout(() => {
      const outcome = collectStamp(liveStation.id, "nfc");
      setIsAutoStamping(false);
      if (outcome.ok && !outcome.alreadyCollected) {
        setJustCollected(true);
      }
    }, 280);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    collectStamp,
    hydrated,
    isStampCollected,
    isValidActiveStation,
    liveStation,
  ]);

  // Minimal Disabled / Invalid State
  if (
    !isValidActiveStation ||
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
            {resolution.status === "tag_disabled" ||
            liveStation?.tag.status !== "active"
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
  const isCollectionComplete =
    collectedCount >= totalStamps && totalStamps > 0;
  const progressPercent =
    totalStamps > 0
      ? Math.min(100, Math.round((collectedCount / totalStamps) * 100))
      : 0;

  const collectionReward =
    rewards.find((r) => r.collectionId === collection.id) ?? rewards[0];

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

      {/* Focused NFC Stamp Card */}
      <div className="paper-card p-5 sm:p-6 space-y-5">
        {/* Status Pill */}
        <div className="flex justify-center">
          {alreadyCollected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F6F0] px-3.5 py-1 text-xs font-extrabold text-[#1B7F5C]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>
                {justCollected
                  ? locale === "vi"
                    ? "Đã đóng dấu tem!"
                    : "Stamp collected!"
                  : locale === "vi"
                  ? "Đã thu thập"
                  : "Collected"}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F3F1] px-3.5 py-1 text-xs font-extrabold text-[#176B61]">
              <Sparkles className="h-3.5 w-3.5 animate-spin" />
              <span>
                {locale === "vi" ? "Đang đóng dấu tem..." : "Stamping..."}
              </span>
            </span>
          )}
        </div>

        {/* Tactile Stamp Card with Postmark Animation */}
        <StampCard
          station={liveStation}
          state={
            alreadyCollected && !isAutoStamping ? "collected" : "featured"
          }
          collectedAt={collectedRecord?.collectedAt}
          animatePress={justCollected}
          showTapLink={false}
        />

        {/* Concise Description + Progress Bar */}
        <div className="space-y-3 text-center">
          <p className="text-sm text-[#525D58]">{t(liveStation.description)}</p>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-[#525D58]">
                {locale === "vi" ? "Tiến độ" : "Progress"}
              </span>
              <span className="font-mono text-[#176B61]">
                {collectedCount} / {totalStamps}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#F5EFE2]">
              <div
                className="h-full rounded-full bg-[#176B61] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Celebratory Banner when all 4 / 4 Stamps Completed */}
        {isCollectionComplete && (
          <div className="rounded-2xl border border-[#F2C653] bg-[#FDF6DF] p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-[#176B61] text-[#F2C653] flex items-center justify-center shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-extrabold text-[#272E2B]">
                  {locale === "vi"
                    ? "Đã mở khóa phần thưởng!"
                    : "Reward unlocked!"}
                </p>
                <p className="text-[11px] font-semibold text-[#525D58]">
                  {collectionReward ? t(collectionReward.name) : "4 / 4"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2 Clean Navigation Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            href="/passport"
            className="min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-4 py-2.5 text-xs font-extrabold transition-colors"
          >
            <BookOpen className="h-4 w-4 text-[#F2C653]" />
            <span>{locale === "vi" ? "Hộ chiếu" : "Passport"}</span>
          </Link>

          {isCollectionComplete && collectionReward ? (
            <Link
              href={`/rewards/${collectionReward.id}`}
              className="min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-full bg-[#F07861] hover:bg-[#DE634C] text-white px-4 py-2.5 text-xs font-extrabold transition-colors"
            >
              <span>{locale === "vi" ? "Nhận quà" : "Claim reward"}</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          ) : (
            <Link
              href={`/collections/${collection.slug}`}
              className="min-h-[48px] inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E6DECB] bg-[#FFF8EB] hover:bg-[#E6F3F1] text-[#176B61] px-4 py-2.5 text-xs font-extrabold transition-colors"
            >
              <span className="truncate">
                {locale === "vi" ? "Trạm tiếp" : "Next station"}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
