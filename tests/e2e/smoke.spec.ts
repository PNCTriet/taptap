import { expect, test } from "@playwright/test";

test.describe("TAPTAP Minimalist Explorer Smoke Suite", () => {
  test("renders Discover (/), Interactive GPS Map (/map), gates NFC Station (/s/tcv-k9x2m4p8) on Supabase Google OAuth Sign-In, and renders Health (/health)", async ({
    page,
  }) => {
    // 1. Discover Page
    await page.goto("/");
    await expect(page.getByText("TAPTAP").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Zoo Explorer" })
    ).toBeVisible();

    // 2. Interactive GPS Map Page (/map) + Demo Walk simulation
    await page.goto("/map");
    await expect(page.getByTestId("zoo-gps-map")).toBeVisible();
    const demoWalkBtn = page.getByTestId("gps-demo-walk-button");
    await expect(demoWalkBtn).toBeVisible();
    await demoWalkBtn.click();
    await expect(page.getByTestId("selected-station-distance")).toBeVisible();

    // 3. NFC Station Page — gates stamp collection behind pure Supabase Google OAuth Sign-In
    await page.goto("/s/tcv-k9x2m4p8");
    await expect(
      page.getByRole("heading", { name: "Asian Elephant" })
    ).toBeVisible();
    const googleBtn = page.getByTestId("google-signin-button");
    await expect(googleBtn).toBeVisible();

    // 4. Health Page
    await page.goto("/health");
    await expect(
      page.getByRole("heading", {
        name: /TAPTAP System & Environment Readiness/i,
      })
    ).toBeVisible();
  });
});
