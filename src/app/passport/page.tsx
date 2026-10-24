"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
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
    <div className="space-y-8">
      {/* Passport Cover Header */}
      <section className="passport-sheet p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E6F3F1] px-3 py-1 text-xs font-extrabold text-[#176B61]">
              <BookOpen className="h-3.5 w-3.5" />
              <span>
                {locale === "vi" ? "Hộ Chiếu Khám Phá Cá Nhân" : "Personal Explorer Passport"}
              </span>
            </div>
            <h1 className="font-display-serif text-3xl sm:text-4xl font-extrabold text-[#272E2B]">
              {session.displayName}
            </h1>
            <p className="text-xs sm:text-sm text-[#525D58]">
              {locale === "vi"
                ? "Lưu trữ toàn bộ con dấu mộc, huy hiệu và phần thưởng từ các trạm NFC bạn đã ghé thăm."
                : "Your tactile record of station ink stamps, unlocked badges, and venue rewards."}
            </p>
          </div>

          {/* Summary Stat Pills */}
          <div className="grid grid-cols-3 gap-3 sm:min-w-[300px]">
            <div className="rounded-2xl bg-white border border-[#E6DECB] p-3 text-center">
              <p className="font-display-serif text-2xl font-extrabold text-[#176B61]">
                {collectedCount}/{requiredCount}
              </p>
              <p className="text-[11px] font-bold text-[#525D58]">
                {locale === "vi" ? "Con dấu" : "Stamps"}
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-[#E6DECB] p-3 text-center">
              <p className="font-display-serif text-2xl font-extrabold text-[#F07861]">
                {isCompleted ? badges.length : 0}/{badges.length}
              </p>
              <p className="text-[11px] font-bold text-[#525D58]">
                {locale === "vi" ? "Huy hiệu" : "Badges"}
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-[#E6DECB] p-3 text-center">
              <p className="font-display-serif text-2xl font-extrabold text-[#4D73CF]">
                {isCompleted ? rewards.length : 0}/{rewards.length}
              </p>
              <p className="text-[11px] font-bold text-[#525D58]">
                {locale === "vi" ? "Phần thưởng" : "Rewards"}
              </p>
            </div>
          </div>
        </div>

        {/* Active Collection Progress Bar */}
        {collection && (
          <div className="mt-6 pt-5 border-t border-[#E6DECB]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold mb-2">
              <span className="text-[#272E2B]">
                {t(collection.name)} — {collectedCount} / {requiredCount}{" "}
                {locale === "vi" ? "con dấu đã đóng" : "stamps collected"}
              </span>
              <span className="text-[#176B61]">{progressPercent}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-[#E6DECB]/60 p-0.5">
              <div
                className="h-full rounded-full bg-[#176B61] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Stamp Pages Grid — Collected vs Uncollected Slots */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="font-display-serif text-2xl font-extrabold text-[#272E2B]">
              {locale === "vi" ? "Trang Đóng Dấu Mộc" : "Passport Stamp Pages"}
            </h2>
            <p className="text-xs text-[#525D58]">
              {locale === "vi"
                ? "Các ô đã đóng dấu hiển thị mộc xác nhận và thời gian; các ô trống đang chờ bạn ghé thăm."
                : "Collected slots display their verification postmark and timestamp; uncollected slots show where to head next."}
            </p>
          </div>
          {collection && (
            <Link
              href={`/collections/${collection.slug}`}
              className="text-xs font-extrabold text-[#176B61] hover:underline inline-flex items-center gap-1"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>
                {locale === "vi" ? "Mở bản đồ bộ sưu tập" : "Open trail overview"}
              </span>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stations.map((station) => {
            const collected = isStampCollected(station.stamp.id);
            const record = getCollectedRecord(station.stamp.id);
            return (
              <StampCard
                key={station.id}
                station={station}
                collectionName={collection ? t(collection.name) : "Zoo Explorer"}
                state={collected ? "collected" : "locked"}
                collectedAt={record?.collectedAt}
              />
            );
          })}
        </div>
      </section>

      {/* Badges & Rewards Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Digital Badges Card */}
        <div className="paper-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
              {locale === "vi" ? "Huy Hiệu Kỹ Thuật Số" : "Explorer Badges"}
            </h3>
            <span className="rounded-full bg-[#FDF6DF] px-2.5 py-0.5 text-xs font-bold text-[#8F6505]">
              {isCompleted
                ? locale === "vi"
                  ? "Đã mở khóa"
                  : "Unlocked"
                : locale === "vi"
                ? "Đang khóa"
                : "Locked"}
            </span>
          </div>

          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`rounded-2xl border p-4 flex items-start gap-4 ${
                isCompleted
                  ? "border-[#176B61] bg-[#E6F3F1]/50"
                  : "border-dashed border-[#CFC4AB] bg-[#F5EFE2]/60"
              }`}
            >
              <div
                className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  isCompleted
                    ? "bg-[#176B61] text-[#F2C653]"
                    : "bg-[#E6DECB] text-[#78847E]"
                }`}
              >
                {isCompleted ? (
                  <ShieldCheck className="h-7 w-7" />
                ) : (
                  <Lock className="h-6 w-6" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-display-serif text-base font-extrabold text-[#272E2B]">
                    {t(badge.name)}
                  </h4>
                  {isCompleted && (
                    <CheckCircle2 className="h-4 w-4 text-[#1B7F5C]" />
                  )}
                </div>
                <p className="text-xs text-[#525D58] leading-relaxed">
                  {t(badge.description)}
                </p>
                <p className="text-[11px] font-bold text-[#176B61] pt-1">
                  {isCompleted
                    ? locale === "vi"
                      ? "Đã mở khóa khi hoàn thành đủ 4 con dấu!"
                      : "Unlocked by collecting all 4 trail stamps!"
                    : locale === "vi"
                    ? `Cần thêm ${requiredCount - collectedCount} con dấu để mở khóa.`
                    : `Collect ${requiredCount - collectedCount} more stamp(s) to unlock.`}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Eligible Rewards Card */}
        <div className="paper-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
              {locale === "vi" ? "Phần Thưởng Điểm Đến" : "Venue Rewards"}
            </h3>
            <Sparkles className="h-4 w-4 text-[#F07861]" />
          </div>

          {rewards.map((reward) => (
            <div
              key={reward.id}
              className="rounded-2xl border border-[#E6DECB] bg-[#FFFDF8] p-4 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-[#FDF6DF] border border-[#F2C653] flex items-center justify-center shrink-0">
                  <Award className="h-7 w-7 text-[#8F6505]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-display-serif text-base font-extrabold text-[#272E2B]">
                    {t(reward.name)}
                  </h4>
                  <p className="text-xs text-[#525D58] leading-relaxed">
                    {t(reward.description)}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E6DECB] flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[#176B61]">
                  {isCompleted
                    ? locale === "vi"
                      ? "Đủ điều kiện nhận thưởng!"
                      : "Eligible to claim!"
                    : `${collectedCount}/${reward.requiredStamps} ${
                        locale === "vi" ? "con dấu" : "stamps"
                      }`}
                </span>
                <Link
                  href={`/rewards/${reward.id}`}
                  className="min-h-[40px] inline-flex items-center gap-1.5 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-4 py-2 text-xs font-extrabold transition-colors"
                >
                  <span>
                    {locale === "vi" ? "Chi tiết & Đổi thưởng" : "Reward details"}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
