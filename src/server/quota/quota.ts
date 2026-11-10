/**
 * Quota rules shared by API routes and the UI (display only).
 * The database triggers (`enforce_tenant_quota`) are authoritative; these helpers
 * mirror the same math so API routes can pre-check and the dashboard can render
 * `used / max`. Never trust a `remaining` number coming from the client.
 */

export const QUOTA_RESOURCES = [
  "rooms",
  "stations",
  "members",
  "active_nfc_tags",
] as const;

export type QuotaResource = (typeof QUOTA_RESOURCES)[number];

export interface PackageLimits {
  max_rooms: number;
  max_stations: number;
  max_members: number;
  max_active_nfc_tags: number;
}

export type QuotaOverrides = Partial<Record<keyof PackageLimits, number>>;

export type QuotaLimits = Record<QuotaResource, number>;
export type QuotaUsage = Record<QuotaResource, number>;

export interface TenantQuotaContext {
  tenantStatus: "pending" | "active" | "suspended" | null;
  subscriptionActive: boolean;
}

const RESOURCE_TO_FIELD: Record<QuotaResource, keyof PackageLimits> = {
  rooms: "max_rooms",
  stations: "max_stations",
  members: "max_members",
  active_nfc_tags: "max_active_nfc_tags",
};

function toLimit(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.floor(value));
}

/** Package limits merged with per-tenant overrides. Inactive tenant => all zero. */
export function effectiveLimits(
  pkg: PackageLimits | null,
  overrides: QuotaOverrides | null | undefined,
  ctx: TenantQuotaContext = { tenantStatus: "active", subscriptionActive: true }
): QuotaLimits {
  const zero: QuotaLimits = { rooms: 0, stations: 0, members: 0, active_nfc_tags: 0 };
  if (!pkg || ctx.tenantStatus !== "active" || !ctx.subscriptionActive) return zero;
  const out = { ...zero };
  for (const resource of QUOTA_RESOURCES) {
    const field = RESOURCE_TO_FIELD[resource];
    out[resource] = toLimit(overrides?.[field]) ?? toLimit(pkg[field]) ?? 0;
  }
  return out;
}

export interface QuotaCheck {
  allowed: boolean;
  resource: QuotaResource;
  used: number;
  max: number;
  remaining: number;
}

/** Can `amount` more items of `resource` be created? */
export function checkQuota(
  resource: QuotaResource,
  usage: QuotaUsage,
  limits: QuotaLimits,
  amount = 1
): QuotaCheck {
  const used = Math.max(0, usage[resource] ?? 0);
  const max = Math.max(0, limits[resource] ?? 0);
  const remaining = Math.max(0, max - used);
  return { allowed: used + amount <= max, resource, used, max, remaining };
}

export interface QuotaMeterRow {
  resource: QuotaResource;
  used: number;
  max: number;
  ratio: number;
  state: "ok" | "near" | "full";
}

export function quotaMeters(usage: QuotaUsage, limits: QuotaLimits): QuotaMeterRow[] {
  return QUOTA_RESOURCES.map((resource) => {
    const used = Math.max(0, usage[resource] ?? 0);
    const max = Math.max(0, limits[resource] ?? 0);
    const ratio = max === 0 ? 1 : Math.min(1, used / max);
    const state = used >= max ? "full" : ratio >= 0.8 ? "near" : "ok";
    return { resource, used, max, ratio, state };
  });
}

/** Parses the jsonb returned by the `tenant_usage` RPC. */
export function parseTenantUsage(raw: unknown): {
  limits: QuotaLimits;
  used: QuotaUsage;
  packageCode: string | null;
  packageName: string | null;
  tenantStatus: string | null;
  role: string | null;
} {
  const obj = (raw ?? {}) as Record<string, Record<string, unknown> | string | null>;
  const l = (obj.limits ?? {}) as Record<string, unknown>;
  const u = (obj.used ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0) || 0);
  const limits = {} as QuotaLimits;
  const used = {} as QuotaUsage;
  for (const r of QUOTA_RESOURCES) {
    limits[r] = num(l[r]);
    used[r] = num(u[r]);
  }
  return {
    limits,
    used,
    packageCode: typeof l.package_code === "string" ? l.package_code : null,
    packageName: typeof l.package_name === "string" ? l.package_name : null,
    tenantStatus: typeof l.tenant_status === "string" ? l.tenant_status : null,
    role: typeof obj.role === "string" ? obj.role : null,
  };
}
