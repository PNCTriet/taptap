import type {
  PilotBadge,
  PilotCollection,
  PilotReward,
  PilotStation,
  PilotVenue,
} from "@/types/domain";

export const PILOT_VENUE: PilotVenue = {
  id: "11111111-1111-4111-8111-111111111101",
  slug: "saigon-zoo",
  name: {
    en: "Saigon Zoo",
    vi: "Thảo Cầm Viên",
  },
  description: {
    en: "Historic botanical gardens and wildlife sanctuary in Saigon.",
    vi: "Vườn thú và thực vật lịch sử giữa lòng Sài Gòn.",
  },
  locationLabel: {
    en: "District 1, Ho Chi Minh City",
    vi: "Quận 1, TP. Hồ Chí Minh",
  },
  coverImageUrl:
    "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=1200&q=80",
  status: "active",
  isDemoSeed: true,
};

export const PILOT_COLLECTIONS: PilotCollection[] = [
  {
    id: "22222222-2222-4222-8222-222222222201",
    venueId: PILOT_VENUE.id,
    slug: "zoo-explorer",
    name: {
      en: "Zoo Explorer",
      vi: "Zoo Explorer",
    },
    subtitle: {
      en: "4 checkpoints • Saigon Zoo",
      vi: "4 trạm dừng • Thảo Cầm Viên",
    },
    description: {
      en: "Collect all 4 wildlife stamps across the shaded heritage trail.",
      vi: "Sưu tầm đủ 4 con dấu trên hành trình khám phá.",
    },
    coverImageUrl:
      "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1200&q=80",
    requiredStamps: 4,
    estimatedDurationMinutes: 45,
    status: "active",
  },
];

export const PILOT_STATIONS: PilotStation[] = [
  {
    id: "33333333-3333-4333-8333-333333333301",
    venueId: PILOT_VENUE.id,
    collectionId: "22222222-2222-4222-8222-222222222201",
    slug: "elephant",
    name: {
      en: "Elephant",
      vi: "Voi Châu Á",
    },
    description: {
      en: "Gentle Asian elephants beneath the century-old forest canopy.",
      vi: "Những chú voi châu Á hiền hòa dưới tán rừng cổ thụ.",
    },
    funFact: {
      en: "Elephants greet each other with low rumbles and trunk touches.",
      vi: "Voi chào nhau bằng âm trầm và cái chạm vòi nhẹ nhàng.",
    },
    locationHint: {
      en: "East Heritage Path",
      vi: "Lối Di Sản Phía Đông",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=900&q=80",
    status: "active",
    tag: {
      id: "44444444-4444-4444-8444-444444444401",
      publicCode: "tcv-k9x2m4p8",
      label: "Elephant — NFC #1",
      status: "active",
    },
    stamp: {
      id: "55555555-5555-4555-8555-555555555501",
      name: {
        en: "Elephant",
        vi: "Voi Châu Á",
      },
      description: {
        en: "East Heritage Path",
        vi: "Lối Di Sản Phía Đông",
      },
      imageUrl:
        "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=900&q=80",
      sortOrder: 1,
      status: "active",
      accentColor: "teal",
    },
  },
  {
    id: "33333333-3333-4333-8333-333333333302",
    venueId: PILOT_VENUE.id,
    collectionId: "22222222-2222-4222-8222-222222222201",
    slug: "giraffe",
    name: {
      en: "Giraffe",
      vi: "Hươu Cao Cổ",
    },
    description: {
      en: "Watch giraffes browse high among the acacia treetops.",
      vi: "Ngắm hươu cao cổ thong thả dưới tán cây keo.",
    },
    funFact: {
      en: "Every giraffe coat pattern is unique like a fingerprint.",
      vi: "Hoa văn mỗi chú hươu cao cổ là độc nhất.",
    },
    locationHint: {
      en: "North Savanna Deck",
      vi: "Đài Quan Sát Phía Bắc",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=900&q=80",
    status: "active",
    tag: {
      id: "44444444-4444-4444-8444-444444444402",
      publicCode: "tcv-q7w3n5r2",
      label: "Giraffe — NFC #2",
      status: "active",
    },
    stamp: {
      id: "55555555-5555-4555-8555-555555555502",
      name: {
        en: "Giraffe",
        vi: "Hươu Cao Cổ",
      },
      description: {
        en: "North Savanna Deck",
        vi: "Đài Quan Sát Phía Bắc",
      },
      imageUrl:
        "https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=900&q=80",
      sortOrder: 2,
      status: "active",
      accentColor: "yellow",
    },
  },
  {
    id: "33333333-3333-4333-8333-333333333303",
    venueId: PILOT_VENUE.id,
    collectionId: "22222222-2222-4222-8222-222222222201",
    slug: "flamingo",
    name: {
      en: "Flamingo",
      vi: "Hồng Hạc",
    },
    description: {
      en: "Coral-pink flamingos gathered along the sunlit lotus lagoon.",
      vi: "Đàn hồng hạc rực rỡ bên hồ sen ngập nắng.",
    },
    funFact: {
      en: "Their coral feathers come from natural aquatic pigments.",
      vi: "Sắc lông hồng cam đến từ sắc tố tự nhiên.",
    },
    locationHint: {
      en: "Central Lagoon",
      vi: "Hồ Trung Tâm",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1497206365907-f5e630693df0?auto=format&fit=crop&w=900&q=80",
    status: "active",
    tag: {
      id: "44444444-4444-4444-8444-444444444403",
      publicCode: "tcv-h4j8v6b1",
      label: "Flamingo — NFC #3",
      status: "active",
    },
    stamp: {
      id: "55555555-5555-4555-8555-555555555503",
      name: {
        en: "Flamingo",
        vi: "Hồng Hạc",
      },
      description: {
        en: "Central Lagoon",
        vi: "Hồ Trung Tâm",
      },
      imageUrl:
        "https://images.unsplash.com/photo-1497206365907-f5e630693df0?auto=format&fit=crop&w=900&q=80",
      sortOrder: 3,
      status: "active",
      accentColor: "coral",
    },
  },
  {
    id: "33333333-3333-4333-8333-333333333304",
    venueId: PILOT_VENUE.id,
    collectionId: "22222222-2222-4222-8222-222222222201",
    slug: "botanical-conservatory",
    name: {
      en: "Botanical Conservatory",
      vi: "Nhà Kính Thực Vật",
    },
    description: {
      en: "Rare orchids and heritage bonsai inside the glasshouse.",
      vi: "Phong lan quý và bonsai cổ thụ trong nhà kính.",
    },
    funFact: {
      en: "Home to over 260 rare tropical plant species since 1864.",
      vi: "Bảo tồn hơn 260 loài thực vật quý từ năm 1864.",
    },
    locationHint: {
      en: "Botanical Glasshouse",
      vi: "Khu Nhà Kính",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
    status: "active",
    tag: {
      id: "44444444-4444-4444-8444-444444444404",
      publicCode: "tcv-z2c9f3t7",
      label: "Conservatory — NFC #4",
      status: "active",
    },
    stamp: {
      id: "55555555-5555-4555-8555-555555555504",
      name: {
        en: "Conservatory",
        vi: "Nhà Kính",
      },
      description: {
        en: "Botanical Glasshouse",
        vi: "Khu Nhà Kính",
      },
      imageUrl:
        "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
      sortOrder: 4,
      status: "active",
      accentColor: "blue",
    },
  },
];

export const DISABLED_DEMO_TAG_CODES: Record<
  string,
  { stationSlug: string; label: string; status: "disabled" | "lost" | "replaced" }
> = {
  "tcv-disabled99": {
    stationSlug: "elephant",
    label: "Elephant — Retired Tag",
    status: "disabled",
  },
};

export const PILOT_BADGES: PilotBadge[] = [
  {
    id: "66666666-6666-4666-8666-666666666601",
    collectionId: "22222222-2222-4222-8222-222222222201",
    name: {
      en: "Zoo Explorer Crest",
      vi: "Huy Hiệu Zoo Explorer",
    },
    description: {
      en: "Collected all 4 Zoo Explorer stamps.",
      vi: "Hoàn thành đủ 4 con dấu Zoo Explorer.",
    },
    imageUrl: "/badges/zoo-explorer-crest.svg",
  },
];

export const PILOT_REWARDS: PilotReward[] = [
  {
    id: "77777777-7777-4777-8777-777777777701",
    collectionId: "22222222-2222-4222-8222-222222222201",
    name: {
      en: "Botanical Postcard & Sticker Set",
      vi: "Bộ Bưu Thiếp & Sticker",
    },
    description: {
      en: "Illustrated postcard and sticker set for completing your passport.",
      vi: "Quà tặng bưu thiếp và sticker khi hoàn thành hộ chiếu.",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80",
    redemptionInstructions: {
      en: "Show your code at the Main Gate Kiosk (08:30–17:00).",
      vi: "Xuất trình mã tại Quầy Cổng Chính (08:30–17:00).",
    },
    requiredStamps: 4,
    status: "active",
  },
];

export function findPilotCollectionBySlug(slug: string): PilotCollection | undefined {
  return PILOT_COLLECTIONS.find((c) => c.slug === slug);
}

export function findPilotStationByCode(publicCode: string): PilotStation | undefined {
  const normalized = publicCode.trim().toLowerCase();
  return PILOT_STATIONS.find((s) => s.tag.publicCode.toLowerCase() === normalized);
}

export function findPilotRewardById(rewardId: string): PilotReward | undefined {
  return PILOT_REWARDS.find((r) => r.id === rewardId || r.id.endsWith(rewardId));
}
