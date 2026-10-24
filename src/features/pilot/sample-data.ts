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
    en: "Saigon Zoo and Botanical Gardens",
    vi: "Thảo Cầm Viên Sài Gòn",
  },
  description: {
    en: "Development seed/demo dataset inspired by the historic botanical gardens and wildlife sanctuary in District 1, Ho Chi Minh City.",
    vi: "Dữ liệu mẫu phát triển lấy cảm hứng từ khu bảo tồn động thực vật lịch sử tại Quận 1, TP. Hồ Chí Minh.",
  },
  locationLabel: {
    en: "2 Nguyen Binh Khiem, District 1, Ho Chi Minh City",
    vi: "2 Nguyễn Bỉnh Khiêm, Quận 1, TP. Hồ Chí Minh",
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
      vi: "Hành Trình Khám Phá Thảo Cầm Viên",
    },
    subtitle: {
      en: "4 NFC Checkpoints • Shaded Heritage Trail",
      vi: "4 Trạm NFC • Tuyến Đường Di Sản Rợp Bóng Cây",
    },
    description: {
      en: "Follow the shaded botanical paths to visit the Elephant sanctuary, the Giraffe lookout, the Flamingo lagoon, and the Botanical Conservatory. Tap each NFC plaque or scan its QR code to press a commemorative ink stamp into your explorer passport.",
      vi: "Dạo bước dưới những tán cây cổ thụ để ghé thăm Khu Voi Châu Á, Đài Quan Sát Hươu Cao Cổ, Hồ Hồng Hạc và Nhà Kính Thực Vật. Chạm thẻ NFC hoặc quét mã QR tại mỗi trạm để đóng dấu mộc vào hộ chiếu khám phá của bạn.",
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
      en: "Meet the gentle Asian elephants beneath the century-old canopy and discover how keepers enrich their daily habitat.",
      vi: "Gặp gỡ những chú voi châu Á hiền hòa dưới tán cây cổ thụ và tìm hiểu công tác bảo tồn sinh cảnh tự nhiên mỗi ngày.",
    },
    funFact: {
      en: "Asian elephants use low-frequency rumbles and trunk touches to greet herd companions across shaded forest clearings.",
      vi: "Voi châu Á giao tiếp bằng âm trầm tần số thấp và cử chỉ vòi tinh tế để chào hỏi đồng loại trong rừng.",
    },
    locationHint: {
      en: "East Heritage Path — Asian Elephant Sanctuary Plaque",
      vi: "Lối Di Sản Phía Đông — Bảng Đồng Khu Voi Châu Á",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=900&q=80",
    status: "active",
    tag: {
      id: "44444444-4444-4444-8444-444444444401",
      publicCode: "tcv-k9x2m4p8",
      label: "Elephant Sanctuary — Brass Plaque NFC #1",
      status: "active",
    },
    stamp: {
      id: "55555555-5555-4555-8555-555555555501",
      name: {
        en: "Elephant Sanctuary Stamp",
        vi: "Tem Mộc Voi Châu Á",
      },
      description: {
        en: "Postmarked at the East Heritage Path Elephant Sanctuary.",
        vi: "Đóng dấu tại Khu Bảo Tồn Voi Châu Á.",
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
      en: "Step onto the elevated timber deck to watch reticulated giraffes browse high among the acacia canopies at eye level.",
      vi: "Bước lên sàn gỗ trên cao để ngắm nhìn những chú hươu cao cổ thong thả thưởng thức lá non ngang tầm mắt.",
    },
    funFact: {
      en: "Each giraffe's coat pattern is as unique as a human fingerprint, helping calves recognize their mothers from afar.",
      vi: "Hoa văn trên bộ lông của mỗi chú hươu cao cổ là độc nhất như vân tay, giúp hươu non nhận ra mẹ từ xa.",
    },
    locationHint: {
      en: "North Savanna Lawn — Elevated Timber Deck Rail",
      vi: "Thảm Cỏ Phía Bắc — Lan Can Đài Quan Sát Gỗ",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=900&q=80",
    status: "active",
    tag: {
      id: "44444444-4444-4444-8444-444444444402",
      publicCode: "tcv-q7w3n5r2",
      label: "Giraffe Lookout — Timber Rail NFC #1",
      status: "active",
    },
    stamp: {
      id: "55555555-5555-4555-8555-555555555502",
      name: {
        en: "Giraffe Lookout Stamp",
        vi: "Tem Mộc Hươu Cao Cổ",
      },
      description: {
        en: "Postmarked at the North Savanna Elevated Deck.",
        vi: "Đóng dấu tại Đài Quan Sát Hươu Cao Cổ.",
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
      en: "Pause by the sunlit lotus lagoon where vibrant coral-pink flamingos gather along the shallow reflections.",
      vi: "Dừng chân bên hồ sen ngập nắng, nơi đàn hồng hạc rực rỡ soi bóng bên mặt nước phẳng lặng.",
    },
    funFact: {
      en: "Flamingos get their coral plumage from carotenoid pigments in the aquatic organisms they filter-feed on.",
      vi: "Màu hồng cam rực rỡ của hồng hạc được hình thành từ sắc tố tự nhiên carotenoid trong nguồn thức ăn thủy sinh.",
    },
    locationHint: {
      en: "Central Waterfowl Lagoon — West Viewing Bridge",
      vi: "Hồ Thủy Cầm Trung Tâm — Cầu Ngắm Cảnh Phía Tây",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1497206365907-f5e630693df0?auto=format&fit=crop&w=900&q=80",
    status: "active",
    tag: {
      id: "44444444-4444-4444-8444-444444444403",
      publicCode: "tcv-h4j8v6b1",
      label: "Flamingo Lagoon — Viewing Bridge NFC #1",
      status: "active",
    },
    stamp: {
      id: "55555555-5555-4555-8555-555555555503",
      name: {
        en: "Flamingo Lagoon Stamp",
        vi: "Tem Mộc Hồ Hồng Hạc",
      },
      description: {
        en: "Postmarked at the Central Waterfowl Lagoon Bridge.",
        vi: "Đóng dấu tại Cầu Hồ Hồng Hạc Trung Tâm.",
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
      en: "Wander among rare Indochinese orchids, heritage bonsai, and tropical ferns inside the historic botanical glasshouse.",
      vi: "Khám phá bộ sưu tập phong lan Đông Dương quý hiếm, bonsai cổ thụ và dương xỉ nhiệt đới trong nhà kính thực vật.",
    },
    funFact: {
      en: "Founded in 1864, the garden preserves over 1,800 trees across 260 botanical species right in the heart of Saigon.",
      vi: "Thành lập từ năm 1864, khu vườn bảo tồn hơn 1.800 cây gỗ thuộc 260 loài thực vật quý giữa lòng Sài Gòn.",
    },
    locationHint: {
      en: "Botanical Quarter — Glasshouse Archway Entrance",
      vi: "Khu Thực Vật — Cổng Vòm Nhà Kính",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80",
    status: "active",
    tag: {
      id: "44444444-4444-4444-8444-444444444404",
      publicCode: "tcv-z2c9f3t7",
      label: "Botanical Conservatory — Archway NFC #1",
      status: "active",
    },
    stamp: {
      id: "55555555-5555-4555-8555-555555555504",
      name: {
        en: "Botanical Orchid Stamp",
        vi: "Tem Mộc Nhà Kính Thực Vật",
      },
      description: {
        en: "Postmarked at the Glasshouse Botanical Conservatory.",
        vi: "Đóng dấu tại Nhà Kính Thực Vật Thảo Cầm Viên.",
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
    label: "Elephant Sanctuary — Retired Test Tag",
    status: "disabled",
  },
};

export const PILOT_BADGES: PilotBadge[] = [
  {
    id: "66666666-6666-4666-8666-666666666601",
    collectionId: "22222222-2222-4222-8222-222222222201",
    name: {
      en: "Saigon Zoo Explorer Crest",
      vi: "Huy Hiệu Nhà Thám Hiểm Thảo Cầm Viên",
    },
    description: {
      en: "Awarded to explorers who collect all 4 wildlife & botanical stamps along the Zoo Explorer trail.",
      vi: "Trao tặng nhà thám hiểm đã sưu tầm trọn bộ 4 con dấu động thực vật trên tuyến Zoo Explorer.",
    },
    imageUrl: "/badges/zoo-explorer-crest.svg",
  },
];

export const PILOT_REWARDS: PilotReward[] = [
  {
    id: "77777777-7777-4777-8777-777777777701",
    collectionId: "22222222-2222-4222-8222-222222222201",
    name: {
      en: "Explorer Botanical Postcard & Sticker Set",
      vi: "Bộ Bưu Thiếp & Nhãn Dán Zoo Explorer",
    },
    description: {
      en: "Receive an illustrated botanical postcard & weatherproof wildlife sticker sheet when you complete the Zoo Explorer passport.",
      vi: "Nhận bộ bưu thiếp minh họa thực vật và bộ sticker động vật chống nước khi hoàn thành hộ chiếu Zoo Explorer.",
    },
    imageUrl:
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80",
    redemptionInstructions: {
      en: "Show your issued redemption code to the attendant at the Main Gate Visitor Kiosk between 08:30 and 17:00.",
      vi: "Xuất trình mã đổi thưởng tại Quầy Thông Tin Cổng Chính từ 08:30 đến 17:00 để nhận quà.",
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
