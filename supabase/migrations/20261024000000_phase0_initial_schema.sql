-- ============================================================================
-- TAPTAP — Phase 0 Initial Database Schema & Row Level Security
-- Migration: 20261024000000_phase0_initial_schema.sql
-- ============================================================================
-- Tables included:
--   1. venues
--   2. venue_admins (helper table for scoped venue admin authorization)
--   3. collections
--   4. stations
--   5. nfc_tags
--   6. stamps
--   7. participants
--   8. collected_stamps
--   9. badges
--  10. participant_badges
--  11. rewards
--  12. redemptions
--
-- Security notes:
-- - Every table in `public` has Row Level Security (RLS) explicitly enabled.
-- - JWT role authorization reads ONLY from `auth.jwt() -> 'app_metadata'`
--   (never `user_metadata`, which is user-editable).
-- - Trigger and role-check functions set `search_path = ''` to prevent
--   search-path hijacking.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Utility & Role Helper Functions
-- ----------------------------------------------------------------------------

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

-- Checks whether the current JWT belongs to a platform_admin via app_metadata
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'platform_admin',
    false
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. Core Tables
-- ----------------------------------------------------------------------------

-- 2.1 venues
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_venues_status on public.venues (status);

create trigger trg_venues_updated_at
before update on public.venues
for each row execute function public.handle_updated_at();

-- 2.2 venue_admins (links auth.users to specific venues for Venue Admin role)
create table public.venue_admins (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'venue_admin' check (role in ('venue_admin', 'venue_editor')),
  created_at timestamptz not null default now(),
  unique (venue_id, user_id)
);

create index idx_venue_admins_user_id on public.venue_admins (user_id);
create index idx_venue_admins_venue_id on public.venue_admins (venue_id);

-- Checks whether the current authenticated user is a platform_admin or an
-- assigned admin for the target venue (via venue_admins or app_metadata.venue_ids)
create or replace function public.is_venue_admin(target_venue_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select
    public.is_platform_admin()
    or exists (
      select 1
      from public.venue_admins va
      where va.venue_id = target_venue_id
        and va.user_id = auth.uid()
    )
    or coalesce(
      (auth.jwt() -> 'app_metadata' -> 'venue_ids') ? (target_venue_id::text),
      false
    );
$$;

-- 2.3 collections
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete restrict,
  name text not null check (char_length(trim(name)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  cover_image_url text,
  completion_criteria jsonb not null default '{"type": "all"}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, slug),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create index idx_collections_venue_id on public.collections (venue_id);
create index idx_collections_slug on public.collections (slug);
create index idx_collections_status on public.collections (status);

create trigger trg_collections_updated_at
before update on public.collections
for each row execute function public.handle_updated_at();

-- 2.4 stations
-- Stations represent physical checkpoints inside a venue and are intentionally
-- decoupled from nfc_tags so damaged/lost hardware tags can be replaced without
-- breaking station history or stamp definitions.
create table public.stations (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete restrict,
  name text not null check (char_length(trim(name)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  image_url text,
  location_hint text,
  status text not null default 'active' check (status in ('active', 'maintenance', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (venue_id, slug)
);

create index idx_stations_venue_id on public.stations (venue_id);
create index idx_stations_status on public.stations (status);

create trigger trg_stations_updated_at
before update on public.stations
for each row execute function public.handle_updated_at();

-- 2.5 nfc_tags
-- Physical NFC stickers/cards or QR code endpoints mapped to a station.
-- `public_code` must be a non-sequential random token (min 6 chars) used in `/s/[code]`.
create table public.nfc_tags (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete restrict,
  public_code text not null unique check (
    char_length(public_code) >= 6
    and public_code ~ '^[a-zA-Z0-9_-]+$'
  ),
  label text,
  status text not null default 'active' check (status in ('active', 'disabled', 'lost', 'replaced')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_nfc_tags_station_id on public.nfc_tags (station_id);
create index idx_nfc_tags_public_code on public.nfc_tags (public_code);
create index idx_nfc_tags_status on public.nfc_tags (status);

create trigger trg_nfc_tags_updated_at
before update on public.nfc_tags
for each row execute function public.handle_updated_at();

-- 2.6 stamps
create table public.stamps (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  station_id uuid not null references public.stations(id) on delete restrict,
  name text not null check (char_length(trim(name)) > 0),
  description text,
  image_url text,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, station_id)
);

create index idx_stamps_collection_id on public.stamps (collection_id, sort_order);
create index idx_stamps_station_id on public.stamps (station_id);

create trigger trg_stamps_updated_at
before update on public.stamps
for each row execute function public.handle_updated_at();

-- 2.7 participants
-- Supports both Supabase Anonymous Auth / Authenticated users (`auth_user_id`)
-- and optional server-signed guest token hashes (`guest_token_hash`).
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  guest_token_hash text unique,
  display_name text,
  locale text not null default 'en' check (locale in ('en', 'vi')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_participants_auth_user_id on public.participants (auth_user_id);

create trigger trg_participants_updated_at
before update on public.participants
for each row execute function public.handle_updated_at();

-- 2.8 collected_stamps
create table public.collected_stamps (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  stamp_id uuid not null references public.stamps(id) on delete restrict,
  nfc_tag_id uuid references public.nfc_tags(id) on delete set null,
  collected_at timestamptz not null default now(),
  source text not null default 'nfc' check (source in ('nfc', 'qr', 'admin')),
  unique (participant_id, stamp_id)
);

create index idx_collected_stamps_participant_id on public.collected_stamps (participant_id);
create index idx_collected_stamps_stamp_id on public.collected_stamps (stamp_id);
create index idx_collected_stamps_nfc_tag_id on public.collected_stamps (nfc_tag_id);

-- 2.9 badges
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_badges_collection_id on public.badges (collection_id);

create trigger trg_badges_updated_at
before update on public.badges
for each row execute function public.handle_updated_at();

-- 2.10 participant_badges
create table public.participant_badges (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (participant_id, badge_id)
);

create index idx_participant_badges_participant_id on public.participant_badges (participant_id);
create index idx_participant_badges_badge_id on public.participant_badges (badge_id);

-- 2.11 rewards
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text,
  image_url text,
  redemption_instructions text,
  status text not null default 'active' check (status in ('active', 'paused', 'exhausted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_rewards_collection_id on public.rewards (collection_id);
create index idx_rewards_status on public.rewards (status);

create trigger trg_rewards_updated_at
before update on public.rewards
for each row execute function public.handle_updated_at();

-- 2.12 redemptions
create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete restrict,
  reward_id uuid not null references public.rewards(id) on delete restrict,
  redemption_code text not null unique check (char_length(redemption_code) >= 6),
  status text not null default 'issued' check (status in ('issued', 'redeemed', 'expired', 'cancelled')),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index idx_redemptions_participant_id on public.redemptions (participant_id);
create index idx_redemptions_reward_id on public.redemptions (reward_id);
create index idx_redemptions_redemption_code on public.redemptions (redemption_code);

create trigger trg_redemptions_updated_at
before update on public.redemptions
for each row execute function public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 3. Enable Row Level Security (RLS) on ALL Tables
-- ----------------------------------------------------------------------------

alter table public.venues enable row level security;
alter table public.venue_admins enable row level security;
alter table public.collections enable row level security;
alter table public.stations enable row level security;
alter table public.nfc_tags enable row level security;
alter table public.stamps enable row level security;
alter table public.participants enable row level security;
alter table public.collected_stamps enable row level security;
alter table public.badges enable row level security;
alter table public.participant_badges enable row level security;
alter table public.rewards enable row level security;
alter table public.redemptions enable row level security;

-- ----------------------------------------------------------------------------
-- 4. Least-Privilege RLS Policies
-- ----------------------------------------------------------------------------

-- 4.1 venues policies
create policy "venues_select_public_or_admin"
  on public.venues for select
  to anon, authenticated
  using (
    status = 'active'
    or public.is_venue_admin(id)
  );

create policy "venues_insert_platform_admin"
  on public.venues for insert
  to authenticated
  with check (public.is_platform_admin());

create policy "venues_update_admin"
  on public.venues for update
  to authenticated
  using (public.is_venue_admin(id))
  with check (public.is_venue_admin(id));

create policy "venues_delete_platform_admin"
  on public.venues for delete
  to authenticated
  using (public.is_platform_admin());

-- 4.2 venue_admins policies
create policy "venue_admins_select_own_or_platform_admin"
  on public.venue_admins for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_platform_admin()
  );

create policy "venue_admins_manage_platform_admin"
  on public.venue_admins for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- 4.3 collections policies
create policy "collections_select_public_or_admin"
  on public.collections for select
  to anon, authenticated
  using (
    status = 'active'
    or public.is_venue_admin(venue_id)
  );

create policy "collections_insert_admin"
  on public.collections for insert
  to authenticated
  with check (public.is_venue_admin(venue_id));

create policy "collections_update_admin"
  on public.collections for update
  to authenticated
  using (public.is_venue_admin(venue_id))
  with check (public.is_venue_admin(venue_id));

create policy "collections_delete_admin"
  on public.collections for delete
  to authenticated
  using (public.is_venue_admin(venue_id));

-- 4.4 stations policies
create policy "stations_select_public_or_admin"
  on public.stations for select
  to anon, authenticated
  using (
    status in ('active', 'maintenance')
    or public.is_venue_admin(venue_id)
  );

create policy "stations_insert_admin"
  on public.stations for insert
  to authenticated
  with check (public.is_venue_admin(venue_id));

create policy "stations_update_admin"
  on public.stations for update
  to authenticated
  using (public.is_venue_admin(venue_id))
  with check (public.is_venue_admin(venue_id));

create policy "stations_delete_admin"
  on public.stations for delete
  to authenticated
  using (public.is_venue_admin(venue_id));

-- 4.5 nfc_tags policies
create policy "nfc_tags_select_active_or_admin"
  on public.nfc_tags for select
  to anon, authenticated
  using (
    status = 'active'
    or exists (
      select 1 from public.stations s
      where s.id = nfc_tags.station_id
        and public.is_venue_admin(s.venue_id)
    )
  );

create policy "nfc_tags_insert_admin"
  on public.nfc_tags for insert
  to authenticated
  with check (
    exists (
      select 1 from public.stations s
      where s.id = nfc_tags.station_id
        and public.is_venue_admin(s.venue_id)
    )
  );

create policy "nfc_tags_update_admin"
  on public.nfc_tags for update
  to authenticated
  using (
    exists (
      select 1 from public.stations s
      where s.id = nfc_tags.station_id
        and public.is_venue_admin(s.venue_id)
    )
  )
  with check (
    exists (
      select 1 from public.stations s
      where s.id = nfc_tags.station_id
        and public.is_venue_admin(s.venue_id)
    )
  );

create policy "nfc_tags_delete_admin"
  on public.nfc_tags for delete
  to authenticated
  using (
    exists (
      select 1 from public.stations s
      where s.id = nfc_tags.station_id
        and public.is_venue_admin(s.venue_id)
    )
  );

-- 4.6 stamps policies
create policy "stamps_select_public_or_admin"
  on public.stamps for select
  to anon, authenticated
  using (
    status = 'active'
    or exists (
      select 1 from public.collections c
      where c.id = stamps.collection_id
        and public.is_venue_admin(c.venue_id)
    )
  );

create policy "stamps_insert_admin"
  on public.stamps for insert
  to authenticated
  with check (
    exists (
      select 1 from public.collections c
      where c.id = stamps.collection_id
        and public.is_venue_admin(c.venue_id)
    )
  );

create policy "stamps_update_admin"
  on public.stamps for update
  to authenticated
  using (
    exists (
      select 1 from public.collections c
      where c.id = stamps.collection_id
        and public.is_venue_admin(c.venue_id)
    )
  )
  with check (
    exists (
      select 1 from public.collections c
      where c.id = stamps.collection_id
        and public.is_venue_admin(c.venue_id)
    )
  );

create policy "stamps_delete_admin"
  on public.stamps for delete
  to authenticated
  using (
    exists (
      select 1 from public.collections c
      where c.id = stamps.collection_id
        and public.is_venue_admin(c.venue_id)
    )
  );

-- 4.7 participants policies
-- Visitors (including Supabase Anonymous Auth sessions) can read/create/update
-- only their own participant record where `auth_user_id = auth.uid()`.
create policy "participants_select_own_or_platform_admin"
  on public.participants for select
  to authenticated
  using (
    auth_user_id = auth.uid()
    or public.is_platform_admin()
  );

create policy "participants_insert_own_or_platform_admin"
  on public.participants for insert
  to authenticated
  with check (
    auth_user_id = auth.uid()
    or public.is_platform_admin()
  );

create policy "participants_update_own_or_platform_admin"
  on public.participants for update
  to authenticated
  using (
    auth_user_id = auth.uid()
    or public.is_platform_admin()
  )
  with check (
    auth_user_id = auth.uid()
    or public.is_platform_admin()
  );

create policy "participants_delete_platform_admin"
  on public.participants for delete
  to authenticated
  using (public.is_platform_admin());

-- 4.8 collected_stamps policies
-- Visitors can SELECT their own collected stamps, and Venue/Platform admins can
-- inspect stamps collected at their venue. Direct client INSERT is intentionally
-- omitted for visitors: stamp collection must be validated server-side.
create policy "collected_stamps_select_own_or_admin"
  on public.collected_stamps for select
  to authenticated
  using (
    exists (
      select 1 from public.participants p
      where p.id = collected_stamps.participant_id
        and p.auth_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.stamps st
      join public.collections c on c.id = st.collection_id
      where st.id = collected_stamps.stamp_id
        and public.is_venue_admin(c.venue_id)
    )
    or public.is_platform_admin()
  );

create policy "collected_stamps_insert_admin_only"
  on public.collected_stamps for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.stamps st
      join public.collections c on c.id = st.collection_id
      where st.id = collected_stamps.stamp_id
        and public.is_venue_admin(c.venue_id)
    )
    or public.is_platform_admin()
  );

create policy "collected_stamps_delete_platform_admin"
  on public.collected_stamps for delete
  to authenticated
  using (public.is_platform_admin());

-- 4.9 badges policies
create policy "badges_select_public_or_admin"
  on public.badges for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.collections c
      where c.id = badges.collection_id
        and (c.status = 'active' or public.is_venue_admin(c.venue_id))
    )
  );

create policy "badges_manage_admin"
  on public.badges for all
  to authenticated
  using (
    exists (
      select 1 from public.collections c
      where c.id = badges.collection_id
        and public.is_venue_admin(c.venue_id)
    )
  )
  with check (
    exists (
      select 1 from public.collections c
      where c.id = badges.collection_id
        and public.is_venue_admin(c.venue_id)
    )
  );

-- 4.10 participant_badges policies
-- Visitors can read their own unlocked badges; unlocking is server-validated.
create policy "participant_badges_select_own_or_admin"
  on public.participant_badges for select
  to authenticated
  using (
    exists (
      select 1 from public.participants p
      where p.id = participant_badges.participant_id
        and p.auth_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.badges b
      join public.collections c on c.id = b.collection_id
      where b.id = participant_badges.badge_id
        and public.is_venue_admin(c.venue_id)
    )
    or public.is_platform_admin()
  );

create policy "participant_badges_manage_platform_admin"
  on public.participant_badges for all
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- 4.11 rewards policies
create policy "rewards_select_public_or_admin"
  on public.rewards for select
  to anon, authenticated
  using (
    status = 'active'
    or exists (
      select 1 from public.collections c
      where c.id = rewards.collection_id
        and public.is_venue_admin(c.venue_id)
    )
  );

create policy "rewards_manage_admin"
  on public.rewards for all
  to authenticated
  using (
    exists (
      select 1 from public.collections c
      where c.id = rewards.collection_id
        and public.is_venue_admin(c.venue_id)
    )
  )
  with check (
    exists (
      select 1 from public.collections c
      where c.id = rewards.collection_id
        and public.is_venue_admin(c.venue_id)
    )
  );

-- 4.12 redemptions policies
-- Visitors can view their own redemptions; Venue admins can view and update
-- redemption status (e.g., marking an issued code as `redeemed`) for their venue.
create policy "redemptions_select_own_or_admin"
  on public.redemptions for select
  to authenticated
  using (
    exists (
      select 1 from public.participants p
      where p.id = redemptions.participant_id
        and p.auth_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.rewards r
      join public.collections c on c.id = r.collection_id
      where r.id = redemptions.reward_id
        and public.is_venue_admin(c.venue_id)
    )
    or public.is_platform_admin()
  );

create policy "redemptions_update_admin"
  on public.redemptions for update
  to authenticated
  using (
    exists (
      select 1
      from public.rewards r
      join public.collections c on c.id = r.collection_id
      where r.id = redemptions.reward_id
        and public.is_venue_admin(c.venue_id)
    )
    or public.is_platform_admin()
  )
  with check (
    exists (
      select 1
      from public.rewards r
      join public.collections c on c.id = r.collection_id
      where r.id = redemptions.reward_id
        and public.is_venue_admin(c.venue_id)
    )
    or public.is_platform_admin()
  );

create policy "redemptions_insert_platform_admin"
  on public.redemptions for insert
  to authenticated
  with check (public.is_platform_admin());
