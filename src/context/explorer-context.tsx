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
import type { User } from "@supabase/supabase-js";
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

export interface AuthUserProfile {
  id: string;
  email: string | null;
  name: string;
  displayName: string;
  avatarUrl: string | null;
}

export type AuthenticatedGoogleUser = AuthUserProfile;

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

export function mapSupabaseUser(supaUser: User): AuthUserProfile {
  const meta = supaUser.user_metadata ?? {};
  const fullName: string =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    (supaUser.email
      ? (supaUser.email.split("@")[0] ?? "Saigon Explorer")
      : "Saigon Explorer");
  const avatarUrl: string | null =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    null;

  return {
    id: supaUser.id,
    email: supaUser.email ?? null,
    name: fullName,
    displayName: fullName,
    avatarUrl,
  };
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
  signInWithGoogle: (
    nextPath?: string
  ) => Promise<{ ok: boolean; error?: string }>;
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
  const [authLoading, setAuthLoading] = useState<boolean>(isSupabaseConfigured);
  const [user, setUser] = useState<AuthUserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [state, setState] = useState<StoredExplorerState>(createInitialState);

  const stationsRef = useRef<PilotStation[]>(PILOT_STATIONS);
  useEffect(() => {
    stationsRef.current = state.stations;
  }, [state.stations]);

  const syncParticipantFromSupabase = useCallback(
    async (supaUser: User) => {
      if (!isSupabaseConfigured) return;
      try {
        const supabase = createClientSupabaseClient();
        const mappedUser = mapSupabaseUser(supaUser);
        setUser(mappedUser);

        // 1. Upsert participant row by auth_user_id
        const { data: participantRow, error: upsertErr } = await supabase
          .from("participants")
          .upsert(
            {
              auth_user_id: supaUser.id,
              email: supaUser.email ?? null,
              display_name: mappedUser.name,
            },
            { onConflict: "auth_user_id" }
          )
          .select("*")
          .single();

        if (!upsertErr && participantRow) {
          const effectiveName = participantRow.display_name || mappedUser.name;
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  name: effectiveName,
                  displayName: effectiveName,
                }
              : mappedUser
          );

          const [
            { data: dbStamps },
            { data: dbBadges },
            { data: dbRedemptions },
          ] = await Promise.all([
            supabase
              .from("collected_stamps")
              .select("*")
              .eq("participant_id", participantRow.id)
              .order("collected_at", { ascending: true }),
            supabase
              .from("participant_badges")
              .select("*")
              .eq("participant_id", participantRow.id),
            supabase
              .from("redemptions")
              .select("*")
              .eq("participant_id", participantRow.id)
              .order("created_at", { ascending: false }),
          ]);

          const mappedStamps: CollectedStampRecord[] = (dbStamps ?? [])
            .map((row): CollectedStampRecord | null => {
              const matchedStation = stationsRef.current.find(
                (s) => s.stamp.id === row.stamp_id
              );
              if (!matchedStation) return null;
              return {
                id: row.id,
                participantId: row.participant_id,
                stampId: row.stamp_id,
                stationId: matchedStation.id,
                publicCode: matchedStation.tag.publicCode,
                collectedAt: row.collected_at,
                source: row.source,
              };
            })
            .filter((item): item is CollectedStampRecord => item !== null);

          const mappedBadges: string[] = (dbBadges ?? []).map(
            (b) => b.badge_id
          );

          const mappedRedemptions: RedemptionRecord[] = (
            dbRedemptions ?? []
          ).map((row) => ({
            id: row.id,
            participantId: row.participant_id,
            rewardId: row.reward_id,
            redemptionCode: row.redemption_code,
            status: row.status,
            createdAt: row.created_at,
            redeemedAt: row.redeemed_at,
          }));

          setState((prev) => ({
            ...prev,
            session: {
              participantId: participantRow.id,
              authUserId: participantRow.auth_user_id,
              isAnonymous: false,
              displayName: effectiveName,
              locale: participantRow.locale ?? prev.session.locale,
              createdAt: participantRow.created_at,
            },
            collectedStamps: mappedStamps,
            earnedBadges: mappedBadges,
            redemptions: mappedRedemptions,
          }));
          return;
        }

        // Fallback via email RPC if participant already existed by email
        if (supaUser.email) {
          const { data: rpcData, error: rpcErr } = await supabase.rpc(
            "upsert_gmail_participant",
            {
              p_email: supaUser.email,
              p_display_name: mappedUser.name,
              p_device_token: `oauth:${supaUser.id}`,
            }
          );

          if (!rpcErr && rpcData && typeof rpcData === "object") {
            const payload = rpcData as unknown as RpcPassportResponse;
            const participant = payload.participant;
            const resolvedId = participant?.id ?? supaUser.id;
            const effectiveName =
              participant?.display_name?.trim() || mappedUser.name;

            setUser((prev) =>
              prev
                ? {
                    ...prev,
                    name: effectiveName,
                    displayName: effectiveName,
                  }
                : mappedUser
            );

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
                  source: "nfc",
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

            setState((prev) => ({
              ...prev,
              session: {
                ...prev.session,
                participantId: resolvedId,
                authUserId: supaUser.id,
                isAnonymous: false,
                displayName: effectiveName,
              },
              collectedStamps: mappedStamps,
              earnedBadges: mappedBadges,
              redemptions: mappedRedemptions,
            }));
            return;
          }
        }

        setState((prev) => ({
          ...prev,
          session: {
            ...prev.session,
            participantId: supaUser.id,
            authUserId: supaUser.id,
            isAnonymous: false,
            displayName: mappedUser.name,
          },
        }));
      } catch {
        // Keep current client state if network is temporarily unreachable
      }
    },
    [isSupabaseConfigured]
  );

  // Hydrate local catalog state & inspect URL auth_error if present
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredExplorerState>;
        setState((prev) => ({
          session: parsed.session ?? prev.session,
          collectedStamps:
            !isSupabaseConfigured && Array.isArray(parsed.collectedStamps)
              ? parsed.collectedStamps
              : prev.collectedStamps,
          earnedBadges:
            !isSupabaseConfigured && Array.isArray(parsed.earnedBadges)
              ? parsed.earnedBadges
              : prev.earnedBadges,
          redemptions:
            !isSupabaseConfigured && Array.isArray(parsed.redemptions)
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

      const params = new URLSearchParams(window.location.search);
      const urlAuthError =
        params.get("auth_error") || params.get("error_description");
      if (urlAuthError) {
        setAuthError(urlAuthError);
      }
    } catch {
      // Ignore storage read errors in restricted private browsing modes
    } finally {
      setHydrated(true);
    }
  }, [isSupabaseConfigured]);

  // Subscribe ONLY to real Supabase Auth (getUser + onAuthStateChange)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;
    const supabase = createClientSupabaseClient();

    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        if (!mounted) return;
        if (data.user) {
          await syncParticipantFromSupabase(data.user);
        } else {
          setUser(null);
          setState((prev) => ({
            ...prev,
            session: {
              ...prev.session,
              authUserId: null,
              isAnonymous: true,
            },
          }));
        }
      })
      .catch(() => {
        // Ignore transient network errors
      })
      .finally(() => {
        if (mounted) {
          setAuthLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      if (nextSession?.user) {
        void syncParticipantFromSupabase(nextSession.user);
      } else {
        setUser(null);
        setState((prev) => ({
          ...prev,
          collectedStamps: [],
          earnedBadges: [],
          redemptions: [],
          session: {
            ...prev.session,
            authUserId: null,
            isAnonymous: true,
          },
        }));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isSupabaseConfigured, syncParticipantFromSupabase]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [hydrated, state]);

  const signInWithGoogle = useCallback(
    async (nextPath?: string): Promise<{ ok: boolean; error?: string }> => {
      setAuthError(null);
      if (!isSupabaseConfigured) {
        const message = "Supabase Auth is not configured.";
        setAuthError(message);
        return { ok: false, error: message };
      }

      const supabase = createClientSupabaseClient();
      const redirectPath =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : typeof window !== "undefined"
            ? window.location.pathname
            : "/passport";
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        redirectPath
      )}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        return { ok: false, error: error.message };
      }

      return { ok: true };
    },
    [isSupabaseConfigured]
  );

  const signOut = useCallback(async () => {
    setAuthError(null);
    if (isSupabaseConfigured) {
      try {
        const supabase = createClientSupabaseClient();
        await supabase.auth.signOut();
      } catch {
        // Ignore signOut network errors
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
      if (isSupabaseConfigured && user && !state.session.isAnonymous) {
        const supabase = createClientSupabaseClient();
        void supabase
          .from("participants")
          .update({ locale: nextLocale })
          .eq("id", state.session.participantId);
      }
    },
    [
      isSupabaseConfigured,
      user,
      state.session.isAnonymous,
      state.session.participantId,
    ]
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

      if (isSupabaseConfigured && user && !state.session.isAnonymous) {
        const supabase = createClientSupabaseClient();
        void supabase
          .from("participants")
          .update({ display_name: trimmed })
          .eq("id", state.session.participantId);
      }
    },
    [
      isSupabaseConfigured,
      user,
      state.session.isAnonymous,
      state.session.participantId,
    ]
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

      if (isSupabaseConfigured && user && !state.session.isAnonymous) {
        const supabase = createClientSupabaseClient();
        void (async () => {
          const { error: upsertErr } = await supabase
            .from("collected_stamps")
            .upsert(
              {
                participant_id: state.session.participantId,
                stamp_id: station.stamp.id,
                nfc_tag_id: station.tag.id,
                source,
              },
              { onConflict: "participant_id,stamp_id" }
            );

          if (!upsertErr && willCompleteCollection && badge) {
            await supabase.from("participant_badges").upsert(
              {
                participant_id: state.session.participantId,
                badge_id: badge.id,
              },
              { onConflict: "participant_id,badge_id" }
            );
          }

          if (upsertErr && user.email) {
            await supabase.rpc("collect_gmail_participant_stamp", {
              p_email: user.email,
              p_stamp_id: station.stamp.id,
              p_station_id: station.id,
              p_nfc_tag_id: station.tag.id,
              p_award_badge_id:
                willCompleteCollection && badge ? badge.id : null,
            });
          }
        })();
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
      state.session.isAnonymous,
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

      if (isSupabaseConfigured && user && !state.session.isAnonymous) {
        const supabase = createClientSupabaseClient();
        void (async () => {
          const { data, error } = await supabase
            .from("redemptions")
            .upsert(
              {
                participant_id: state.session.participantId,
                reward_id: reward.id,
                redemption_code: created.redemptionCode,
                status: "issued",
              },
              { onConflict: "participant_id,reward_id" }
            )
            .select("*")
            .single();

          if (!error && data) {
            setState((prev) => ({
              ...prev,
              redemptions: prev.redemptions.map((item) =>
                item.rewardId === reward.id
                  ? {
                      id: data.id,
                      participantId: data.participant_id,
                      rewardId: data.reward_id,
                      redemptionCode: data.redemption_code,
                      status: data.status,
                      createdAt: data.created_at,
                      redeemedAt: data.redeemed_at,
                    }
                  : item
              ),
            }));
          } else if (user.email) {
            await supabase.rpc("claim_gmail_participant_reward", {
              p_email: user.email,
              p_reward_id: reward.id,
              p_voucher_code: created.redemptionCode,
              p_expires_at: expiresAtIso,
            });
          }
        })();
      }

      return created;
    },
    [
      state.collectedStamps,
      state.redemptions,
      state.rewards,
      state.session.participantId,
      state.session.isAnonymous,
      state.stations,
      isSupabaseConfigured,
      user,
    ]
  );

  const markRedemptionRedeemed = useCallback(
    (redemptionId: string) => {
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

      if (isSupabaseConfigured && user && !state.session.isAnonymous) {
        const supabase = createClientSupabaseClient();
        void supabase
          .from("redemptions")
          .update({ status: "redeemed", redeemed_at: nowIso })
          .eq("id", redemptionId)
          .eq("participant_id", state.session.participantId);
      }
    },
    [
      isSupabaseConfigured,
      user,
      state.session.isAnonymous,
      state.session.participantId,
    ]
  );

  const resetDemoProgress = useCallback(() => {
    setState((prev) => ({
      ...createInitialState(),
      session: {
        ...prev.session,
      },
    }));

    if (isSupabaseConfigured && user && !state.session.isAnonymous) {
      const supabase = createClientSupabaseClient();
      void Promise.all([
        supabase
          .from("collected_stamps")
          .delete()
          .eq("participant_id", state.session.participantId),
        supabase
          .from("participant_badges")
          .delete()
          .eq("participant_id", state.session.participantId),
        supabase
          .from("redemptions")
          .delete()
          .eq("participant_id", state.session.participantId),
      ]);
    }
  }, [
    isSupabaseConfigured,
    user,
    state.session.isAnonymous,
    state.session.participantId,
  ]);

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

    if (isSupabaseConfigured && user && !state.session.isAnonymous) {
      const supabase = createClientSupabaseClient();
      void supabase.from("collected_stamps").upsert(
        firstTwo.map((st) => ({
          participant_id: state.session.participantId,
          stamp_id: st.stamp.id,
          nfc_tag_id: st.tag.id,
          source: "nfc" as const,
        })),
        { onConflict: "participant_id,stamp_id" }
      );
    }
  }, [
    state.session.participantId,
    state.session.isAnonymous,
    isSupabaseConfigured,
    user,
  ]);

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
