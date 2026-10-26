"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Map } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { StampCard } from "@/components/stamp-card";
import { StationIllustration } from "@/components/station-artwork";
import { ZooGpsMap } from "@/components/zoo-gps-map";
import { AppIcon } from "@/components/ui/app-icon";
import { formatDistance } from "@/lib/geo";

export default function DiscoverPage() {
  const {
    locale,
    t,
    venues,
    collections,
    stations,
    collectedStamps,
    isStampCollected,
    getCollectedRecord,
  } = useExplorer();

  const [distances, setDistances] = useState<Record<string, number>>({});

  const venue = venues[0];
  const featuredCollection = collections[0];
  const activeStations = stations.filter((s) => s.status === "active");
  const collectedCount = collectedStamps.length;
  const totalRequired =
    featuredCollection?.requiredStamps ?? activeStations.length;
  const progressPercent =
    totalRequired > 0
      ? Math.min(100, Math.round((collectedCount / totalRequired) * 100))
      : 0;

  if (!featuredCollection || !venue) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Minimal Featured Collection Hero */}
      <section className="paper-card animate-card-enter overflow-hidden p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Cohesive Saigon Zoo Explorer Crest Illustration (4:3 Aspect Ratio) */}
          <div className="md:col-span-6 overflow-hidden rounded-[16px] border border-[#E6DECB] bg-[#F5EFE2] aspect-[4/3]">
            <StationIllustration
              stationIdOrSlug={featuredCollection.slug}
              variant="card"
              className="h-full w-full"
            />
          </div>

          {/* Concise Info + Progress + Primary CTAs */}
          <div className="md:col-span-6 space-y-5">
            <div>
              <p className="type-caption text-xs text-[#176B61]">
                {t(venue.name)}
              </p>
              <h1 className="font-display-serif text-3xl sm:text-4xl font-extrabold text-[#272E2B] mt-1">
                {t(featuredCollection.name)}
              </h1>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-[#525D58]">
                  {locale === "vi" ? "Tiến độ" : "Progress"}
                </span>
                <span className="type-mono text-[#176B61]">
                  {collectedCount} / {totalRequired}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F5EFE2]">
                <div
                  className="h-full rounded-full bg-[#176B61] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={`/collections/${featuredCollection.slug}`}
                className="min-h-[48px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] active:scale-[0.97] text-white px-6 py-3 text-sm font-extrabold shadow-xs transition-all duration-150"
              >
                <span>
                  {collectedCount > 0
                    ? locale === "vi"
                      ? "Tiếp tục"
                      : "Continue"
                    : locale === "vi"
                      ? "Khám phá"
                      : "Start exploring"}
                </span>
                <AppIcon icon={ArrowRight} size="sm" />
              </Link>

              <Link
                href="/map"
                className="min-h-[48px] inline-flex items-center justify-center gap-2 rounded-full border border-[#E6DECB] bg-[#FFF8EB] hover:bg-[#F5EFE2] active:scale-[0.97] text-[#272E2B] px-5 py-3 text-sm font-extrabold transition-all duration-150"
              >
                <AppIcon icon={Map} size="sm" className="text-[#176B61]" />
                <span>{locale === "vi" ? "Bản đồ GPS" : "Live GPS Map"}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Airy Stamp Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
            {locale === "vi" ? "Các trạm" : "Stations"}
          </h2>
          <span className="type-mono text-xs font-bold text-[#78847E]">
            {collectedCount} / {totalRequired}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stations.map((station) => {
            const collected = isStampCollected(station.stamp.id);
            const record = getCollectedRecord(station.stamp.id);
            const dist = distances[station.id];
            return (
              <StampCard
                key={station.id}
                station={station}
                state={
                  collected
                    ? "collected"
                    : station.status === "active"
                      ? "available"
                      : "locked"
                }
                collectedAt={record?.collectedAt}
                distanceLabel={
                  typeof dist === "number"
                    ? formatDistance(dist, locale)
                    : null
                }
              />
            );
          })}
        </div>
      </section>

      {/* Embedded Interactive Saigon Zoo GPS Map Preview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
            {locale === "vi" ? "Bản đồ Thảo Cầm Viên" : "Saigon Zoo Map"}
          </h2>
          <Link
            href="/map"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-[#176B61] hover:underline"
          >
            <span>{locale === "vi" ? "Mở toàn màn hình" : "Open Live GPS Map"}</span>
            <AppIcon icon={ArrowRight} size="xs" />
          </Link>
        </div>

        <ZooGpsMap compact onDistancesChange={setDistances} />
      </section>
    </div>
  );
}
