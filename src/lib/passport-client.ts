import { EXPLORER_STORAGE_KEY } from "@/lib/explorer-storage";
import type {
  GuestMergeResult,
  PassportResponse,
  PassportStamp,
} from "@/types/passport";

/**
 * Passport UI contract (client). The API is owned by a parallel backend.
 *
 * `GET /api/passport` → `{ stamps: PassportStamp[] }`
 * `POST /api/participant/merge` → `{ merged: number, alreadyOwned: number }`
 *
 * `PassportStamp` is `{ id, name, imageUrl|null, collectedAt, source: 'b2c' | 'b2b',
 * venueName?, tenantName?, roomName? }`.
 */

export const GUEST_MERGE_PENDING_KEY = "taptap_guest_merge_pending";
export const GUEST_MERGE_ATTEMPTED_KEY = "taptap_guest_merge_attempted";

export const DEMO_PASSPORT_STAMPS: PassportStamp[] = [
  {
    id: "demo-b2c-elephant",
    name: "Demo Elephant",
    imageUrl: null,
    collectedAt: "2026-10-27T02:15:00.000Z",
    source: "b2c",
    venueName: "Demo Zoo",
  },
  {
    id: "demo-b2c-giraffe",
    name: "Demo Giraffe",
    imageUrl: null,
    collectedAt: "2026-10-26T09:00:00.000Z",
    source: "b2c",
    venueName: "Demo Zoo",
  },
  {
    id: "demo-b2b-workshop",
    name: "Demo Workshop",
    imageUrl: null,
    collectedAt: "2026-11-03T08:45:00.000Z",
    source: "b2b",
    tenantName: "Demo Studio",
    roomName: "Workshop",
  },
  {
    id: "demo-b2b-counter",
    name: "Demo Counter",
    imageUrl: null,
    collectedAt: "2026-11-02T04:30:00.000Z",
    source: "b2b",
    tenantName: "Demo Cafe",
    roomName: "Main room",
  },
  {
    id: "demo-b2b-window",
    name: "Demo Window",
    imageUrl: null,
    collectedAt: "2026-11-01T11:00:00.000Z",
    source: "b2b",
    tenantName: "Demo Cafe",
    roomName: "Main room",
  },
];

/** Fixture used when the passport is opened with `?mock=1&merged=1`. */
export const DEMO_MERGE_RESULT: GuestMergeResult = {
  merged: 3,
  alreadyOwned: 1,
};

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parsePassportStamp(value: unknown): PassportStamp | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || row.id.trim().length === 0) return null;
  if (typeof row.name !== "string" || row.name.trim().length === 0) return null;
  if (row.source !== "b2c" && row.source !== "b2b") return null;
  if (typeof row.collectedAt !== "string" || row.collectedAt.trim().length === 0) {
    return null;
  }
  if (
    row.imageUrl !== undefined &&
    row.imageUrl !== null &&
    typeof row.imageUrl !== "string"
  ) {
    return null;
  }

  const imageUrl =
    typeof row.imageUrl === "string" && row.imageUrl.trim().length > 0
      ? row.imageUrl
      : null;

  return {
    id: row.id,
    name: row.name.trim(),
    imageUrl,
    collectedAt: row.collectedAt,
    source: row.source,
    venueName: optionalString(row.venueName),
    tenantName: optionalString(row.tenantName),
    roomName: optionalString(row.roomName),
  };
}

export function parsePassportResponse(value: unknown): PassportResponse {
  if (!value || typeof value !== "object") return { stamps: [] };
  const stamps = (value as { stamps?: unknown }).stamps;
  if (!Array.isArray(stamps)) return { stamps: [] };
  return {
    stamps: stamps.flatMap((stamp) => {
      const parsed = parsePassportStamp(stamp);
      return parsed ? [parsed] : [];
    }),
  };
}

export function parseMergeResult(value: unknown): GuestMergeResult {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid merge response");
  }
  const row = value as Record<string, unknown>;
  if (typeof row.merged !== "number" || !Number.isFinite(row.merged)) {
    throw new Error("Invalid merge response");
  }
  if (typeof row.alreadyOwned !== "number" || !Number.isFinite(row.alreadyOwned)) {
    throw new Error("Invalid merge response");
  }
  return { merged: row.merged, alreadyOwned: row.alreadyOwned };
}

/** Reads `GET /api/passport`. A non-OK response becomes an empty passport. */
export async function getPassport(signal?: AbortSignal): Promise<PassportResponse> {
  try {
    const response = await fetch("/api/passport", {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
      signal,
    });
    if (!response.ok) return { stamps: [] };
    return parsePassportResponse(await response.json());
  } catch (error) {
    if (isAbortError(error)) throw error;
    return { stamps: [] };
  }
}

/**
 * Posts guest progress once. No request fields are required; the session cookie
 * carries the guest. Resolves `{ merged, alreadyOwned }`.
 */
export async function mergeGuestProgress(
  signal?: AbortSignal,
): Promise<GuestMergeResult> {
  const response = await fetch("/api/participant/merge", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: "{}",
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    throw new Error(`Merge failed (${response.status})`);
  }
  return parseMergeResult(await response.json());
}

export function shouldShowMergeNotice(result: GuestMergeResult): boolean {
  return result.merged > 0;
}

export function shouldMergeGuestProgress(input: {
  mergeFlag: boolean;
  authenticated: boolean;
  authLoading: boolean;
  pendingGuestStamps: number;
  attempted: boolean;
}): boolean {
  if (input.mergeFlag) return true;
  if (input.authLoading || !input.authenticated || input.attempted) return false;
  return input.pendingGuestStamps > 0;
}

export function mergeSavedMessage(merged: number, locale: "en" | "vi"): string {
  if (locale === "vi") return `Đã lưu ${merged} con dấu vào tài khoản`;
  const noun = merged === 1 ? "stamp" : "stamps";
  return `${merged} ${noun} saved to your account`;
}

/** Guest stamps still sitting in the explorer snapshot, before auth hydration overwrites it. */
export function readLocalGuestStampCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(EXPLORER_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as {
      session?: { isAnonymous?: boolean; authUserId?: string | null };
      collectedStamps?: unknown[];
    };
    const session = parsed.session;
    const anonymous = session?.isAnonymous !== false && !session?.authUserId;
    if (!anonymous || !Array.isArray(parsed.collectedStamps)) return 0;
    return parsed.collectedStamps.length;
  } catch {
    return 0;
  }
}
