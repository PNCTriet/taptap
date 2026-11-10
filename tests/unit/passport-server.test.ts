import { describe, expect, it } from "vitest";
import { parseMergeResult, stampOriginLabel, toLegacyRecords, toPassportStamps, type PassportRow } from "@/server/passport/map";
import { isValidGuestToken, newGuestToken } from "@/server/guest/token";

const base = { participantId: "p1", collectSource: "nfc" as const, publicCode: "tcv-a", imageUrl: null };
const rows: PassportRow[] = [
  { ...base, id: "c2", stampId: "s2", stationId: "st2", name: "Robot Racer", collectedAt: "2026-11-10T10:00:00Z", source: "b2b", venueName: "b2b-demo", tenantName: "Demo Toy Studio", roomName: "Play Room A" },
  { ...base, id: "c1", stampId: "s1", stationId: "st1", name: "Asian Elephant", collectedAt: "2026-11-10T09:00:00Z", source: "b2c", venueName: "Saigon Zoo", tenantName: null, roomName: null },
];

describe("passport mapping", () => {
  it("maps RPC rows to the PassportStamp contract with tenant/room labels for B2B", () => {
    const stamps = toPassportStamps(rows);
    expect(stamps[0]).toEqual({ id: "c2", name: "Robot Racer", imageUrl: null, collectedAt: "2026-11-10T10:00:00Z", source: "b2b", tenantName: "Demo Toy Studio", roomName: "Play Room A" });
    expect(stamps[1]).toEqual({ id: "c1", name: "Asian Elephant", imageUrl: null, collectedAt: "2026-11-10T09:00:00Z", source: "b2c", venueName: "Saigon Zoo" });
    // The hidden B2B draft venue name never leaks into the contract.
    expect(JSON.stringify(stamps)).not.toContain("b2b-demo");
    expect(stampOriginLabel(stamps[0]!)).toBe("Demo Toy Studio · Play Room A");
  });
  it("keeps legacy records B2C-only so catalog screens never count tenant stamps", () => {
    const legacy = toLegacyRecords(rows);
    expect(legacy.map((r) => r.station_id)).toEqual(["st1"]);
  });
  it("tolerates bad payloads", () => {
    expect(toPassportStamps(null)).toEqual([]);
    expect(toLegacyRecords({})).toEqual([]);
  });
});

describe("guest token + merge result", () => {
  it("issues 256-bit url-safe tokens and rejects malformed ones", () => {
    const t = newGuestToken();
    expect(isValidGuestToken(t)).toBe(true);
    expect(t).not.toBe(newGuestToken());
    expect(isValidGuestToken("short")).toBe(false);
    expect(isValidGuestToken("x".repeat(40) + "'; drop table")).toBe(false);
    expect(isValidGuestToken(undefined)).toBe(false);
  });
  it("normalises merge results", () => {
    expect(parseMergeResult({ merged: 2, alreadyOwned: 1 })).toEqual({ merged: 2, alreadyOwned: 1 });
    expect(parseMergeResult({ merged: -3, alreadyOwned: "x" })).toEqual({ merged: 0, alreadyOwned: 0 });
    expect(parseMergeResult(null)).toEqual({ merged: 0, alreadyOwned: 0 });
  });
});
