-- =============================================================================
-- TAPTAP — Schema & Row-Level Security (Google OAuth + Supabase Persistence)
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Automatic updated_at trigger helper
-- -----------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Tables
-- -----------------------------------------------------------------------------

-- 2.1 venues
create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  cover_image_url text,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 2.2 venue_admins
create table if not exists public.venue_admins (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'venue_admin' check (role in ('venue_admin', 'venue_editor')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (venue_id, user_id)
);

-- 2.3 collections
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  cover_image_url text,
  completion_criteria jsonb not null default '{"type": "all_stamps", "required_count": 4}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 2.4 stations
create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  image_url text,
  location_hint text,
  status text not null default 'active' check (status in ('active', 'maintenance', 'inactive')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (venue_id, slug)
);

-- 2.5 nfc_tags
create table if not exists public.nfc_tags (
  id uuid primary key default gen_random_uuid(),
  station_id uuid not null references public.stations(id) on delete cascade,
  public_code text not null unique check (char_length(public_code) >= 6),
  label text,
  status text not null default 'active' check (status in ('active', 'disabled', 'lost', 'replaced')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 2.6 stamps
create table if not exists public.stamps (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  station_id uuid not null references public.stations(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (collection_id, station_id)
);

-- 2.7 participants
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  guest_token_hash text unique,
  display_name text,
  locale text not null default 'en' check (locale in ('en', 'vi')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 2.8 collected_stamps
create table if not exists public.collected_stamps (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  stamp_id uuid not null references public.stamps(id) on delete cascade,
  nfc_tag_id uuid references public.nfc_tags(id) on delete set null,
  collected_at timestamptz not null default timezone('utc'::text, now()),
  source text not null default 'nfc' check (source in ('nfc', 'qr', 'admin')),
  unique (participant_id, stamp_id)
);

-- 2.9 badges
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 2.10 participant_badges
create table if not exists public.participant_badges (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  unlocked_at timestamptz not null default timezone('utc'::text, now()),
  unique (participant_id, badge_id)
);

-- 2.11 rewards
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  redemption_instructions text,
  status text not null default 'active' check (status in ('active', 'paused', 'exhausted')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- 2.12 redemptions
create table if not exists public.redemptions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete restrict,
  redemption_code text not null unique,
  status text not null default 'issued' check (status in ('issued', 'redeemed', 'expired', 'cancelled')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  redeemed_at timestamptz,
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (participant_id, reward_id)
);

-- -----------------------------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------------------------
create index if not exists idx_collections_venue_id on public.collections(venue_id);
create index if not exists idx_stations_venue_id on public.stations(venue_id);
create index if not exists idx_nfc_tags_station_id on public.nfc_tags(station_id);
create index if not exists idx_nfc_tags_public_code on public.nfc_tags(public_code);
create index if not exists idx_stamps_collection_id on public.stamps(collection_id);
create index if not exists idx_stamps_station_id on public.stamps(station_id);
create index if not exists idx_collected_stamps_participant_id on public.collected_stamps(participant_id);
create index if not exists idx_collected_stamps_stamp_id on public.collected_stamps(stamp_id);
create index if not exists idx_participant_badges_participant_id on public.participant_badges(participant_id);
create index if not exists idx_redemptions_participant_id on public.redemptions(participant_id);

-- -----------------------------------------------------------------------------
-- 4. Updated_at Triggers
-- -----------------------------------------------------------------------------
drop trigger if exists set_venues_updated_at on public.venues;
create trigger set_venues_updated_at
  before update on public.venues
  for each row execute function public.handle_updated_at();

drop trigger if exists set_collections_updated_at on public.collections;
create trigger set_collections_updated_at
  before update on public.collections
  for each row execute function public.handle_updated_at();

drop trigger if exists set_stations_updated_at on public.stations;
create trigger set_stations_updated_at
  before update on public.stations
  for each row execute function public.handle_updated_at();

drop trigger if exists set_nfc_tags_updated_at on public.nfc_tags;
create trigger set_nfc_tags_updated_at
  before update on public.nfc_tags
  for each row execute function public.handle_updated_at();

drop trigger if exists set_stamps_updated_at on public.stamps;
create trigger set_stamps_updated_at
  before update on public.stamps
  for each row execute function public.handle_updated_at();

drop trigger if exists set_participants_updated_at on public.participants;
create trigger set_participants_updated_at
  before update on public.participants
  for each row execute function public.handle_updated_at();

drop trigger if exists set_badges_updated_at on public.badges;
create trigger set_badges_updated_at
  before update on public.badges
  for each row execute function public.handle_updated_at();

drop trigger if exists set_rewards_updated_at on public.rewards;
create trigger set_rewards_updated_at
  before update on public.rewards
  for each row execute function public.handle_updated_at();

drop trigger if exists set_redemptions_updated_at on public.redemptions;
create trigger set_redemptions_updated_at
  before update on public.redemptions
  for each row execute function public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Security Helper Functions for RLS
-- -----------------------------------------------------------------------------
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'platform_role') = 'platform_admin',
    false
  );
$$;

create or replace function public.is_venue_admin(target_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_platform_admin()
  or exists (
    select 1
    from public.venue_admins va
    where va.venue_id = target_venue_id
      and va.user_id = (select auth.uid())
  );
$$;

-- -----------------------------------------------------------------------------
-- 6. Enable Row-Level Security on All 12 Tables
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 7. RLS Policies
-- -----------------------------------------------------------------------------

-- 7.1 venues
drop policy if exists "venues_select_public_or_admin" on public.venues;
create policy "venues_select_public_or_admin"
  on public.venues for select
  using (status = 'active' or public.is_venue_admin(id));

drop policy if exists "venues_insert_platform_admin" on public.venues;
create policy "venues_insert_platform_admin"
  on public.venues for insert
  with check (public.is_platform_admin());

drop policy if exists "venues_update_venue_admin" on public.venues;
create policy "venues_update_venue_admin"
  on public.venues for update
  using (public.is_venue_admin(id))
  with check (public.is_venue_admin(id));

drop policy if exists "venues_delete_platform_admin" on public.venues;
create policy "venues_delete_platform_admin"
  on public.venues for delete
  using (public.is_platform_admin());

-- 7.2 venue_admins
drop policy if exists "venue_admins_select_own_or_admin" on public.venue_admins;
create policy "venue_admins_select_own_or_admin"
  on public.venue_admins for select
  using (user_id = (select auth.uid()) or public.is_venue_admin(venue_id));

drop policy if exists "venue_admins_manage_platform_admin" on public.venue_admins;
create policy "venue_admins_manage_platform_admin"
  on public.venue_admins for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- 7.3 collections
drop policy if exists "collections_select_public_or_admin" on public.collections;
create policy "collections_select_public_or_admin"
  on public.collections for select
  using (status = 'active' or public.is_venue_admin(venue_id));

drop policy if exists "collections_manage_venue_admin" on public.collections;
create policy "collections_manage_venue_admin"
  on public.collections for all
  using (public.is_venue_admin(venue_id))
  with check (public.is_venue_admin(venue_id));

-- 7.4 stations
drop policy if exists "stations_select_public_or_admin" on public.stations;
create policy "stations_select_public_or_admin"
  on public.stations for select
  using (status = 'active' or public.is_venue_admin(venue_id));

drop policy if exists "stations_manage_venue_admin" on public.stations;
create policy "stations_manage_venue_admin"
  on public.stations for all
  using (public.is_venue_admin(venue_id))
  with check (public.is_venue_admin(venue_id));

-- 7.5 nfc_tags
drop policy if exists "nfc_tags_select_active_or_admin" on public.nfc_tags;
create policy "nfc_tags_select_active_or_admin"
  on public.nfc_tags for select
  using (
    status = 'active'
    or exists (
      select 1 from public.stations s
      where s.id = nfc_tags.station_id
        and public.is_venue_admin(s.venue_id)
    )
  );

drop policy if exists "nfc_tags_manage_venue_admin" on public.nfc_tags;
create policy "nfc_tags_manage_venue_admin"
  on public.nfc_tags for all
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

-- 7.6 stamps
drop policy if exists "stamps_select_public_or_admin" on public.stamps;
create policy "stamps_select_public_or_admin"
  on public.stamps for select
  using (
    status = 'active'
    or exists (
      select 1 from public.collections c
      where c.id = stamps.collection_id
        and public.is_venue_admin(c.venue_id)
    )
  );

drop policy if exists "stamps_manage_venue_admin" on public.stamps;
create policy "stamps_manage_venue_admin"
  on public.stamps for all
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

-- 7.7 participants (Authenticated Google users own their row via auth_user_id = auth.uid())
drop policy if exists "participants_select_own_or_admin" on public.participants;
create policy "participants_select_own_or_admin"
  on public.participants for select
  to authenticated
  using (auth_user_id = (select auth.uid()) or public.is_platform_admin());

drop policy if exists "participants_insert_authenticated" on public.participants;
create policy "participants_insert_authenticated"
  on public.participants for insert
  to authenticated
  with check (auth_user_id = (select auth.uid()) or public.is_platform_admin());

drop policy if exists "participants_update_own_or_admin" on public.participants;
create policy "participants_update_own_or_admin"
  on public.participants for update
  to authenticated
  using (auth_user_id = (select auth.uid()) or public.is_platform_admin())
  with check (auth_user_id = (select auth.uid()) or public.is_platform_admin());

-- 7.8 collected_stamps (Authenticated Google users can view, collect, and reset their own stamps)
drop policy if exists "collected_stamps_select_own_or_admin" on public.collected_stamps;
create policy "collected_stamps_select_own_or_admin"
  on public.collected_stamps for select
  to authenticated
  using (
    exists (
      select 1 from public.participants p
      where p.id = collected_stamps.participant_id
        and p.auth_user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.stamps st
      join public.collections c on c.id = st.collection_id
      where st.id = collected_stamps.stamp_id
        and public.is_venue_admin(c.venue_id)
    )
  );

drop policy if exists "collected_stamps_insert_admin_only" on public.collected_stamps;
drop policy if exists "collected_stamps_insert_own_or_admin" on public.collected_stamps;
create policy "collected_stamps_insert_own_or_admin"
  on public.collected_stamps for insert
  to authenticated
  with check (
    (
      exists (
        select 1 from public.participants p
        where p.id = collected_stamps.participant_id
          and p.auth_user_id = (select auth.uid())
      )
      and exists (
        select 1 from public.stamps st
        where st.id = collected_stamps.stamp_id
          and st.status = 'active'
      )
    )
    or public.is_platform_admin()
  );

drop policy if exists "collected_stamps_delete_own_or_admin" on public.collected_stamps;
create policy "collected_stamps_delete_own_or_admin"
  on public.collected_stamps for delete
  to authenticated
  using (
    exists (
      select 1 from public.participants p
      where p.id = collected_stamps.participant_id
        and p.auth_user_id = (select auth.uid())
    )
    or public.is_platform_admin()
  );

-- 7.9 badges
drop policy if exists "badges_select_public_or_admin" on public.badges;
create policy "badges_select_public_or_admin"
  on public.badges for select
  using (
    exists (
      select 1 from public.collections c
      where c.id = badges.collection_id
        and (c.status = 'active' or public.is_venue_admin(c.venue_id))
    )
  );

drop policy if exists "badges_manage_venue_admin" on public.badges;
create policy "badges_manage_venue_admin"
  on public.badges for all
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

-- 7.10 participant_badges
drop policy if exists "participant_badges_select_own_or_admin" on public.participant_badges;
create policy "participant_badges_select_own_or_admin"
  on public.participant_badges for select
  to authenticated
  using (
    exists (
      select 1 from public.participants p
      where p.id = participant_badges.participant_id
        and p.auth_user_id = (select auth.uid())
    )
    or public.is_platform_admin()
  );

drop policy if exists "participant_badges_manage_platform_admin" on public.participant_badges;
drop policy if exists "participant_badges_insert_own_or_admin" on public.participant_badges;
create policy "participant_badges_insert_own_or_admin"
  on public.participant_badges for insert
  to authenticated
  with check (
    exists (
      select 1 from public.participants p
      where p.id = participant_badges.participant_id
        and p.auth_user_id = (select auth.uid())
    )
    or public.is_platform_admin()
  );

drop policy if exists "participant_badges_delete_own_or_admin" on public.participant_badges;
create policy "participant_badges_delete_own_or_admin"
  on public.participant_badges for delete
  to authenticated
  using (
    exists (
      select 1 from public.participants p
      where p.id = participant_badges.participant_id
        and p.auth_user_id = (select auth.uid())
    )
    or public.is_platform_admin()
  );

-- 7.11 rewards
drop policy if exists "rewards_select_public_or_admin" on public.rewards;
create policy "rewards_select_public_or_admin"
  on public.rewards for select
  using (
    status = 'active'
    or exists (
      select 1 from public.collections c
      where c.id = rewards.collection_id
        and public.is_venue_admin(c.venue_id)
    )
  );

drop policy if exists "rewards_manage_venue_admin" on public.rewards;
create policy "rewards_manage_venue_admin"
  on public.rewards for all
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

-- 7.12 redemptions (Authenticated Google users can claim, redeem, and reset their own rewards)
drop policy if exists "redemptions_select_own_or_admin" on public.redemptions;
create policy "redemptions_select_own_or_admin"
  on public.redemptions for select
  to authenticated
  using (
    exists (
      select 1 from public.participants p
      where p.id = redemptions.participant_id
        and p.auth_user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.rewards r
      join public.collections c on c.id = r.collection_id
      where r.id = redemptions.reward_id
        and public.is_venue_admin(c.venue_id)
    )
  );

drop policy if exists "redemptions_insert_platform_admin" on public.redemptions;
drop policy if exists "redemptions_insert_own_or_admin" on public.redemptions;
create policy "redemptions_insert_own_or_admin"
  on public.redemptions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.participants p
      where p.id = redemptions.participant_id
        and p.auth_user_id = (select auth.uid())
    )
    or public.is_platform_admin()
  );

drop policy if exists "redemptions_update_venue_admin" on public.redemptions;
drop policy if exists "redemptions_update_own_or_admin" on public.redemptions;
create policy "redemptions_update_own_or_admin"
  on public.redemptions for update
  to authenticated
  using (
    exists (
      select 1 from public.participants p
      where p.id = redemptions.participant_id
        and p.auth_user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.rewards r
      join public.collections c on c.id = r.collection_id
      where r.id = redemptions.reward_id
        and public.is_venue_admin(c.venue_id)
    )
  )
  with check (
    exists (
      select 1 from public.participants p
      where p.id = redemptions.participant_id
        and p.auth_user_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.rewards r
      join public.collections c on c.id = r.collection_id
      where r.id = redemptions.reward_id
        and public.is_venue_admin(c.venue_id)
    )
  );

drop policy if exists "redemptions_delete_own_or_admin" on public.redemptions;
create policy "redemptions_delete_own_or_admin"
  on public.redemptions for delete
  to authenticated
  using (
    exists (
      select 1 from public.participants p
      where p.id = redemptions.participant_id
        and p.auth_user_id = (select auth.uid())
    )
    or public.is_platform_admin()
  );
