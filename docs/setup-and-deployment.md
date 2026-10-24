# TAPTAP — Setup & Deployment Guide

## 1. Local Development Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```
2. **Create local environment file:**
   ```bash
   cp .env.example .env.local
   ```
3. **Run quality checks:**
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

---

## 2. Supabase Database & Type Generation Workflow

If you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed locally:

1. **Start local Supabase stack:**
   ```bash
   supabase start
   ```
   This automatically applies `supabase/migrations/20261024000000_phase0_initial_schema.sql` and seeds `supabase/seed.sql` (configured in `supabase/config.toml`).

2. **Reset database & re-run seed:**
   ```bash
   supabase db reset
   ```

3. **Regenerate TypeScript database types:**
   ```bash
   pnpm db:types
   ```
   This writes strongly typed definitions to `src/types/database.types.ts`.

---

## 3. Vercel Deployment Checklist (Preview & Production)

1. **Connect Repository:** Import the GitHub repository into Vercel with Framework Preset set to **Next.js**.
2. **Configure Environment Variables in Vercel Project Settings:**
   - `NEXT_PUBLIC_APP_URL` — Canonical URL (e.g., `https://taptap-preview.vercel.app`)
   - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (`https://<project-ref>.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase publishable key (`sb_publishable_...`) or legacy `anon` JWT
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase secret / service role key (Server-only; mark as Sensitive in Vercel)
3. **Verify Health Endpoint Post-Deploy:**
   - Visit `/health` or `GET /api/health` on the deployed URL to confirm `publicEnvConfigured: true`, `serverEnvConfigured: true`, and Supabase connectivity.
