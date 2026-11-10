import { expect, test } from "@playwright/test";

/** Google sign-in starts at Supabase, lands on accounts.google.com, and returns via /auth/callback. Read-only. */
test("Google OAuth start redirects to accounts.google.com with /auth/callback as the return", async ({ page, baseURL }) => {
  test.skip(test.info().project.name !== "Mobile Chrome", "one run");
  let authorizeUrl: URL | null = null;
  page.on("request", (req) => {
    const u = new URL(req.url());
    if (u.pathname.endsWith("/auth/v1/authorize")) authorizeUrl = u;
  });
  await page.route("https://accounts.google.com/**", (route) => route.fulfill({ status: 200, body: "google" }));
  await page.goto("/passport");
  const google = page.getByRole("button", { name: /Google/i }).first();
  await expect(google).toBeVisible({ timeout: 20_000 });
  const toGoogle = page.waitForRequest((r) => r.url().startsWith("https://accounts.google.com/"), { timeout: 20_000 });
  await google.click();
  const g = new URL((await toGoogle).url());
  expect(g.searchParams.get("redirect_uri")).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co\/auth\/v1\/callback$/);
  expect(authorizeUrl).not.toBeNull();
  const redirectTo = new URL(authorizeUrl!.searchParams.get("redirect_to")!);
  expect(redirectTo.origin).toBe(new URL(baseURL!).origin);
  expect(redirectTo.pathname).toBe("/auth/callback");
  expect(redirectTo.searchParams.get("next")).toBe("/passport");
});
