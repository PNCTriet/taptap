import { describe, expect, it } from "vitest";
import { checkQuota, effectiveLimits, parseTenantUsage, quotaMeters } from "@/server/quota/quota";
import { mapDbError } from "@/server/quota/errors";
import { B2B_ACTIONS } from "@/server/b2b/actions";

const STARTER = { max_rooms: 1, max_stations: 10, max_members: 3, max_active_nfc_tags: 10 };
const GROWTH = { max_rooms: 5, max_stations: 50, max_members: 10, max_active_nfc_tags: 50 };
const PRO = { max_rooms: 20, max_stations: 200, max_members: 50, max_active_nfc_tags: 200 };

describe("effectiveLimits", () => {
  it("maps the owner-approved package catalogue", () => {
    expect(effectiveLimits(STARTER, {})).toEqual({ rooms: 1, stations: 10, members: 3, active_nfc_tags: 10 });
    expect(effectiveLimits(GROWTH, {})).toEqual({ rooms: 5, stations: 50, members: 10, active_nfc_tags: 50 });
    expect(effectiveLimits(PRO, {})).toEqual({ rooms: 20, stations: 200, members: 50, active_nfc_tags: 200 });
  });

  it("applies per-tenant overrides on top of the package", () => {
    expect(effectiveLimits(STARTER, { max_rooms: 2 }).rooms).toBe(2);
    expect(effectiveLimits(STARTER, { max_rooms: 2 }).stations).toBe(10);
  });

  it("ignores invalid overrides and clamps negatives", () => {
    expect(effectiveLimits(STARTER, { max_rooms: Number.NaN }).rooms).toBe(1);
    expect(effectiveLimits(STARTER, { max_rooms: -5 }).rooms).toBe(0);
  });

  it("blocks everything for suspended tenants or no active subscription", () => {
    const zero = { rooms: 0, stations: 0, members: 0, active_nfc_tags: 0 };
    expect(effectiveLimits(GROWTH, {}, { tenantStatus: "suspended", subscriptionActive: true })).toEqual(zero);
    expect(effectiveLimits(GROWTH, {}, { tenantStatus: "active", subscriptionActive: false })).toEqual(zero);
    expect(effectiveLimits(null, {})).toEqual(zero);
  });
});

describe("checkQuota", () => {
  const limits = effectiveLimits(STARTER, {});
  it("allows creation within quota", () => {
    const r = checkQuota("rooms", { rooms: 0, stations: 0, members: 1, active_nfc_tags: 0 }, limits);
    expect(r).toMatchObject({ allowed: true, used: 0, max: 1, remaining: 1 });
  });
  it("rejects creation at the limit", () => {
    const r = checkQuota("rooms", { rooms: 1, stations: 0, members: 1, active_nfc_tags: 0 }, limits);
    expect(r).toMatchObject({ allowed: false, used: 1, max: 1, remaining: 0 });
  });
  it("handles bulk amounts", () => {
    const usage = { rooms: 0, stations: 8, members: 1, active_nfc_tags: 0 };
    expect(checkQuota("stations", usage, limits, 2).allowed).toBe(true);
    expect(checkQuota("stations", usage, limits, 3).allowed).toBe(false);
  });
});

describe("quotaMeters + parseTenantUsage", () => {
  it("parses the tenant_usage RPC payload and computes meter states", () => {
    const parsed = parseTenantUsage({
      role: "owner",
      used: { rooms: 1, stations: 8, members: 1, active_nfc_tags: 0 },
      limits: { rooms: 1, stations: 10, members: 3, active_nfc_tags: 10, package_code: "starter", package_name: "Starter", tenant_status: "active" },
    });
    expect(parsed.packageCode).toBe("starter");
    expect(parsed.role).toBe("owner");
    const meters = Object.fromEntries(quotaMeters(parsed.used, parsed.limits).map((m) => [m.resource, m.state]));
    expect(meters).toEqual({ rooms: "full", stations: "near", members: "ok", active_nfc_tags: "ok" });
  });
});

describe("mapDbError", () => {
  it("maps DB quota errors to HTTP 409 with a bilingual message", () => {
    const e = mapDbError({ code: "P0001", message: "QUOTA_EXCEEDED:rooms:1/1", hint: "rooms" });
    expect(e.status).toBe(409);
    expect(e).toMatchObject({ code: "QUOTA_EXCEEDED", resource: "rooms", used: 1, max: 1 });
    expect(e.message.en).toContain("1/1 rooms");
    expect(e.message.vi).toContain("1/1 phòng");
  });
  it("maps role errors to 403 and validation errors to 422", () => {
    expect(mapDbError({ code: "42501", message: "FORBIDDEN" }).status).toBe(403);
    expect(mapDbError({ code: "22023", message: "INVALID:name" }).status).toBe(422);
    expect(mapDbError({ code: "P0002", message: "NOT_FOUND" }).status).toBe(404);
    expect(mapDbError({ code: "P0001", message: "LAST_OWNER" }).status).toBe(409);
  });
});

describe("B2B action whitelist", () => {
  it("pre-checks quota for every create action that has a tenant id", () => {
    expect(B2B_ACTIONS["create-room"]?.quota?.resource).toBe("rooms");
    expect(B2B_ACTIONS["create-station"]?.quota?.resource).toBe("stations");
    expect(B2B_ACTIONS["invite-member"]?.quota?.resource).toBe("members");
  });
  it("rejects malformed input before reaching the database", () => {
    expect(B2B_ACTIONS["create-room"]!.schema.safeParse({ tenantId: "x", name: "" }).success).toBe(false);
    expect(B2B_ACTIONS["invite-member"]!.schema.safeParse({ tenantId: "6b1089f7-3a06-4bf4-bd52-1f762a3dd3c4", email: "nope", role: "owner" }).success).toBe(false);
    expect(B2B_ACTIONS["upsert-package"]!.schema.safeParse({ code: "x", name: "X", maxRooms: -1, maxStations: 1, maxMembers: 1, maxActiveNfcTags: 1 }).success).toBe(false);
  });
});
