import { describe, expect, it } from "vitest";
import {
  deriveDisplayNameFromEmail,
  normalizeGmailInput,
} from "@/context/explorer-context";

describe("Instant Gmail Login helpers", () => {
  it("normalizes bare usernames by appending @gmail.com", () => {
    expect(normalizeGmailInput("explorer.tcv")).toEqual({
      valid: true,
      email: "explorer.tcv@gmail.com",
    });
  });

  it("trims and lowercases full Gmail addresses", () => {
    expect(normalizeGmailInput("  Visitor.SaigonZoo@Gmail.com ")).toEqual({
      valid: true,
      email: "visitor.saigonzoo@gmail.com",
    });
  });

  it("rejects empty or malformed email inputs", () => {
    expect(normalizeGmailInput("   ").valid).toBe(false);
    expect(normalizeGmailInput("invalid@@gmail.com").valid).toBe(false);
  });

  it("derives a clean display name when none is provided", () => {
    expect(deriveDisplayNameFromEmail("explorer.tcv@gmail.com")).toBe(
      "Explorer Tcv"
    );
    expect(
      deriveDisplayNameFromEmail("explorer.tcv@gmail.com", "Saigon Explorer")
    ).toBe("Saigon Explorer");
  });
});
