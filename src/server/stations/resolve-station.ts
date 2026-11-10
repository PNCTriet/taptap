import {
  DISABLED_DEMO_TAG_CODES,
  findPilotStationByCode,
  PILOT_COLLECTIONS,
  PILOT_VENUE,
} from "@/features/pilot/sample-data";
import { createClient } from "@supabase/supabase-js";
import { getEnvStatus, getPublicEnv, validatePublicCode } from "@/lib/env";
import { mapCollection, mapStation, mapVenue } from "@/server/catalog/mappers";
import type { StationResolutionResult } from "@/types/domain";

interface RpcResolution {
  status: "ok" | "tag_disabled" | "station_inactive" | "not_found" | "invalid_code";
  tag?: { id: string; public_code: string; label: string | null; status: string };
  station?: { id: string; slug: string; name: string; description: string | null; location_hint: string | null; image_url: string | null; latitude: number | null; longitude: number | null; status: string };
  stamp?: { id: string; name: string; description: string | null; image_url: string | null; sort_order: number; status: string } | null;
  collection?: { id: string; slug: string; name: string; description: string | null; status: string; completion_criteria: { required?: number } | null } | null;
  venue?: { id: string; slug: string; name: string; description: string | null };
  tenant?: { name: string } | null;
  room?: { name: string } | null;
}

/** Resolves a tag through the `resolve_public_tag` RPC (B2C and B2B tags). */
async function resolveFromSupabase(code: string): Promise<StationResolutionResult | null> {
  try {
    const env = getPublicEnv();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.rpc("resolve_public_tag", { p_code: code });
    if (error || !data) return null;
    const r = data as RpcResolution;
    if (r.status === "not_found" || r.status === "invalid_code" || !r.station || !r.venue || !r.tag) {
      return null; // fall back to pilot seed lookup / not-found copy
    }
    const venueId = r.venue.id;
    const collectionId = r.collection?.id ?? "";
    const station = mapStation(
      { ...r.station },
      r.stamp ?? null,
      r.tag,
      venueId,
      collectionId
    );
    const venue = mapVenue({ ...r.venue, status: "active" });
    if (r.tenant?.name) {
      venue.name = { en: r.tenant.name, vi: r.tenant.name };
      if (r.room?.name) venue.locationLabel = { en: r.room.name, vi: r.room.name };
    }
    const collection = r.collection ? mapCollection(r.collection, venueId, r.collection.completion_criteria?.required ?? 0) : undefined;
    const base = { dataSource: "supabase" as const, code: r.tag.public_code, venue, station, collection };
    if (r.status === "tag_disabled") {
      return { ...base, status: "tag_disabled", errorMessage: { en: "This tag has been retired. Use the replacement tag at the station.", vi: "Thẻ này đã ngưng. Dùng thẻ mới tại trạm." } };
    }
    if (r.status === "station_inactive") {
      return { ...base, status: "station_inactive", errorMessage: { en: "This station is paused. Your progress is safe.", vi: "Trạm đang tạm dừng. Tiến độ của bạn vẫn an toàn." } };
    }
    return { ...base, status: "ok" };
  } catch {
    return null;
  }
}

/**
 * Resolves a station and its associated stamp/collection from an NFC/QR `public_code`.
 * Validates format via Zod first, then resolves against Pilot Seed (or live Supabase when connected).
 */
export async function resolveStationByPublicCode(
  rawCode: string
): Promise<StationResolutionResult> {
  const trimmedCode = rawCode.trim();
  const validation = validatePublicCode(trimmedCode);

  if (!validation.success) {
    return {
      status: "invalid_code",
      dataSource: "pilot-seed",
      code: trimmedCode,
      errorMessage: {
        en: "This checkpoint code format is invalid. Please tap the NFC plaque or scan the official station QR code again.",
        vi: "Định dạng mã trạm không hợp lệ. Vui lòng chạm lại thẻ NFC hoặc quét lại mã QR chính thức tại trạm.",
      },
    };
  }

  const normalizedCode = validation.data.toLowerCase();
  const envStatus = getEnvStatus();
  const dataSource = envStatus.publicEnvConfigured ? "supabase" : "pilot-seed";

  if (envStatus.publicEnvConfigured) {
    const live = await resolveFromSupabase(normalizedCode);
    if (live) return live;
  }

  // Check if this tag is explicitly marked disabled/retired
  const disabledEntry = DISABLED_DEMO_TAG_CODES[normalizedCode];
  if (disabledEntry) {
    return {
      status: "tag_disabled",
      dataSource,
      code: normalizedCode,
      venue: PILOT_VENUE,
      errorMessage: {
        en: `This NFC tag (${normalizedCode}) has been retired or disabled by venue staff. Please use the replacement plaque at the station.`,
        vi: `Thẻ NFC này (${normalizedCode}) đã ngừng hoạt động hoặc được thay thế. Vui lòng sử dụng bảng NFC mới tại trạm.`,
      },
    };
  }

  const station = findPilotStationByCode(normalizedCode);
  if (!station) {
    return {
      status: "not_found",
      dataSource,
      code: normalizedCode,
      errorMessage: {
        en: `No station was found for checkpoint code "${normalizedCode}". Check the code or return to Explore.`,
        vi: `Không tìm thấy trạm nào khớp với mã "${normalizedCode}". Vui lòng kiểm tra lại hoặc quay về trang Khám Phá.`,
      },
    };
  }

  if (station.status !== "active") {
    return {
      status: "station_inactive",
      dataSource,
      code: normalizedCode,
      venue: PILOT_VENUE,
      station,
      errorMessage: {
        en: `The ${station.name.en} checkpoint is temporarily under maintenance. Your passport progress is safe!`,
        vi: `Trạm ${station.name.vi} hiện đang tạm bảo trì. Tiến độ hộ chiếu của bạn vẫn được lưu an toàn!`,
      },
    };
  }

  const collection =
    PILOT_COLLECTIONS.find((c) => c.id === station.collectionId) ?? PILOT_COLLECTIONS[0];

  return {
    status: "ok",
    dataSource,
    code: station.tag.publicCode,
    venue: PILOT_VENUE,
    collection,
    station,
  };
}
