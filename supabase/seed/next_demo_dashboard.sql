-- TAPTAP — demo dashboard activity. Additive and idempotent. Do not apply from CI.
-- A teammate reviews this, applies supabase/migrations/20261110143000_crm_dashboard.sql
-- first (the tap log table), then runs this file by hand.
--
-- Touches only:
--   * the tenant whose slug is demo-toy-studio AND is_demo is true
--   * rooms, stations, stamps, and tags created here under that tenant
--   * participant rows with email demo-visitor-NN@example.com
--   * collected_stamps and station_taps for those demo visitors
--
-- It does not create or replace functions (including *_gmail_participant_*).
-- It does not update any other tenant, any pilot B2C row, or any real visitor.
-- Re-running uses fixed ids and ON CONFLICT, so it does not duplicate rows.
-- If demo-toy-studio is missing, or is_demo is not true, the script does nothing
-- (or stops) and leaves the database unchanged.

do $$
declare
  v_tenant uuid;
  v_demo boolean;
  v_venue uuid;
  v_collection uuid;
  v_room uuid;
  v_station uuid;
  v_stamp uuid;
  v_pid uuid;
  v_stations uuid[];
  v_station_count int;
  v_day date;
  v_at timestamptz;
  v_tap uuid;
  v_grant uuid;
  v_index int;
  v_granted boolean;
  i int;
  d int;
  spec record;
begin
  select id, is_demo into v_tenant, v_demo
    from public.tenants
   where slug = 'demo-toy-studio';

  if v_tenant is null then
    raise notice 'next_demo_dashboard: demo-toy-studio is not present; nothing inserted';
    return;
  end if;
  if v_demo is not true then
    raise exception 'next_demo_dashboard: refusing to write because demo-toy-studio is not marked is_demo';
  end if;
  if to_regclass('public.station_taps') is null then
    raise exception 'next_demo_dashboard: apply supabase/migrations/20261110143000_crm_dashboard.sql before this seed';
  end if;

  select id into v_venue from public.venues where tenant_id = v_tenant order by created_at limit 1;
  select id into v_collection from public.collections where tenant_id = v_tenant order by created_at limit 1;
  select id into v_room from public.rooms where tenant_id = v_tenant and slug = 'play-room-a';
  if v_room is null then
    select id into v_room from public.rooms where tenant_id = v_tenant order by created_at limit 1;
  end if;
  if v_venue is null or v_collection is null or v_room is null then
    raise notice 'next_demo_dashboard: demo tenant has no venue, collection, or room; run phase1 demo seed first';
    return;
  end if;

  -- Extra demo stations so the trail has more than the two phase-1 toys.
  -- Quota errors are swallowed: the seed keeps the stations that already exist.
  for spec in
    select * from (values
      ('d4440000-0000-4000-8000-000000000001'::uuid, 'Demo Kiosk', 'demo-dash-kiosk', 'tt-demodash01'),
      ('d4440000-0000-4000-8000-000000000002'::uuid, 'Demo Plush', 'demo-dash-plush', 'tt-demodash02'),
      ('d4440000-0000-4000-8000-000000000003'::uuid, 'Demo Blocks', 'demo-dash-blocks', 'tt-demodash03'),
      ('d4440000-0000-4000-8000-000000000004'::uuid, 'Demo Train', 'demo-dash-train', 'tt-demodash04')
    ) as s(id, name, slug, code)
  loop
    begin
      insert into public.stations (id, venue_id, tenant_id, room_id, name, slug, description, status)
      values (spec.id, v_venue, v_tenant, v_room, spec.name, spec.slug, 'Demo dashboard station', 'active')
      on conflict (venue_id, slug) do nothing;
    exception
      when sqlstate 'P0001' then
        raise notice 'next_demo_dashboard: skipped station % (%)', spec.slug, sqlerrm;
    end;

    select id into v_station from public.stations
      where tenant_id = v_tenant and venue_id = v_venue and slug = spec.slug;
    if v_station is null then
      continue;
    end if;

    insert into public.stamps (collection_id, station_id, tenant_id, name, description, sort_order, status)
    values (v_collection, v_station, v_tenant, spec.name, 'Demo dashboard stamp', 10, 'active')
    on conflict (collection_id, station_id) do nothing;

    begin
      insert into public.nfc_tags (station_id, tenant_id, public_code, label, status)
      values (v_station, v_tenant, spec.code, spec.name || ' — demo tag', 'active')
      on conflict (public_code) do nothing;
    exception
      when sqlstate 'P0001' then
        raise notice 'next_demo_dashboard: skipped tag % (%)', spec.code, sqlerrm;
    end;
  end loop;

  select coalesce(array_agg(id order by slug), '{}') into v_stations
    from public.stations
   where tenant_id = v_tenant
     and slug in ('robot-racer', 'puzzle-cube', 'demo-dash-kiosk', 'demo-dash-plush', 'demo-dash-blocks', 'demo-dash-train');
  v_station_count := coalesce(array_length(v_stations, 1), 0);
  if v_station_count = 0 then
    raise notice 'next_demo_dashboard: no demo stations to attach activity to';
    return;
  end if;

  for i in 1..40 loop
    v_pid := ('d1110000-0000-4000-8000-' || lpad(to_hex(i), 12, '0'))::uuid;
    begin
      insert into public.participants (id, display_name, email, locale, guest_token_hash)
      values (
        v_pid,
        'Demo visitor ' || lpad(i::text, 2, '0'),
        'demo-visitor-' || lpad(i::text, 2, '0') || '@example.com',
        case when i % 2 = 0 then 'vi' else 'en' end,
        'demo-dashboard:' || lpad(i::text, 2, '0')
      )
      on conflict (id) do update
        set display_name = excluded.display_name,
            locale = excluded.locale
        where participants.email = excluded.email
          and participants.email like 'demo-visitor-%@example.com';
    exception
      when unique_violation then
        select id into v_pid from public.participants
         where lower(email) = 'demo-visitor-' || lpad(i::text, 2, '0') || '@example.com'
           and email like 'demo-visitor-%@example.com';
        if v_pid is null then
          raise notice 'next_demo_dashboard: skipped visitor %; email is not a demo-visitor row', i;
          continue;
        end if;
    end;

    -- About one visit every four days across the last 30 days, plus a
    -- weekend bump, so the chart is uneven rather than a flat line.
    for d in 0..29 loop
      if ((i * 5 + d * 3) % 4) <> 0 and not (d % 7 = 0 and i % 3 = 0) then
        continue;
      end if;
      if not exists (
        select 1 from public.participants
         where id = v_pid and email like 'demo-visitor-%@example.com'
      ) then
        continue;
      end if;

      v_index := 1 + ((i + d) % v_station_count);
      v_station := v_stations[v_index];
      if v_station is null or not exists (
        select 1 from public.stations where id = v_station and tenant_id = v_tenant
      ) then
        continue;
      end if;

      select id into v_stamp from public.stamps
        where station_id = v_station and tenant_id = v_tenant
        order by created_at
        limit 1;

      v_day := (timezone('utc', now()))::date - d;
      v_at := v_day::timestamp + time '09:15' + ((i * 17 + d) % 9) * interval '50 minutes';
      v_tap := ('d2220000-0000-4000-8000-' || lpad(to_hex(i * 100 + d), 12, '0'))::uuid;
      v_granted := v_stamp is not null and not exists (
        select 1 from public.collected_stamps
         where participant_id = v_pid and stamp_id = v_stamp
      );

      insert into public.station_taps (id, tenant_id, station_id, participant_id, source, granted, tapped_at)
      values (
        v_tap,
        v_tenant,
        v_station,
        v_pid,
        case when (i + d) % 5 = 0 then 'qr' else 'nfc' end,
        v_granted,
        v_at
      )
      on conflict (id) do nothing;

      if v_granted then
        v_grant := ('d3330000-0000-4000-8000-' || lpad(to_hex(i * 100 + v_index), 12, '0'))::uuid;
        insert into public.collected_stamps (id, participant_id, stamp_id, station_id, collected_at, source)
        values (v_grant, v_pid, v_stamp, v_station, v_at, case when (i + d) % 5 = 0 then 'qr' else 'nfc' end)
        on conflict (participant_id, stamp_id) do nothing;
      end if;
    end loop;
  end loop;
end $$;
