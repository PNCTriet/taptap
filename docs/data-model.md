# TAPTAP — Data Model & Schema Reference

All tables are defined in `supabase/migrations/20261024000000_phase0_initial_schema.sql` using UUID primary keys (`gen_random_uuid()`), `timestamptz` timestamps, strict `CHECK` constraints, and Row Level Security (RLS).

---

## 1. Entity-Relationship Overview

```text
venues (1) ───────< (N) collections (1) ───────< (N) stamps
  │                         │                         │
  │                         ├──────────< (N) badges   │
  │                         └──────────< (N) rewards  │
  │                                            │      │
  └───────────────< (N) stations (1) ──────────┼──────┘
                          │                    │
                          └───< (N) nfc_tags   │
                                      │        │
participants (1) ──< (N) collected_stamps >────┘
      │
      ├──< (N) participant_badges >── badges
      └──< (N) redemptions >───────── rewards
```

---

## 2. Table Specifications (11 Core Tables + `venue_admins`)

### 2.1 `venues`
Represents a physical partner location (e.g., *Saigon Zoo and Botanical Gardens*).
- **Key columns:** `id`, `name`, `slug` (`UNIQUE`), `description`, `cover_image_url`, `status` (`draft` | `active` | `archived`), `created_at`, `updated_at`.

### 2.2 `venue_admins` (Helper Authorization Table)
Maps authenticated users (`auth.users.id`) to venues they are authorized to manage.
- **Key columns:** `id`, `venue_id` (`FK -> venues ON DELETE CASCADE`), `user_id` (`FK -> auth.users ON DELETE CASCADE`), `role` (`venue_admin` | `venue_editor`), `created_at`, `UNIQUE (venue_id, user_id)`.

### 2.3 `collections`
A themed stamp trail or campaign within a venue (e.g., *Zoo Explorer*).
- **Key columns:** `id`, `venue_id` (`FK -> venues ON DELETE RESTRICT`), `name`, `slug`, `description`, `cover_image_url`, `completion_criteria` (`jsonb`, e.g. `{"type":"all","required":4}`), `status` (`draft` | `active` | `archived`), `starts_at`, `ends_at`, `created_at`, `updated_at`.
- **Constraints:** `UNIQUE (venue_id, slug)`.

### 2.4 `stations`
A physical checkpoint at a venue (`Elephant`, `Giraffe`, `Flamingo`, `Botanical Conservatory`).
- **Key columns:** `id`, `venue_id` (`FK -> venues ON DELETE RESTRICT`), `name`, `slug`, `description`, `image_url`, `location_hint`, `status` (`active` | `maintenance` | `inactive`), `created_at`, `updated_at`.
- **Constraints:** `UNIQUE (venue_id, slug)`.

### 2.5 `nfc_tags`
Physical NFC stickers/plaques or QR endpoints pointing to a station.
- **Key columns:** `id`, `station_id` (`FK -> stations ON DELETE RESTRICT`), `public_code` (`UNIQUE`, non-sequential token `>= 6` chars), `label`, `status` (`active` | `disabled` | `lost` | `replaced`), `created_at`, `updated_at`.

### 2.6 `stamps`
Links a `station` to a `collection` with commemorative artwork and metadata.
- **Key columns:** `id`, `collection_id` (`FK -> collections ON DELETE CASCADE`), `station_id` (`FK -> stations ON DELETE RESTRICT`), `name`, `description`, `image_url`, `sort_order`, `status` (`active` | `inactive`), `created_at`, `updated_at`.
- **Constraints:** `UNIQUE (collection_id, station_id)`.

### 2.7 `participants`
Visitor profile supporting both anonymous sessions and linked accounts.
- **Key columns:** `id`, `auth_user_id` (`UUID UNIQUE NULLABLE`, `FK -> auth.users(id) ON DELETE SET NULL`), `guest_token_hash` (`TEXT UNIQUE NULLABLE`), `display_name`, `locale` (`en` | `vi`), `created_at`, `updated_at`.

### 2.8 `collected_stamps`
Idempotent ledger of stamps collected by a participant.
- **Key columns:** `id`, `participant_id` (`FK -> participants ON DELETE CASCADE`), `stamp_id` (`FK -> stamps ON DELETE RESTRICT`), `nfc_tag_id` (`FK -> nfc_tags ON DELETE SET NULL`), `collected_at`, `source` (`nfc` | `qr` | `admin`).
- **Constraints:** `UNIQUE (participant_id, stamp_id)` prevents duplicate stamps for the same participant.

### 2.9 `badges`
Digital achievement badges unlocked upon completing a collection.
- **Key columns:** `id`, `collection_id` (`FK -> collections ON DELETE CASCADE`), `name`, `description`, `image_url`, `created_at`, `updated_at`.

### 2.10 `participant_badges`
Tracks which badges a participant has unlocked.
- **Key columns:** `id`, `participant_id` (`FK -> participants ON DELETE CASCADE`), `badge_id` (`FK -> badges ON DELETE CASCADE`), `unlocked_at`.
- **Constraints:** `UNIQUE (participant_id, badge_id)`.

### 2.11 `rewards`
Physical or digital perks offered for completing a collection.
- **Key columns:** `id`, `collection_id` (`FK -> collections ON DELETE CASCADE`), `name`, `description`, `image_url`, `redemption_instructions`, `status` (`active` | `paused` | `exhausted`), `created_at`, `updated_at`.

### 2.12 `redemptions`
Issued reward claim codes and their fulfillment lifecycle.
- **Key columns:** `id`, `participant_id` (`FK -> participants ON DELETE RESTRICT`), `reward_id` (`FK -> rewards ON DELETE RESTRICT`), `redemption_code` (`UNIQUE`), `status` (`issued` | `redeemed` | `expired` | `cancelled`), `created_at`, `redeemed_at`, `updated_at`.
