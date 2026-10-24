"use client";

import React from "react";
import Link from "next/link";
import { Award, CheckCircle2, Gift, Lock } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { StampCard } from "@/components/stamp-card";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export default function PassportPage() {
  const {
    locale,
    t,
    isAuthenticated,
    user,
    session,
    collections,
    stations,
    badges,
    rewards,
    collectedStamps,
    redemptions,
    isStationCollected,
    getCollectedRecord,
  } = useExplorer();

  const collection = collections[0];
  const badge = badges[0];
  const reward = rewards[0];

  const totalStamps = stations.length;
  const collectedCount = collectedStamps.length;
  const progressPercent =
    totalStamps > 0 ? Math.round((collectedCount / totalStamps) * 100) : 0;
  const isCompleted = collectedCount >= (collection?.requiredStamps ?? 4);
  const existingRedemption = reward
    ? redemptions.find((r) => r.rewardId === reward.id)
    : undefined;

  return (
    <div className="space-y-6">
      {/* Minimal Header */}
      <div className="paper-card p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="font-display-serif text-2xl font-extrabold text-[#272E2B]">
              {locale === "vi" ? "Hộ chiếu" : "Passport"}
            </h1>
            <p className="text-xs font-semibold text-[#525D58]">
              {isAuthenticated && user?.email
                ? `${session.displayName} • ${user.email}`
                : session.displayName}
            </p>
          </div>
          <span className="rounded-full bg-[#E6F3F1] px-3.5 py-1.5 text-xs font-extrabold text-[#176B61]">
            {collectedCount} / {totalStamps} {locale === "vi" ? "con dấu" : "stamps"}
          </span>
        </div>

        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-[#EDE6D6]"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-[#176B61] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {!isAuthenticated && (
          <div className="pt-1">
            <GoogleSignInButton
              nextPath="/passport"
              labelEn="Continue with Google to sync passport"
              labelVi="Đăng nhập Gmail để lưu hộ chiếu"
            />
          </div>
        )}
      </div>

      {/* 2-Column Visual Stamp Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stations.map((station) => {
          const collected = isStationCollected(station.id);
          const record = getCollectedRecord(station.id);
          return (
            <StampCard
              key={station.id}
              station={station}
              state={collected ? "collected" : "available"}
              collectedAt={record?.collectedAt}
            />
          );
        })}
      </div>

      {/* Badges & Rewards Section (2 Compact Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {badge && (
          <div className="paper-card p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  isCompleted
                    ? "bg-[#176B61] text-[#F2C653]"
                    : "bg-[#EDE6D6] text-[#525D58]"
                }`}
              >
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display-serif text-base font-extrabold text-[#272E2B]">
                  {t(badge.name)}
                </p>
                <p className="text-xs font-bold text-[#525D58]">
                  {isCompleted
                    ? locale === "vi"
                      ? "Đã mở khóa"
                      : "Unlocked"
                    : `${collectedCount}/${totalStamps}`}
                </p>
              </div>
            </div>
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-[#1F7A4C] shrink-0" />
            ) : (
              <Lock className="h-4 w-4 text-[#525D58] shrink-0" />
            )}
          </div>
        )}

        {reward && (
          <Link
            href={`/rewards/${reward.id}`}
            className="paper-card p-4 flex items-center justify-between gap-3 hover:border-[#176B61] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  isCompleted
                    ? "bg-[#E86F52] text-white"
                    : "bg-[#EDE6D6] text-[#525D58]"
                }`}
              >
                <Gift className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display-serif text-base font-extrabold text-[#272E2B]">
                  {t(reward.name)}
                </p>
                <p className="text-xs font-bold text-[#176B61]">
                  {existingRedemption
                    ? existingRedemption.redemptionCode
                    : isCompleted
                      ? locale === "vi"
                        ? "Nhận thưởng →"
                        : "Claim reward →"
                      : `${collectedCount}/${reward.requiredStamps}`}
                </p>
              </div>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
