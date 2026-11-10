-- TAPTAP Phase 1 — SECURITY DEFINER RPCs (role checks inside, quota via triggers).
-- Error convention (mapped to HTTP by src/server/quota/errors.ts):
--   QUOTA_EXCEEDED:<resource>:<used>/<max>  (P0001 -> 409)
--   FORBIDDEN (42501 -> 403) · NOT_FOUND (P0002 -> 404) · INVALID:<field> (22023 -> 422)
--   ALREADY_MEMBER / LAST_OWNER / ROOM_NOT_IN_TENANT (P0001 -> 409/422)

create or replace function public.taptap_slugify(p_text text)
returns text language sql immutable set search_path = '' as $$
  select coalesce(nullif(trim(both '-' from regexp_replace(lower(coalesce(p_text,'')), '[^a-z0-9]+', '-', 'g')), ''), 'item');
$$;

create or replace function public.taptap_require_tenant_role(p_tenant uuid, p_roles text[])
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if not public.has_tenant_role(p_tenant, p_roles) then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.taptap_caller_tenant_role(p_tenant uuid)
returns text language sql stable security definer set search_path = '' as $$
  select case when public.is_platform_admin() then 'platform_admin' else (
    select m.role from public.tenant_members m
    where m.tenant_id = p_tenant and m.user_id = (select auth.uid())) end;
$$;

-- Adds an existing auth user as member, or records a pending invitation.
create or replace function public.taptap_add_or_invite(p_tenant uuid, p_email text, p_role text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_email text := lower(trim(p_email));
  v_user uuid;
begin
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'INVALID:email' using errcode = '22023';
  end if;
  if p_role not in ('owner','admin','editor','viewer') then
    raise exception 'INVALID:role' using errcode = '22023';
  end if;
  select id into v_user from auth.users where lower(email) = v_email limit 1;
  if v_user is not null then
    if exists (select 1 from public.tenant_members where tenant_id = p_tenant and user_id = v_user) then
      raise exception 'ALREADY_MEMBER' using errcode = 'P0001';
    end if;
    insert into public.tenant_members (tenant_id, user_id, email, role)
      values (p_tenant, v_user, v_email, p_role);
    return jsonb_build_object('status','added','email',v_email,'role',p_role);
  end if;
  if exists (select 1 from public.tenant_invitations
             where tenant_id = p_tenant and lower(email) = v_email and status = 'pending') then
    raise exception 'ALREADY_MEMBER' using errcode = 'P0001';
  end if;
  insert into public.tenant_invitations (tenant_id, email, role, invited_by)
    values (p_tenant, v_email, p_role, (select auth.uid()));
  return jsonb_build_object('status','invited','email',v_email,'role',p_role);
end;
$$;

-- ---------------------------------------------------------------- Platform admin
create or replace function public.platform_upsert_package(
  p_code text, p_name text, p_max_rooms int, p_max_stations int, p_max_members int,
  p_max_active_nfc_tags int, p_status text default 'active')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v public.subscription_packages;
begin
  if not public.is_platform_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if least(p_max_rooms, p_max_stations, p_max_active_nfc_tags) < 0 or p_max_members < 1 then
    raise exception 'INVALID:limits' using errcode = '22023';
  end if;
  insert into public.subscription_packages (code, name, max_rooms, max_stations, max_members, max_active_nfc_tags, status)
  values (lower(trim(p_code)), trim(p_name), p_max_rooms, p_max_stations, p_max_members, p_max_active_nfc_tags, coalesce(p_status,'active'))
  on conflict (code) do update set name = excluded.name, max_rooms = excluded.max_rooms,
    max_stations = excluded.max_stations, max_members = excluded.max_members,
    max_active_nfc_tags = excluded.max_active_nfc_tags, status = excluded.status
  returning * into v;
  return to_jsonb(v);
end;
$$;

create or replace function public.platform_create_tenant(
  p_name text, p_slug text, p_package_code text, p_owner_email text default null, p_is_demo boolean default false)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_tenant uuid;
  v_venue uuid;
  v_pkg uuid;
  v_slug text := public.taptap_slugify(coalesce(nullif(p_slug,''), p_name));
  v_invite jsonb;
begin
  if not public.is_platform_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if coalesce(trim(p_name),'') = '' then raise exception 'INVALID:name' using errcode = '22023'; end if;
  select id into v_pkg from public.subscription_packages where code = lower(trim(p_package_code)) and status = 'active';
  if v_pkg is null then raise exception 'NOT_FOUND' using errcode = 'P0002', hint = 'package'; end if;
  if exists (select 1 from public.tenants where slug = v_slug) then
    raise exception 'INVALID:slug_taken' using errcode = '22023';
  end if;

  insert into public.tenants (name, slug, status, is_demo, created_by)
    values (trim(p_name), v_slug, 'active', coalesce(p_is_demo,false), (select auth.uid()))
    returning id into v_tenant;
  -- Hidden backing venue + collection so tenant stations reuse the /s/[code] collect path.
  insert into public.venues (name, slug, description, status, tenant_id)
    values (trim(p_name), 'b2b-' || v_slug, 'TAPTAP Business space', 'draft', v_tenant)
    returning id into v_venue;
  insert into public.collections (venue_id, name, slug, description, completion_criteria, status, tenant_id)
    values (v_venue, trim(p_name), 'b2b-' || v_slug, 'TAPTAP Business collection',
            '{"type":"all"}'::jsonb, 'active', v_tenant);
  insert into public.tenant_subscriptions (tenant_id, package_id, status)
    values (v_tenant, v_pkg, 'active');
  if coalesce(trim(p_owner_email),'') <> '' then
    v_invite := public.taptap_add_or_invite(v_tenant, p_owner_email, 'owner');
  end if;
  return jsonb_build_object('id', v_tenant, 'slug', v_slug, 'owner', v_invite);
end;
$$;

create or replace function public.platform_set_tenant_status(p_tenant uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if p_status not in ('pending','active','suspended') then raise exception 'INVALID:status' using errcode = '22023'; end if;
  update public.tenants set status = p_status where id = p_tenant;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.platform_assign_package(p_tenant uuid, p_package_code text, p_quota_overrides jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare v_pkg uuid;
begin
  if not public.is_platform_admin() then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select id into v_pkg from public.subscription_packages where code = lower(trim(p_package_code)) and status = 'active';
  if v_pkg is null then raise exception 'NOT_FOUND' using errcode = 'P0002', hint = 'package'; end if;
  if not exists (select 1 from public.tenants where id = p_tenant) then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  update public.tenant_subscriptions set status = 'canceled', ends_at = now()
    where tenant_id = p_tenant and status = 'active';
  insert into public.tenant_subscriptions (tenant_id, package_id, status, quota_overrides)
    values (p_tenant, v_pkg, 'active', coalesce(p_quota_overrides, '{}'::jsonb));
end;
$$;

-- ------------------------------------------------------------------- Tenant usage
create or replace function public.tenant_usage(p_tenant uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  perform public.taptap_require_tenant_role(p_tenant, array['owner','admin','editor','viewer']);
  return jsonb_build_object(
    'limits', public.tenant_effective_limits(p_tenant),
    'used', public.tenant_resource_usage(p_tenant),
    'role', public.taptap_caller_tenant_role(p_tenant));
end;
$$;

-- ---------------------------------------------------------------- Members
create or replace function public.tenant_invite_member(p_tenant uuid, p_email text, p_role text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_caller text;
begin
  perform public.taptap_require_tenant_role(p_tenant, array['owner','admin']);
  v_caller := public.taptap_caller_tenant_role(p_tenant);
  if v_caller = 'admin' and p_role = 'owner' then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return public.taptap_add_or_invite(p_tenant, p_email, p_role);
end;
$$;

create or replace function public.tenant_set_member_role(p_tenant uuid, p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_caller text; v_current text;
begin
  perform public.taptap_require_tenant_role(p_tenant, array['owner','admin']);
  if p_role not in ('owner','admin','editor','viewer') then raise exception 'INVALID:role' using errcode = '22023'; end if;
  v_caller := public.taptap_caller_tenant_role(p_tenant);
  select role into v_current from public.tenant_members where tenant_id = p_tenant and user_id = p_user;
  if v_current is null then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_caller = 'admin' and (p_role = 'owner' or v_current = 'owner') then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  if v_current = 'owner' and p_role <> 'owner'
     and (select count(*) from public.tenant_members where tenant_id = p_tenant and role = 'owner') <= 1 then
    raise exception 'LAST_OWNER' using errcode = 'P0001';
  end if;
  update public.tenant_members set role = p_role where tenant_id = p_tenant and user_id = p_user;
end;
$$;

create or replace function public.tenant_remove_member(p_tenant uuid, p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_caller text; v_current text;
begin
  perform public.taptap_require_tenant_role(p_tenant, array['owner','admin']);
  v_caller := public.taptap_caller_tenant_role(p_tenant);
  select role into v_current from public.tenant_members where tenant_id = p_tenant and user_id = p_user;
  if v_current is null then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  if v_caller = 'admin' and v_current = 'owner' then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  if v_current = 'owner'
     and (select count(*) from public.tenant_members where tenant_id = p_tenant and role = 'owner') <= 1 then
    raise exception 'LAST_OWNER' using errcode = 'P0001';
  end if;
  delete from public.tenant_members where tenant_id = p_tenant and user_id = p_user;
end;
$$;

create or replace function public.tenant_revoke_invitation(p_invitation uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_tenant uuid;
begin
  select tenant_id into v_tenant from public.tenant_invitations where id = p_invitation and status = 'pending';
  if v_tenant is null then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  perform public.taptap_require_tenant_role(v_tenant, array['owner','admin']);
  update public.tenant_invitations set status = 'revoked' where id = p_invitation;
end;
$$;

-- Called after sign-in: converts pending invitations for the caller's verified email.
create or replace function public.accept_my_invitations()
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  r record;
  n int := 0;
begin
  if v_uid is null then return 0; end if;
  select lower(email) into v_email from auth.users where id = v_uid and email_confirmed_at is not null;
  if v_email is null then return 0; end if;
  for r in select * from public.tenant_invitations where lower(email) = v_email and status = 'pending' loop
    update public.tenant_invitations set status = 'accepted', accepted_at = now() where id = r.id;
    insert into public.tenant_members (tenant_id, user_id, email, role)
      values (r.tenant_id, v_uid, v_email, r.role)
      on conflict (tenant_id, user_id) do nothing;
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- ------------------------------------------------------------------ Rooms
create or replace function public.tenant_create_room(p_tenant uuid, p_name text, p_description text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_base text; v_slug text; i int := 1; v public.rooms;
begin
  perform public.taptap_require_tenant_role(p_tenant, array['owner','admin']);
  if coalesce(trim(p_name),'') = '' then raise exception 'INVALID:name' using errcode = '22023'; end if;
  v_base := left(public.taptap_slugify(p_name), 70);
  v_slug := v_base;
  while exists (select 1 from public.rooms where tenant_id = p_tenant and slug = v_slug) loop
    i := i + 1; v_slug := v_base || '-' || i;
  end loop;
  insert into public.rooms (tenant_id, name, slug, description, status)
    values (p_tenant, trim(p_name), v_slug, nullif(trim(p_description),''), 'active')
    returning * into v;
  return to_jsonb(v);
end;
$$;

create or replace function public.tenant_update_room(p_room uuid, p_name text, p_description text, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_tenant uuid;
begin
  select tenant_id into v_tenant from public.rooms where id = p_room;
  if v_tenant is null then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  perform public.taptap_require_tenant_role(v_tenant, array['owner','admin']);
  if p_status not in ('draft','active','archived') then raise exception 'INVALID:status' using errcode = '22023'; end if;
  update public.rooms set name = coalesce(nullif(trim(p_name),''), name),
    description = nullif(trim(p_description),''), status = p_status where id = p_room;
end;
$$;

create or replace function public.tenant_delete_room(p_room uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_tenant uuid;
begin
  select tenant_id into v_tenant from public.rooms where id = p_room;
  if v_tenant is null then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  perform public.taptap_require_tenant_role(v_tenant, array['owner','admin']);
  delete from public.rooms where id = p_room;
end;
$$;

-- --------------------------------------------------------------- Stations / tags
create or replace function public.tenant_create_station(p_tenant uuid, p_room uuid, p_name text, p_description text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_venue uuid; v_collection uuid; v_base text; v_slug text; i int := 1;
  v_station public.stations; v_sort int;
begin
  perform public.taptap_require_tenant_role(p_tenant, array['owner','admin','editor']);
  if coalesce(trim(p_name),'') = '' then raise exception 'INVALID:name' using errcode = '22023'; end if;
  if p_room is not null and not exists (select 1 from public.rooms where id = p_room and tenant_id = p_tenant) then
    raise exception 'ROOM_NOT_IN_TENANT' using errcode = '22023';
  end if;
  select id into v_venue from public.venues where tenant_id = p_tenant;
  select id into v_collection from public.collections where tenant_id = p_tenant order by created_at limit 1;
  if v_venue is null or v_collection is null then raise exception 'NOT_FOUND' using errcode = 'P0002', hint = 'tenant_space'; end if;
  v_base := left(public.taptap_slugify(p_name), 70);
  v_slug := v_base;
  while exists (select 1 from public.stations where venue_id = v_venue and slug = v_slug) loop
    i := i + 1; v_slug := v_base || '-' || i;
  end loop;
  insert into public.stations (venue_id, tenant_id, room_id, name, slug, description, status)
    values (v_venue, p_tenant, p_room, trim(p_name), v_slug, nullif(trim(p_description),''), 'active')
    returning * into v_station;
  select coalesce(max(sort_order), 0) + 1 into v_sort from public.stamps where collection_id = v_collection;
  insert into public.stamps (collection_id, station_id, tenant_id, name, description, sort_order, status)
    values (v_collection, v_station.id, p_tenant, v_station.name, v_station.description, v_sort, 'active');
  return to_jsonb(v_station);
end;
$$;

create or replace function public.tenant_update_station(p_station uuid, p_name text, p_description text, p_status text, p_room uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_tenant uuid;
begin
  select tenant_id into v_tenant from public.stations where id = p_station;
  if v_tenant is null then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  perform public.taptap_require_tenant_role(v_tenant, array['owner','admin','editor']);
  if p_status not in ('active','maintenance','inactive') then raise exception 'INVALID:status' using errcode = '22023'; end if;
  if p_room is not null and not exists (select 1 from public.rooms where id = p_room and tenant_id = v_tenant) then
    raise exception 'ROOM_NOT_IN_TENANT' using errcode = '22023';
  end if;
  update public.stations set name = coalesce(nullif(trim(p_name),''), name),
    description = nullif(trim(p_description),''), status = p_status, room_id = p_room
    where id = p_station;
  update public.stamps set name = coalesce(nullif(trim(p_name),''), name),
    status = case when p_status = 'active' then 'active' else 'inactive' end
    where station_id = p_station and tenant_id = v_tenant;
end;
$$;

create or replace function public.tenant_create_tag(p_station uuid, p_label text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_tenant uuid; v_code text; v public.nfc_tags;
begin
  select tenant_id into v_tenant from public.stations where id = p_station;
  if v_tenant is null then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  perform public.taptap_require_tenant_role(v_tenant, array['owner','admin','editor']);
  loop
    v_code := 'tt-' || substr(md5(gen_random_uuid()::text), 1, 10);
    exit when not exists (select 1 from public.nfc_tags where public_code = v_code);
  end loop;
  insert into public.nfc_tags (station_id, tenant_id, public_code, label, status)
    values (p_station, v_tenant, v_code, nullif(trim(p_label),''), 'active')
    returning * into v;
  return to_jsonb(v);
end;
$$;

create or replace function public.tenant_set_tag_status(p_tag uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_tenant uuid;
begin
  select tenant_id into v_tenant from public.nfc_tags where id = p_tag;
  if v_tenant is null then raise exception 'NOT_FOUND' using errcode = 'P0002'; end if;
  perform public.taptap_require_tenant_role(v_tenant, array['owner','admin','editor']);
  if p_status not in ('active','disabled','lost','replaced') then raise exception 'INVALID:status' using errcode = '22023'; end if;
  update public.nfc_tags set status = p_status where id = p_tag;
end;
$$;

-- ------------------------------------------------------------------ Player (/s/[code])
create or replace function public.resolve_public_tag(p_code text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_tag public.nfc_tags; v_station public.stations; v_stamp public.stamps;
  v_collection public.collections; v_venue public.venues; v_room public.rooms;
  v_tenant public.tenants; v_status text := 'ok';
begin
  if p_code is null or p_code !~ '^[A-Za-z0-9_-]{6,64}$' then
    return jsonb_build_object('status','invalid_code');
  end if;
  select * into v_tag from public.nfc_tags where public_code = lower(trim(p_code));
  if v_tag.id is null then return jsonb_build_object('status','not_found'); end if;
  select * into v_station from public.stations where id = v_tag.station_id;
  select * into v_venue from public.venues where id = v_station.venue_id;
  select s.* into v_stamp from public.stamps s
    join public.collections c on c.id = s.collection_id
    where s.station_id = v_station.id
    order by (s.status = 'active') desc, (c.status = 'active') desc, s.created_at
    limit 1;
  if v_stamp.id is not null then
    select * into v_collection from public.collections where id = v_stamp.collection_id;
  end if;
  if v_station.tenant_id is not null then
    select * into v_tenant from public.tenants where id = v_station.tenant_id;
    if v_station.room_id is not null then select * into v_room from public.rooms where id = v_station.room_id; end if;
  end if;

  if v_tag.status <> 'active' then v_status := 'tag_disabled';
  elsif v_station.status <> 'active' or v_stamp.id is null or v_stamp.status <> 'active'
        or v_collection.status is distinct from 'active'
        or (v_station.tenant_id is null and v_venue.status <> 'active')
        or (v_tenant.id is not null and v_tenant.status <> 'active')
        or (v_room.id is not null and v_room.status <> 'active') then
    v_status := 'station_inactive';
  end if;

  return jsonb_build_object(
    'status', v_status,
    'tag', jsonb_build_object('id', v_tag.id, 'public_code', v_tag.public_code, 'label', v_tag.label, 'status', v_tag.status),
    'station', jsonb_build_object('id', v_station.id, 'slug', v_station.slug, 'name', v_station.name,
      'description', v_station.description, 'location_hint', v_station.location_hint, 'image_url', v_station.image_url,
      'latitude', v_station.latitude, 'longitude', v_station.longitude, 'status', v_station.status),
    'stamp', case when v_stamp.id is null then null else jsonb_build_object('id', v_stamp.id, 'name', v_stamp.name,
      'description', v_stamp.description, 'image_url', v_stamp.image_url, 'sort_order', v_stamp.sort_order, 'status', v_stamp.status) end,
    'collection', case when v_collection.id is null then null else jsonb_build_object('id', v_collection.id,
      'slug', v_collection.slug, 'name', v_collection.name, 'description', v_collection.description,
      'completion_criteria', v_collection.completion_criteria, 'status', v_collection.status) end,
    'venue', jsonb_build_object('id', v_venue.id, 'slug', v_venue.slug, 'name', v_venue.name, 'description', v_venue.description),
    'tenant', case when v_tenant.id is null then null else jsonb_build_object('name', v_tenant.name) end,
    'room', case when v_room.id is null then null else jsonb_build_object('name', v_room.name) end);
end;
$$;

create or replace function public.taptap_ensure_participant()
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := (select auth.uid()); v_id uuid; v_email text; v_name text;
begin
  if v_uid is null then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select id into v_id from public.participants where auth_user_id = v_uid;
  if v_id is not null then return v_id; end if;
  select lower(email), coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email,'@',1))
    into v_email, v_name from auth.users where id = v_uid;
  if v_email is not null then
    update public.participants set auth_user_id = v_uid
      where auth_user_id is null and lower(trim(email)) = v_email
      returning id into v_id;
    if v_id is not null then return v_id; end if;
  end if;
  insert into public.participants (auth_user_id, email, display_name)
    values (v_uid, v_email, v_name) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.collect_stamp_by_code(p_code text, p_source text default 'nfc')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_res jsonb; v_participant uuid; v_row public.collected_stamps; v_new boolean := false;
  v_stamp uuid; v_station uuid; v_tag uuid; v_collection uuid; v_required int; v_have int;
begin
  if (select auth.uid()) is null then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  v_res := public.resolve_public_tag(p_code);
  if v_res->>'status' <> 'ok' then
    return jsonb_build_object('ok', false, 'status', v_res->>'status');
  end if;
  v_stamp := (v_res->'stamp'->>'id')::uuid;
  v_station := (v_res->'station'->>'id')::uuid;
  v_tag := (v_res->'tag'->>'id')::uuid;
  v_collection := (v_res->'collection'->>'id')::uuid;
  v_participant := public.taptap_ensure_participant();

  insert into public.collected_stamps (participant_id, stamp_id, nfc_tag_id, station_id, source)
    values (v_participant, v_stamp, v_tag, v_station,
            case when p_source in ('nfc','qr') then p_source else 'nfc' end)
    on conflict (participant_id, stamp_id) do nothing
    returning * into v_row;
  if v_row.id is not null then
    v_new := true;
  else
    select * into v_row from public.collected_stamps where participant_id = v_participant and stamp_id = v_stamp;
  end if;

  -- Completion badges (existing rewards/badges module unchanged).
  select coalesce((completion_criteria->>'required')::int,
                  (select count(*) from public.stamps where collection_id = v_collection and status = 'active'))
    into v_required from public.collections where id = v_collection;
  select count(*) into v_have from public.collected_stamps cs join public.stamps s on s.id = cs.stamp_id
    where cs.participant_id = v_participant and s.collection_id = v_collection;
  if v_required > 0 and v_have >= v_required then
    insert into public.participant_badges (participant_id, badge_id)
      select v_participant, b.id from public.badges b where b.collection_id = v_collection
      on conflict (participant_id, badge_id) do nothing;
  end if;

  return jsonb_build_object('ok', true, 'newly_collected', v_new, 'participant_id', v_participant,
    'record', jsonb_build_object('id', v_row.id, 'stamp_id', v_row.stamp_id, 'station_id', v_station,
      'nfc_tag_id', v_row.nfc_tag_id, 'public_code', v_res->'tag'->>'public_code',
      'collected_at', v_row.collected_at, 'source', v_row.source),
    'collection_progress', jsonb_build_object('have', v_have, 'required', v_required));
end;
$$;

create or replace function public.my_passport()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', cs.id, 'participant_id', cs.participant_id, 'stamp_id', cs.stamp_id,
      'station_id', s.station_id,
      'public_code', coalesce(
        (select t.public_code from public.nfc_tags t where t.id = cs.nfc_tag_id),
        (select t.public_code from public.nfc_tags t where t.station_id = s.station_id and t.status = 'active' order by t.created_at limit 1)),
      'collected_at', cs.collected_at, 'source', cs.source) order by cs.collected_at), '[]'::jsonb)
  from public.collected_stamps cs
  join public.participants p on p.id = cs.participant_id
  join public.stamps s on s.id = cs.stamp_id
  where p.auth_user_id = (select auth.uid()) and s.tenant_id is null;
$$;

-- -------------------------------------------------------------------- Grants
do $$
declare f text;
begin
  foreach f in array array[
    'public.taptap_require_tenant_role(uuid, text[])',
    'public.taptap_caller_tenant_role(uuid)',
    'public.taptap_add_or_invite(uuid, text, text)',
    'public.taptap_ensure_participant()',
    'public.platform_upsert_package(text, text, integer, integer, integer, integer, text)',
    'public.platform_create_tenant(text, text, text, text, boolean)',
    'public.platform_set_tenant_status(uuid, text)',
    'public.platform_assign_package(uuid, text, jsonb)',
    'public.tenant_usage(uuid)',
    'public.tenant_invite_member(uuid, text, text)',
    'public.tenant_set_member_role(uuid, uuid, text)',
    'public.tenant_remove_member(uuid, uuid)',
    'public.tenant_revoke_invitation(uuid)',
    'public.accept_my_invitations()',
    'public.tenant_create_room(uuid, text, text)',
    'public.tenant_update_room(uuid, text, text, text)',
    'public.tenant_delete_room(uuid)',
    'public.tenant_create_station(uuid, uuid, text, text)',
    'public.tenant_update_station(uuid, text, text, text, uuid)',
    'public.tenant_create_tag(uuid, text)',
    'public.tenant_set_tag_status(uuid, text)',
    'public.collect_stamp_by_code(text, text)',
    'public.my_passport()',
    'public.resolve_public_tag(text)'
  ] loop
    execute format('revoke all on function %s from public, anon', f);
  end loop;
end $$;

-- Internal helpers: not callable through the API at all.
revoke all on function public.taptap_add_or_invite(uuid, text, text) from authenticated;
revoke all on function public.taptap_ensure_participant() from authenticated;
revoke all on function public.taptap_require_tenant_role(uuid, text[]) from authenticated;
revoke all on function public.taptap_caller_tenant_role(uuid) from authenticated;

grant execute on function public.platform_upsert_package(text, text, integer, integer, integer, integer, text) to authenticated;
grant execute on function public.platform_create_tenant(text, text, text, text, boolean) to authenticated;
grant execute on function public.platform_set_tenant_status(uuid, text) to authenticated;
grant execute on function public.platform_assign_package(uuid, text, jsonb) to authenticated;
grant execute on function public.tenant_usage(uuid) to authenticated;
grant execute on function public.tenant_invite_member(uuid, text, text) to authenticated;
grant execute on function public.tenant_set_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.tenant_remove_member(uuid, uuid) to authenticated;
grant execute on function public.tenant_revoke_invitation(uuid) to authenticated;
grant execute on function public.accept_my_invitations() to authenticated;
grant execute on function public.tenant_create_room(uuid, text, text) to authenticated;
grant execute on function public.tenant_update_room(uuid, text, text, text) to authenticated;
grant execute on function public.tenant_delete_room(uuid) to authenticated;
grant execute on function public.tenant_create_station(uuid, uuid, text, text) to authenticated;
grant execute on function public.tenant_update_station(uuid, text, text, text, uuid) to authenticated;
grant execute on function public.tenant_create_tag(uuid, text) to authenticated;
grant execute on function public.tenant_set_tag_status(uuid, text) to authenticated;
grant execute on function public.collect_stamp_by_code(text, text) to authenticated;
grant execute on function public.my_passport() to authenticated;
grant execute on function public.resolve_public_tag(text) to anon, authenticated;
