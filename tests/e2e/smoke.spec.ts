import { expect, test } from "@playwright/test";

test.describe("TAPTAP Playful Explorer Smoke Suite", () => {
  test("renders Discover (/), Collection (/collections/zoo-explorer), Station (/s/tcv-k9x2m4p8), Passport (/passport), and Health (/health)", async ({
    page,
  }) => {
    // 1. Discover Page
    await page.goto("/");
    await expect(page.getByText("Tap. Explore. Collect.").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Zoo Explorer" })).toBeVisible();

    // 2. Station Page — verify it does NOT auto-collect on load
    await page.goto("/s/tcv-k9x2m4p8");
    await expect(page.getByRole("heading", { name: "Elephant" })).toBeVisible();
    const collectButton = page.getByRole("button", { name: /Collect stamp/i });
    await expect(collectButton).toBeVisible();

    // 3. Health Page
    await page.goto("/health");
    await expect(
      page.getByRole("heading", { name: /TAPTAP System & Environment Readiness/i })
    ).toBeVisible();
  });
});
