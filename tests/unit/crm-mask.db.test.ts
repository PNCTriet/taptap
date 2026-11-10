/**
 * crm_activity masks visitor emails for tenant viewers, server-side.
 * Needs NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY and E2E_{OWNER,VIEWER}_{EMAIL,PASSWORD}; skipped otherwise.
 */
import { describe, expect, it } from "vitest";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ready = Boolean(URL_ && KEY && process.env.E2E_OWNER_EMAIL && process.env.E2E_VIEWER_EMAIL);

async function token(who: "OWNER" | "VIEWER") {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: KEY!, "content-type": "application/json" },
    body: JSON.stringify({ email: process.env[`E2E_${who}_EMAIL`], password: process.env[`E2E_${who}_PASSWORD`] }),
  });
  return ((await r.json()) as { access_token: string }).access_token;
}
async function tenantId(jwt: string) {
  const r = await fetch(`${URL_}/rest/v1/tenants?slug=eq.demo-toy-studio&select=id`, {
    headers: { apikey: KEY!, authorization: `Bearer ${jwt}` },
  });
  return ((await r.json()) as { id: string }[])[0]!.id;
}
type Person = { email: string | null; emailMasked?: boolean };
async function people(jwt: string, tenant: string) {
  const r = await fetch(`${URL_}/rest/v1/rpc/crm_activity`, {
    method: "POST",
    headers: { apikey: KEY!, authorization: `Bearer ${jwt}`, "content-type": "application/json" },
    body: JSON.stringify({ p_scope: "tenant", p_tenant: tenant, p_since: new Date(Date.now() - 30 * 864e5).toISOString(), p_participant: null }),
  });
  expect(r.status).toBe(200);
  return ((await r.json()) as { people: Person[] }).people;
}

describe.skipIf(!ready)("crm_activity viewer email masking (database)", () => {
  it("returns full emails to the owner and masked emails to the viewer", async () => {
    const [owner, viewer] = await Promise.all([token("OWNER"), token("VIEWER")]);
    const tenant = await tenantId(owner);
    const full = (await people(owner, tenant)).filter((p) => p.email);
    const masked = (await people(viewer, tenant)).filter((p) => p.email);
    expect(full.length).toBeGreaterThan(0);
    expect(full.some((p) => /^demo-visitor-\d+@example\.com$/.test(p.email!))).toBe(true);
    expect(full.every((p) => p.emailMasked !== true)).toBe(true);
    expect(masked.length).toBe(full.length);
    for (const p of masked) {
      expect(p.emailMasked).toBe(true);
      expect(p.email).toMatch(/^.\*\*\*@[^@]+$|^\*\*\*$/);
      expect(p.email).not.toMatch(/demo-visitor-\d+@/);
    }
  });
  it("viewer still cannot read the B2C or all-tenant scope", async () => {
    const viewer = await token("VIEWER");
    const r = await fetch(`${URL_}/rest/v1/rpc/crm_activity`, {
      method: "POST",
      headers: { apikey: KEY!, authorization: `Bearer ${viewer}`, "content-type": "application/json" },
      body: JSON.stringify({ p_scope: "all", p_tenant: null, p_since: new Date(Date.now() - 864e5).toISOString(), p_participant: null }),
    });
    expect(r.status).toBeGreaterThanOrEqual(400);
  });
});
