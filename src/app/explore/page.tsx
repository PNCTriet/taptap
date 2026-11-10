"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Map } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { CollectibleCard } from "@/components/ui/collectible-card";
import { ZooGpsMap } from "@/components/zoo-gps-map";
import { AppIcon } from "@/components/ui/app-icon";
import { cardArtSrc, resolveCardArt } from "@/lib/card-art";
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
      <section className="space-y-5">
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
          <div className="flex justify-center md:col-span-5">
            <CollectibleCard
              name={t(activeStations[0]?.name ?? featuredCollection.name)}
              series={t(venue.name)}
              fact={t(featuredCollection.description)}
              imageSrc={(() => {
                const lead = activeStations[0];
                const art = lead ? resolveCardArt(lead.slug, lead.name.en) : null;
                return art ? cardArtSrc(art, true) : null;
              })()}
              pastel="#cde6d0"
              accent="#2f8568"
              flipHint={locale === "vi" ? "Chạm để lật" : "Tap to flip"}
              className="h-[280px] w-[186px]"
            />
          </div>

          <div className="space-y-5 md:col-span-7">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-gouache-muted">
                {t(venue.name)}
              </p>
              <h1 className="mt-1 font-gouache text-[2rem] leading-[1.1] text-gouache-ink">
                {t(featuredCollection.name)}
              </h1>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-[#525D58]">
                  {locale === "vi" ? "Tiến độ" : "Progress"}
                </span>
                <span className="font-mono text-gouache-ink">
                  {collectedCount} / {totalRequired}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gouache-line">
                <div
                  className="h-full rounded-full bg-gouache-ink transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={`/collections/${featuredCollection.slug}`}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-gouache-ink px-6 py-3 text-sm font-extrabold text-gouache-cream shadow-[0_8px_22px_rgba(44,34,30,0.22)] transition-transform active:scale-[0.97] sm:flex-initial"
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
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-gouache-line bg-gouache-cream px-5 py-3 text-sm font-extrabold text-gouache-ink transition-transform active:scale-[0.97]"
              >
                <AppIcon icon={Map} size="sm" />
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

        <ul className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {stations.map((station, index) => {
            const art = resolveCardArt(station.slug, station.name.en, station.stamp.name.en);
            const dist = distances[station.id];
            const collected = isStampCollected(station.stamp.id);
            return (
              <li
                key={station.id}
                className={`shrink-0 snap-start ${index === 0 ? "w-[70%]" : "w-[58%]"} max-w-[240px]`}
              >
                <CollectibleCard
                  name={t(station.name)}
                  series={
                    typeof dist === "number"
                      ? formatDistance(dist, locale)
                      : collected
                        ? locale === "vi"
                          ? "Đã có"
                          : "Collected"
                        : t(station.locationHint)
                  }
                  fact={t(station.funFact)}
                  imageSrc={art ? cardArtSrc(art, true) : null}
                  code={station.tag.publicCode}
                  flipHint={locale === "vi" ? "Chạm để lật" : "Tap to flip"}
                  className="aspect-[2/3] w-full"
                  onSelect={() => {
                    window.location.assign(`/s/${station.tag.publicCode}`);
                  }}
                />
              </li>
            );
          })}
        </ul>
      </section>

      {/* Embedded Interactive Saigon Zoo GPS Map Preview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
            {locale === "vi" ? "Bản đồ Thảo Cầm Viên" : "Saigon Zoo Map"}
          </h2>
          <Link
            href="/map"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-gouache-ink"
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
