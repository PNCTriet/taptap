import { describe, expect, it } from "vitest";
import {
  aggregateCrm,
  buildVisitorRows,
  filterVisitors,
  visitorHistory,
  windowFor,
  zonedStartIso,
  type CrmActivityInput,
} from "@/server/crm/aggregate";
import { resolveCrmScope } from "@/server/crm/access";
import { demoActivity } from "@/server/crm/demo-fixture";
import { parseCrmActivity } from "@/server/crm/parse";

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";

function activity(overrides: Partial<CrmActivityInput> = {}): CrmActivityInput {
  return {
    timeZone: "UTC",
    from: "2026-10-12",
    to: "2026-11-10",
    taps: [],
    grants: [],
    holdings: [],
    activeStampIds: ["s1", "s2"],
    ...overrides,
  };
}

describe("aggregateCrm", () => {
  it("counts taps, visitors, stamps, and fills every day in the window", () => {
    const overview = aggregateCrm(
      activity({
        taps: [
          { at: "2026-11-10T01:00:00Z", participantId: "p1" },
          { at: "2026-11-10T02:00:00Z", participantId: "p1" },
          { at: "2026-11-09T02:00:00Z", participantId: "p2" },
          { at: "2026-10-01T00:00:00Z", participantId: "old" },
        ],
        grants: [
          { at: "2026-11-10T01:00:00Z", participantId: "p1", stampId: "s1" },
          { at: "2026-11-09T02:00:00Z", participantId: "p2", stampId: "s1" },
        ],
        holdings: [
          { participantId: "p1", stampId: "s1" },
          { participantId: "p1", stampId: "s2" },
          { participantId: "p2", stampId: "s1" },
        ],
      })
    );
    expect(overview.taps).toBe(3);
    expect(overview.uniqueVisitors).toBe(2);
    expect(overview.stampsCollected).toBe(2);
    expect(overview.completedVisitors).toBe(1);
    expect(overview.completionRate).toBeCloseTo(0.5);
    expect(overview.daily).toHaveLength(30);
    expect(overview.daily[0]).toEqual({ date: "2026-10-12", taps: 0, stamps: 0, visitors: 0 });
    expect(overview.daily.at(-1)).toMatchObject({ date: "2026-11-10", taps: 2, stamps: 1, visitors: 1 });
  });

  it("returns a null completion rate when nobody visited or nothing is active", () => {
    expect(aggregateCrm(activity()).completionRate).toBeNull();
    expect(
      aggregateCrm(activity({ activeStampIds: [], taps: [{ at: "2026-11-10T00:00:00Z", participantId: "p1" }] })).completionRate
    ).toBeNull();
  });

  it("falls back to grants only when the tap log is empty and the flag is set", () => {
    const grants = [{ at: "2026-11-10T00:00:00Z", participantId: "p1", stampId: "s1" }];
    expect(aggregateCrm(activity({ grants, fallbackTapsToGrants: true })).taps).toBe(1);
    expect(aggregateCrm(activity({ grants })).taps).toBe(0);
    expect(
      aggregateCrm(
        activity({
          grants,
          taps: [{ at: "2026-11-10T03:00:00Z", participantId: "p1" }],
          fallbackTapsToGrants: true,
        })
      ).taps
    ).toBe(1);
  });

  it("buckets a late UTC instant onto the next local day", () => {
    const overview = aggregateCrm(
      activity({
        timeZone: "Asia/Ho_Chi_Minh",
        from: "2026-11-10",
        to: "2026-11-10",
        taps: [{ at: "2026-11-09T18:30:00Z", participantId: "p1" }],
      })
    );
    expect(overview.daily).toEqual([{ date: "2026-11-10", taps: 1, stamps: 0, visitors: 1 }]);
    expect(windowFor("UTC", 30, new Date("2026-11-10T12:00:00Z"))).toEqual({
      from: "2026-10-12",
      to: "2026-11-10",
    });
    expect(zonedStartIso("2026-11-10", "UTC")).toBe("2026-11-10T00:00:00.000Z");
    expect(zonedStartIso("2026-11-10", "Asia/Ho_Chi_Minh")).toBe("2026-11-09T17:00:00.000Z");
  });
});

describe("visitor table", () => {
  const input = activity({
    taps: [
      { at: "2026-11-10T01:00:00Z", participantId: "p1", stationName: "Kiosk", source: "nfc", granted: true },
      { at: "2026-11-08T01:00:00Z", participantId: "p2", stationName: "Cube", source: "qr", granted: false },
    ],
    grants: [{ at: "2026-11-10T01:00:00Z", participantId: "p1", stampId: "s1", stampName: "Kiosk", stationName: "Kiosk", source: "nfc" }],
    holdings: [
      { participantId: "p1", stampId: "s1" },
      { participantId: "p1", stampId: "s2" },
      { participantId: "p2", stampId: "s1" },
    ],
  });
  const people = [
    { id: "p1", displayName: "Lan Demo", email: "lan@example.com", locale: "vi", lastAt: "2026-11-10T01:00:00Z" },
    { id: "p2", displayName: "Minh Demo", email: "minh@example.com", locale: "en", lastAt: "2026-11-08T01:00:00Z" },
  ];
  const rows = buildVisitorRows(input, people);

  it("searches, filters, and sorts", () => {
    expect(filterVisitors(rows, { search: "lan@" })).toHaveLength(1);
    expect(filterVisitors(rows, { filter: "completed" }).map((row) => row.id)).toEqual(["p1"]);
    expect(filterVisitors(rows, { filter: "in_progress" }).map((row) => row.id)).toEqual(["p2"]);
    expect(filterVisitors(rows, { filter: "no_stamps" })).toHaveLength(0);
    expect(filterVisitors(rows, { sort: "taps", direction: "asc" }).map((row) => row.id)).toEqual(["p1", "p2"]);
    expect(filterVisitors(rows, { sort: "name", direction: "asc" }).map((row) => row.name)).toEqual(["Lan Demo", "Minh Demo"]);
  });

  it("returns that visitor's tap and stamp history, newest first", () => {
    const history = visitorHistory("p1", input);
    expect(history.taps).toEqual([{ at: "2026-11-10T01:00:00Z", stationName: "Kiosk", source: "nfc", granted: true }]);
    expect(history.stamps[0]?.stampName).toBe("Kiosk");
    expect(visitorHistory("p2", input).stamps).toHaveLength(0);
  });
});

describe("resolveCrmScope", () => {
  const memberships = [
    { tenantId: TENANT_A, role: "viewer" },
    { tenantId: TENANT_B, role: "owner" },
  ];

  it("lets a member read only their tenant, including editor and viewer", () => {
    expect(resolveCrmScope({ isPlatformAdmin: false, memberships: [{ tenantId: TENANT_A, role: "editor" }], requested: TENANT_A })).toEqual({
      ok: true,
      scope: "tenant",
      tenantId: TENANT_A,
    });
    expect(resolveCrmScope({ isPlatformAdmin: false, memberships: [{ tenantId: TENANT_A, role: "viewer" }], requested: TENANT_A }).ok).toBe(true);
    expect(resolveCrmScope({ isPlatformAdmin: false, memberships, requested: TENANT_A })).toMatchObject({ ok: true, tenantId: TENANT_A });
  });

  it("refuses another tenant, the B2C catalog, and the all-tenant rollup", () => {
    const other = "33333333-3333-4333-8333-333333333333";
    expect(resolveCrmScope({ isPlatformAdmin: false, memberships, requested: other })).toMatchObject({ ok: false, status: 403 });
    expect(resolveCrmScope({ isPlatformAdmin: false, memberships, requested: "all" })).toMatchObject({ ok: false, code: "FORBIDDEN" });
    expect(resolveCrmScope({ isPlatformAdmin: false, memberships, requested: "b2c" })).toMatchObject({ ok: false, status: 403 });
    expect(resolveCrmScope({ isPlatformAdmin: false, memberships: [{ tenantId: TENANT_A, role: "guest" }], requested: TENANT_A })).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("lets a platform admin read one tenant, B2C, or everything", () => {
    expect(resolveCrmScope({ isPlatformAdmin: true, memberships: [], requested: null })).toEqual({ ok: true, scope: "all" });
    expect(resolveCrmScope({ isPlatformAdmin: true, memberships: [], requested: "b2c" })).toEqual({ ok: true, scope: "b2c" });
    expect(resolveCrmScope({ isPlatformAdmin: true, memberships: [], requested: TENANT_B })).toMatchObject({ ok: true, tenantId: TENANT_B });
  });

  it("asks for a tenant when a member belongs to more than one and names none", () => {
    expect(resolveCrmScope({ isPlatformAdmin: false, memberships, requested: null })).toMatchObject({ code: "TENANT_REQUIRED" });
    expect(resolveCrmScope({ isPlatformAdmin: false, memberships, requested: "not-a-uuid" })).toMatchObject({ code: "INVALID" });
  });
});

describe("parseCrmActivity", () => {
  it("keeps well-formed rows and drops the rest", () => {
    const parsed = parseCrmActivity({
      taps: [{ at: "2026-11-10T00:00:00Z", participantId: "p1", granted: true }, { at: "bad" }, null],
      grants: [{ at: "2026-11-10T00:00:00Z", participantId: "p1", stampId: "s1", stampName: "Kiosk" }],
      holdings: [{ participantId: "p1", stampId: "s1" }],
      activeStampIds: ["s1", 4],
      people: [{ id: "p1", displayName: "Lan", email: null, locale: "vi", lastAt: null }],
      truncated: false,
      quota: { limits: { rooms: 1 }, used: { rooms: 0 } },
    });
    expect(parsed.taps).toHaveLength(1);
    expect(parsed.grants[0]?.stampName).toBe("Kiosk");
    expect(parsed.activeStampIds).toEqual(["s1"]);
    expect(parsed.people[0]?.displayName).toBe("Lan");
    expect(parsed.truncated).toBe(false);
  });
});

describe("demo activity fixture", () => {
  it("builds about 40 visitors and 30 days, with more taps than stamps", () => {
    const { input, people } = demoActivity();
    const overview = aggregateCrm(input);
    const rows = buildVisitorRows(input, people);
    expect(people).toHaveLength(40);
    expect(rows.length).toBeGreaterThanOrEqual(40);
    expect(overview.daily).toHaveLength(30);
    expect(overview.taps).toBeGreaterThan(overview.stampsCollected);
    expect(overview.stampsCollected).toBeGreaterThan(40);
    expect(overview.uniqueVisitors).toBe(40);
    expect(overview.completionRate).toBeGreaterThan(0);
    expect(overview.completionRate).toBeLessThan(1);
  });
});
