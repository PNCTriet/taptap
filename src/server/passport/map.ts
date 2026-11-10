import type { MergeResponse, PassportStamp } from "@/types/passport";

/** Row shape returned by the `taptap_passport_for` family of RPCs. */
export interface PassportRow {
  id: string;
  stampId: string;
  stationId: string;
  name: string;
  imageUrl: string | null;
  collectedAt: string;
  source: "b2c" | "b2b";
  venueName: string | null;
  tenantName: string | null;
  roomName: string | null;
  collectSource: "nfc" | "qr" | "admin";
  participantId: string;
  publicCode: string | null;
}

/** Legacy shape still used by the player context for B2C station state. */
export interface LegacyRecord {
  id: string;
  participant_id: string;
  stamp_id: string;
  station_id: string;
  public_code: string | null;
  collected_at: string;
  source: "nfc" | "qr" | "admin";
}

function opt(v: string | null | undefined) {
  return v ? v : undefined;
}

export function toPassportStamps(rows: unknown): PassportStamp[] {
  if (!Array.isArray(rows)) return [];
  return (rows as PassportRow[]).map((r) => {
    const s: PassportStamp = {
      id: r.id,
      name: r.name,
      imageUrl: r.imageUrl ?? null,
      collectedAt: r.collectedAt,
      source: r.source === "b2b" ? "b2b" : "b2c",
    };
    if (s.source === "b2c") {
      if (opt(r.venueName)) s.venueName = r.venueName!;
    } else {
      if (opt(r.tenantName)) s.tenantName = r.tenantName!;
      if (opt(r.roomName)) s.roomName = r.roomName!;
    }
    return s;
  });
}

/** B2C-only records for existing player screens (catalog stations never include tenant stations). */
export function toLegacyRecords(rows: unknown): LegacyRecord[] {
  if (!Array.isArray(rows)) return [];
  return (rows as PassportRow[])
    .filter((r) => r.source !== "b2b")
    .map((r) => ({
      id: r.id,
      participant_id: r.participantId,
      stamp_id: r.stampId,
      station_id: r.stationId,
      public_code: r.publicCode,
      collected_at: r.collectedAt,
      source: r.collectSource,
    }))
    .sort((a, b) => a.collected_at.localeCompare(b.collected_at));
}

export function parseMergeResult(v: unknown): MergeResponse {
  const o = (v ?? {}) as Record<string, unknown>;
  const n = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x > 0 ? Math.floor(x) : 0);
  return { merged: n(o.merged), alreadyOwned: n(o.alreadyOwned) };
}

/** Human label for a passport stamp's origin. */
export function stampOriginLabel(s: PassportStamp): string {
  if (s.source === "b2b") return [s.tenantName, s.roomName].filter(Boolean).join(" · ");
  return s.venueName ?? "";
}
