"use client";

import { useEffect, useState } from "react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { useSearchFlag } from "@/components/passport/use-search-flag";
import { StampArt, StampThumbnail, paletteForStamp } from "@/components/passport/stamp-thumbnail";
import { useExplorer } from "@/context/explorer-context";
import { DEMO_PASSPORT_STAMPS, getPassport } from "@/lib/passport-client";
import {
  collectedCaption,
  formatCollectedAt,
  groupPassportStamps,
  passportStampsFromCollected,
  stampPlaceLine,
  stampSeries,
  type PassportStampCard,
} from "@/lib/passport-groups";
import { Sheet } from "@/components/ui/sheet";
import { TiltButton, TiltProvider } from "@/components/ui/tilt-provider";
import type { PassportStamp } from "@/types/passport";

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function PassportView() {
  const mock = useSearchFlag("mock");
  const {
    locale,
    isAuthenticated,
    collectedStamps,
    stations,
    venues,
  } = useExplorer();
  const vi = locale === "vi";
  const [remote, setRemote] = useState<PassportStamp[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (mock) return;
    const controller = new AbortController();
    let active = true;
    getPassport(controller.signal)
      .then((body) => {
        if (active) setRemote(body.stamps);
      })
      .catch((error: unknown) => {
        if (!active || isAbortError(error)) return;
        setRemote([]);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [mock]);

  const legacy = passportStampsFromCollected(collectedStamps, stations, venues, locale);
  const stamps: PassportStampCard[] = mock
    ? DEMO_PASSPORT_STAMPS
    : remote === null
      ? []
      : remote.length > 0
        ? remote
        : legacy;
  const loading = !mock && remote === null;
  const groups = groupPassportStamps(stamps);
  const selected = stamps.find((stamp) => stamp.id === selectedId) ?? null;
  const selectedIndex = selected ? stamps.findIndex((stamp) => stamp.id === selected.id) : 0;
  const selectedPalette = paletteForStamp(selectedIndex < 0 ? 0 : selectedIndex);

  const emptyLabel = vi ? "Chưa có con dấu" : "No stamps yet";
  const closeLabel = vi ? "Đóng" : "Close";
  const detailsHint = vi ? "Chi tiết" : "Details";
  const countLabel = vi
    ? `${stamps.length} con dấu`
    : `${stamps.length} ${stamps.length === 1 ? "stamp" : "stamps"}`;

  return (
    <TiltProvider>
      <div className="space-y-8" aria-busy={loading}>
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display-serif text-[length:var(--type-title-2)] font-extrabold leading-[1.12] text-[#272E2B]">
                {vi ? "Hộ chiếu" : "Passport"}
              </h1>
              {mock ? (
                <span className="rounded-full bg-gouache-ink px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-gouache-cream">
                  Demo
                </span>
              ) : null}
            </div>
            <p className="text-[length:var(--type-footnote)] font-semibold text-[#525D58]">
              {loading ? (vi ? "Đang tải" : "Loading") : countLabel}
            </p>
          </div>
          <TiltButton />
        </header>

        {!mock && !isAuthenticated ? (
          <GoogleSignInButton nextPath="/passport" size="md" />
        ) : null}

        <section aria-labelledby="passport-explore" className="space-y-3" data-testid="passport-section-b2c">
          <h2
            id="passport-explore"
            className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#525D58]"
          >
            {vi ? "Khám phá" : "Explore"}
          </h2>
          {loading ? null : groups.explore.length === 0 ? (
            <p
              data-testid="passport-empty-b2c"
              className="rounded-[18px] border border-dashed border-[#CFC4AB] bg-white/80 px-4 py-8 text-center text-[length:var(--type-footnote)] font-semibold text-[#525D58]"
            >
              {emptyLabel}
            </p>
          ) : (
            <StampGrid
              stamps={groups.explore}
              offset={0}
              demo={mock}
              detailsHint={detailsHint}
              closeLabel={closeLabel}
              locale={locale}
              onSelect={setSelectedId}
            />
          )}
        </section>

        <section aria-labelledby="passport-business" className="space-y-4" data-testid="passport-section-b2b">
          <h2
            id="passport-business"
            className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#525D58]"
          >
            {vi ? "Doanh nghiệp" : "Business"}
          </h2>
          {loading ? null : groups.business.length === 0 ? (
            <p
              data-testid="passport-empty-b2b"
              className="rounded-[18px] border border-dashed border-[#CFC4AB] bg-white/80 px-4 py-8 text-center text-[length:var(--type-footnote)] font-semibold text-[#525D58]"
            >
              {emptyLabel}
            </p>
          ) : (
            groups.business.map((group) => {
              const title =
                group.tenantName || (vi ? "Doanh nghiệp" : "Business");
              const offset = stamps.findIndex((stamp) => stamp.id === group.stamps[0]?.id);
              return (
                <div key={group.key} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[17px] font-extrabold leading-tight text-[#272E2B]">
                        {title}
                      </h3>
                      {group.roomName ? (
                        <p className="text-[length:var(--type-footnote)] font-semibold text-[#525D58]">
                          {group.roomName}
                        </p>
                      ) : null}
                    </div>
                    <span
                      data-testid="passport-business-badge"
                      className="inline-flex shrink-0 items-center rounded-full bg-business-accent px-2 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-white"
                    >
                      {vi ? "Doanh nghiệp" : "Business"}
                    </span>
                  </div>
                  <StampGrid
                    stamps={group.stamps}
                    offset={offset < 0 ? 0 : offset}
                    demo={mock}
                    detailsHint={detailsHint}
                    closeLabel={closeLabel}
                    locale={locale}
                    onSelect={setSelectedId}
                  />
                </div>
              );
            })
          )}
        </section>
      </div>

      <Sheet
        open={selected !== null}
        title={selected?.name ?? ""}
        closeLabel={closeLabel}
        onClose={() => setSelectedId(null)}
        testId="passport-stamp-sheet"
      >
        {selected ? (
          <div className="space-y-3">
            <div className="h-36 overflow-hidden rounded-[var(--radius-control)] bg-gouache-bg">
              <StampArt
                stamp={selected}
                pastel={selectedPalette.pastel}
                animal={selectedPalette.animal}
              />
            </div>
            {mock ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-gouache-ink">
                Demo
              </p>
            ) : null}
            <p className="text-[length:var(--type-body)] font-semibold text-gouache-ink">
              {collectedCaption(selected.collectedAt, locale)}
            </p>
            <p>{stampPlaceLine(selected, locale)}</p>
            <p className="text-[length:var(--type-caption)] font-bold uppercase tracking-[0.08em]">
              {selected.source === "b2b"
                ? vi
                  ? "Doanh nghiệp"
                  : "Business"
                : vi
                  ? "Khám phá"
                  : "Explore"}
            </p>
          </div>
        ) : null}
      </Sheet>
    </TiltProvider>
  );
}

function StampGrid({
  stamps,
  offset,
  demo,
  detailsHint,
  closeLabel,
  locale,
  onSelect,
}: {
  stamps: PassportStampCard[];
  offset: number;
  demo: boolean;
  detailsHint: string;
  closeLabel: string;
  locale: "en" | "vi";
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4">
      {stamps.map((stamp, index) => (
        <li
          key={stamp.id}
          data-testid={
            stamp.legacyStationId
              ? `stamp-card-${stamp.legacyStationId}`
              : `passport-stamp-${stamp.id}`
          }
          data-state="collected"
          className="min-w-0"
        >
          <StampThumbnail
            stamp={stamp}
            index={offset + index}
            series={stampSeries(stamp, locale)}
            fact={`${collectedCaption(stamp.collectedAt, locale)}. ${stampPlaceLine(stamp, locale)}`}
            flipHint={detailsHint}
            closeLabel={closeLabel}
            sealLabel={locale === "vi" ? "ĐÃ LƯU" : "SAVED"}
            sealDetail={formatCollectedAt(stamp.collectedAt, locale, "short")}
            demo={demo}
            onSelect={() => onSelect(stamp.id)}
          />
        </li>
      ))}
    </ul>
  );
}
