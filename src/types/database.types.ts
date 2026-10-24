export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type VenueStatus = "draft" | "active" | "archived";
export type CollectionStatus = "draft" | "active" | "archived";
export type StationStatus = "active" | "maintenance" | "inactive";
export type NfcTagStatus = "active" | "disabled" | "lost" | "replaced";
export type StampStatus = "active" | "inactive";
export type StampSource = "nfc" | "qr" | "admin";
export type RewardStatus = "active" | "paused" | "exhausted";
export type RedemptionStatus = "issued" | "redeemed" | "expired" | "cancelled";
export type SupportedLocale = "en" | "vi";

export interface Database {
  public: {
    Tables: {
      venues: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          cover_image_url: string | null;
          status: VenueStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          cover_image_url?: string | null;
          status?: VenueStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          cover_image_url?: string | null;
          status?: VenueStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      venue_admins: {
        Row: {
          id: string;
          venue_id: string;
          user_id: string;
          role: "venue_admin" | "venue_editor";
          created_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          user_id: string;
          role?: "venue_admin" | "venue_editor";
          created_at?: string;
        };
        Update: {
          id?: string;
          venue_id?: string;
          user_id?: string;
          role?: "venue_admin" | "venue_editor";
          created_at?: string;
        };
      };
      collections: {
        Row: {
          id: string;
          venue_id: string;
          name: string;
          slug: string;
          description: string | null;
          cover_image_url: string | null;
          completion_criteria: Json;
          status: CollectionStatus;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          name: string;
          slug: string;
          description?: string | null;
          cover_image_url?: string | null;
          completion_criteria?: Json;
          status?: CollectionStatus;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          venue_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          cover_image_url?: string | null;
          completion_criteria?: Json;
          status?: CollectionStatus;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      stations: {
        Row: {
          id: string;
          venue_id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          location_hint: string | null;
          status: StationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          venue_id: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          location_hint?: string | null;
          status?: StationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          venue_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image_url?: string | null;
          location_hint?: string | null;
          status?: StationStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      nfc_tags: {
        Row: {
          id: string;
          station_id: string;
          public_code: string;
          label: string | null;
          status: NfcTagStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          station_id: string;
          public_code: string;
          label?: string | null;
          status?: NfcTagStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          station_id?: string;
          public_code?: string;
          label?: string | null;
          status?: NfcTagStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      stamps: {
        Row: {
          id: string;
          collection_id: string;
          station_id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          status: StampStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          station_id: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          status?: StampStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          station_id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          sort_order?: number;
          status?: StampStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      participants: {
        Row: {
          id: string;
          auth_user_id: string | null;
          guest_token_hash: string | null;
          display_name: string | null;
          locale: SupportedLocale;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          guest_token_hash?: string | null;
          display_name?: string | null;
          locale?: SupportedLocale;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          guest_token_hash?: string | null;
          display_name?: string | null;
          locale?: SupportedLocale;
          created_at?: string;
          updated_at?: string;
        };
      };
      collected_stamps: {
        Row: {
          id: string;
          participant_id: string;
          stamp_id: string;
          nfc_tag_id: string | null;
          collected_at: string;
          source: StampSource;
        };
        Insert: {
          id?: string;
          participant_id: string;
          stamp_id: string;
          nfc_tag_id?: string | null;
          collected_at?: string;
          source?: StampSource;
        };
        Update: {
          id?: string;
          participant_id?: string;
          stamp_id?: string;
          nfc_tag_id?: string | null;
          collected_at?: string;
          source?: StampSource;
        };
      };
      badges: {
        Row: {
          id: string;
          collection_id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      participant_badges: {
        Row: {
          id: string;
          participant_id: string;
          badge_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          participant_id: string;
          badge_id: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          participant_id?: string;
          badge_id?: string;
          unlocked_at?: string;
        };
      };
      rewards: {
        Row: {
          id: string;
          collection_id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          redemption_instructions: string | null;
          status: RewardStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          redemption_instructions?: string | null;
          status?: RewardStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          redemption_instructions?: string | null;
          status?: RewardStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      redemptions: {
        Row: {
          id: string;
          participant_id: string;
          reward_id: string;
          redemption_code: string;
          status: RedemptionStatus;
          created_at: string;
          redeemed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          participant_id: string;
          reward_id: string;
          redemption_code: string;
          status?: RedemptionStatus;
          created_at?: string;
          redeemed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          participant_id?: string;
          reward_id?: string;
          redemption_code?: string;
          status?: RedemptionStatus;
          created_at?: string;
          redeemed_at?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
