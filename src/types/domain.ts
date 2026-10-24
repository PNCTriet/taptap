import type {
  CollectionStatus,
  NfcTagStatus,
  RedemptionStatus,
  RewardStatus,
  StampSource,
  StampStatus,
  StationStatus,
  SupportedLocale,
  VenueStatus,
} from "./database.types";

export interface LocalizedText {
  en: string;
  vi: string;
}

export type StampVisualState = "locked" | "available" | "collected" | "featured";

export interface PilotVenue {
  id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  locationLabel: LocalizedText;
  coverImageUrl: string;
  status: VenueStatus;
  isDemoSeed: boolean;
}

export interface PilotCollection {
  id: string;
  venueId: string;
  slug: string;
  name: LocalizedText;
  subtitle: LocalizedText;
  description: LocalizedText;
  coverImageUrl: string;
  requiredStamps: number;
  estimatedDurationMinutes: number;
  status: CollectionStatus;
}

export interface PilotStation {
  id: string;
  venueId: string;
  collectionId: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  funFact: LocalizedText;
  locationHint: LocalizedText;
  imageUrl: string;
  status: StationStatus;
  tag: {
    id: string;
    publicCode: string;
    label: string;
    status: NfcTagStatus;
  };
  stamp: {
    id: string;
    name: LocalizedText;
    description: LocalizedText;
    imageUrl: string;
    sortOrder: number;
    status: StampStatus;
    accentColor: "teal" | "coral" | "yellow" | "blue";
  };
}

export interface PilotBadge {
  id: string;
  collectionId: string;
  name: LocalizedText;
  description: LocalizedText;
  imageUrl: string;
}

export interface PilotReward {
  id: string;
  collectionId: string;
  name: LocalizedText;
  description: LocalizedText;
  imageUrl: string;
  redemptionInstructions: LocalizedText;
  requiredStamps: number;
  status: RewardStatus;
}

export interface CollectedStampRecord {
  id: string;
  participantId: string;
  stampId: string;
  stationId: string;
  publicCode: string;
  collectedAt: string;
  source: StampSource;
}

export interface RedemptionRecord {
  id: string;
  participantId: string;
  rewardId: string;
  redemptionCode: string;
  status: RedemptionStatus;
  createdAt: string;
  redeemedAt: string | null;
}

export interface ExplorerParticipantSession {
  participantId: string;
  authUserId: string | null;
  isAnonymous: boolean;
  displayName: string;
  locale: SupportedLocale;
  createdAt: string;
}

export type StationResolutionStatus =
  | "ok"
  | "tag_disabled"
  | "station_inactive"
  | "not_found"
  | "invalid_code";

export interface StationResolutionResult {
  status: StationResolutionStatus;
  dataSource: "supabase" | "pilot-seed";
  code: string;
  venue?: PilotVenue;
  collection?: PilotCollection;
  station?: PilotStation;
  errorMessage?: LocalizedText;
}
