import { expect, test } from "@playwright/test";

test.describe("Saigon Zoo Stamp Rally MVP Smoke Flow", () => {
  test("renders bilingual home, gates station tap behind Instant Gmail login, and updates passport", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Saigon Zoo Stamp Rally/i })
    ).toBeVisible();

    await page.goto("/s/tcv-main-gate");
    await expect(
      page.getByRole("heading", { name: /Main Heritage Arch/i })
    ).toBeVisible();

    const googleBtn = page.getByTestId("google-signin-button");
    await expect(googleBtn).toBeVisible();
    await googleBtn.click();

    const quickGmailBtn = page.getByTestId("gmail-quick-signin-button");
    await expect(quickGmailBtn).toBeVisible();
    await quickGmailBtn.click();

    await expect(page.getByText("STAMPED")).toBeVisible();

    await page.goto("/passport");
    await expect(page.getByText("1/4")).toBeVisible();
  });
});
