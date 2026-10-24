"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Award, Lock, ShieldCheck } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { StampCard } from "@/components/stamp-card";

export default function PassportPage() {
  const {
    locale,
    t,
    session,
    collections,
    stations,
    badges,
    rewards,
    collectedStamps,
    isStampCollected,
    getCollectedRecord,
  } = useExplorer();

  const collection = collections[0];
  const collectedCount = collectedStamps.length;
  const requiredCount = collection?.requiredStamps ?? stations.length;
  const isCompleted = collectedCount >= requiredCount && requiredCount > 0;
  const progressPercent =
    requiredCount > 0
      ? Math.min(100, Math.round((collectedCount / requiredCount) * 100))
      : 0;

  return (
    <div className="space-y-6">
      {/* Compact Passport Header */}
      <section className="paper-card p-5 sm:p-6 space-y-4">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#176B61]">
              {locale === "vi" ? "Hộ chiếu" : "Passport"}
            </p>
            <h1 className="font-display-serif text-2xl sm:text-3xl font-extrabold text-[#272E2B]">
              {session.displayName}
            </h1>
          </div>
          <span className="font-mono text-sm font-extrabold text-[#176B61]">
            {collectedCount} / {requiredCount}{" "}
            {locale === "vi" ? "con dấu" : "stamps"}
          </span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F5EFE2]">
          <div
            className="h-full rounded-full bg-[#176B61] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {/* Stamp Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stations.map((station) => {
          const collected = isStampCollected(station.stamp.id);
          const record = getCollectedRecord(station.stamp.id);
          return (
            <StampCard
              key={station.id}
              station={station}
              state={collected ? "collected" : "locked"}
              collectedAt={record?.collectedAt}
            />
          );
        })}
      </section>

      {/* Compact Badges & Rewards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="paper-card p-4 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div
                className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                  isCompleted
                    ? "bg-[#176B61] text-[#F2C653]"
                    : "bg-[#F5EFE2] text-[#78847E]"
                }`}
              >
                {isCompleted ? (
                  <ShieldCheck className="h-5 w-5" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </div>
              <div>
                <h2 className="font-display-serif text-base font-extrabold text-[#272E2B]">
                  {t(badge.name)}
                </h2>
                <p className="text-xs font-semibold text-[#525D58]">
                  {isCompleted
                    ? locale === "vi"
                      ? "Đã mở khóa"
                      : "Unlocked"
                    : locale === "vi"
                    ? "Đang khóa"
                    : "Locked"}
                </p>
              </div>
            </div>
          </div>
        ))}

        {rewards.map((reward) => (
          <Link
            key={reward.id}
            href={`/rewards/${reward.id}`}
            className="paper-card p-4 flex items-center justify-between gap-3 hover:border-[#176B61] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-[#FDF6DF] border border-[#F2C653] flex items-center justify-center shrink-0">
                <Award className="h-5 w-5 text-[#8F6505]" />
              </div>
              <div>
                <h2 className="font-display-serif text-base font-extrabold text-[#272E2B]">
                  {t(reward.name)}
                </h2>
                <p className="text-xs font-extrabold text-[#176B61]">
                  {isCompleted
                    ? locale === "vi"
                      ? "Nhận quà"
                      : "Claim"
                    : `${collectedCount} / ${reward.requiredStamps}`}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-[#176B61] shrink-0" />
          </Link>
        ))}
      </section>
    </div>
  );
}
