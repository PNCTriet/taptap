import { expect, test } from "@playwright/test";

test.describe("TAPTAP Minimalist Explorer Smoke Suite", () => {
  test("renders Discover (/), gates NFC Station (/s/tcv-k9x2m4p8) on Google Sign-In then auto-collects, and renders Health (/health)", async ({
    page,
  }) => {
    // 1. Discover Page
    await page.goto("/");
    await expect(page.getByText("TAPTAP").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Zoo Explorer" })).toBeVisible();

    // 2. NFC Station Page — shows Google sign-in prompt first, then auto-collects once signed in
    await page.goto("/s/tcv-k9x2m4p8");
    await expect(page.getByRole("heading", { name: "Asian Elephant" })).toBeVisible();
    const googleBtn = page.getByTestId("google-signin-button");
    await expect(googleBtn).toBeVisible();
    await googleBtn.click();
    await expect(page.getByText("STAMPED")).toBeVisible();

    // 3. Health Page
    await page.goto("/health");
    await expect(
      page.getByRole("heading", { name: /TAPTAP System & Environment Readiness/i })
    ).toBeVisible();
  });
});
