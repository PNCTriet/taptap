import { PILOT_COLLECTIONS, PILOT_STATIONS, PILOT_VENUE } from "@/features/pilot/sample-data";
import type { LocalizedText, PilotCollection, PilotStation, PilotVenue } from "@/types/domain";
import type { NfcTagStatus, StationStatus, StampStatus } from "@/types/database.types";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=900&q=80";
const ACCENTS: PilotStation["stamp"]["accentColor"][] = ["teal", "coral", "yellow", "blue"];

export function same(text: string | null | undefined, fallback = ""): LocalizedText {
  const v = (text ?? "").trim() || fallback;
  return { en: v, vi: v };
}

export interface DbVenue { id: string; slug: string; name: string; description: string | null; cover_image_url?: string | null; status?: string }
export interface DbCollection {
  id: string; venue_id?: string; slug: string; name: string; description: string | null;
  cover_image_url?: string | null; status?: string; completion_criteria?: { required?: number } | null;
}
export interface DbStation {
  id: string; venue_id?: string; slug: string; name: string; description: string | null;
  location_hint?: string | null; image_url?: string | null; latitude?: number | null; longitude?: number | null; status: string;
}
export interface DbStamp { id: string; name: string; description: string | null; image_url?: string | null; sort_order: number; status: string; collection_id?: string }
export interface DbTag { id: string; public_code: string; label: string | null; status: string }

export function mapVenue(v: DbVenue): PilotVenue {
  const seed = v.id === PILOT_VENUE.id ? PILOT_VENUE : null;
  return {
    id: v.id,
    slug: v.slug,
    name: seed?.name ?? same(v.name),
    description: seed?.description ?? same(v.description),
    locationLabel: seed?.locationLabel ?? same(""),
    coverImageUrl: v.cover_image_url || seed?.coverImageUrl || DEFAULT_IMAGE,
    status: (v.status as PilotVenue["status"]) ?? "active",
    isDemoSeed: Boolean(seed),
  };
}

export function mapCollection(c: DbCollection, venueId: string, stampCount: number): PilotCollection {
  const seed = PILOT_COLLECTIONS.find((p) => p.id === c.id);
  const required = c.completion_criteria?.required ?? stampCount;
  return {
    id: c.id,
    venueId,
    slug: c.slug,
    name: seed?.name ?? same(c.name),
    subtitle: seed?.subtitle ?? { en: `${stampCount} stations`, vi: `${stampCount} trạm` },
    description: seed?.description ?? same(c.description),
    coverImageUrl: c.cover_image_url || seed?.coverImageUrl || DEFAULT_IMAGE,
    requiredStamps: required || stampCount,
    estimatedDurationMinutes: seed?.estimatedDurationMinutes ?? 30,
    status: (c.status as PilotCollection["status"]) ?? "active",
  };
}

export function mapStation(
  s: DbStation,
  stamp: DbStamp | null,
  tag: DbTag | null,
  venueId: string,
  collectionId: string
): PilotStation {
  const seed = PILOT_STATIONS.find((p) => p.id === s.id);
  const sortOrder = stamp?.sort_order ?? 0;
  return {
    id: s.id,
    venueId,
    collectionId,
    slug: s.slug,
    name: seed?.name ?? same(s.name),
    description: seed?.description ?? same(s.description),
    funFact: seed?.funFact ?? same(s.description),
    locationHint: seed?.locationHint ?? same(s.location_hint, ""),
    latitude: typeof s.latitude === "number" ? s.latitude : (seed?.latitude ?? 10.7883),
    longitude: typeof s.longitude === "number" ? s.longitude : (seed?.longitude ?? 106.7054),
    imageUrl: s.image_url || seed?.imageUrl || DEFAULT_IMAGE,
    status: s.status as StationStatus,
    tag: {
      id: tag?.id ?? seed?.tag.id ?? "",
      publicCode: tag?.public_code ?? seed?.tag.publicCode ?? "",
      label: tag?.label ?? seed?.tag.label ?? "",
      status: (tag?.status as NfcTagStatus) ?? "disabled",
    },
    stamp: {
      id: stamp?.id ?? seed?.stamp.id ?? "",
      name: seed?.stamp.name ?? same(stamp?.name ?? s.name),
      description: seed?.stamp.description ?? same(stamp?.description),
      imageUrl: stamp?.image_url || seed?.stamp.imageUrl || s.image_url || DEFAULT_IMAGE,
      sortOrder,
      status: (stamp?.status as StampStatus) ?? "inactive",
      accentColor: seed?.stamp.accentColor ?? ACCENTS[Math.abs(sortOrder) % ACCENTS.length] ?? "teal",
    },
  };
}
