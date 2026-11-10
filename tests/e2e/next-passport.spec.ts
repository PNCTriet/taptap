import { expect, test } from "@playwright/test";
import { hasE2eEnv, login, rest, tokenFor } from "./helpers";

/** Guest collects a B2B (tenant) stamp + a B2C stamp, signs in, and both show in the account passport. */
const B2B_CODE = "tt-democube002"; // Demo Toy Studio · Play Room A · "Puzzle Cube"
const B2C_CODE = "tcv-k9x2m4p8"; // Saigon Zoo · "Asian Elephant"

test.describe.configure({ mode: "serial", timeout: 120_000 });

test.beforeEach(({}, testInfo) => {
  test.skip(!hasE2eEnv(), "E2E demo credentials not configured");
  test.skip(testInfo.project.name !== (process.env.E2E_PROJECT ?? "Mobile Chrome"), "Mutating flow runs on one project");
});

async function resetOwnerStamps() {
  const owner = await tokenFor("OWNER");
  const mine = (await rest("rpc/my_passport_v2", { method: "POST", token: owner, body: "{}" })).json as { id: string; name: string }[];
  for (const s of mine.filter((x) => ["Puzzle Cube", "Asian Elephant"].includes(x.name))) {
    await rest(`collected_stamps?id=eq.${s.id}`, { method: "DELETE", token: owner });
  }
}

test("guest B2B stamp is merged into the account at sign-in and shows in the passport", async ({ page }) => {
  await resetOwnerStamps();
  await page.setViewportSize({ width: 390, height: 844 });
  const shots = process.env.PHASE1_SCREENSHOT_DIR;

  // 1. Guest taps a tenant (B2B) tag and a venue (B2C) tag.
  await page.goto(`/s/${B2B_CODE}`);
  await expect(page.getByTestId("postmark-seal")).toBeVisible({ timeout: 20_000 });
  await page.goto(`/s/${B2C_CODE}`);
  await expect(page.getByTestId("postmark-seal")).toBeVisible({ timeout: 20_000 });
  const cookies = await page.context().cookies();
  const guest = cookies.find((c) => c.name === "tt_guest");
  expect(guest?.httpOnly).toBe(true);

  // 2. Guest passport already shows the B2B stamp, labelled by tenant / room.
  await page.goto("/passport");
  const b2b = page.getByTestId("passport-b2b-stamp").filter({ hasText: "Puzzle Cube" });
  await expect(b2b).toBeVisible({ timeout: 20_000 });
  await expect(b2b.getByTestId("passport-b2b-origin")).toHaveText(/Demo Toy Studio/);

  // Tenant stations never enter the public catalog.
  const catalog = await (await page.request.get("/api/catalog")).json();
  expect(JSON.stringify(catalog)).not.toContain("Puzzle Cube");

  // 3. Sign in -> server-side merge from the httpOnly cookie.
  await login(page, "OWNER", "/passport");
  const notice = page.getByTestId("merge-notice");
  await expect(notice).toContainText(/Moved 2 guest stamps/, { timeout: 20_000 });
  if (shots) await page.screenshot({ path: `${shots}/next-merge-notice.png` });
  await expect(page.getByTestId("passport-b2b-stamp").filter({ hasText: "Puzzle Cube" })).toBeVisible();
  expect((await page.context().cookies()).some((c) => c.name === "tt_guest")).toBe(false);

  // Passport API (contract) has both sources.
  const body = (await (await page.request.get("/api/passport")).json()) as { stamps: { name: string; source: string; tenantName?: string; roomName?: string; venueName?: string }[] };
  expect(body.stamps.find((s) => s.name === "Puzzle Cube")).toMatchObject({ source: "b2b", tenantName: "Demo Toy Studio", roomName: "Play Room A" });
  expect(body.stamps.find((s) => s.name === "Asian Elephant")).toMatchObject({ source: "b2c" });

  // 4. Repeat merge is a no-op (idempotent); notice dismissed, mixed passport frame.
  const again = await (await page.request.post("/api/participant/merge")).json();
  expect(again).toMatchObject({ merged: 0, alreadyOwned: 0 });
  await page.getByTestId("merge-notice").getByRole("button").click();
  await page.reload();
  await expect(page.getByTestId("passport-b2b-stamp").first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("merge-notice")).toHaveCount(0);
  if (shots) await page.screenshot({ path: `${shots}/next-passport-mixed.png` });
});
