-- TAPTAP Phase 1 — DEMO data only (idempotent). Not a partnership with any real venue.
-- Run as the database owner (Supabase SQL editor / MCP execute_sql). No secrets here:
-- demo auth users are created separately and looked up by email.
do $$
declare
  v_tenant uuid; v_venue uuid; v_collection uuid; v_room uuid; v_station uuid; v_uid uuid;
  v_starter uuid := (select id from public.subscription_packages where code = 'starter');
  v_growth uuid := (select id from public.subscription_packages where code = 'growth');
  r record;
begin
  -- Platform admin role for the founder's existing Google account (app_metadata only).
  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"platform_role":"platform_admin"}'::jsonb
   where lower(email) = 'triet.pnc@gmail.com';

  -- Tenant 1: Demo Toy Studio (Growth) -------------------------------------------
  select id into v_tenant from public.tenants where slug = 'demo-toy-studio';
  if v_tenant is null then
    insert into public.tenants (name, slug, status, is_demo) values ('Demo Toy Studio', 'demo-toy-studio', 'active', true)
      returning id into v_tenant;
    insert into public.venues (name, slug, description, status, tenant_id)
      values ('Demo Toy Studio', 'b2b-demo-toy-studio', 'Demo business space', 'draft', v_tenant) returning id into v_venue;
    insert into public.collections (venue_id, name, slug, description, completion_criteria, status, tenant_id)
      values (v_venue, 'Demo Toy Studio', 'b2b-demo-toy-studio', 'Demo collection', '{"type":"all"}', 'active', v_tenant)
      returning id into v_collection;
    insert into public.tenant_subscriptions (tenant_id, package_id, status) values (v_tenant, v_growth, 'active');
    insert into public.rooms (tenant_id, name, slug, description, status)
      values (v_tenant, 'Play Room A', 'play-room-a', 'Demo room', 'active') returning id into v_room;
    for r in select * from (values (1, 'Robot Racer', 'robot-racer', 'tt-demorobot01'), (2, 'Puzzle Cube', 'puzzle-cube', 'tt-democube002')) s(n, name, slug, code) loop
      insert into public.stations (venue_id, tenant_id, room_id, name, slug, description, status)
        values (v_venue, v_tenant, v_room, r.name, r.slug, 'Demo toy station', 'active') returning id into v_station;
      insert into public.stamps (collection_id, station_id, tenant_id, name, description, sort_order, status)
        values (v_collection, v_station, v_tenant, r.name, 'Demo toy stamp', r.n, 'active');
      insert into public.nfc_tags (station_id, tenant_id, public_code, label, status)
        values (v_station, v_tenant, r.code, r.name || ' — demo tag', 'active');
    end loop;
  end if;
  for r in select * from (values
      ('triet.pnc@gmail.com', 'owner'),
      ('tenant-owner.demo@example.com', 'owner'),
      ('tenant-editor.demo@example.com', 'editor'),
      ('tenant-viewer.demo@example.com', 'viewer')) m(email, role) loop
    select id into v_uid from auth.users where lower(email) = r.email;
    if v_uid is not null then
      insert into public.tenant_members (tenant_id, user_id, email, role) values (v_tenant, v_uid, r.email, r.role)
        on conflict (tenant_id, user_id) do nothing;
    elsif not exists (select 1 from public.tenant_invitations where tenant_id = v_tenant and lower(email) = r.email and status = 'pending') then
      insert into public.tenant_invitations (tenant_id, email, role) values (v_tenant, r.email, r.role);
    end if;
  end loop;

  -- Tenant 2: Demo Starter Space (Starter) — used by the quota E2E test ------------
  select id into v_tenant from public.tenants where slug = 'demo-starter-space';
  if v_tenant is null then
    insert into public.tenants (name, slug, status, is_demo) values ('Demo Starter Space', 'demo-starter-space', 'active', true)
      returning id into v_tenant;
    insert into public.venues (name, slug, description, status, tenant_id)
      values ('Demo Starter Space', 'b2b-demo-starter-space', 'Demo business space', 'draft', v_tenant) returning id into v_venue;
    insert into public.collections (venue_id, name, slug, description, completion_criteria, status, tenant_id)
      values (v_venue, 'Demo Starter Space', 'b2b-demo-starter-space', 'Demo collection', '{"type":"all"}', 'active', v_tenant);
    insert into public.tenant_subscriptions (tenant_id, package_id, status) values (v_tenant, v_starter, 'active');
  end if;
  select id into v_uid from auth.users where lower(email) = 'tenant-owner.demo@example.com';
  if v_uid is not null then
    insert into public.tenant_members (tenant_id, user_id, email, role) values (v_tenant, v_uid, 'tenant-owner.demo@example.com', 'owner')
      on conflict (tenant_id, user_id) do nothing;
  end if;
end $$;
