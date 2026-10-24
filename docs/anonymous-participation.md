# TAPTAP — Anonymous Participation & Account Linking Strategy

## 1. Core UX Requirement

Visitors walking through a venue (such as Saigon Zoo and Botanical Gardens) must be able to tap their first NFC tag (`/s/tcv-k9x2m4p8`) and immediately collect their first stamp **without hitting a sign-up wall, email verification, or OAuth redirect**. Later, if they wish to back up their passport across devices, they can optionally link an email, phone, or social account without losing any collected stamps.

---

## 2. Comparison of Persistence Approaches

| Dimension | Option A: Supabase Anonymous Sign-In (`signInAnonymously()`) | Option B: Custom Signed HTTP-Only Guest Cookie (`guest_token_hash`) |
| :--- | :--- | :--- |
| **How it works** | Creates an authenticated JWT with `is_anonymous: true` stored in HTTP-only SSR cookies via `@supabase/ssr`. | Server generates a random 256-bit token, sets an HTTP-only cookie, and stores `sha256(token)` in `participants.guest_token_hash`. |
| **RLS Integration** | Native `auth.uid()` works identically for anonymous and permanent users. | Requires custom Postgres session variables or bypassing RLS via service-role on every read/write. |
| **Account Upgrade** | Built-in `supabase.auth.updateUser({ email })` or `linkIdentity()` preserves the exact `auth.uid()` and `participants.id`. | Requires custom server-side merge transaction to migrate `collected_stamps` when a user signs in. |
| **Offline / Demo Preview** | Requires live Supabase project connection. | Can pair with local browser storage fallback during zero-credential UI previews. |

---

## 3. Recommended Strategy for TAPTAP

TAPTAP uses a **Unified Participant Session Architecture** that combines **Supabase Anonymous Auth** as the primary production mechanism with a **Guest Token / Local Session Fallback** for zero-credential preview environments:

1. **First Tap on `/s/[code]` (Production with Supabase Configured):**
   - When the visitor taps **"Collect stamp"** and has no active session, the app calls `supabase.auth.signInAnonymously()` (enabled via `enable_anonymous_sign_ins = true` in `supabase/config.toml`).
   - A `participants` row is created with `auth_user_id = auth.uid()`.
   - Because the session is persisted in HTTP-only cookies via `@supabase/ssr`, all subsequent visits to `/s/[other-code]`, `/passport`, and `/rewards/[id]` automatically recognize the visitor and enforce RLS via `auth_user_id = auth.uid()`.

2. **Seamless Account Upgrade (Saving Progress Across Devices):**
   - On `/profile`, the visitor can link an email/OAuth identity via `supabase.auth.updateUser()` / `supabase.auth.linkIdentity()`.
   - Because `auth.uid()` remains unchanged when an anonymous user upgrades to a permanent user in Supabase Auth, **zero data migration is required**—all rows in `collected_stamps`, `participant_badges`, and `redemptions` remain attached to the same `participant_id`.

3. **Phase 0 / UI Preview Mode Fallback:**
   - When running in local/preview environments without live Supabase credentials, the client-side `ExplorerProvider` (`src/context/explorer-context.tsx`) maintains an isolated participant session in `localStorage` (`taptap_explorer_state_v1`) seeded with the Saigon Zoo *"Zoo Explorer"* dataset so every route (`/`, `/collections/[slug]`, `/s/[code]`, `/passport`, `/rewards/[id]`, `/profile`) is fully interactive and testable.
