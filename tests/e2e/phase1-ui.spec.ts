import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const outDir = path.resolve(process.env.PHASE1_SCREENSHOT_DIR ?? "test-results/phase1");

test.describe("phase 1 mobile frames", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "390×844 frames use chromium");

  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });

  test("landing keeps both paths in view and captures B2C frames", async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });

    await page.goto("/");
    const player = page.getByTestId("landing-player-cta");
    const business = page.getByTestId("landing-business-cta");
    await expect(player).toBeVisible();
    await expect(business).toBeVisible();
    await expect(player).toBeInViewport();
    await expect(business).toBeInViewport();
    await expect(page.getByTestId("landing-demo-card")).toHaveAttribute("data-state", "settled", {
      timeout: 8000,
    });
    await expect(page.getByText("Demo", { exact: true }).first()).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, "landing-390x844.png"),
      fullPage: false,
    });

    await page.getByRole("button", { name: "VI", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chạm. Sưu tầm.");
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Tap. Collect.");

    await page.goto("/explore");
    await expect(page.getByRole("heading", { name: "Zoo Explorer" })).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, "b2c-explore-390x844.png"),
      fullPage: false,
    });

    await page.goto("/s/tcv-k9x2m4p8");
    await expect(page.getByRole("heading", { name: "Asian Elephant" })).toBeVisible();
    await expect(page.getByTestId("google-signin-button")).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, "b2c-station-390x844.png"),
      fullPage: false,
    });
  });

  test("reduced motion skips the reveal", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByTestId("landing-demo-card")).toHaveAttribute("data-state", "settled");
    await expect(page.getByTestId("landing-player-cta")).toBeInViewport();
    await expect(page.getByTestId("landing-business-cta")).toBeInViewport();
  });
});
