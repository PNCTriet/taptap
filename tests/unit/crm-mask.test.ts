import { describe, expect, it } from "vitest";
import { maskEmail, shouldMaskEmails } from "@/server/crm/access";

describe("CRM visitor email masking", () => {
  it("masks only for tenant viewers (and unknown roles), never for owner/admin/editor or platform admin", () => {
    expect(shouldMaskEmails({ isPlatformAdmin: false, scope: "tenant", role: "viewer" })).toBe(true);
    expect(shouldMaskEmails({ isPlatformAdmin: false, scope: "tenant", role: null })).toBe(true);
    for (const role of ["owner", "admin", "editor"]) {
      expect(shouldMaskEmails({ isPlatformAdmin: false, scope: "tenant", role })).toBe(false);
    }
    expect(shouldMaskEmails({ isPlatformAdmin: true, scope: "tenant", role: "viewer" })).toBe(false);
    expect(shouldMaskEmails({ isPlatformAdmin: true, scope: "all", role: null })).toBe(false);
  });
  it("masks the local part and keeps the domain; idempotent on already-masked values", () => {
    expect(maskEmail("demo-visitor-01@example.com")).toBe("d***@example.com");
    expect(maskEmail("d***@example.com")).toBe("d***@example.com");
    expect(maskEmail("nope")).toBe("***");
    expect(maskEmail(null)).toBeNull();
  });
});
