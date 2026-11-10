import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEMO_MERGE_RESULT,
  DEMO_PASSPORT_STAMPS,
  getPassport,
  mergeGuestProgress,
  mergeSavedMessage,
  parseMergeResult,
  parsePassportResponse,
  readLocalGuestStampCount,
  shouldMergeGuestProgress,
  shouldShowMergeNotice,
} from "@/lib/passport-client";
import { groupPassportStamps } from "@/lib/passport-groups";
import { EXPLORER_STORAGE_KEY } from "@/lib/explorer-storage";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("passport contract", () => {
  it("parses stamps and drops invalid rows", () => {
    const parsed = parsePassportResponse({
      stamps: [
        ...DEMO_PASSPORT_STAMPS,
        { id: "bad", name: "Nope", imageUrl: null, collectedAt: "2026-01-01", source: "nfc" },
        { id: "", name: "Missing", imageUrl: null, collectedAt: "2026-01-01", source: "b2c" },
      ],
    });
    expect(parsed.stamps.map((stamp) => stamp.id)).toEqual(
      DEMO_PASSPORT_STAMPS.map((stamp) => stamp.id),
    );
    expect(parsed.stamps[0]).toMatchObject({
      source: "b2c",
      imageUrl: null,
      venueName: "Demo Zoo",
    });
  });

  it("treats a legacy records payload as an empty passport", () => {
    expect(parsePassportResponse({ records: [] })).toEqual({ stamps: [] });
    expect(parsePassportResponse(null)).toEqual({ stamps: [] });
  });

  it("GETs /api/passport and returns stamps", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify({ stamps: DEMO_PASSPORT_STAMPS }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const body = await getPassport();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/passport",
      expect.objectContaining({ method: "GET" }),
    );
    expect(body.stamps).toHaveLength(5);
  });

  it("returns an empty passport when the request is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ records: [] }), { status: 401 })),
    );
    await expect(getPassport()).resolves.toEqual({ stamps: [] });
  });

  it("POSTs /api/participant/merge and parses the counts", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify(DEMO_MERGE_RESULT), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(mergeGuestProgress()).resolves.toEqual({ merged: 3, alreadyOwned: 1 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/participant/merge",
      expect.objectContaining({ method: "POST", body: "{}" }),
    );
  });

  it("rejects a merge payload that is missing counts", () => {
    expect(() => parseMergeResult({ merged: 1 })).toThrow(/Invalid merge response/);
  });

  it("shows a notice only when merged is greater than zero", () => {
    expect(shouldShowMergeNotice({ merged: 3, alreadyOwned: 1 })).toBe(true);
    expect(shouldShowMergeNotice({ merged: 0, alreadyOwned: 4 })).toBe(false);
    expect(mergeSavedMessage(3, "en")).toBe("3 stamps saved to your account");
    expect(mergeSavedMessage(1, "en")).toBe("1 stamp saved to your account");
    expect(mergeSavedMessage(3, "vi")).toBe("Đã lưu 3 con dấu vào tài khoản");
  });

  it("merges after login only when guest progress is pending, or when the flag is set", () => {
    expect(
      shouldMergeGuestProgress({
        mergeFlag: false,
        authenticated: true,
        authLoading: false,
        pendingGuestStamps: 2,
        attempted: false,
      }),
    ).toBe(true);
    expect(
      shouldMergeGuestProgress({
        mergeFlag: false,
        authenticated: true,
        authLoading: false,
        pendingGuestStamps: 2,
        attempted: true,
      }),
    ).toBe(false);
    expect(
      shouldMergeGuestProgress({
        mergeFlag: false,
        authenticated: false,
        authLoading: false,
        pendingGuestStamps: 2,
        attempted: false,
      }),
    ).toBe(false);
    expect(
      shouldMergeGuestProgress({
        mergeFlag: true,
        authenticated: false,
        authLoading: true,
        pendingGuestStamps: 0,
        attempted: false,
      }),
    ).toBe(true);
  });

  it("groups B2C under Explore and B2B by tenant and room", () => {
    const groups = groupPassportStamps(DEMO_PASSPORT_STAMPS);
    expect(groups.explore.map((stamp) => stamp.id)).toEqual([
      "demo-b2c-elephant",
      "demo-b2c-giraffe",
    ]);
    expect(groups.business.map((group) => [group.tenantName, group.roomName])).toEqual([
      ["Demo Studio", "Workshop"],
      ["Demo Cafe", "Main room"],
    ]);
    expect(groups.business[1]?.stamps.map((stamp) => stamp.name)).toEqual([
      "Demo Counter",
      "Demo Window",
    ]);
    expect(groupPassportStamps([])).toEqual({ explore: [], business: [] });
  });

  it("counts anonymous local stamps and ignores a signed-in snapshot", () => {
    const store = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
      },
    });
    store.set(
      EXPLORER_STORAGE_KEY,
      JSON.stringify({
        session: { isAnonymous: true, authUserId: null },
        collectedStamps: [{ id: "a" }, { id: "b" }],
      }),
    );
    expect(readLocalGuestStampCount()).toBe(2);

    store.set(
      EXPLORER_STORAGE_KEY,
      JSON.stringify({
        session: { isAnonymous: false, authUserId: "user-1" },
        collectedStamps: [{ id: "a" }],
      }),
    );
    expect(readLocalGuestStampCount()).toBe(0);
  });
});
