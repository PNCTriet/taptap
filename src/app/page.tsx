"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { StampCard } from "@/components/stamp-card";

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
      <section className="paper-card overflow-hidden p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Prominent Real Photo (4:3 Aspect Ratio) */}
          <div className="md:col-span-6 overflow-hidden rounded-[16px] border border-[#E6DECB] bg-[#F5EFE2] aspect-[4/3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featuredCollection.coverImageUrl}
              alt={t(featuredCollection.name)}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Concise Info + Progress + 1 Primary CTA */}
          <div className="md:col-span-6 space-y-5">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#176B61]">
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
                <span className="font-mono text-[#176B61]">
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

            <Link
              href={`/collections/${featuredCollection.slug}`}
              className="min-h-[48px] w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] active:bg-[#0E433D] text-white px-6 py-3 text-sm font-extrabold shadow-xs transition-colors"
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
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Clean Airy Stamp Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
            {locale === "vi" ? "Các trạm" : "Stations"}
          </h2>
          <span className="font-mono text-xs font-bold text-[#78847E]">
            {collectedCount} / {totalRequired}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stations.map((station) => {
            const collected = isStampCollected(station.stamp.id);
            const record = getCollectedRecord(station.stamp.id);
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
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
