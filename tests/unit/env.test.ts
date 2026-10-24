import { describe, expect, it } from "vitest";
import {
  getEnvStatus,
  getPublicEnv,
  getServerEnv,
  validatePublicCode,
} from "@/lib/env";
import { resolveStationByPublicCode } from "@/server/stations/resolve-station";
import {
  findPilotCollectionBySlug,
  findPilotStationByCode,
  PILOT_STATIONS,
} from "@/features/pilot/sample-data";

describe("Environment Validation (src/lib/env.ts)", () => {
  it("reports pilot-seed-preview mode when Supabase env vars are missing or placeholders", () => {
    const status = getEnvStatus({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_URL: "https://your-project-ref.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        "sb_publishable_replace_with_your_anon_or_publishable_key",
    });

    expect(status.publicEnvConfigured).toBe(false);
    expect(status.serverEnvConfigured).toBe(false);
    expect(status.mode).toBe("pilot-seed-preview");
    expect(status.publicEnvIssues.length).toBeGreaterThan(0);
  });

  it("reports supabase-live mode when valid Supabase credentials are provided", () => {
    const status = getEnvStatus({
      NEXT_PUBLIC_APP_URL: "https://taptap.example.com",
      NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklm.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_valid_key_1234567890",
      SUPABASE_SERVICE_ROLE_KEY: "sb_secret_valid_service_role_key_123456",
    });

    expect(status.publicEnvConfigured).toBe(true);
    expect(status.serverEnvConfigured).toBe(true);
    expect(status.mode).toBe("supabase-live");
    expect(status.publicEnvIssues).toEqual([]);
    expect(status.serverEnvIssues).toEqual([]);
  });

  it("getPublicEnv and getServerEnv parse valid variables and throw on missing values", () => {
    const pub = getPublicEnv({
      NEXT_PUBLIC_APP_URL: "https://taptap.example.com",
      NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklm.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_valid_key_1234567890",
    });
    expect(pub.NEXT_PUBLIC_SUPABASE_URL).toBe("https://abcdefghijklm.supabase.co");

    expect(() => getServerEnv({})).toThrow();
  });
});

describe("NFC / QR Public Code Validation & Station Resolution", () => {
  it("accepts non-sequential alphanumeric public codes of length >= 6", () => {
    expect(validatePublicCode("tcv-k9x2m4p8").success).toBe(true);
    expect(validatePublicCode("tcv-q7w3n5r2").success).toBe(true);
  });

  it("rejects short or malformed public codes", () => {
    expect(validatePublicCode("123").success).toBe(false);
    expect(validatePublicCode("bad code with spaces").success).toBe(false);
    expect(validatePublicCode("tcv-k9x2<script>").success).toBe(false);
  });

  it("resolves known Saigon Zoo stations (Elephant, Giraffe, Flamingo, Conservatory)", async () => {
    expect(PILOT_STATIONS.map((s) => s.slug)).toEqual([
      "elephant",
      "giraffe",
      "flamingo",
      "botanical-conservatory",
    ]);

    const collection = findPilotCollectionBySlug("zoo-explorer");
    expect(collection?.name.en).toBe("Zoo Explorer");

    const elephant = await resolveStationByPublicCode("tcv-k9x2m4p8");
    expect(elephant.status).toBe("ok");
    expect(elephant.station?.name.en).toBe("Elephant");

    const giraffe = findPilotStationByCode("TCV-Q7W3N5R2");
    expect(giraffe?.name.en).toBe("Giraffe");
  });

  it("handles disabled and unknown tag codes gracefully", async () => {
    const disabled = await resolveStationByPublicCode("tcv-disabled99");
    expect(disabled.status).toBe("tag_disabled");

    const unknown = await resolveStationByPublicCode("tcv-unknown999");
    expect(unknown.status).toBe("not_found");

    const invalid = await resolveStationByPublicCode("a!");
    expect(invalid.status).toBe("invalid_code");
  });
});
