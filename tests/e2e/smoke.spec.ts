import { expect, test } from "@playwright/test";

test.describe("TAPTAP Minimalist Explorer Smoke Suite", () => {
  test("renders Discover (/), auto-collects on NFC Station (/s/tcv-k9x2m4p8), and renders Health (/health)", async ({
    page,
  }) => {
    // 1. Discover Page
    await page.goto("/");
    await expect(page.getByText("TAPTAP").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Zoo Explorer" })).toBeVisible();

    // 2. NFC Station Page — auto-collects on visit with stamp animation
    await page.goto("/s/tcv-k9x2m4p8");
    await expect(page.getByRole("heading", { name: "Asian Elephant" })).toBeVisible();
    await expect(page.getByText("STAMPED")).toBeVisible();

    // 3. Health Page
    await page.goto("/health");
    await expect(
      page.getByRole("heading", { name: /TAPTAP System & Environment Readiness/i })
    ).toBeVisible();
  });
});
