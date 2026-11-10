import { expect, test } from "@playwright/test";
import { hasE2eEnv, login, rest, tokenFor } from "./helpers";

/** Tenant viewer gets masked visitor emails from the CRM API; the owner gets full ones. Read-only. */
test.describe("CRM viewer email masking (API)", () => {
  test.skip(!hasE2eEnv(), "needs E2E creds");
  test.beforeEach(({}, info) => test.skip(info.project.name !== "Mobile Chrome", "one run"));

  for (const [who, masked] of [["VIEWER", true], ["OWNER", false]] as const) {
    test(`${who} ${masked ? "sees masked" : "sees full"} visitor emails`, async ({ page }) => {
      await login(page, who, "/b2b");
      const t = await rest("tenants?slug=eq.demo-toy-studio&select=id", { token: await tokenFor(who) });
      const tenantId = (t.json as { id: string }[])[0]!.id;
      const res = await page.request.get(`/api/crm/activity?days=30&scope=${tenantId}`);
      expect(res.status()).toBe(200);
      const body = (await res.json()) as { visitors: { email: string | null }[] };
      const emails = body.visitors.map((v) => v.email).filter((e): e is string => !!e);
      expect(emails.length).toBeGreaterThan(0);
      if (masked) {
        for (const e of emails) expect(e).toMatch(/^.\*\*\*@|^\*\*\*$/);
      } else {
        expect(emails.some((e) => /^demo-visitor-\d+@example\.com$/.test(e))).toBe(true);
      }
    });
  }
});
