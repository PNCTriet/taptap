"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  PILOT_BADGES,
  PILOT_COLLECTIONS,
  PILOT_REWARDS,
  PILOT_STATIONS,
  PILOT_VENUE,
} from "@/features/pilot/sample-data";
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

interface CollectStampOutcome {
  ok: boolean;
  alreadyCollected: boolean;
  record?: CollectedStampRecord;
  error?: LocalizedText;
}

interface ExplorerContextValue {
  hydrated: boolean;
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (text: LocalizedText) => string;
  session: ExplorerParticipantSession;
  updateDisplayName: (name: string) => void;
  venues: PilotVenue[];
  collections: PilotCollection[];
  stations: PilotStation[];
  badges: PilotBadge[];
  rewards: PilotReward[];
  collectedStamps: CollectedStampRecord[];
  redemptions: RedemptionRecord[];
  isStampCollected: (stampId: string) => boolean;
  getCollectedRecord: (stampId: string) => CollectedStampRecord | undefined;
  collectStamp: (stationId: string, source?: StampSource) => CollectStampOutcome;
  issueRedemption: (rewardId: string) => RedemptionRecord | undefined;
  markRedemptionRedeemed: (redemptionId: string) => void;
  resetDemoProgress: () => void;
  loadSampleProgress: () => void;
  // Admin state mutations for Admin UI Foundation
  upsertVenue: (venue: PilotVenue) => void;
  upsertCollection: (collection: PilotCollection) => void;
  upsertStation: (station: PilotStation) => void;
  upsertReward: (reward: PilotReward) => void;
}

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

export function ExplorerProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<StoredExplorerState>(createInitialState);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredExplorerState>;
        setState((prev) => ({
          session: parsed.session ?? prev.session,
          collectedStamps: Array.isArray(parsed.collectedStamps)
            ? parsed.collectedStamps
            : prev.collectedStamps,
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
              ? parsed.stations
              : prev.stations,
          rewards:
            Array.isArray(parsed.rewards) && parsed.rewards.length > 0
              ? parsed.rewards
              : prev.rewards,
        }));
      }
    } catch {
      // Ignore storage read errors in restricted private browsing modes
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [hydrated, state]);

  const locale = state.session.locale;

  const setLocale = useCallback((nextLocale: SupportedLocale) => {
    setState((prev) => ({
      ...prev,
      session: {
        ...prev.session,
        locale: nextLocale,
      },
    }));
  }, []);

  const t = useCallback(
    (text: LocalizedText) => {
      return locale === "vi" ? text.vi : text.en;
    },
    [locale]
  );

  const updateDisplayName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      session: {
        ...prev.session,
        displayName: trimmed,
      },
    }));
  }, []);

  const isStampCollected = useCallback(
    (stampId: string) => {
      return state.collectedStamps.some((item) => item.stampId === stampId);
    },
    [state.collectedStamps]
  );

  const getCollectedRecord = useCallback(
    (stampId: string) => {
      return state.collectedStamps.find((item) => item.stampId === stampId);
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
          error: {
            en: "This checkpoint is currently unavailable for stamp collection.",
            vi: "Trạm này hiện đang tạm ngưng nhận dấu mộc.",
          },
        };
      }

      const existing = state.collectedStamps.find(
        (c) => c.stampId === station.stamp.id
      );
      if (existing) {
        return {
          ok: true,
          alreadyCollected: true,
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

      setState((prev) => ({
        ...prev,
        collectedStamps: [...prev.collectedStamps, newRecord],
      }));

      return {
        ok: true,
        alreadyCollected: false,
        record: newRecord,
      };
    },
    [state.collectedStamps, state.session.participantId, state.stations]
  );

  const issueRedemption = useCallback(
    (rewardId: string): RedemptionRecord | undefined => {
      const reward = state.rewards.find((r) => r.id === rewardId);
      if (!reward || reward.status !== "active") return undefined;

      const existing = state.redemptions.find((r) => r.rewardId === rewardId);
      if (existing) return existing;

      // Verify eligibility against collected stamps in the reward's collection
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

      return created;
    },
    [
      state.collectedStamps,
      state.redemptions,
      state.rewards,
      state.session.participantId,
      state.stations,
    ]
  );

  const markRedemptionRedeemed = useCallback((redemptionId: string) => {
    setState((prev) => ({
      ...prev,
      redemptions: prev.redemptions.map((item) =>
        item.id === redemptionId
          ? {
              ...item,
              status: "redeemed",
              redeemedAt: new Date().toISOString(),
            }
          : item
      ),
    }));
  }, []);

  const resetDemoProgress = useCallback(() => {
    setState((prev) => ({
      ...createInitialState(),
      session: {
        ...createDefaultSession(),
        locale: prev.session.locale,
      },
    }));
  }, []);

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
  }, [state.session.participantId]);

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

  const value = useMemo<ExplorerContextValue>(
    () => ({
      hydrated,
      locale,
      setLocale,
      t,
      session: state.session,
      updateDisplayName,
      venues: state.venues,
      collections: state.collections,
      stations: state.stations,
      badges: PILOT_BADGES,
      rewards: state.rewards,
      collectedStamps: state.collectedStamps,
      redemptions: state.redemptions,
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
    }),
    [
      collectStamp,
      getCollectedRecord,
      hydrated,
      isStampCollected,
      issueRedemption,
      loadSampleProgress,
      locale,
      markRedemptionRedeemed,
      resetDemoProgress,
      setLocale,
      state.collectedStamps,
      state.collections,
      state.redemptions,
      state.rewards,
      state.session,
      state.stations,
      state.venues,
      t,
      updateDisplayName,
      upsertCollection,
      upsertReward,
      upsertStation,
      upsertVenue,
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
