import type { MergeResponse, PassportResponse, PassportStamp } from "@/types/passport";

/** GET /api/passport — the visitor's B2C + B2B stamps (account or guest). */
export async function fetchPassport(): Promise<PassportStamp[]> {
  const res = await fetch("/api/passport", { cache: "no-store", credentials: "same-origin" });
  if (!res.ok) return [];
  const body = (await res.json()) as Partial<PassportResponse>;
  return Array.isArray(body.stamps) ? body.stamps : [];
}

/** POST /api/participant/merge — move this browser's guest stamps into the signed-in account. */
export async function mergeGuestProgress(): Promise<MergeResponse> {
  const res = await fetch("/api/participant/merge", { method: "POST", credentials: "same-origin" });
  const body = (await res.json().catch(() => ({}))) as Partial<MergeResponse>;
  return { merged: Number(body.merged) || 0, alreadyOwned: Number(body.alreadyOwned) || 0 };
}
