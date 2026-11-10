import type { Page } from "@playwright/test";

/**
 * Demo credentials come from env (never committed):
 *   E2E_PLATFORM_ADMIN_EMAIL / _PASSWORD, E2E_OWNER_*, E2E_EDITOR_*, E2E_VIEWER_*, E2E_VISITOR_*
 * Supabase public URL + anon key: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export type Who = "PLATFORM_ADMIN" | "OWNER" | "EDITOR" | "VIEWER" | "VISITOR";

export function creds(who: Who) {
  const email = process.env[`E2E_${who}_EMAIL`];
  const password = process.env[`E2E_${who}_PASSWORD`];
  return email && password ? { email, password } : null;
}

export const hasE2eEnv = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
  (["PLATFORM_ADMIN", "OWNER", "EDITOR", "VIEWER", "VISITOR"] as Who[]).every((w) => creds(w));

const SB_URL = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_KEY = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function tokenFor(who: Who): Promise<string> {
  const c = creds(who)!;
  const res = await fetch(`${SB_URL()}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SB_KEY(), "content-type": "application/json" },
    body: JSON.stringify(c),
  });
  const body = (await res.json()) as { access_token: string };
  return body.access_token;
}

/** Direct PostgREST call (bypasses the Next.js API) to prove DB/RLS enforcement. */
export async function rest(path: string, init: RequestInit & { token?: string } = {}) {
  const { token, ...rest } = init;
  const res = await fetch(`${SB_URL()}/rest/v1/${path}`, {
    ...rest,
    headers: {
      apikey: SB_KEY(),
      authorization: `Bearer ${token ?? SB_KEY()}`,
      "content-type": "application/json",
      prefer: "return=representation",
      ...(rest.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { status: res.status, json };
}

export async function login(page: Page, who: Who, next = "/") {
  const c = creds(who)!;
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByTestId("login-email").fill(c.email);
  await page.getByTestId("login-password").fill(c.password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 20_000 });
}
