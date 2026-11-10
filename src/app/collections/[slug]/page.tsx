"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Award, BookOpen, Map } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { StampCard } from "@/components/stamp-card";
import { StationIllustration } from "@/components/station-artwork";
import { ZooGpsMap } from "@/components/zoo-gps-map";
import { AppIcon } from "@/components/ui/app-icon";
import { formatDistance } from "@/lib/geo";

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

  const [distances, setDistances] = useState<Record<string, number>>({});

  const collection =
    collections.find((c) => c.slug === slug) ?? collections[0];
  const venue = venues.find((v) => v.id === collection?.venueId) ?? venues[0];

  if (!collection || !venue) {
    return null;
  }

  const collectionStations = stations
    .filter((s) => s.collectionId === collection.id)
    .sort((a, b) => a.stamp.sortOrder - b.stamp.sortOrder);

  const collectedInCollection = collectionStations.filter((s) =>
    isStampCollected(s.stamp.id)
  ).length;
  const required = collection.requiredStamps;
  const isCompleted = collectedInCollection >= required && required > 0;
  const percent =
    required > 0
      ? Math.min(100, Math.round((collectedInCollection / required) * 100))
      : 0;

  const collectionReward = rewards.find(
    (r) => r.collectionId === collection.id
  );

  return (
    <div className="space-y-6">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#176B61] hover:underline"
      >
        <AppIcon icon={ArrowLeft} size="sm" />
        <span>{locale === "vi" ? "Khám phá" : "Explore"}</span>
      </Link>

      {/* Compact Collection Hero */}
      <section className="paper-card animate-card-enter p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5 overflow-hidden rounded-[16px] border border-[#E6DECB] bg-[#F5EFE2] aspect-[4/3]">
            <StationIllustration
              stationIdOrSlug={collection.slug}
              variant="card"
              className="h-full w-full"
            />
          </div>

          <div className="md:col-span-7 space-y-4">
            <div>
              <p className="type-caption text-xs text-[#176B61]">
                {t(venue.name)}
              </p>
              <h1 className="font-display-serif text-3xl font-extrabold text-[#272E2B] mt-0.5">
                {t(collection.name)}
              </h1>
              <p className="text-sm text-[#525D58] mt-1">
                {t(collection.description)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-[#525D58]">
                  {locale === "vi" ? "Con dấu" : "Stamps"}
                </span>
                <span className="type-mono text-[#176B61]">
                  {collectedInCollection} / {required}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F5EFE2]">
                <div
                  className="h-full rounded-full bg-[#176B61] transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {isCompleted && collectionReward ? (
                <Link
                  href={`/rewards/${collectionReward.id}`}
                  className="min-h-[46px] inline-flex items-center justify-center gap-2 rounded-full bg-[#F07861] hover:bg-[#DE634C] active:scale-[0.97] text-white px-6 py-2.5 text-sm font-extrabold transition-all duration-150"
                >
                  <AppIcon icon={Award} size="sm" />
                  <span>{locale === "vi" ? "Nhận quà" : "Claim reward"}</span>
                  <AppIcon icon={ArrowRight} size="sm" />
                </Link>
              ) : (
                <Link
                  href="/passport"
                  className="min-h-[46px] inline-flex items-center justify-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] active:scale-[0.97] text-white px-6 py-2.5 text-sm font-extrabold transition-all duration-150"
                >
                  <AppIcon icon={BookOpen} size="sm" className="text-[#F2C653]" />
                  <span>{locale === "vi" ? "Mở hộ chiếu" : "View passport"}</span>
                  <AppIcon icon={ArrowRight} size="sm" />
                </Link>
              )}

              <Link
                href="/map"
                className="min-h-[46px] inline-flex items-center justify-center gap-2 rounded-full border border-[#E6DECB] bg-[#FFF8EB] hover:bg-[#F5EFE2] active:scale-[0.97] text-[#272E2B] px-5 py-2.5 text-sm font-extrabold transition-all duration-150"
              >
                <AppIcon icon={Map} size="sm" className="text-[#176B61]" />
                <span>{locale === "vi" ? "Bản đồ GPS" : "GPS Map"}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stamp Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {collectionStations.map((station) => {
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
                typeof dist === "number" ? formatDistance(dist, locale) : null
              }
            />
          );
        })}
      </section>

      {/* Embedded Live GPS Trail Map */}
      <section className="space-y-3">
        <ZooGpsMap compact onDistancesChange={setDistances} />
      </section>

      {/* Compact Reward Row */}
      {collectionReward && (
        <Link
          href={`/rewards/${collectionReward.id}`}
          className="paper-card p-4 flex items-center justify-between gap-4 hover:border-[#176B61] transition-all duration-150 active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#FDF6DF] border border-[#F2C653] flex items-center justify-center shrink-0">
              <AppIcon icon={Award} size="md" className="text-[#8F6505]" />
            </div>
            <div>
              <h2 className="font-display-serif text-base font-extrabold text-[#272E2B]">
                {t(collectionReward.name)}
              </h2>
              <p className="text-xs font-bold text-[#176B61]">
                {collectedInCollection} / {collectionReward.requiredStamps}{" "}
                {locale === "vi" ? "con dấu" : "stamps"}
              </p>
            </div>
          </div>
          <AppIcon icon={ArrowRight} size="sm" className="text-[#176B61] shrink-0" />
        </Link>
      )}
    </div>
  );
}
