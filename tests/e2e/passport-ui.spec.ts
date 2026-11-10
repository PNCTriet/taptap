import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const outDir = path.resolve("test-results/passport-ui");

test.describe("passport UI mobile frames", () => {
  test.beforeEach(({ browserName }, testInfo) => {
    test.skip(
      browserName !== "chromium" || testInfo.project.name !== "Mobile Chrome",
      "one 390×844 chromium frame",
    );
  });

  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });

  test("passport shows mixed B2C and B2B demo stamps", async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });

    await page.goto("/passport");
    await expect(page.getByRole("heading", { name: "Passport" })).toBeVisible();
    await expect(page.getByTestId("passport-empty-b2c")).toHaveText("No stamps yet");
    await expect(page.getByTestId("passport-empty-b2b")).toHaveText("No stamps yet");

    await page.goto("/passport?mock=1");
    await expect(page.getByRole("heading", { name: "Passport" })).toBeVisible();
    await expect(page.getByText("Demo", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Explore" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Business" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Demo Cafe" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Demo Studio" })).toBeVisible();
    await expect(page.getByTestId("passport-business-badge").first()).toBeVisible();
    await expect(page.getByText(/HOWLSTUDIO/i)).toHaveCount(0);

    await page.getByRole("button", { name: "VI", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hộ chiếu");
    await expect(page.getByRole("heading", { name: "Khám phá" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Doanh nghiệp" })).toBeVisible();
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Passport");

    await page.getByRole("button", { name: "Demo Elephant" }).click();
    const sheet = page.getByTestId("passport-stamp-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Demo Zoo")).toBeVisible();
    await expect(sheet.getByText("Explore")).toBeVisible();
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(sheet).toHaveCount(0);

    await page.screenshot({
      path: path.join(outDir, "passport-mixed-390x844.png"),
      fullPage: false,
    });
  });

  test("guest merge stays quiet when nothing new was saved", async ({ page }) => {
    await page.route("**/api/participant/merge", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ merged: 0, alreadyOwned: 2 }),
      }),
    );
    const merged = page.waitForResponse("**/api/participant/merge");
    await page.goto("/explore?merged=1");
    expect((await merged).ok()).toBeTruthy();
    await expect(page.getByTestId("guest-merge-notice")).toHaveCount(0);
  });

  test("guest merge notice follows the merge response", async ({ page }) => {
    fs.mkdirSync(outDir, { recursive: true });

    await page.goto("/passport?mock=1&merged=1");
    const notice = page.getByTestId("guest-merge-notice");
    await expect(notice).toBeVisible();
    await expect(notice.getByRole("heading", { name: "3 stamps saved to your account" })).toBeVisible();
    await expect(page.getByTestId("guest-merge-reveal")).toHaveAttribute("data-state", "settled", {
      timeout: 8000,
    });
    await expect(notice.getByText("Demo", { exact: true })).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, "guest-merge-notice-390x844.png"),
      fullPage: false,
    });
  });

  test("guest merge notice uses the live merge response on the landing page", async ({ page }) => {
    await page.route("**/api/participant/merge", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ merged: 2, alreadyOwned: 1 }),
      }),
    );
    await page.goto("/profile?merged=1");
    await expect(
      page.getByRole("dialog", { name: "2 stamps saved to your account" }),
    ).toBeVisible();
  });
});
