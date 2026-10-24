"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Compass,
  MapPin,
  QrCode,
  Sparkles,
} from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { StampCard } from "@/components/stamp-card";

export default function DiscoverPage() {
  const {
    locale,
    t,
    venues,
    collections,
    stations,
    rewards,
    collectedStamps,
    isStampCollected,
    getCollectedRecord,
  } = useExplorer();

  const venue = venues[0];
  const featuredCollection = collections[0];
  const activeStations = stations.filter((s) => s.status === "active");
  const collectedCount = collectedStamps.length;
  const totalRequired = featuredCollection?.requiredStamps ?? activeStations.length;
  const progressPercent =
    totalRequired > 0 ? Math.min(100, Math.round((collectedCount / totalRequired) * 100)) : 0;

  // Next uncollected station for "Start exploring" / "Continue exploring" CTA
  const nextStation =
    activeStations.find((s) => !isStampCollected(s.stamp.id)) ?? activeStations[0];

  if (!featuredCollection || !venue) {
    return (
      <div className="paper-card p-8 text-center">
        <p className="text-base font-bold text-[#272E2B]">
          {locale === "vi"
            ? "Chưa có bộ sưu tập nào đang mở."
            : "No active collections available yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner — Playful Explorer Passport Direction */}
      <section className="relative overflow-hidden rounded-[24px] border border-[#E6DECB] bg-white shadow-[0_8px_30px_-6px_rgba(39,46,43,0.08)]">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Editorial Column */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F3F1] px-3 py-1 text-xs font-extrabold text-[#176B61]">
                  <MapPin className="h-3.5 w-3.5" />
                  {t(venue.name)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF6DF] border border-[#F2C653] px-3 py-1 text-xs font-bold text-[#8F6505]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {locale === "vi" ? "Bộ sưu tập tiêu điểm" : "Featured Trail"}
                </span>
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-[#F07861]">
                  Tap. Explore. Collect.
                </p>
                <h1 className="font-display-serif text-3xl sm:text-4xl font-extrabold text-[#272E2B] mt-1 leading-tight">
                  {t(featuredCollection.name)}
                </h1>
                <p className="text-sm font-semibold text-[#176B61] mt-1">
                  {t(featuredCollection.subtitle)}
                </p>
              </div>

              <p className="text-sm sm:text-base text-[#525D58] leading-relaxed">
                {t(featuredCollection.description)}
              </p>
            </div>

            {/* Live Progress & Primary CTA */}
            <div className="mt-6 pt-5 border-t border-[#E6DECB] space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-[#272E2B]">
                    {locale === "vi" ? "Tiến độ hộ chiếu của bạn" : "Your Passport Progress"}
                  </span>
                  <span className="text-[#176B61]">
                    {collectedCount} / {totalRequired}{" "}
                    {locale === "vi" ? "con dấu" : "stamps"} ({progressPercent}%)
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-[#F5EFE2] p-0.5">
                  <div
                    className="h-full rounded-full bg-[#176B61] transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/collections/${featuredCollection.slug}`}
                  className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] active:bg-[#0E433D] text-white px-6 py-3 text-sm font-extrabold shadow-sm transition-colors"
                >
                  <Compass className="h-4 w-4 text-[#F2C653]" />
                  <span>
                    {collectedCount > 0
                      ? locale === "vi"
                        ? "Tiếp tục hành trình"
                        : "Continue exploring"
                      : locale === "vi"
                      ? "Bắt đầu khám phá"
                      : "Start exploring"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {nextStation && (
                  <Link
                    href={`/s/${nextStation.tag.publicCode}`}
                    className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#176B61]/25 bg-[#FFF8EB] hover:bg-[#E6F3F1] text-[#176B61] px-5 py-2.5 text-sm font-extrabold transition-colors"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>
                      {locale === "vi"
                        ? `Chạm thử trạm ${t(nextStation.name)}`
                        : `Simulate Tap: ${t(nextStation.name)}`}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Right Cover Image Column (Preserving Aspect Ratio) */}
          <div className="lg:col-span-5 bg-[#F5EFE2] p-4 sm:p-6 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-[#E6DECB]">
            <div className="overflow-hidden rounded-[18px] border-2 border-white shadow-md bg-[#FFF8EB] aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featuredCollection.coverImageUrl}
                alt={t(featuredCollection.name)}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="mt-4 rounded-2xl bg-white/90 border border-[#E6DECB] p-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold text-[#272E2B]">
                  {locale === "vi"
                    ? "Không cần cài đặt ứng dụng"
                    : "No Native App Required"}
                </p>
                <p className="text-[11px] text-[#525D58]">
                  {locale === "vi"
                    ? "Chạm điện thoại vào bảng NFC hoặc quét QR tại mỗi trạm."
                    : "Tap your phone on any station NFC plaque or scan the QR code."}
                </p>
              </div>
              <Link
                href="/passport"
                className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[#F07861] hover:bg-[#DE634C] text-white px-3.5 py-2 text-xs font-extrabold transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>{locale === "vi" ? "Hộ chiếu" : "Passport"}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Station Checkpoints Grid */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#176B61]">
              {locale === "vi" ? "Các trạm dừng NFC / QR" : "NFC / QR Checkpoints"}
            </span>
            <h2 className="font-display-serif text-2xl font-extrabold text-[#272E2B]">
              {locale === "vi"
                ? "Bản Đồ Tem Mộc Zoo Explorer"
                : "Zoo Explorer Stamp Checkpoints"}
            </h2>
          </div>
          <Link
            href={`/collections/${featuredCollection.slug}`}
            className="text-xs font-extrabold text-[#176B61] hover:underline inline-flex items-center gap-1"
          >
            <span>
              {locale === "vi" ? "Xem chi tiết bộ sưu tập" : "View full collection details"}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stations.map((station) => {
            const collected = isStampCollected(station.stamp.id);
            const record = getCollectedRecord(station.stamp.id);
            return (
              <StampCard
                key={station.id}
                station={station}
                collectionName={t(featuredCollection.name)}
                state={
                  collected
                    ? "collected"
                    : station.status === "active"
                    ? "available"
                    : "locked"
                }
                collectedAt={record?.collectedAt}
              />
            );
          })}
        </div>
      </section>

      {/* Reward Preview Strip */}
      {rewards[0] && (
        <section className="passport-sheet p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#FDF6DF] border border-[#F2C653] flex items-center justify-center shrink-0">
              <Award className="h-6 w-6 text-[#8F6505]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#E6F3F1] px-2.5 py-0.5 text-[11px] font-extrabold text-[#176B61]">
                  {locale === "vi" ? "Phần thưởng hoàn thành" : "Completion Reward"}
                </span>
                <span className="text-xs font-bold text-[#525D58]">
                  {collectedCount}/{rewards[0].requiredStamps}{" "}
                  {locale === "vi" ? "con dấu" : "stamps"}
                </span>
              </div>
              <h3 className="font-display-serif text-lg font-extrabold text-[#272E2B] mt-1">
                {t(rewards[0].name)}
              </h3>
              <p className="text-xs sm:text-sm text-[#525D58] mt-0.5">
                {t(rewards[0].description)}
              </p>
            </div>
          </div>

          <Link
            href={`/rewards/${rewards[0].id}`}
            className="min-h-[44px] shrink-0 inline-flex items-center gap-2 rounded-full bg-[#272E2B] hover:bg-[#176B61] text-white px-5 py-2.5 text-xs font-extrabold transition-colors"
          >
            <span>{locale === "vi" ? "Xem phần thưởng" : "View Reward Details"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}
    </div>
  );
}
