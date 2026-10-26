# TAPTAP

**Tap. Explore. Collect.**  
*NFC-powered digital stamp collection platform by TAPTAP.*

TAPTAP is a mobile-first web application that turns physical venues into interactive explorer trails. Visitors tap NFC checkpoints or scan QR codes at physical stations (`https://<APP_DOMAIN>/s/<PUBLIC_CODE>`) using their phone's native browser—no native app install or Web NFC API required—to collect tactile digital passport stamps, unlock badges, and redeem venue rewards.

- **Initial Pilot Demo Dataset:** Saigon Zoo and Botanical Gardens (*Thảo Cầm Viên Sài Gòn*) — *"Zoo Explorer"* collection (`Elephant`, `Giraffe`, `Flamingo`, `Botanical Conservatory`).
- **Design System:** **Playful Explorer** — tactile passport aesthetic (`#FFF8EB` Paper Cream, `#176B61` Explorer Teal, `#F07861` Adventure Coral, `#F2C653` Sunshine Yellow, `#4D73CF` Discovery Blue) built on clean Apple HIG mobile ergonomics with full **EN / VI** bilingual support (English default).

---

## Quickstart

### 1. Prerequisites
- **Node.js** `>= 20`
- **pnpm** `>= 9` (`corepack enable`)
- **Supabase CLI** (optional for local database migration/seed testing)

### 2. Install & Configure
```bash
pnpm install
cp .env.example .env.local
```

> **Zero-Credential Preview Mode:** In Phase 0 / UI Preview mode, TAPTAP runs out-of-the-box even before live Supabase credentials are configured. The app automatically falls back to the deterministic Saigon Zoo *"Zoo Explorer"* seed dataset and clearly labels demo data in the UI and `/health` diagnostics.

### 3. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## Key Routes

| Route | Purpose |
| :--- | :--- |
| `/` | **Discover** — Featured *Zoo Explorer* hero, active collections, live progress, EN/VI switcher |
| `/collections/[slug]` | **Collection Detail** — Trail overview (`zoo-explorer`), live progress bar, station checklist |
| `/s/[code]` | **Station NFC/QR Landing** — Direct entry from physical tag (`/s/tcv-k9x2m4p8`), explicit *"Collect stamp"* action, ink-stamp animation |
| `/passport` | **Personal Passport** — Collected stamps with cancellation marks, missing slots, badges, and rewards |
| `/rewards/[id]` | **Reward Detail & Redemption** — Eligibility verification, confirmation step, and redemption code |
| `/profile` | **Explorer Profile** — EN/VI language preference, anonymous/linked session status, demo reset |
| `/admin` | **Admin Console** — Manage Venues, Collections, Stations, Stamps, Rewards, NFC URLs & SVG QR downloads |
| `/health` & `/api/health` | **System Readiness** — Environment variable validation & Supabase connection status |

---

## NPM / PNPM Scripts

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start Next.js development server |
| `pnpm build` | Build production bundle |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint across the repository |
| `pnpm typecheck` | Run TypeScript compiler (`tsc --noEmit`) with strict checks |
| `pnpm test` | Run Vitest unit test suite |
| `pnpm test:watch` | Run Vitest in interactive watch mode |
| `pnpm test:e2e` | Run Playwright end-to-end smoke tests |
| `pnpm db:types` | Generate TypeScript definitions from local Supabase (`supabase gen types typescript --local > src/types/database.types.ts`) |

---

## Documentation Index

- [`docs/architecture.md`](./docs/architecture.md) — System architecture, separation of `stations` vs `nfc_tags`, unified NFC/QR URLs, physical presence considerations, and Swift/SwiftUI iOS readiness.
- [`docs/data-model.md`](./docs/data-model.md) — Entity-Relationship overview, all 11 core tables + `venue_admins`, status enums, and foreign key deletion rules.
- [`docs/anonymous-participation.md`](./docs/anonymous-participation.md) — Frictionless anonymous participation strategy, Supabase Anonymous Auth vs signed guest tokens, and account linking.
- [`docs/security-and-rls.md`](./docs/security-and-rls.md) — Role definitions (`Visitor`, `Venue admin`, `Platform admin`), least-privilege RLS matrix, and `server-only` boundaries.
- [`docs/setup-and-deployment.md`](./docs/setup-and-deployment.md) — Local setup, Supabase migration/seed workflow, and Vercel preview/production deployment guide.
