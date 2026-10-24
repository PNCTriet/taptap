"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Clock,
  Compass,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { StampCard } from "@/components/stamp-card";

export default function CollectionDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "zoo-explorer";

  const {
    locale,
    t,
    venues,
    collections,
    stations,
    rewards,
    isStampCollected,
    getCollectedRecord,
  } = useExplorer();

  const collection =
    collections.find((c) => c.slug === slug) ?? collections[0];
  const venue = venues.find((v) => v.id === collection?.venueId) ?? venues[0];

  if (!collection || !venue) {
    return (
      <div className="paper-card p-8 text-center space-y-4">
        <h1 className="font-display-serif text-2xl font-bold text-[#272E2B]">
          {locale === "vi" ? "Không tìm thấy bộ sưu tập" : "Collection not found"}
        </h1>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-[#176B61] text-white px-5 py-2.5 text-sm font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          {locale === "vi" ? "Quay lại Khám phá" : "Back to Explore"}
        </Link>
      </div>
    );
  }

  const collectionStations = stations
    .filter((s) => s.collectionId === collection.id)
    .sort((a, b) => a.stamp.sortOrder - b.stamp.sortOrder);

  const collectedInCollection = collectionStations.filter((s) =>
    isStampCollected(s.stamp.id)
  ).length;
  const required = collection.requiredStamps;
  const percent =
    required > 0 ? Math.min(100, Math.round((collectedInCollection / required) * 100)) : 0;

  const nextUncollectedStation =
    collectionStations.find((s) => !isStampCollected(s.stamp.id)) ??
    collectionStations[0];

  const collectionReward = rewards.find((r) => r.collectionId === collection.id);

  return (
    <div className="space-y-8">
      {/* Breadcrumb Back Link */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#176B61] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{locale === "vi" ? "Quay về Khám phá" : "Back to Discover"}</span>
        </Link>
      </div>

      {/* Collection Header Card */}
      <section className="paper-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-5 bg-[#F5EFE2] aspect-[4/3] md:aspect-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={collection.coverImageUrl}
              alt={t(collection.name)}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F3F1] px-3 py-1 text-xs font-extrabold text-[#176B61]">
                  <MapPin className="h-3.5 w-3.5" />
                  {t(venue.name)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF6DF] px-3 py-1 text-xs font-bold text-[#8F6505]">
                  <Clock className="h-3.5 w-3.5" />
                  ~{collection.estimatedDurationMinutes}{" "}
                  {locale === "vi" ? "phút đi bộ" : "min walk"}
                </span>
              </div>

              <h1 className="font-display-serif text-3xl font-extrabold text-[#272E2B]">
                {t(collection.name)}
              </h1>
              <p className="text-sm text-[#525D58] leading-relaxed">
                {t(collection.description)}
              </p>
            </div>

            {/* Live Progress Bar */}
            <div className="rounded-2xl bg-[#FFF8EB] border border-[#E6DECB] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-[#272E2B]">
                  {locale === "vi" ? "Tiến độ sưu tầm" : "Collection Progress"}
                </span>
                <span className="text-[#176B61]">
                  {collectedInCollection} / {required}{" "}
                  {locale === "vi" ? "con dấu" : "stamps"} ({percent}%)
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-[#E6DECB]/60 p-0.5">
                <div
                  className="h-full rounded-full bg-[#176B61] transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {nextUncollectedStation && (
                  <Link
                    href={`/s/${nextUncollectedStation.tag.publicCode}`}
                    className="min-h-[44px] inline-flex items-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-5 py-2 text-xs font-extrabold transition-colors"
                  >
                    <Compass className="h-4 w-4 text-[#F2C653]" />
                    <span>
                      {collectedInCollection === required
                        ? locale === "vi"
                          ? "Xem lại trạm đầu tiên"
                          : "Revisit Station #1"
                        : locale === "vi"
                        ? `Tiếp tục: Trạm ${t(nextUncollectedStation.name)}`
                        : `Continue: ${t(nextUncollectedStation.name)} Station`}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}

                {collectionReward && (
                  <Link
                    href={`/rewards/${collectionReward.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#F07861] hover:underline"
                  >
                    <Award className="h-4 w-4" />
                    <span>
                      {locale === "vi"
                        ? `Phần thưởng: ${t(collectionReward.name)}`
                        : `Reward: ${t(collectionReward.name)}`}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Station Stamp Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display-serif text-2xl font-extrabold text-[#272E2B]">
              {locale === "vi"
                ? "Danh Sách Trạm Trong Bộ Sưu Tập"
                : "Stations in this Collection"}
            </h2>
            <p className="text-xs text-[#525D58]">
              {locale === "vi"
                ? "Nhấn vào từng trạm để mô phỏng thao tác chạm thẻ NFC hoặc quét mã QR."
                : "Select any checkpoint below to open its NFC/QR station landing sheet."}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white border border-[#E6DECB] px-3 py-1 text-xs font-bold text-[#525D58]">
            <Sparkles className="h-3.5 w-3.5 text-[#F2C653]" />
            {collectionStations.length}{" "}
            {locale === "vi" ? "trạm" : "checkpoints"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {collectionStations.map((station) => {
            const collected = isStampCollected(station.stamp.id);
            const record = getCollectedRecord(station.stamp.id);
            return (
              <StampCard
                key={station.id}
                station={station}
                collectionName={t(collection.name)}
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
    </div>
  );
}
