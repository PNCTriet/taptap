import { expect, test, type Page } from "@playwright/test";
import { hasE2eEnv, login, rest, tokenFor } from "./helpers";

/**
 * Phase 1 acceptance happy paths (docs/MVP_PLAN_B2C_B2B.md §1.6 / §2.6).
 * Runs against the real Supabase project with demo accounts supplied via env.
 * Mutating flows run once (first mobile project) and clean up after themselves.
 */
const DEMO_STARTER_TENANT = "94c09d20-0ba9-4839-a968-0f0ec6ab9dbe"; // "Demo Starter Space" (Starter: 1 room)
const DEMO_GROWTH_TENANT = "79b5ad68-79e8-47ae-80a6-15ecd2a1f67d"; // "Demo Toy Studio" (Growth)

test.describe.configure({ mode: "serial", timeout: 120_000 });

test.beforeEach(({}, testInfo) => {
  test.skip(!hasE2eEnv(), "E2E demo credentials not configured");
  test.skip(
    testInfo.project.name !== (process.env.E2E_PROJECT ?? "Mobile Chrome"),
    "Mutating acceptance flow runs on a single project"
  );
});

async function createInCms(page: Page, section: string, fill: (form: ReturnType<Page["getByTestId"]>) => Promise<void>) {
  await page.goto(`/admin/${section}`);
  await page.getByTestId(`${section}-new`).click();
  const form = page.getByTestId(`${section}-form`);
  await fill(form);
  await page.getByTestId(`${section}-save`).click();
  await expect(page.getByTestId(`${section}-notice`)).toBeVisible();
}

async function selectWhenLoaded(form: ReturnType<Page["getByTestId"]>, name: string, label: string) {
  const select = form.locator(`select[name="${name}"]`);
  await expect(select.locator("option", { hasText: label })).toHaveCount(1);
  await select.selectOption({ label });
}

test.describe("B2C: CMS → NFC tag → collect once → passport", () => {
  const stamp = Date.now().toString(36);
  const venueName = `E2E Venue ${stamp}`;
  const venueSlug = `e2e-venue-${stamp}`;
  const collectionName = `E2E Trail ${stamp}`;
  const stationName = `E2E Station ${stamp}`;
  const code = `tcv-e2e${stamp}`.slice(0, 24);

  test.afterAll(async () => {
    if (!hasE2eEnv()) return;
    const admin = await tokenFor("PLATFORM_ADMIN");
    await rest(`venues?slug=eq.${venueSlug}`, { method: "DELETE", token: admin });
  });

  test("platform admin builds a trail and a visitor collects it exactly once", async ({ page, browser }) => {
    await login(page, "PLATFORM_ADMIN", "/admin");
    await expect(page.getByTestId("open-player-cta")).toBeVisible();

    await createInCms(page, "venues", async (form) => {
      await form.locator('input[name="name"]').fill(venueName);
      await form.locator('input[name="slug"]').fill(venueSlug);
    });
    await createInCms(page, "collections", async (form) => {
      await selectWhenLoaded(form, "venue_id", venueName);
      await form.locator('input[name="name"]').fill(collectionName);
      await form.locator('input[name="slug"]').fill(`e2e-trail-${stamp}`);
    });
    await createInCms(page, "stations", async (form) => {
      await selectWhenLoaded(form, "venue_id", venueName);
      await form.locator('input[name="name"]').fill(stationName);
      await form.locator('input[name="slug"]').fill(`e2e-station-${stamp}`);
    });
    await createInCms(page, "stamps", async (form) => {
      await selectWhenLoaded(form, "collection_id", collectionName);
      await selectWhenLoaded(form, "station_id", stationName);
      await form.locator('input[name="name"]').fill(`${stationName} stamp`);
    });
    await createInCms(page, "tags", async (form) => {
      await selectWhenLoaded(form, "station_id", stationName);
      await form.locator('input[name="public_code"]').fill(code);
    });
    // CMS → player CTA for this tag
    await expect(page.locator(`a[href$="/s/${code}"]`).first()).toBeVisible();

    const admin = await tokenFor("PLATFORM_ADMIN");
    const st = await rest(`stations?slug=eq.e2e-station-${stamp}&select=id`, { token: admin });
    const stationId = (st.json as { id: string }[])[0]!.id;

    // Visitor (separate browser context) taps the tag.
    const ctx = await browser.newContext({ ...test.info().project.use });
    const visitor = await ctx.newPage();
    await login(visitor, "VISITOR", `/s/${code}`);
    await expect(visitor).toHaveURL(new RegExp(`/s/${code}`));
    await expect(visitor.getByTestId("postmark-seal")).toBeVisible({ timeout: 20_000 });

    // Second collect is idempotent (exactly once per participant).
    const again = await visitor.request.post("/api/collect", { data: { code, source: "nfc" } });
    expect(again.status()).toBe(200);
    const againBody = await again.json();
    expect(againBody.newly_collected ?? againBody.newlyCollected).toBe(false);

    const vtoken = await tokenFor("VISITOR");
    const rows = await rest(`collected_stamps?station_id=eq.${stationId}&select=id`, { token: vtoken });
    expect((rows.json as unknown[]).length).toBe(1);

    // Passport shows the just-collected stamp.
    await visitor.goto("/passport");
    await expect(visitor.getByTestId(`stamp-card-${stationId}`)).toHaveAttribute("data-state", "collected", { timeout: 20_000 });
    await ctx.close();
  });

  test("RLS: a visitor cannot create or edit stations", async () => {
    const vtoken = await tokenFor("VISITOR");
    const venues = await rest(`venues?select=id&tenant_id=is.null&limit=1`, { token: vtoken });
    const venueId = (venues.json as { id: string }[])[0]!.id;
    const ins = await rest("stations", {
      method: "POST",
      token: vtoken,
      body: JSON.stringify({ venue_id: venueId, name: "hack", slug: `hack-${Date.now()}` }),
    });
    expect(ins.status).toBeGreaterThanOrEqual(400);
    const upd = await rest(`stations?venue_id=eq.${venueId}`, {
      method: "PATCH",
      token: vtoken,
      body: JSON.stringify({ name: "hacked" }),
    });
    // RLS filters the update to zero rows.
    expect(upd.status === 200 ? (upd.json as unknown[]).length : 0).toBe(0);
  });
});

test.describe("B2B: platform admin, tenant quota, roles, isolation", () => {
  const stamp = Date.now().toString(36);
  const tenantSlug = `e2e-tenant-${stamp}`;
  const pkgCode = `e2e-${stamp}`;

  test.afterAll(async () => {
    if (!hasE2eEnv()) return;
    const admin = await tokenFor("PLATFORM_ADMIN");
    await rest(`tenants?slug=eq.${tenantSlug}`, { method: "DELETE", token: admin });
    await rest(`subscription_packages?code=eq.${pkgCode}`, { method: "DELETE", token: admin });
  });

  test("platform admin creates a package and a tenant with an owner", async ({ page }) => {
    await login(page, "PLATFORM_ADMIN", "/admin/b2b/packages");
    await page.getByTestId("pkg-new").click();
    await page.getByTestId("pkg-code").fill(pkgCode);
    await page.getByTestId("pkg-name").fill(`E2E ${stamp}`);
    await page.getByTestId("pkg-maxRooms").fill("2");
    await page.getByTestId("pkg-maxStations").fill("4");
    await page.getByTestId("pkg-maxMembers").fill("3");
    await page.getByTestId("pkg-maxActiveNfcTags").fill("4");
    await page.getByTestId("pkg-save").click();
    await expect(page.getByTestId("pkg-msg")).toBeVisible();
    await expect(page.getByTestId("pkg-row").filter({ hasText: `E2E ${stamp}` })).toBeVisible();

    await page.goto("/admin/b2b/tenants");
    await page.getByTestId("tenant-new").click();
    await page.getByTestId("tenant-name").fill(`E2E Tenant ${stamp}`);
    await page.getByTestId("tenant-slug").fill(tenantSlug);
    await page.getByTestId("tenant-package").selectOption({ value: pkgCode });
    await page.getByTestId("tenant-owner").fill(process.env.E2E_EDITOR_EMAIL!);
    await page.getByTestId("tenant-save").click();
    await expect(page.getByTestId("tenant-msg")).toBeVisible();
    await expect(page.getByTestId("tenant-row").filter({ hasText: `E2E Tenant ${stamp}` })).toBeVisible();
  });

  test("owner creates a room within quota; the next one is blocked by the server", async ({ page }) => {
    const owner = await tokenFor("OWNER");
    // Reset the Starter demo tenant to 0 rooms.
    const rooms = await rest(`rooms?tenant_id=eq.${DEMO_STARTER_TENANT}&select=id`, { token: owner });
    for (const r of rooms.json as { id: string }[]) {
      await rest("rpc/tenant_delete_room", { method: "POST", token: owner, body: JSON.stringify({ p_room: r.id }) });
    }

    await login(page, "OWNER", "/b2b/rooms?tenant=demo-starter-space");
    await expect(page.getByTestId("rooms-usage")).toHaveText(/0\s*\/\s*1/);
    await page.getByTestId("room-name").fill("E2E Room 1");
    await page.getByTestId("room-create").click();
    await expect(page.getByTestId("room-row")).toHaveCount(1);
    await expect(page.getByTestId("rooms-usage")).toHaveText(/1\s*\/\s*1/);

    await page.waitForLoadState("networkidle");
    await page.getByTestId("room-name").fill("E2E Room 2");
    await expect(page.getByTestId("room-name")).toHaveValue("E2E Room 2");
    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/b2b/create-room")),
      // Submit with Enter: on previews the Vercel toolbar can overlay the button.
      page.getByTestId("room-name").press("Enter"),
    ]);
    expect(resp.status()).toBe(409);
    expect((await resp.json()).code).toBe("QUOTA_EXCEEDED");
    await expect(page.getByTestId("rooms-msg")).toContainText(/limit|hạn mức/i);
    await expect(page.getByTestId("room-row")).toHaveCount(1);

    // Database rejects it too, even bypassing the Next.js API.
    const direct = await rest("rpc/tenant_create_room", {
      method: "POST",
      token: owner,
      body: JSON.stringify({ p_tenant: DEMO_STARTER_TENANT, p_name: "Bypass", p_description: null }),
    });
    expect(direct.status).toBe(400);
    expect(JSON.stringify(direct.json)).toContain("QUOTA_EXCEEDED:rooms:1/1");
  });

  test("tenant dashboard shows used/max for rooms, stations, members, tags", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, "OWNER", "/b2b?tenant=demo-toy-studio");
    for (const r of ["rooms", "stations", "members", "active_nfc_tags"]) {
      await expect(page.getByTestId(`quota-${r}-value`)).toHaveText(/\d+\s*\/\s*\d+/);
    }
    const dir = process.env.PHASE1_SCREENSHOT_DIR;
    if (dir) await page.screenshot({ path: `${dir}/b2b-dashboard-390x844.png`, fullPage: false });
  });

  test("editor cannot invite or create rooms; viewer is read-only", async ({ page }) => {
    const editor = await tokenFor("EDITOR");
    const invite = await rest("rpc/tenant_invite_member", {
      method: "POST",
      token: editor,
      body: JSON.stringify({ p_tenant: DEMO_GROWTH_TENANT, p_email: "nobody@example.com", p_role: "viewer" }),
    });
    expect(invite.status).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(invite.json)).toContain("FORBIDDEN");

    const viewer = await tokenFor("VIEWER");
    const st = await rest("rpc/tenant_create_station", {
      method: "POST",
      token: viewer,
      body: JSON.stringify({ p_tenant: DEMO_GROWTH_TENANT, p_room: null, p_name: "nope", p_description: null }),
    });
    expect(JSON.stringify(st.json)).toContain("FORBIDDEN");
    const rawInsert = await rest("rooms", {
      method: "POST",
      token: viewer,
      body: JSON.stringify({ tenant_id: DEMO_GROWTH_TENANT, name: "x", slug: `x-${Date.now()}` }),
    });
    expect(rawInsert.status).toBeGreaterThanOrEqual(400);

    await login(page, "VIEWER", "/b2b/rooms?tenant=demo-toy-studio");
    await expect(page.getByTestId("tenant-role")).toHaveText(/viewer/i);
    await expect(page.getByTestId("room-row").first()).toBeVisible();
    await expect(page.getByTestId("room-create")).toHaveCount(0);
    await expect(page.getByTestId("room-delete")).toHaveCount(0);

    await page.goto("/b2b/members?tenant=demo-toy-studio");
    await expect(page.getByTestId("invite-submit")).toHaveCount(0);
  });

  test("tenant stations and tags never appear in the public B2C catalog", async ({ request }) => {
    const anonStations = await rest("stations?select=id&tenant_id=not.is.null");
    expect(anonStations.json).toEqual([]);
    const anonTags = await rest("nfc_tags?select=id&tenant_id=not.is.null");
    expect(anonTags.json).toEqual([]);
    const catalog = await (await request.get("/api/catalog")).json();
    const names = (catalog.stations as { name: { en: string } | string }[]).map((s) => JSON.stringify(s.name));
    expect(names.join(" ")).not.toContain("Robot Racer");
    expect(names.join(" ")).not.toContain("Puzzle Cube");
  });
});
