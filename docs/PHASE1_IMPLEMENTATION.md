# Phase 1 — implementation notes (B2C + B2B one-repo MVP)

Scope: `docs/MVP_PLAN_B2C_B2B.md` §4 Phase 1. Acceptance: §1.6 (B2C) and §2.6 (B2B).

## Routes

| Area | Route | Who |
| --- | --- | --- |
| Player (B2C + B2B end users) | `/s/<code>`, `/passport`, `/map`, `/rewards` | everyone (collect needs sign-in) |
| Sign in | `/login` (Google + demo email/password) | everyone |
| B2C CMS | `/admin`, `/admin/venues`, `/admin/collections`, `/admin/stations`, `/admin/stamps`, `/admin/tags`, `/admin/rewards` | platform admin |
| B2B platform admin | `/admin/b2b`, `/admin/b2b/packages`, `/admin/b2b/tenants`, `/admin/b2b/tenants/<id>` | platform admin |
| Tenant site | `/b2b?tenant=<slug>`, `/b2b/rooms`, `/b2b/rooms/<id>`, `/b2b/stations`, `/b2b/members`, `/b2b/plan` | tenant owner/admin/editor/viewer |
| APIs | `POST /api/collect`, `GET /api/passport`, `GET /api/catalog`, `GET /api/me`, `POST /api/b2b/<action>` | session-scoped |

Platform admin = `auth.users.raw_app_meta_data.platform_role = 'platform_admin'` (checked by `is_platform_admin()`
from the JWT and by the server guard via `getUser()`). JWT claims refresh on the next token refresh, so a user
who is newly promoted should sign out/in once. The Google OAuth flow (`/auth/callback`) is unchanged.

## Migrations (additive only)

1. `20261110120000_phase1_b2b_multitenancy.sql` — new tables `subscription_packages`, `tenants`,
   `tenant_subscriptions`, `tenant_members`, `tenant_invitations`, `rooms`; nullable `tenant_id` on
   `venues/collections/stations/stamps/nfc_tags` and nullable `stations.room_id`. Existing B2C rows keep
   `tenant_id = null`. RLS enabled on every new table. Restrictive `*_tenant_isolation` SELECT policies make
   tenant rows visible only to tenant members / platform admin, so they never leak into the public B2C catalog.
2. `20261110120100_phase1_rpcs.sql` — SECURITY DEFINER RPCs with internal role checks (`platform_*`, `tenant_*`,
   `resolve_public_tag`, `collect_stamp_by_code`, `my_passport`, `accept_my_invitations`). Tenant writes go only
   through these RPCs; no service-role key is used by the app.
3. `20261110120200_phase1_seed_packages.sql` — Starter 1/10/3/10, Growth 5/50/10/50, Pro 20/200/50/200
   (rooms / stations / members / active NFC tags).

Demo data (clearly labelled demo, no partner claims): `supabase/seed/phase1_demo_seed.sql`.
Demo account credentials are kept outside the repo.

## Quota

* Authoritative: `BEFORE INSERT/UPDATE` triggers (`enforce_quota_*`) take a per-tenant advisory lock, compare
  usage with `tenant_effective_limits()` (package + `quota_overrides`; suspended tenant or no active
  subscription ⇒ 0) and raise `QUOTA_EXCEEDED:<resource>:<used>/<max>`. Members quota counts members + pending
  invitations; tag quota counts active tags only.
* API: `/api/b2b/<action>` pre-checks with `tenant_usage()` and maps DB errors to HTTP 409 with an EN/VI message
  (`src/server/quota/errors.ts`). Pure rules live in `src/server/quota/quota.ts` (Vitest).

## Roles

Owner/Admin: rooms, stations, tags, members (Admin cannot grant Owner). Editor: stations + tags only.
Viewer: read-only. Last owner cannot be removed/demoted.

## Tests

* `pnpm test` — Vitest (quota rules, error mapping, action validation).
* `tests/e2e/phase1.spec.ts` — Playwright acceptance against a real Supabase project. Needs
  `E2E_{PLATFORM_ADMIN,OWNER,EDITOR,VIEWER,VISITOR}_{EMAIL,PASSWORD}` in env; skipped otherwise.
  Creates its own data and deletes it afterwards. Run e.g.
  `PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test tests/e2e/phase1.spec.ts --project="Mobile Chrome"`.
