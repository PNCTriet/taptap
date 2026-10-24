import {
  DISABLED_DEMO_TAG_CODES,
  findPilotStationByCode,
  PILOT_COLLECTIONS,
  PILOT_VENUE,
} from "@/features/pilot/sample-data";
import { getEnvStatus, validatePublicCode } from "@/lib/env";
import type { StationResolutionResult } from "@/types/domain";

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
