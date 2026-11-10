import type { CrmGrantEvent, CrmHolding, CrmPerson, CrmTapEvent } from "./aggregate";

export interface ParsedCrmActivity {
  taps: CrmTapEvent[];
  grants: CrmGrantEvent[];
  holdings: CrmHolding[];
  activeStampIds: string[];
  people: CrmPerson[];
  truncated: boolean;
  quota: unknown;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Drops malformed RPC rows instead of throwing the whole dashboard. */
export function parseCrmActivity(raw: unknown): ParsedCrmActivity {
  const obj = asRecord(raw) ?? {};
  const taps: CrmTapEvent[] = [];
  for (const row of list(obj.taps)) {
    const item = asRecord(row);
    const at = asString(item?.at);
    const participantId = asString(item?.participantId);
    if (!item || !at || !participantId) continue;
    taps.push({
      at,
      participantId,
      stationName: asString(item.stationName),
      source: asString(item.source),
      granted: item.granted === true,
    });
  }
  const grants: CrmGrantEvent[] = [];
  for (const row of list(obj.grants)) {
    const item = asRecord(row);
    const at = asString(item?.at);
    const participantId = asString(item?.participantId);
    const stampId = asString(item?.stampId);
    if (!item || !at || !participantId || !stampId) continue;
    grants.push({
      at,
      participantId,
      stampId,
      stampName: asString(item.stampName),
      stationName: asString(item.stationName),
      source: asString(item.source),
    });
  }
  const holdings: CrmHolding[] = [];
  for (const row of list(obj.holdings)) {
    const item = asRecord(row);
    const participantId = asString(item?.participantId);
    const stampId = asString(item?.stampId);
    if (!participantId || !stampId) continue;
    holdings.push({ participantId, stampId });
  }
  const people: CrmPerson[] = [];
  for (const row of list(obj.people)) {
    const item = asRecord(row);
    const id = asString(item?.id);
    if (!id) continue;
    people.push({
      id,
      displayName: asString(item?.displayName),
      email: asString(item?.email),
      locale: asString(item?.locale),
      lastAt: asString(item?.lastAt),
    });
  }
  const activeStampIds = list(obj.activeStampIds).filter((id): id is string => typeof id === "string" && id.length > 0);
  return {
    taps,
    grants,
    holdings,
    activeStampIds,
    people,
    truncated: obj.truncated === true,
    quota: obj.quota ?? null,
  };
}
