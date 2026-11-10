-- TAPTAP Phase 1 — B2B multi-tenancy (additive only).
-- New tables: subscription_packages, tenants, tenant_subscriptions, tenant_members,
-- tenant_invitations, rooms. New NULLABLE columns: tenant_id on venues / collections /
-- stations / stamps / nfc_tags, room_id on stations. B2C rows keep tenant_id = NULL.
-- Quotas are enforced by BEFORE INSERT/UPDATE triggers (authoritative, any write path).

-- 1. Tables -----------------------------------------------------------------
create table if not exists public.subscription_packages (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9-]{2,40}$'),
  name text not null check (char_length(name) between 1 and 80),
  max_rooms integer not null check (max_rooms >= 0),
  max_stations integer not null check (max_stations >= 0),
  max_members integer not null check (max_members >= 1),
  max_active_nfc_tags integer not null check (max_active_nfc_tags >= 0),
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  status text not null default 'active' check (status in ('pending','active','suspended')),
  is_demo boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  package_id uuid not null references public.subscription_packages(id) on delete restrict,
  status text not null default 'active' check (status in ('active','canceled','expired')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  quota_overrides jsonb not null default '{}'::jsonb check (jsonb_typeof(quota_overrides) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists tenant_subscriptions_one_active
  on public.tenant_subscriptions (tenant_id) where status = 'active';
create index if not exists tenant_subscriptions_package_idx on public.tenant_subscriptions (package_id);

create table if not exists public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  role text not null check (role in ('owner','admin','editor','viewer')),
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);
create index if not exists tenant_members_user_idx on public.tenant_members (user_id);

create table if not exists public.tenant_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  role text not null check (role in ('owner','admin','editor','viewer')),
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create unique index if not exists tenant_invitations_one_pending
  on public.tenant_invitations (tenant_id, lower(email)) where status = 'pending';
create index if not exists tenant_invitations_email_idx on public.tenant_invitations (lower(email));
create index if not exists tenant_invitations_invited_by_idx on public.tenant_invitations (invited_by);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null check (slug ~ '^[a-z0-9-]{1,80}$'),
  description text,
  status text not null default 'active' check (status in ('draft','active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
create index if not exists tenants_created_by_idx on public.tenants (created_by);

-- 2. Nullable columns on existing B2C tables (no data change) -----------------
alter table public.venues      add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.collections add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.stations    add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.stations    add column if not exists room_id uuid references public.rooms(id) on delete set null;
alter table public.stamps      add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
alter table public.nfc_tags    add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

create unique index if not exists venues_one_per_tenant on public.venues (tenant_id) where tenant_id is not null;
create index if not exists collections_tenant_idx on public.collections (tenant_id);
create index if not exists stations_tenant_idx on public.stations (tenant_id);
create index if not exists stations_room_idx on public.stations (room_id);
create index if not exists stamps_tenant_idx on public.stamps (tenant_id);
create index if not exists nfc_tags_tenant_idx on public.nfc_tags (tenant_id);

-- 3. updated_at triggers -------------------------------------------------------
create trigger set_updated_at_subscription_packages before update on public.subscription_packages
  for each row execute function public.handle_updated_at();
create trigger set_updated_at_tenants before update on public.tenants
  for each row execute function public.handle_updated_at();
create trigger set_updated_at_tenant_subscriptions before update on public.tenant_subscriptions
  for each row execute function public.handle_updated_at();
create trigger set_updated_at_rooms before update on public.rooms
  for each row execute function public.handle_updated_at();

-- 4. Authorization helpers (app_metadata + server-managed membership only) -----
create or replace function public.is_tenant_member(target_tenant_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.tenant_members m
    where m.tenant_id = target_tenant_id and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_tenant_role(target_tenant_id uuid, allowed_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_platform_admin() or exists (
    select 1 from public.tenant_members m
    where m.tenant_id = target_tenant_id
      and m.user_id = (select auth.uid())
      and m.role = any(allowed_roles)
  );
$$;

-- 5. Quota engine --------------------------------------------------------------
-- Effective limits = active package + quota_overrides. No active subscription or a
-- non-active tenant => every limit is 0 (writes blocked).
create or replace function public.tenant_effective_limits(p_tenant uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_pkg public.subscription_packages;
  v_sub public.tenant_subscriptions;
  v_status text;
  o jsonb;
begin
  select status into v_status from public.tenants where id = p_tenant;
  select * into v_sub from public.tenant_subscriptions
    where tenant_id = p_tenant and status = 'active'
      and starts_at <= now() and (ends_at is null or ends_at > now())
    limit 1;
  if v_status is distinct from 'active' or v_sub.id is null then
    return jsonb_build_object('rooms',0,'stations',0,'members',0,'active_nfc_tags',0,
      'package_code', null, 'tenant_status', v_status);
  end if;
  select * into v_pkg from public.subscription_packages where id = v_sub.package_id;
  o := coalesce(v_sub.quota_overrides, '{}'::jsonb);
  return jsonb_build_object(
    'rooms', coalesce((o->>'max_rooms')::int, v_pkg.max_rooms),
    'stations', coalesce((o->>'max_stations')::int, v_pkg.max_stations),
    'members', coalesce((o->>'max_members')::int, v_pkg.max_members),
    'active_nfc_tags', coalesce((o->>'max_active_nfc_tags')::int, v_pkg.max_active_nfc_tags),
    'package_code', v_pkg.code,
    'package_name', v_pkg.name,
    'tenant_status', v_status);
end;
$$;

create or replace function public.tenant_resource_usage(p_tenant uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'rooms', (select count(*) from public.rooms where tenant_id = p_tenant),
    'stations', (select count(*) from public.stations where tenant_id = p_tenant),
    'members', (select count(*) from public.tenant_members where tenant_id = p_tenant)
             + (select count(*) from public.tenant_invitations where tenant_id = p_tenant and status = 'pending'),
    'active_nfc_tags', (select count(*) from public.nfc_tags where tenant_id = p_tenant and status = 'active'));
$$;

create or replace function public.enforce_tenant_quota()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_resource text;
  v_limit int;
  v_used int;
begin
  if new.tenant_id is null then
    return new; -- B2C rows are never quota-limited
  end if;

  v_resource := case tg_table_name
    when 'rooms' then 'rooms'
    when 'stations' then 'stations'
    when 'tenant_members' then 'members'
    when 'tenant_invitations' then 'members'
    when 'nfc_tags' then 'active_nfc_tags'
  end;

  if tg_table_name = 'nfc_tags' then
    if new.status <> 'active' then return new; end if;
    if tg_op = 'UPDATE' and old.status = 'active' and old.tenant_id is not distinct from new.tenant_id then
      return new;
    end if;
  end if;
  if tg_table_name = 'tenant_invitations' then
    if new.status <> 'pending' then return new; end if;
    if tg_op = 'UPDATE' and old.status = 'pending' then return new; end if;
  end if;
  if tg_table_name = 'stations' and tg_op = 'UPDATE' and old.tenant_id is not distinct from new.tenant_id then
    return new;
  end if;

  -- Serialize concurrent writes per tenant so two requests cannot both pass.
  perform pg_advisory_xact_lock(hashtextextended('taptap_quota:' || new.tenant_id::text, 0));

  v_limit := (public.tenant_effective_limits(new.tenant_id) ->> v_resource)::int;
  v_used := (public.tenant_resource_usage(new.tenant_id) ->> v_resource)::int;

  if v_used + 1 > coalesce(v_limit, 0) then
    raise exception 'QUOTA_EXCEEDED:%:%/%', v_resource, v_used, coalesce(v_limit, 0)
      using errcode = 'P0001', hint = v_resource;
  end if;
  return new;
end;
$$;

create trigger enforce_quota_rooms before insert on public.rooms
  for each row execute function public.enforce_tenant_quota();
create trigger enforce_quota_stations before insert or update of tenant_id on public.stations
  for each row execute function public.enforce_tenant_quota();
create trigger enforce_quota_members before insert on public.tenant_members
  for each row execute function public.enforce_tenant_quota();
create trigger enforce_quota_invitations before insert or update of status on public.tenant_invitations
  for each row execute function public.enforce_tenant_quota();
create trigger enforce_quota_nfc_tags before insert or update of status, tenant_id on public.nfc_tags
  for each row execute function public.enforce_tenant_quota();

-- 6. RLS on every new table -----------------------------------------------------
alter table public.subscription_packages enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_subscriptions enable row level security;
alter table public.tenant_members enable row level security;
alter table public.tenant_invitations enable row level security;
alter table public.rooms enable row level security;

-- Reads: platform admin or a member of the tenant. Writes: platform admin directly;
-- tenant roles write only through the SECURITY DEFINER RPCs (role + quota checked).
create policy subscription_packages_select on public.subscription_packages for select to authenticated
  using (status = 'active' or (select public.is_platform_admin()));
create policy subscription_packages_admin on public.subscription_packages for all to authenticated
  using ((select public.is_platform_admin())) with check ((select public.is_platform_admin()));

create policy tenants_select on public.tenants for select to authenticated
  using ((select public.is_platform_admin()) or public.is_tenant_member(id));
create policy tenants_admin on public.tenants for all to authenticated
  using ((select public.is_platform_admin())) with check ((select public.is_platform_admin()));

create policy tenant_subscriptions_select on public.tenant_subscriptions for select to authenticated
  using ((select public.is_platform_admin()) or public.is_tenant_member(tenant_id));
create policy tenant_subscriptions_admin on public.tenant_subscriptions for all to authenticated
  using ((select public.is_platform_admin())) with check ((select public.is_platform_admin()));

create policy tenant_members_select on public.tenant_members for select to authenticated
  using ((select public.is_platform_admin()) or public.is_tenant_member(tenant_id));
create policy tenant_members_admin on public.tenant_members for all to authenticated
  using ((select public.is_platform_admin())) with check ((select public.is_platform_admin()));

create policy tenant_invitations_select on public.tenant_invitations for select to authenticated
  using ((select public.is_platform_admin()) or public.has_tenant_role(tenant_id, array['owner','admin']));
create policy tenant_invitations_admin on public.tenant_invitations for all to authenticated
  using ((select public.is_platform_admin())) with check ((select public.is_platform_admin()));

create policy rooms_select on public.rooms for select to authenticated
  using ((select public.is_platform_admin()) or public.is_tenant_member(tenant_id));
create policy rooms_admin on public.rooms for all to authenticated
  using ((select public.is_platform_admin())) with check ((select public.is_platform_admin()));

-- 7. Tenant isolation on shared catalog tables ---------------------------------
-- Members can read their tenant rows (any status).
create policy venues_select_tenant_member on public.venues for select to authenticated
  using (tenant_id is not null and public.is_tenant_member(tenant_id));
create policy collections_select_tenant_member on public.collections for select to authenticated
  using (tenant_id is not null and public.is_tenant_member(tenant_id));
create policy stations_select_tenant_member on public.stations for select to authenticated
  using (tenant_id is not null and public.is_tenant_member(tenant_id));
create policy stamps_select_tenant_member on public.stamps for select to authenticated
  using (tenant_id is not null and public.is_tenant_member(tenant_id));
create policy nfc_tags_select_tenant_member on public.nfc_tags for select to authenticated
  using (tenant_id is not null and public.is_tenant_member(tenant_id));

-- RESTRICTIVE: tenant rows never leak into the public B2C listing (anon/visitors).
create policy venues_tenant_isolation on public.venues as restrictive for select to public
  using (tenant_id is null or (select public.is_platform_admin()) or public.is_tenant_member(tenant_id));
create policy collections_tenant_isolation on public.collections as restrictive for select to public
  using (tenant_id is null or (select public.is_platform_admin()) or public.is_tenant_member(tenant_id));
create policy stations_tenant_isolation on public.stations as restrictive for select to public
  using (tenant_id is null or (select public.is_platform_admin()) or public.is_tenant_member(tenant_id));
create policy stamps_tenant_isolation on public.stamps as restrictive for select to public
  using (tenant_id is null or (select public.is_platform_admin()) or public.is_tenant_member(tenant_id));
create policy nfc_tags_tenant_isolation on public.nfc_tags as restrictive for select to public
  using (tenant_id is null or (select public.is_platform_admin()) or public.is_tenant_member(tenant_id));

-- 8. Function privileges ------------------------------------------------------
revoke all on function public.is_tenant_member(uuid) from public;
revoke all on function public.has_tenant_role(uuid, text[]) from public, anon;
revoke all on function public.tenant_effective_limits(uuid) from public, anon, authenticated;
revoke all on function public.tenant_resource_usage(uuid) from public, anon, authenticated;
revoke all on function public.enforce_tenant_quota() from public, anon, authenticated;
grant execute on function public.is_tenant_member(uuid) to anon, authenticated;
grant execute on function public.has_tenant_role(uuid, text[]) to authenticated;
