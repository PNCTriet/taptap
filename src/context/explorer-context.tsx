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
const STORAGE_KEY_PREVIEW_AUTH = "taptap_preview_google_user_v1";

export interface AuthenticatedGoogleUser {
  id: string;
  email: string | null;
  name: string;
  avatarUrl: string | null;
}

interface StoredExplorerState {
  session: ExplorerParticipantSession;
  collectedStamps: CollectedStampRecord[];
  redemptions: RedemptionRecord[];
  venues: PilotVenue[];
  collections: PilotCollection[];
  stations: PilotStation[];
  rewards: PilotReward[];
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
    redemptions: [],
    venues: [PILOT_VENUE],
    collections: PILOT_COLLECTIONS,
    stations: PILOT_STATIONS,
    rewards: PILOT_REWARDS,
  };
}

function mapSupabaseUser(supaUser: User): AuthenticatedGoogleUser {
  const meta = supaUser.user_metadata ?? {};
  const fullName: string =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    (supaUser.email ? supaUser.email.split("@")[0] ?? "Saigon Explorer" : "Saigon Explorer");
  const avatarUrl: string | null =
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    null;

  return {
    id: supaUser.id,
    email: supaUser.email ?? null,
    name: fullName,
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
  isAuthenticated: boolean;
  user: AuthenticatedGoogleUser | null;
  authError: string | null;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
  session: ExplorerParticipantSession;
  updateDisplayName: (name: string) => void;
  venue: PilotVenue;
  venues: PilotVenue[];
  collections: PilotCollection[];
  stations: PilotStation[];
  badges: PilotBadge[];
  rewards: PilotReward[];
  collectedStamps: CollectedStampRecord[];
  redemptions: RedemptionRecord[];
  isStampCollected: (stampOrStationId: string) => boolean;
  isStationCollected: (stationOrStampId: string) => boolean;
  getCollectedRecord: (stampOrStationId: string) => CollectedStampRecord | undefined;
  collectStamp: (stationId: string, source?: StampSource) => CollectStampOutcome;
  issueRedemption: (rewardId: string) => RedemptionRecord | undefined;
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
  const isSupabaseConfigured = useMemo(() => isSupabasePublicEnvConfigured(), []);
  const [hydrated, setHydrated] = useState(false);
  const [authLoading, setAuthLoading] = useState<boolean>(isSupabaseConfigured);
  const [user, setUser] = useState<AuthenticatedGoogleUser | null>(null);
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

        // 1. Upsert participant row for this Google user
        const { data: participantRow, error: upsertErr } = await supabase
          .from("participants")
          .upsert(
            {
              auth_user_id: supaUser.id,
              display_name: mappedUser.name,
            },
            { onConflict: "auth_user_id" }
          )
          .select("*")
          .single();

        if (upsertErr || !participantRow) {
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
          return;
        }

        const effectiveName = participantRow.display_name || mappedUser.name;
        setUser((prev) => (prev ? { ...prev, name: effectiveName } : mappedUser));

        // 2. Load collected_stamps & redemptions from Supabase
        const [{ data: dbStamps }, { data: dbRedemptions }] = await Promise.all([
          supabase
            .from("collected_stamps")
            .select("*")
            .eq("participant_id", participantRow.id)
            .order("collected_at", { ascending: true }),
          supabase
            .from("redemptions")
            .select("*")
            .eq("participant_id", participantRow.id)
            .order("created_at", { ascending: false }),
        ]);

        const mappedStamps: CollectedStampRecord[] = (dbStamps ?? [])
          .map((row) => {
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

        const mappedRedemptions: RedemptionRecord[] = (dbRedemptions ?? []).map(
          (row) => ({
            id: row.id,
            participantId: row.participant_id,
            rewardId: row.reward_id,
            redemptionCode: row.redemption_code,
            status: row.status,
            createdAt: row.created_at,
            redeemedAt: row.redeemed_at,
          })
        );

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
          redemptions: mappedRedemptions,
        }));
      } catch {
        // Keep current client state if network is temporarily unreachable
      }
    },
    [isSupabaseConfigured]
  );

  // Hydrate local state & preview auth
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
                  const seedMatch = PILOT_STATIONS.find((p) => p.id === st.id || p.slug === st.slug);
                  return {
                    ...seedMatch,
                    ...st,
                    latitude: typeof st.latitude === "number" ? st.latitude : (seedMatch?.latitude ?? 10.7883),
                    longitude: typeof st.longitude === "number" ? st.longitude : (seedMatch?.longitude ?? 106.7054),
                  };
                })
              : prev.stations,
          rewards:
            Array.isArray(parsed.rewards) && parsed.rewards.length > 0
              ? parsed.rewards
              : prev.rewards,
        }));
      }

      if (!isSupabaseConfigured) {
        const rawPreviewUser = window.localStorage.getItem(STORAGE_KEY_PREVIEW_AUTH);
        if (rawPreviewUser) {
          const parsedUser = JSON.parse(rawPreviewUser) as AuthenticatedGoogleUser;
          if (parsedUser && parsedUser.id) {
            setUser(parsedUser);
            setState((prev) => ({
              ...prev,
              session: {
                ...prev.session,
                authUserId: parsedUser.id,
                isAnonymous: false,
                displayName: parsedUser.name,
              },
            }));
          }
        }
      }
    } catch {
      // Ignore storage read errors in restricted private browsing modes
    } finally {
      setHydrated(true);
    }
  }, [isSupabaseConfigured]);

  // Subscribe to Supabase Auth when configured
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
    async (nextPath?: string) => {
      setAuthError(null);
      const targetNext =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : "/passport";

      if (isSupabaseConfigured) {
        const supabase = createClientSupabaseClient();
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
          targetNext
        )}`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: {
              access_type: "offline",
              prompt: "select_account",
            },
          },
        });
        if (error) {
          setAuthError(error.message);
        }
        return;
      }

      // Local preview fallback when NEXT_PUBLIC_SUPABASE_URL is not configured yet
      const previewUser: AuthenticatedGoogleUser = {
        id: "preview-google-user-01",
        email: "explorer@gmail.com",
        name: "Saigon Explorer",
        avatarUrl: null,
      };
      setUser(previewUser);
      setState((prev) => ({
        ...prev,
        session: {
          ...prev.session,
          authUserId: previewUser.id,
          isAnonymous: false,
          displayName: previewUser.name,
        },
      }));
      try {
        window.localStorage.setItem(
          STORAGE_KEY_PREVIEW_AUTH,
          JSON.stringify(previewUser)
        );
      } catch {
        // Ignore storage errors
      }
    },
    [isSupabaseConfigured]
  );

  const signOut = useCallback(async () => {
    setAuthError(null);
    if (isSupabaseConfigured) {
      const supabase = createClientSupabaseClient();
      await supabase.auth.signOut();
    } else {
      try {
        window.localStorage.removeItem(STORAGE_KEY_PREVIEW_AUTH);
      } catch {
        // Ignore storage errors
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
    [isSupabaseConfigured, user, state.session.isAnonymous, state.session.participantId]
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
      setUser((prev) => (prev ? { ...prev, name: trimmed } : null));
      if (isSupabaseConfigured && user && !state.session.isAnonymous) {
        const supabase = createClientSupabaseClient();
        void supabase
          .from("participants")
          .update({ display_name: trimmed })
          .eq("id", state.session.participantId);
      }
    },
    [isSupabaseConfigured, user, state.session.isAnonymous, state.session.participantId]
  );

  const isStampCollected = useCallback(
    (stampOrStationId: string) => {
      return state.collectedStamps.some(
        (item) =>
          item.stampId === stampOrStationId || item.stationId === stampOrStationId
      );
    },
    [state.collectedStamps]
  );

  const getCollectedRecord = useCallback(
    (stampOrStationId: string) => {
      return state.collectedStamps.find(
        (item) =>
          item.stampId === stampOrStationId || item.stationId === stampOrStationId
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
      setState((prev) => ({
        ...prev,
        collectedStamps: [...prev.collectedStamps, newRecord],
      }));

      if (isSupabaseConfigured && user && !state.session.isAnonymous) {
        const supabase = createClientSupabaseClient();
        void (async () => {
          await supabase.from("collected_stamps").upsert(
            {
              participant_id: state.session.participantId,
              stamp_id: station.stamp.id,
              nfc_tag_id: station.tag.id,
              source,
            },
            { onConflict: "participant_id,stamp_id" }
          );

          const requiredCount = PILOT_COLLECTIONS[0]?.requiredStamps ?? 4;
          const badge = PILOT_BADGES[0];
          if (nextCount >= requiredCount && badge) {
            await supabase.from("participant_badges").upsert(
              {
                participant_id: state.session.participantId,
                badge_id: badge.id,
              },
              { onConflict: "participant_id,badge_id" }
            );
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

      const codeSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const created: RedemptionRecord = {
        id: `rdm-${Date.now()}`,
        participantId: state.session.participantId,
        rewardId: reward.id,
        redemptionCode: `ZOO-${codeSuffix}`,
        status: "issued",
        createdAt: new Date().toISOString(),
        redeemedAt: null,
      };

      setState((prev) => ({
        ...prev,
        redemptions: [...prev.redemptions, created],
      }));

      if (isSupabaseConfigured && user && !state.session.isAnonymous) {
        const supabase = createClientSupabaseClient();
        void supabase
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
          .single()
          .then(({ data }) => {
            if (data) {
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
    [isSupabaseConfigured, user, state.session.isAnonymous, state.session.participantId]
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
  }, [isSupabaseConfigured, user, state.session.isAnonymous, state.session.participantId]);

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
          ? prev.collections.map((c) => (c.id === collection.id ? collection : c))
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
      rewards: state.rewards,
      collectedStamps: state.collectedStamps,
      redemptions: state.redemptions,
      isStampCollected,
      isStationCollected: isStampCollected,
      getCollectedRecord,
      collectStamp,
      issueRedemption,
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
    <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>
  );
}

export function useExplorer() {
  const ctx = useContext(ExplorerContext);
  if (!ctx) {
    throw new Error("useExplorer must be used inside an ExplorerProvider");
  }
  return ctx;
}
