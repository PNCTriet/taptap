/**
 * Pure CRM aggregation. The database RPC only returns scoped rows;
 * every total, rate, day bucket, and table sort lives here so Vitest
 * can lock the math without a database.
 */

export interface CrmTapEvent {
  at: string;
  participantId: string;
  stationName?: string | null;
  source?: string | null;
  granted?: boolean;
}

export interface CrmGrantEvent {
  at: string;
  participantId: string;
  stampId: string;
  stampName?: string | null;
  stationName?: string | null;
  source?: string | null;
}

export interface CrmHolding {
  participantId: string;
  stampId: string;
}

export interface CrmPerson {
  id: string;
  displayName: string | null;
  email: string | null;
  locale: string | null;
  lastAt: string | null;
}

export interface CrmActivityInput {
  timeZone: string;
  /** Inclusive YYYY-MM-DD bounds in `timeZone`. */
  from: string;
  to: string;
  taps: CrmTapEvent[];
  grants: CrmGrantEvent[];
  /** Lifetime stamp holdings, used only for completion. */
  holdings: CrmHolding[];
  activeStampIds: string[];
  /**
   * When the tap log has no in-range rows, each in-range grant counts as one tap.
   * Live collects predate the tap log; the demo seed fills both, so this stays off.
   */
  fallbackTapsToGrants?: boolean;
}

export interface DailyPoint {
  date: string;
  taps: number;
  stamps: number;
  visitors: number;
}

export interface CrmOverview {
  taps: number;
  uniqueVisitors: number;
  stampsCollected: number;
  /** Null when nobody visited, or the scope has no active stamps. */
  completionRate: number | null;
  completedVisitors: number;
  activeStampCount: number;
  daily: DailyPoint[];
}

export interface VisitorRow {
  id: string;
  name: string;
  email: string | null;
  locale: string | null;
  taps: number;
  stamps: number;
  lifetimeStamps: number;
  lastAt: string | null;
  completed: boolean;
}

export type VisitorFilter = "all" | "completed" | "in_progress" | "no_stamps";
export type VisitorSort = "name" | "taps" | "stamps" | "last";
export type SortDirection = "asc" | "desc";

export interface VisitorQuery {
  search?: string;
  filter?: VisitorFilter;
  sort?: VisitorSort;
  direction?: SortDirection;
}

export interface VisitorHistory {
  taps: { at: string; stationName: string | null; source: string | null; granted: boolean }[];
  stamps: { at: string; stampName: string | null; stationName: string | null; source: string | null }[];
}

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function addDays(day: string, delta: number): string {
  const match = DAY.exec(day);
  if (!match) return day;
  const dt = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

export function eachDay(from: string, to: string): string[] {
  if (!DAY.test(from) || !DAY.test(to) || from > to) return [];
  const out: string[] = [];
  let cursor = from;
  while (cursor <= to && out.length < 400) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

export function dayKey(iso: string, timeZone: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;
    if (!year || !month || !day) return null;
    return `${year}-${month}-${day}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function todayKey(timeZone: string, now = new Date()): string {
  return dayKey(now.toISOString(), timeZone) ?? now.toISOString().slice(0, 10);
}

export function windowFor(timeZone: string, days: number, now = new Date()): { from: string; to: string } {
  const span = Math.min(90, Math.max(1, Math.floor(days)));
  const to = todayKey(timeZone, now);
  return { from: addDays(to, -(span - 1)), to };
}

/** UTC instant of local midnight on `day`, so the SQL window matches the chart. */
export function zonedStartIso(day: string, timeZone: string): string {
  const match = DAY.exec(day);
  if (!match) return new Date().toISOString();
  let cursor = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) - 1, 0, 0, 0));
  for (let step = 0; step < 64; step += 1) {
    const key = dayKey(cursor.toISOString(), timeZone);
    if (key != null && key >= day) break;
    cursor = new Date(cursor.getTime() + 30 * 60 * 1000);
  }
  while (dayKey(new Date(cursor.getTime() - 60 * 1000).toISOString(), timeZone) === day) {
    cursor = new Date(cursor.getTime() - 60 * 1000);
  }
  return cursor.toISOString();
}

function inRange(iso: string, timeZone: string, from: string, to: string): boolean {
  const key = dayKey(iso, timeZone);
  return key != null && key >= from && key <= to;
}

function holdingsByPerson(holdings: CrmHolding[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const holding of holdings) {
    if (!holding.participantId || !holding.stampId) continue;
    const set = map.get(holding.participantId) ?? new Set<string>();
    set.add(holding.stampId);
    map.set(holding.participantId, set);
  }
  return map;
}

function isCompleted(owned: Set<string> | undefined, active: string[]): boolean {
  if (active.length === 0 || !owned) return false;
  return active.every((id) => owned.has(id));
}

export function aggregateCrm(input: CrmActivityInput): CrmOverview {
  const days = eachDay(input.from, input.to);
  const active = [...new Set(input.activeStampIds.filter(Boolean))];
  const owned = holdingsByPerson(input.holdings);
  const tapsInRange = input.taps.filter((tap) => inRange(tap.at, input.timeZone, input.from, input.to));
  const grantsInRange = input.grants.filter((grant) => inRange(grant.at, input.timeZone, input.from, input.to));
  const useGrantTaps = input.fallbackTapsToGrants === true && tapsInRange.length === 0;
  const tapSeries = useGrantTaps
    ? grantsInRange.map((grant) => ({ at: grant.at, participantId: grant.participantId }))
    : tapsInRange;

  const byDay = new Map<string, { taps: number; stamps: number; people: Set<string> }>();
  for (const day of days) byDay.set(day, { taps: 0, stamps: 0, people: new Set() });

  const visitors = new Set<string>();
  for (const tap of tapSeries) {
    if (!tap.participantId) continue;
    visitors.add(tap.participantId);
    const key = dayKey(tap.at, input.timeZone);
    const bucket = key ? byDay.get(key) : undefined;
    if (!bucket) continue;
    bucket.taps += 1;
    bucket.people.add(tap.participantId);
  }
  for (const grant of grantsInRange) {
    if (!grant.participantId) continue;
    visitors.add(grant.participantId);
    const key = dayKey(grant.at, input.timeZone);
    const bucket = key ? byDay.get(key) : undefined;
    if (!bucket) continue;
    bucket.stamps += 1;
    bucket.people.add(grant.participantId);
  }

  let completedVisitors = 0;
  if (active.length > 0) {
    for (const id of visitors) {
      if (isCompleted(owned.get(id), active)) completedVisitors += 1;
    }
  }

  return {
    taps: tapSeries.length,
    uniqueVisitors: visitors.size,
    stampsCollected: grantsInRange.length,
    completionRate: visitors.size === 0 || active.length === 0 ? null : completedVisitors / visitors.size,
    completedVisitors,
    activeStampCount: active.length,
    daily: days.map((date) => {
      const bucket = byDay.get(date)!;
      return { date, taps: bucket.taps, stamps: bucket.stamps, visitors: bucket.people.size };
    }),
  };
}

export function buildVisitorRows(input: CrmActivityInput, people: CrmPerson[]): VisitorRow[] {
  const active = [...new Set(input.activeStampIds.filter(Boolean))];
  const owned = holdingsByPerson(input.holdings);
  const taps = new Map<string, number>();
  const stamps = new Map<string, number>();
  const lifetime = new Map<string, number>();

  for (const tap of input.taps) {
    if (!inRange(tap.at, input.timeZone, input.from, input.to) || !tap.participantId) continue;
    taps.set(tap.participantId, (taps.get(tap.participantId) ?? 0) + 1);
  }
  for (const grant of input.grants) {
    if (!inRange(grant.at, input.timeZone, input.from, input.to) || !grant.participantId) continue;
    stamps.set(grant.participantId, (stamps.get(grant.participantId) ?? 0) + 1);
  }
  for (const [id, set] of owned) lifetime.set(id, set.size);

  const known = new Map(people.map((person) => [person.id, person]));
  const ids = new Set<string>([
    ...known.keys(),
    ...taps.keys(),
    ...stamps.keys(),
    ...owned.keys(),
  ]);

  const rows: VisitorRow[] = [];
  for (const id of ids) {
    const person = known.get(id);
    const lifetimeStamps = lifetime.get(id) ?? 0;
    const tapCount = taps.get(id) ?? 0;
    const stampCount = stamps.get(id) ?? 0;
    if (tapCount === 0 && stampCount === 0 && lifetimeStamps === 0) continue;
    const name = person?.displayName?.trim() || person?.email || id.slice(0, 8);
    rows.push({
      id,
      name,
      email: person?.email ?? null,
      locale: person?.locale ?? null,
      taps: tapCount,
      stamps: stampCount,
      lifetimeStamps,
      lastAt: person?.lastAt ?? null,
      completed: isCompleted(owned.get(id), active),
    });
  }
  return rows;
}

export function filterVisitors(rows: VisitorRow[], query: VisitorQuery = {}): VisitorRow[] {
  const search = (query.search ?? "").trim().toLowerCase();
  const filter = query.filter ?? "all";
  const sort = query.sort ?? "last";
  const direction = query.direction ?? "desc";

  const filtered = rows.filter((row) => {
    if (search && !`${row.name} ${row.email ?? ""}`.toLowerCase().includes(search)) return false;
    if (filter === "completed") return row.completed;
    if (filter === "in_progress") return !row.completed && row.lifetimeStamps > 0;
    if (filter === "no_stamps") return row.lifetimeStamps === 0;
    return true;
  });

  const factor = direction === "asc" ? 1 : -1;
  filtered.sort((a, b) => {
    let cmp = 0;
    if (sort === "name") cmp = a.name.localeCompare(b.name);
    else if (sort === "taps") cmp = a.taps - b.taps;
    else if (sort === "stamps") cmp = a.stamps - b.stamps;
    else {
      const at = a.lastAt ? Date.parse(a.lastAt) : 0;
      const bt = b.lastAt ? Date.parse(b.lastAt) : 0;
      cmp = at - bt;
    }
    if (cmp === 0) cmp = a.name.localeCompare(b.name);
    return cmp * factor;
  });
  return filtered;
}

export function visitorHistory(participantId: string, input: Pick<CrmActivityInput, "taps" | "grants" | "timeZone" | "from" | "to">): VisitorHistory {
  const taps = input.taps
    .filter((tap) => tap.participantId === participantId && inRange(tap.at, input.timeZone, input.from, input.to))
    .map((tap) => ({
      at: tap.at,
      stationName: tap.stationName ?? null,
      source: tap.source ?? null,
      granted: Boolean(tap.granted),
    }))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const stamps = input.grants
    .filter((grant) => grant.participantId === participantId && inRange(grant.at, input.timeZone, input.from, input.to))
    .map((grant) => ({
      at: grant.at,
      stampName: grant.stampName ?? null,
      stationName: grant.stationName ?? null,
      source: grant.source ?? null,
    }))
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return { taps, stamps };
}
