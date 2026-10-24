# TAPTAP — Security & Row Level Security (RLS)

## 1. Mandatory Security Boundaries

1. **RLS Enabled Everywhere:** Every table in `public` (`venues`, `venue_admins`, `collections`, `stations`, `nfc_tags`, `stamps`, `participants`, `collected_stamps`, `badges`, `participant_badges`, `rewards`, `redemptions`) has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
2. **Server-Only Service Role:** `SUPABASE_SERVICE_ROLE_KEY` is validated only in `src/lib/env.ts` (`getServerEnv()`) and consumed exclusively in `src/lib/supabase/admin.ts`, which imports `'server-only'` at line 1 so Next.js fails the build immediately if a client component ever attempts to import it.
3. **Never Trust `user_metadata` for Authorization:** In Supabase Auth, `raw_user_meta_data` (`user_metadata`) can be modified by the client via `supabase.auth.updateUser()`. TAPTAP RLS functions (`public.is_platform_admin()` and `public.is_venue_admin()`) inspect **only** `auth.jwt() -> 'app_metadata'` and the server-managed `public.venue_admins` table.
4. **Server-Validated Stamp & Redemption Writes:** Visitors cannot arbitrarily `INSERT` rows into `collected_stamps`, `participant_badges`, or `redemptions` from the browser client. Stamp collection and reward issuance go through server-side validation that verifies tag status (`nfc_tags.status = 'active'`), station status (`stations.status = 'active'`), and collection completion criteria.

---

## 2. Roles Overview

| Role | Identification | Scope |
| :--- | :--- | :--- |
| **Visitor** (`anon` / `authenticated`) | Public visitor or Supabase Anonymous Auth (`auth.uid()`) | Read active venues, collections, stations, stamps, badges, rewards. Read/update own `participants` row. Read own `collected_stamps`, `participant_badges`, `redemptions`. |
| **Venue Admin** (`authenticated`) | Row in `public.venue_admins` for `venue_id` OR `app_metadata.venue_ids ? venue_id` | Full read/write management of collections, stations, NFC tags, stamps, badges, and rewards belonging to their assigned `venue_id`. Can inspect and mark `redemptions` as `redeemed` for their venue. |
| **Platform Admin** (`authenticated`) | `auth.jwt() -> 'app_metadata' ->> 'role' = 'platform_admin'` | Full CRUD across all venues, `venue_admins`, and platform tables. |

---

## 3. RLS Policy Matrix by Table

| Table | `SELECT` | `INSERT` | `UPDATE` | `DELETE` |
| :--- | :--- | :--- | :--- | :--- |
| `venues` | Active (`anon`/`auth`) or Venue/Platform Admin | Platform Admin | Venue/Platform Admin | Platform Admin |
| `venue_admins` | Own row or Platform Admin | Platform Admin | Platform Admin | Platform Admin |
| `collections` | Active (`anon`/`auth`) or Venue/Platform Admin | Venue/Platform Admin | Venue/Platform Admin | Venue/Platform Admin |
| `stations` | Active/Maintenance or Venue/Platform Admin | Venue/Platform Admin | Venue/Platform Admin | Venue/Platform Admin |
| `nfc_tags` | Active or Venue/Platform Admin | Venue/Platform Admin | Venue/Platform Admin | Venue/Platform Admin |
| `stamps` | Active or Venue/Platform Admin | Venue/Platform Admin | Venue/Platform Admin | Venue/Platform Admin |
| `participants` | Own (`auth_user_id = auth.uid()`) or Platform Admin | Own (`auth_user_id = auth.uid()`) or Platform Admin | Own (`auth_user_id = auth.uid()`) or Platform Admin | Platform Admin |
| `collected_stamps` | Own participant or Venue/Platform Admin | Server (`service_role`) or Venue/Platform Admin | Denied (Immutable) | Platform Admin |
| `badges` | Active collection or Venue/Platform Admin | Venue/Platform Admin | Venue/Platform Admin | Venue/Platform Admin |
| `participant_badges` | Own participant or Venue/Platform Admin | Server (`service_role`) or Platform Admin | Denied (Immutable) | Platform Admin |
| `rewards` | Active or Venue/Platform Admin | Venue/Platform Admin | Venue/Platform Admin | Venue/Platform Admin |
| `redemptions` | Own participant or Venue/Platform Admin | Server (`service_role`) or Platform Admin | Venue/Platform Admin | Platform Admin |
