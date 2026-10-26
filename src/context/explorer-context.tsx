"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  PILOT_BADGES,
  PILOT_COLLECTIONS,
  PILOT_REWARDS,
  PILOT_STATIONS,
  PILOT_VENUE,
} from "@/features/pilot/sample-data";
import { isSupabasePublicEnvConfigured } from "@/lib/env";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type { StampSource, SupportedLocale } from "@/types/database.types";
import type {
  CollectedStampRecord,
  ExplorerParticipantSession,
  LocalizedText,
  PilotBadge,
  PilotCollection,
  PilotReward,
  PilotStation,
  PilotVenue,
  RedemptionRecord,
} from "@/types/domain";

const STORAGE_KEY = "taptap_explorer_state_v1";
export const GMAIL_SESSION_STORAGE_KEY = "taptap.gmail.session.v1";

export interface AuthUserProfile {
  id: string;
  email: string | null;
  name: string;
  displayName: string;
  avatarUrl: string | null;
}

export type AuthenticatedGoogleUser = AuthUserProfile;

interface StoredGmailSession {
  id: string;
  email: string;
  displayName: string;
}

interface StoredExplorerState {
  session: ExplorerParticipantSession;
  collectedStamps: CollectedStampRecord[];
  earnedBadges: string[];
  redemptions: RedemptionRecord[];
  venues: PilotVenue[];
  collections: PilotCollection[];
  stations: PilotStation[];
  rewards: PilotReward[];
}

interface RpcPassportResponse {
  participant?: {
    id: string;
    email: string;
    display_name: string | null;
    device_token?: string | null;
  } | null;
  stamps?: Array<{
    id: string;
    participant_id: string;
    stamp_id: string;
    station_id?: string | null;
    nfc_tag_id?: string | null;
    collected_at: string;
  }>;
  badges?: Array<{
    id: string;
    participant_id: string;
    badge_id: string;
    awarded_at?: string;
  }>;
  redemptions?: Array<{
    id: string;
    participant_id: string;
    reward_id: string;
    voucher_code?: string;
    redemption_code?: string;
    status: "issued" | "redeemed" | "expired" | "cancelled";
    created_at?: string;
    redeemed_at: string | null;
    expires_at?: string | null;
  }>;
}

function createDefaultSession(): ExplorerParticipantSession {
  return {
    participantId: "88888888-8888-4888-8888-888888888801",
    authUserId: null,
    isAnonymous: true,
    displayName: "Saigon Explorer",
    locale: "en",
    createdAt: "2026-10-24T08:00:00.000Z",
  };
}

function createInitialState(): StoredExplorerState {
  return {
    session: createDefaultSession(),
    collectedStamps: [],
    earnedBadges: [],
    redemptions: [],
    venues: [PILOT_VENUE],
    collections: PILOT_COLLECTIONS,
    stations: PILOT_STATIONS,
    rewards: PILOT_REWARDS,
  };
}

export function normalizeGmailInput(rawEmail: string): {
  valid: boolean;
  email: string;
} {
  const trimmed = rawEmail.trim().toLowerCase();
  if (!trimmed) {
    return { valid: false, email: "" };
  }
  const withDomain = trimmed.includes("@") ? trimmed : `${trimmed}@gmail.com`;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return {
    valid: emailRegex.test(withDomain),
    email: withDomain,
  };
}

export function deriveDisplayNameFromEmail(
  email: string,
  customName?: string
): string {
  const trimmedName = customName?.trim();
  if (trimmedName) return trimmedName;
  const localPart = email.split("@")[0] ?? "Explorer";
  const cleaned = localPart
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return cleaned || "Saigon Explorer";
}

export interface CollectStampOutcome {
  ok: boolean;
  alreadyCollected: boolean;
  newlyCollected: boolean;
  record?: CollectedStampRecord;
  error?: LocalizedText;
}

interface ExplorerContextValue {
  hydrated: boolean;
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (text: LocalizedText) => string;
  isSupabaseConfigured: boolean;
  authLoading: boolean;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUserProfile | null;
  authError: string | null;
  isGmailModalOpen: boolean;
  openGmailModal: () => void;
  closeGmailModal: () => void;
  signInWithGmail: (
    email: string,
    displayName?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
  session: ExplorerParticipantSession;
  updateDisplayName: (name: string) => void;
  venue: PilotVenue;
  venues: PilotVenue[];
  collections: PilotCollection[];
  stations: PilotStation[];
  badges: PilotBadge[];
  earnedBadges: string[];
  rewards: PilotReward[];
  collectedStamps: CollectedStampRecord[];
  redemptions: RedemptionRecord[];
  isStampCollected: (stampOrStationId: string) => boolean;
  isStationCollected: (stationOrStampId: string) => boolean;
  getCollectedRecord: (
    stampOrStationId: string
  ) => CollectedStampRecord | undefined;
  collectStamp: (
    stationId: string,
    source?: StampSource
  ) => CollectStampOutcome;
  issueRedemption: (rewardId: string) => RedemptionRecord | undefined;
  claimReward: (rewardId: string) => RedemptionRecord | undefined;
  markRedemptionRedeemed: (redemptionId: string) => void;
  resetDemoProgress: () => void;
  resetProgress: () => void;
  loadSampleProgress: () => void;
  upsertVenue: (venue: PilotVenue) => void;
  upsertCollection: (collection: PilotCollection) => void;
  upsertStation: (station: PilotStation) => void;
  upsertReward: (reward: PilotReward) => void;
}

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

export function ExplorerProvider({ children }: { children: React.ReactNode }) {
  const isSupabaseConfigured = useMemo(
    () => isSupabasePublicEnvConfigured(),
    []
  );
  const [hydrated, setHydrated] = useState(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState<boolean>(false);
  const [state, setState] = useState<StoredExplorerState>(createInitialState);

  const stationsRef = useRef<PilotStation[]>(PILOT_STATIONS);
  useEffect(() => {
    stationsRef.current = state.stations;
  }, [state.stations]);

  const applyPassportPayload = useCallback(
    (
      payload: RpcPassportResponse,
      fallbackEmail: string,
      fallbackDisplayName: string
    ): AuthUserProfile => {
      const participant = payload.participant;
      const resolvedId = participant?.id ?? `gmail-${fallbackEmail}`;
      const resolvedEmail = participant?.email ?? fallbackEmail;
      const resolvedName =
        participant?.display_name?.trim() || fallbackDisplayName;

      const profile: AuthUserProfile = {
        id: resolvedId,
        email: resolvedEmail,
        name: resolvedName,
        displayName: resolvedName,
        avatarUrl: null,
      };

      const mappedStamps: CollectedStampRecord[] = (payload.stamps ?? [])
        .map((row): CollectedStampRecord | null => {
          const matchedStation = stationsRef.current.find(
            (s) =>
              s.stamp.id === row.stamp_id ||
              (row.station_id && s.id === row.station_id)
          );
          if (!matchedStation) return null;
          return {
            id: row.id,
            participantId: row.participant_id || resolvedId,
            stampId: row.stamp_id,
            stationId: matchedStation.id,
            publicCode: matchedStation.tag.publicCode,
            collectedAt: row.collected_at,
            source: "nfc" as const,
          };
        })
        .filter((item): item is CollectedStampRecord => item !== null);

      const mappedBadges: string[] = (payload.badges ?? []).map(
        (b) => b.badge_id
      );

      const mappedRedemptions: RedemptionRecord[] = (
        payload.redemptions ?? []
      ).map((row) => ({
        id: row.id,
        participantId: row.participant_id || resolvedId,
        rewardId: row.reward_id,
        redemptionCode:
          row.voucher_code || row.redemption_code || "ZOO-REWARD",
        status: row.status,
        createdAt:
          row.created_at || row.redeemed_at || new Date().toISOString(),
        redeemedAt: row.redeemed_at,
      }));

      setUser(profile);
      setState((prev) => ({
        ...prev,
        session: {
          ...prev.session,
          participantId: resolvedId,
          authUserId: resolvedId,
          isAnonymous: false,
          displayName: resolvedName,
        },
        collectedStamps: mappedStamps,
        earnedBadges: mappedBadges,
        redemptions: mappedRedemptions,
      }));

      try {
        const storedSession: StoredGmailSession = {
          id: resolvedId,
          email: resolvedEmail,
          displayName: resolvedName,
        };
        window.localStorage.setItem(
          GMAIL_SESSION_STORAGE_KEY,
          JSON.stringify(storedSession)
        );
      } catch {
        // Ignore storage write errors
      }

      return profile;
    },
    []
  );

  const syncGmailSessionWithSupabase = useCallback(
    async (email: string, displayName: string) => {
      if (!isSupabaseConfigured) return;
      try {
        const supabase = createClientSupabaseClient();
        const { data, error } = await supabase.rpc(
          "upsert_gmail_participant",
          {
            p_email: email,
            p_display_name: displayName,
            p_device_token: `gmail:${email}`,
          }
        );
        if (!error && data && typeof data === "object") {
          applyPassportPayload(
            data as unknown as RpcPassportResponse,
            email,
            displayName
          );
        }
      } catch {
        // Keep local Gmail session if offline
      }
    },
    [isSupabaseConfigured, applyPassportPayload]
  );

  // Hydrate local state & Gmail session on initial mount
  useEffect(() => {
    let mounted = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredExplorerState>;
        setState((prev) => ({
          session: parsed.session ?? prev.session,
          collectedStamps: Array.isArray(parsed.collectedStamps)
            ? parsed.collectedStamps
            : prev.collectedStamps,
          earnedBadges: Array.isArray(parsed.earnedBadges)
            ? parsed.earnedBadges
            : prev.earnedBadges,
          redemptions: Array.isArray(parsed.redemptions)
            ? parsed.redemptions
            : prev.redemptions,
          venues:
            Array.isArray(parsed.venues) && parsed.venues.length > 0
              ? parsed.venues
              : prev.venues,
          collections:
            Array.isArray(parsed.collections) && parsed.collections.length > 0
              ? parsed.collections
              : prev.collections,
          stations:
            Array.isArray(parsed.stations) && parsed.stations.length > 0
              ? parsed.stations.map((st) => {
                  const seedMatch = PILOT_STATIONS.find(
                    (p) => p.id === st.id || p.slug === st.slug
                  );
                  return {
                    ...seedMatch,
                    ...st,
                    latitude:
                      typeof st.latitude === "number"
                        ? st.latitude
                        : (seedMatch?.latitude ?? 10.7883),
                    longitude:
                      typeof st.longitude === "number"
                        ? st.longitude
                        : (seedMatch?.longitude ?? 106.7054),
                  };
                })
              : prev.stations,
          rewards:
            Array.isArray(parsed.rewards) && parsed.rewards.length > 0
              ? parsed.rewards
              : prev.rewards,
        }));
      }

      const rawGmail = window.localStorage.getItem(GMAIL_SESSION_STORAGE_KEY);
      if (rawGmail) {
        const parsedGmail = JSON.parse(
          rawGmail
        ) as Partial<StoredGmailSession>;
        if (parsedGmail && typeof parsedGmail.email === "string") {
          const { valid, email } = normalizeGmailInput(parsedGmail.email);
          if (valid) {
            const displayName = deriveDisplayNameFromEmail(
              email,
              parsedGmail.displayName
            );
            const initialProfile: AuthUserProfile = {
              id: parsedGmail.id || `gmail-${email}`,
              email,
              name: displayName,
              displayName,
              avatarUrl: null,
            };
            setUser(initialProfile);
            setState((prev) => ({
              ...prev,
              session: {
                ...prev.session,
                participantId: initialProfile.id,
                authUserId: initialProfile.id,
                isAnonymous: false,
                displayName,
              },
            }));
            void syncGmailSessionWithSupabase(email, displayName).finally(
              () => {
                if (mounted) setAuthLoading(false);
              }
            );
            setHydrated(true);
            return;
          }
        }
      }
    } catch {
      // Ignore storage read errors in restricted private browsing modes
    }

    setHydrated(true);
    setAuthLoading(false);

    return () => {
      mounted = false;
    };
  }, [syncGmailSessionWithSupabase]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [hydrated, state]);

  const signInWithGmail = useCallback(
    async (
      rawEmail: string,
      customDisplayName?: string
    ): Promise<{ ok: boolean; error?: string }> => {
      setAuthError(null);
      const { valid, email } = normalizeGmailInput(rawEmail);
      if (!valid) {
        const msg =
          state.session.locale === "vi"
            ? "Vui lòng nhập địa chỉ Gmail hợp lệ."
            : "Please enter a valid Gmail address.";
        setAuthError(msg);
        return { ok: false, error: msg };
      }

      const finalDisplayName = deriveDisplayNameFromEmail(
        email,
        customDisplayName
      );

      if (isSupabaseConfigured) {
        try {
          const supabase = createClientSupabaseClient();
          const { data, error } = await supabase.rpc(
            "upsert_gmail_participant",
            {
              p_email: email,
              p_display_name: finalDisplayName,
              p_device_token: `gmail:${email}`,
            }
          );

          if (!error && data && typeof data === "object") {
            applyPassportPayload(
              data as unknown as RpcPassportResponse,
              email,
              finalDisplayName
            );
            setIsGmailModalOpen(false);
            return { ok: true };
          }
        } catch {
          // Fall through to local session fallback if offline
        }
      }

      // Offline / local preview fallback
      applyPassportPayload(
        {
          participant: {
            id: `gmail-${email}`,
            email,
            display_name: finalDisplayName,
            device_token: `gmail:${email}`,
          },
          stamps: [],
          badges: [],
          redemptions: [],
        },
        email,
        finalDisplayName
      );
      setIsGmailModalOpen(false);
      return { ok: true };
    },
    [isSupabaseConfigured, applyPassportPayload, state.session.locale]
  );

  const openGmailModal = useCallback(() => {
    setAuthError(null);
    setIsGmailModalOpen(true);
  }, []);

  const closeGmailModal = useCallback(() => {
    setAuthError(null);
    setIsGmailModalOpen(false);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setIsGmailModalOpen(true);
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    try {
      window.localStorage.removeItem(GMAIL_SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    if (isSupabaseConfigured) {
      try {
        const supabase = createClientSupabaseClient();
        await supabase.auth.signOut();
      } catch {
        // Ignore auth signout error
      }
    }
    setUser(null);
    setState((prev) => ({
      ...createInitialState(),
      session: {
        ...createDefaultSession(),
        locale: prev.session.locale,
      },
    }));
  }, [isSupabaseConfigured]);

  const locale = state.session.locale;

  const setLocale = useCallback(
    (nextLocale: SupportedLocale) => {
      setState((prev) => ({
        ...prev,
        session: {
          ...prev.session,
          locale: nextLocale,
        },
      }));
    },
    []
  );

  const t = useCallback(
    (text: LocalizedText) => {
      return locale === "vi" ? text.vi : text.en;
    },
    [locale]
  );

  const updateDisplayName = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      setState((prev) => ({
        ...prev,
        session: {
          ...prev.session,
          displayName: trimmed,
        },
      }));
      setUser((prev) =>
        prev ? { ...prev, name: trimmed, displayName: trimmed } : null
      );

      if (user?.email) {
        try {
          const updatedSession: StoredGmailSession = {
            id: user.id,
            email: user.email,
            displayName: trimmed,
          };
          window.localStorage.setItem(
            GMAIL_SESSION_STORAGE_KEY,
            JSON.stringify(updatedSession)
          );
        } catch {
          // Ignore storage error
        }

        if (isSupabaseConfigured) {
          const supabase = createClientSupabaseClient();
          void supabase.rpc("upsert_gmail_participant", {
            p_email: user.email,
            p_display_name: trimmed,
            p_device_token: `gmail:${user.email}`,
          });
        }
      }
    },
    [isSupabaseConfigured, user]
  );

  const isStampCollected = useCallback(
    (stampOrStationId: string) => {
      return state.collectedStamps.some(
        (item) =>
          item.stampId === stampOrStationId ||
          item.stationId === stampOrStationId
      );
    },
    [state.collectedStamps]
  );

  const getCollectedRecord = useCallback(
    (stampOrStationId: string) => {
      return state.collectedStamps.find(
        (item) =>
          item.stampId === stampOrStationId ||
          item.stationId === stampOrStationId
      );
    },
    [state.collectedStamps]
  );

  const collectStamp = useCallback(
    (stationId: string, source: StampSource = "nfc"): CollectStampOutcome => {
      const station = state.stations.find((s) => s.id === stationId);
      if (!station) {
        return {
          ok: false,
          alreadyCollected: false,
          newlyCollected: false,
          error: {
            en: "Station not found.",
            vi: "Không tìm thấy trạm.",
          },
        };
      }

      if (station.status !== "active" || station.tag.status !== "active") {
        return {
          ok: false,
          alreadyCollected: false,
          newlyCollected: false,
          error: {
            en: "This checkpoint is currently unavailable for stamp collection.",
            vi: "Trạm này hiện đang tạm ngưng nhận dấu mộc.",
          },
        };
      }

      const existing = state.collectedStamps.find(
        (c) => c.stampId === station.stamp.id || c.stationId === station.id
      );
      if (existing) {
        return {
          ok: true,
          alreadyCollected: true,
          newlyCollected: false,
          record: existing,
        };
      }

      const newRecord: CollectedStampRecord = {
        id: `cs-${Date.now()}`,
        participantId: state.session.participantId,
        stampId: station.stamp.id,
        stationId: station.id,
        publicCode: station.tag.publicCode,
        collectedAt: new Date().toISOString(),
        source,
      };

      const nextCount = state.collectedStamps.length + 1;
      const requiredCount = PILOT_COLLECTIONS[0]?.requiredStamps ?? 4;
      const badge = PILOT_BADGES[0];
      const willCompleteCollection = nextCount >= requiredCount;

      setState((prev) => ({
        ...prev,
        collectedStamps: [...prev.collectedStamps, newRecord],
        earnedBadges:
          willCompleteCollection && badge && !prev.earnedBadges.includes(badge.id)
            ? [...prev.earnedBadges, badge.id]
            : prev.earnedBadges,
      }));

      if (isSupabaseConfigured && user?.email) {
        const supabase = createClientSupabaseClient();
        void supabase
          .rpc("collect_gmail_participant_stamp", {
            p_email: user.email,
            p_stamp_id: station.stamp.id,
            p_station_id: station.id,
            p_nfc_tag_id: station.tag.id,
            p_award_badge_id:
              willCompleteCollection && badge ? badge.id : null,
          })
          .then(({ data }) => {
            if (data && typeof data === "object") {
              const row = data as {
                id?: string;
                participant_id?: string;
                collected_at?: string;
              };
              if (row.id) {
                setState((prev) => ({
                  ...prev,
                  collectedStamps: prev.collectedStamps.map((item) =>
                    item.stampId === station.stamp.id
                      ? {
                          ...item,
                          id: row.id ?? item.id,
                          participantId:
                            row.participant_id ?? item.participantId,
                          collectedAt: row.collected_at ?? item.collectedAt,
                        }
                      : item
                  ),
                }));
              }
            }
          });
      }

      return {
        ok: true,
        alreadyCollected: false,
        newlyCollected: true,
        record: newRecord,
      };
    },
    [
      state.collectedStamps,
      state.session.participantId,
      state.stations,
      isSupabaseConfigured,
      user,
    ]
  );

  const issueRedemption = useCallback(
    (rewardId: string): RedemptionRecord | undefined => {
      const reward = state.rewards.find((r) => r.id === rewardId);
      if (!reward || reward.status !== "active") return undefined;

      const existing = state.redemptions.find((r) => r.rewardId === rewardId);
      if (existing) return existing;

      const collectionStationStampIds = new Set(
        state.stations
          .filter((s) => s.collectionId === reward.collectionId)
          .map((s) => s.stamp.id)
      );
      const collectedCount = state.collectedStamps.filter((cs) =>
        collectionStationStampIds.has(cs.stampId)
      ).length;

      if (collectedCount < reward.requiredStamps) {
        return undefined;
      }

      const codeSuffix = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const nowIso = new Date().toISOString();
      const expiresAtIso = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const created: RedemptionRecord = {
        id: `rdm-${Date.now()}`,
        participantId: state.session.participantId,
        rewardId: reward.id,
        redemptionCode: `ZOO-${codeSuffix}`,
        status: "issued",
        createdAt: nowIso,
        redeemedAt: null,
      };

      setState((prev) => ({
        ...prev,
        redemptions: [...prev.redemptions, created],
      }));

      if (isSupabaseConfigured && user?.email) {
        const supabase = createClientSupabaseClient();
        void supabase
          .rpc("claim_gmail_participant_reward", {
            p_email: user.email,
            p_reward_id: reward.id,
            p_voucher_code: created.redemptionCode,
            p_expires_at: expiresAtIso,
          })
          .then(({ data }) => {
            if (data && typeof data === "object") {
              const row = data as {
                id?: string;
                participant_id?: string;
                reward_id?: string;
                voucher_code?: string;
                redemption_code?: string;
                status?: "issued" | "redeemed" | "expired" | "cancelled";
                created_at?: string;
                redeemed_at?: string | null;
              };
              if (row.id) {
                setState((prev) => ({
                  ...prev,
                  redemptions: prev.redemptions.map((item) =>
                    item.rewardId === reward.id
                      ? {
                          id: row.id ?? item.id,
                          participantId:
                            row.participant_id ?? item.participantId,
                          rewardId: row.reward_id ?? item.rewardId,
                          redemptionCode:
                            row.voucher_code ??
                            row.redemption_code ??
                            item.redemptionCode,
                          status: row.status ?? item.status,
                          createdAt: row.created_at ?? item.createdAt,
                          redeemedAt:
                            row.redeemed_at !== undefined
                              ? row.redeemed_at
                              : item.redeemedAt,
                        }
                      : item
                  ),
                }));
              }
            }
          });
      }

      return created;
    },
    [
      state.collectedStamps,
      state.redemptions,
      state.rewards,
      state.session.participantId,
      state.stations,
      isSupabaseConfigured,
      user,
    ]
  );

  const markRedemptionRedeemed = useCallback((redemptionId: string) => {
    const nowIso = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      redemptions: prev.redemptions.map((item) =>
        item.id === redemptionId
          ? {
              ...item,
              status: "redeemed",
              redeemedAt: nowIso,
            }
          : item
      ),
    }));
  }, []);

  const resetDemoProgress = useCallback(() => {
    setState((prev) => ({
      ...createInitialState(),
      session: {
        ...prev.session,
      },
    }));

    if (isSupabaseConfigured && user?.email) {
      const supabase = createClientSupabaseClient();
      void supabase.rpc("reset_gmail_participant_progress", {
        p_email: user.email,
      });
    }
  }, [isSupabaseConfigured, user]);

  const loadSampleProgress = useCallback(() => {
    const firstTwo = PILOT_STATIONS.slice(0, 2);
    const sampleRecords: CollectedStampRecord[] = firstTwo.map((st, idx) => ({
      id: `cs-demo-${idx + 1}`,
      participantId: state.session.participantId,
      stampId: st.stamp.id,
      stationId: st.id,
      publicCode: st.tag.publicCode,
      collectedAt: new Date(Date.now() - (2 - idx) * 600_000).toISOString(),
      source: "nfc",
    }));
    setState((prev) => ({
      ...prev,
      collectedStamps: sampleRecords,
      earnedBadges: [],
      redemptions: [],
    }));

    if (isSupabaseConfigured && user?.email) {
      const supabase = createClientSupabaseClient();
      const email = user.email;
      void (async () => {
        await supabase.rpc("reset_gmail_participant_progress", {
          p_email: email,
        });
        for (const st of firstTwo) {
          await supabase.rpc("collect_gmail_participant_stamp", {
            p_email: email,
            p_stamp_id: st.stamp.id,
            p_station_id: st.id,
            p_nfc_tag_id: st.tag.id,
            p_award_badge_id: null,
          });
        }
      })();
    }
  }, [state.session.participantId, isSupabaseConfigured, user]);

  const upsertVenue = useCallback((venue: PilotVenue) => {
    setState((prev) => {
      const exists = prev.venues.some((v) => v.id === venue.id);
      return {
        ...prev,
        venues: exists
          ? prev.venues.map((v) => (v.id === venue.id ? venue : v))
          : [...prev.venues, venue],
      };
    });
  }, []);

  const upsertCollection = useCallback((collection: PilotCollection) => {
    setState((prev) => {
      const exists = prev.collections.some((c) => c.id === collection.id);
      return {
        ...prev,
        collections: exists
          ? prev.collections.map((c) =>
              c.id === collection.id ? collection : c
            )
          : [...prev.collections, collection],
      };
    });
  }, []);

  const upsertStation = useCallback((station: PilotStation) => {
    setState((prev) => {
      const exists = prev.stations.some((s) => s.id === station.id);
      return {
        ...prev,
        stations: exists
          ? prev.stations.map((s) => (s.id === station.id ? station : s))
          : [...prev.stations, station],
      };
    });
  }, []);

  const upsertReward = useCallback((reward: PilotReward) => {
    setState((prev) => {
      const exists = prev.rewards.some((r) => r.id === reward.id);
      return {
        ...prev,
        rewards: exists
          ? prev.rewards.map((r) => (r.id === reward.id ? reward : r))
          : [...prev.rewards, reward],
      };
    });
  }, []);

  const isAuthenticated = Boolean(user);

  const value = useMemo<ExplorerContextValue>(
    () => ({
      hydrated,
      locale,
      setLocale,
      t,
      isSupabaseConfigured,
      authLoading,
      isAuthLoading: authLoading,
      isAuthenticated,
      user,
      authError,
      isGmailModalOpen,
      openGmailModal,
      closeGmailModal,
      signInWithGmail,
      signInWithGoogle,
      signOut,
      session: state.session,
      updateDisplayName,
      venue: state.venues[0] ?? PILOT_VENUE,
      venues: state.venues,
      collections: state.collections,
      stations: state.stations,
      badges: PILOT_BADGES,
      earnedBadges: state.earnedBadges,
      rewards: state.rewards,
      collectedStamps: state.collectedStamps,
      redemptions: state.redemptions,
      isStampCollected,
      isStationCollected: isStampCollected,
      getCollectedRecord,
      collectStamp,
      issueRedemption,
      claimReward: issueRedemption,
      markRedemptionRedeemed,
      resetDemoProgress,
      resetProgress: resetDemoProgress,
      loadSampleProgress,
      upsertVenue,
      upsertCollection,
      upsertStation,
      upsertReward,
    }),
    [
      hydrated,
      locale,
      setLocale,
      t,
      isSupabaseConfigured,
      authLoading,
      isAuthenticated,
      user,
      authError,
      isGmailModalOpen,
      openGmailModal,
      closeGmailModal,
      signInWithGmail,
      signInWithGoogle,
      signOut,
      state.session,
      updateDisplayName,
      state.venues,
      state.collections,
      state.stations,
      state.earnedBadges,
      state.rewards,
      state.collectedStamps,
      state.redemptions,
      isStampCollected,
      getCollectedRecord,
      collectStamp,
      issueRedemption,
      markRedemptionRedeemed,
      resetDemoProgress,
      loadSampleProgress,
      upsertVenue,
      upsertCollection,
      upsertStation,
      upsertReward,
    ]
  );

  return (
    <ExplorerContext.Provider value={value}>
      {children}
    </ExplorerContext.Provider>
  );
}

export function useExplorer() {
  const ctx = useContext(ExplorerContext);
  if (!ctx) {
    throw new Error("useExplorer must be used inside an ExplorerProvider");
  }
  return ctx;
}
