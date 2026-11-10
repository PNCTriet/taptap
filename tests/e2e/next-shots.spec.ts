import { expect, test } from "@playwright/test";
import { hasE2eEnv, login } from "./helpers";

/** Review frames for the Next PR. Runs only when PHASE1_SCREENSHOT_DIR is set. */
const shots = process.env.PHASE1_SCREENSHOT_DIR;

test.describe("next review frames", () => {
  test.skip(!shots || !hasE2eEnv(), "set PHASE1_SCREENSHOT_DIR and E2E creds");
  test.beforeEach(({ browserName }, info) => {
    test.skip(browserName !== "chromium" || info.project.name !== "Mobile Chrome", "one run");
  });

  test("mobile 390x844: landing, card open, card screen, passport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `${shots}/next-landing.png` });

    // Guest taps a venue tag: card-open animation, then the settled card screen.
    await page.goto("/s/tcv-k9x2m4p8");
    const reveal = page.locator(".ui-reveal").first();
    await expect(reveal).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${shots}/next-cards-open.png` });
    await expect(page.getByTestId("postmark-seal")).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${shots}/next-station-or-card.png` });
    await page.screenshot({ path: `${shots}/next-cards-screen.png` });

    await login(page, "OWNER", "/passport");
    await expect(page.getByTestId("passport-section-b2b")).toBeVisible({ timeout: 20_000 });
    const done = page.getByTestId("guest-merge-done");
    if (await done.isVisible().catch(() => false)) await done.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${shots}/next-passport.png` });
  });

  test("desktop 1440x900: tenant dashboard and CRM as tenant owner", async ({ browser }) => {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
      baseURL: test.info().project.use.baseURL,
    });
    const page = await ctx.newPage();
    await login(page, "OWNER", "/b2b");
    await page.goto("/b2b");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${shots}/next-b2b-dashboard.png` });
    await page.goto("/b2b/visitors");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${shots}/next-crm.png` });
    await ctx.close();
  });
});
