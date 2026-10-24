# TAPTAP — System Architecture

## 1. Architectural Principles

1. **Zero-Friction Mobile Web First:** Visitors interact with physical checkpoints by tapping an NDEF-formatted NFC tag or scanning a fallback QR code. Both resolve to a standard HTTPS URL (`https://<APP_DOMAIN>/s/<PUBLIC_CODE>`) handled natively by iOS Safari and Android Chrome—without requiring a native app download or the browser Web NFC API (which is unavailable on iOS Safari).
2. **Strict Separation of Stations and NFC Hardware (`stations` vs `nfc_tags`):** Physical NFC stickers or plaques in outdoor venues like Saigon Zoo can be damaged by weather, lost, or vandalized. By separating `stations` (the logical checkpoint and content) from `nfc_tags` (the physical token with `public_code`), operators can mark a compromised tag as `lost` or `replaced` and provision a new tag for the same station without losing historical stamp analytics or breaking collection progress.
3. **Instant Tactile NFC Auto-Collection:** Visiting an active `/s/[code]` URL from a physical NFC tap or QR scan automatically collects the station's stamp on client hydration (guarded idempotently per session) and plays a tactile ink-postmark landing animation—without requiring an extra button click. Meanwhile, browsing uncollected cards in the web catalog (`/`, `/collections/[slug]`, `/passport`) does not link to `/s/[code]`, preventing accidental collection while browsing.
4. **Future Native iOS (Swift / SwiftUI) Readiness:** Domain logic, Zod schemas, and station resolution services live in `src/server/*` and `src/types/*`, cleanly decoupled from React UI components. Future SwiftUI clients can consume the same Supabase schema, RLS policies, and `/api/*` endpoints.

---

## 2. High-Level Request Flow

```text
[Physical NFC Tag / QR Code]
       │  URL: https://<APP_DOMAIN>/s/tcv-k9x2m4p8
       ▼
[Next.js App Router: /s/[code]]
       │
       ├─► 1. Server validates `code` format with Zod (`publicCodeSchema`)
       ├─► 2. Resolves `nfc_tags` -> `stations` -> `stamps` -> `collections` -> `venues`
       │      (Queries Supabase when configured, or deterministic Pilot Seed in preview mode)
       ├─► 3. Renders Station Sheet (`available` | `collected` | `disabled` | `invalid`)
       │
       ▼ (Client hydration on active `/s/[code]`)
[Auto-Collect & Tactile Postmark Animation]
       ├─► Ensures anonymous or authenticated participant session exists
       ├─► Records `(participant_id, stamp_id, nfc_tag_id, source)` idempotently
       ├─► Plays ink-postmark slam + ink-ring pulse animation onto the stamp card
       └─► Evaluates `collections.completion_criteria` -> unlocks Badge & Reward eligibility
```

---

## 3. Physical Presence Limitation & Anti-Replay Roadmap

### Phase 0 / Pilot Reality
Because standard NDEF NFC tags and printed QR codes encode a static URL (`/s/<PUBLIC_CODE>`), **simply opening the URL does not cryptographically prove physical presence** if a visitor copies and shares the URL externally.

To mitigate casual enumeration in Phase 0:
- `nfc_tags.public_code` uses non-sequential random alphanumeric tokens (e.g., `tcv-k9x2m4p8`) enforced by database `CHECK` constraints (`char_length(public_code) >= 6`).
- Revoked or retired tags (`status IN ('disabled', 'lost', 'replaced')`) are immediately rejected by the station resolver.

### Phase 1+ Hardening Options
When higher assurance is required for high-value rewards, TAPTAP supports layered verification without changing the database schema:
1. **CMAC / SUN Dynamic NFC Tags (NTAG 424 DNA):** Tag appends an encrypted tap counter and CMAC signature (`?picc_data=...&cmac=...`) validated server-side.
2. **Venue Geofence / Approximate Location Check:** Optional browser Geolocation verification when claiming high-tier physical rewards.
3. **Inter-Station Velocity Cooldowns:** Server-side rate limiting rejecting impossible travel times between distant stations.
4. **Staff Counter Confirmation:** Two-step reward redemption on `/rewards/[id]` where venue staff verify or mark the `redemption_code` as `redeemed`.
