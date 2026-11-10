import type { CollectedStampRecord, PilotStation, PilotVenue } from "@/types/domain";
import type { PassportStamp } from "@/types/passport";

export type PassportStampCard = PassportStamp & {
  /** Station id from the existing explorer passport, used by the phase-1 check. */
  legacyStationId?: string;
};

export type BusinessStampGroup = {
  key: string;
  tenantName: string;
  roomName: string | null;
  stamps: PassportStamp[];
};

export function groupPassportStamps(stamps: PassportStamp[]): {
  explore: PassportStamp[];
  business: BusinessStampGroup[];
} {
  const explore: PassportStamp[] = [];
  const buckets = new Map<string, BusinessStampGroup>();
  const sorted = [...stamps].sort((a, b) => b.collectedAt.localeCompare(a.collectedAt));

  for (const stamp of sorted) {
    if (stamp.source === "b2c") {
      explore.push(stamp);
      continue;
    }
    if (stamp.source !== "b2b") continue;
    const tenantName = stamp.tenantName?.trim() ?? "";
    const roomName = stamp.roomName?.trim() || null;
    const key = `${tenantName}\u0000${roomName ?? ""}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.stamps.push(stamp);
      continue;
    }
    buckets.set(key, { key, tenantName, roomName, stamps: [stamp] });
  }

  const business = [...buckets.values()].sort((a, b) => {
    const aAt = a.stamps[0]?.collectedAt ?? "";
    const bAt = b.stamps[0]?.collectedAt ?? "";
    return bAt.localeCompare(aAt);
  });

  return { explore, business };
}

export function passportStampsFromCollected(
  records: CollectedStampRecord[],
  stations: PilotStation[],
  venues: PilotVenue[],
  locale: "en" | "vi",
): PassportStampCard[] {
  return records.map((record) => {
    const station = stations.find(
      (item) => item.id === record.stationId || item.stamp.id === record.stampId,
    );
    const venue = station
      ? venues.find((item) => item.id === station.venueId)
      : undefined;
    const name = station
      ? locale === "vi"
        ? station.stamp.name.vi
        : station.stamp.name.en
      : record.publicCode || (locale === "vi" ? "Con dấu" : "Stamp");
    const venueName = venue
      ? locale === "vi"
        ? venue.name.vi
        : venue.name.en
      : undefined;
    return {
      id: record.id,
      name,
      imageUrl: null,
      collectedAt: record.collectedAt,
      source: "b2c",
      venueName,
      legacyStationId: record.stationId,
    };
  });
}

export function formatCollectedAt(
  iso: string,
  locale: "en" | "vi",
  style: "short" | "full" = "full",
): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    month: "short",
    day: "numeric",
    year: style === "full" ? "numeric" : undefined,
  }).format(date);
}

export function collectedCaption(iso: string, locale: "en" | "vi"): string {
  const formatted = formatCollectedAt(iso, locale);
  if (!formatted) return locale === "vi" ? "Đã lưu" : "Saved";
  return locale === "vi" ? `Đã lưu ${formatted}` : `Saved ${formatted}`;
}

export function stampSeries(stamp: PassportStamp, locale: "en" | "vi"): string {
  if (stamp.source === "b2c") {
    return stamp.venueName || (locale === "vi" ? "Khám phá" : "Explore");
  }
  return (
    stamp.roomName ||
    stamp.tenantName ||
    (locale === "vi" ? "Doanh nghiệp" : "Business")
  );
}

export function stampPlaceLine(stamp: PassportStamp, locale: "en" | "vi"): string {
  if (stamp.source === "b2c") {
    return stamp.venueName || (locale === "vi" ? "Khám phá" : "Explore");
  }
  const parts = [stamp.tenantName, stamp.roomName].filter(
    (part): part is string => Boolean(part && part.trim()),
  );
  if (parts.length > 0) return parts.join(" · ");
  return locale === "vi" ? "Doanh nghiệp" : "Business";
}
