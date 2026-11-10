-- TAPTAP CRM dashboard — additive only. Do not apply from CI.
-- A teammate reviews and runs this in the SQL editor after reading it.
--
-- Adds:
--   * public.station_taps — one row per NFC/QR tap (repeats allowed)
--   * public.crm_activity(...) — role-checked read for the dashboard and visitor CRM
--   * public.tenant_upsert_stamp(...) — editor+ create/edit of a station's stamp
--   * collect_stamp_by_code also writes one station_taps row (same response JSON)
--
-- Does not replace or call any function named *_gmail_participant_*.
-- Does not update existing pilot rows. Existing B2C rows stay tenant_id null.
--
-- Access:
--   tenant owner, admin, editor, viewer -> only the tenant they pass
--   platform admin (app_metadata.platform_role) -> one tenant, B2C, or all
-- station_taps has RLS on and no policies, and is revoked from anon/authenticated.
-- Callers read it only through crm_activity (security definer, search_path locked).

create table if not exists public.station_taps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  station_id uuid not null references public.stations(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete set null,
  nfc_tag_id uuid references public.nfc_tags(id) on delete set null,
  source text not null default 'nfc' check (source in ('nfc', 'qr', 'admin')),
  granted boolean not null default false,
  tapped_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists station_taps_tenant_tapped_idx
  on public.station_taps (tenant_id, tapped_at desc);
create index if not exists station_taps_participant_idx
  on public.station_taps (participant_id, tapped_at desc);
create index if not exists collected_stamps_collected_at_idx
  on public.collected_stamps (collected_at);

alter table public.station_taps enable row level security;
revoke all on table public.station_taps from public, anon, authenticated;

-- ---------------------------------------------------------------------------
create or replace function public.crm_activity(
  p_scope text,
  p_tenant uuid,
  p_since timestamptz,
  p_participant uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_taps jsonb;
  v_grants jsonb;
  v_holdings jsonb;
  v_stamps jsonb;
  v_people jsonb;
  v_quota jsonb;
  v_tap_count int;
  v_grant_count int;
begin
  if (select auth.uid()) is null then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;

  if p_scope = 'tenant' then
    if p_tenant is null then
      raise exception 'INVALID:tenant' using errcode = '22023';
    end if;
    perform public.taptap_require_tenant_role(p_tenant, array['owner','admin','editor','viewer']);
  elsif p_scope in ('b2c', 'all') then
    if not public.is_platform_admin() then
      raise exception 'FORBIDDEN' using errcode = '42501';
    end if;
  else
    raise exception 'INVALID:scope' using errcode = '22023';
  end if;

  if p_since is null or p_since > timezone('utc'::text, now()) + interval '5 minutes'
     or p_since < timezone('utc'::text, now()) - interval '400 days' then
    raise exception 'INVALID:since' using errcode = '22023';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'at', t.at,
      'participantId', t.participant_id,
      'stationName', t.station_name,
      'source', t.source,
      'granted', t.granted
    )), '[]'::jsonb), count(*)::int
    into v_taps, v_tap_count
  from (
    select
      tap.tapped_at as at,
      tap.participant_id,
      st.name as station_name,
      tap.source,
      tap.granted
    from public.station_taps tap
    join public.stations st on st.id = tap.station_id
    where tap.tapped_at >= p_since
      and (p_participant is null or tap.participant_id = p_participant)
      and (
        (p_scope = 'tenant' and tap.tenant_id = p_tenant)
        or (p_scope = 'b2c' and tap.tenant_id is null)
        or p_scope = 'all'
      )
    order by tap.tapped_at desc
    limit 8000
  ) t;

  select coalesce(jsonb_agg(jsonb_build_object(
      'at', g.at,
      'participantId', g.participant_id,
      'stampId', g.stamp_id,
      'stampName', g.stamp_name,
      'stationName', g.station_name,
      'source', g.source
    )), '[]'::jsonb), count(*)::int
    into v_grants, v_grant_count
  from (
    select
      cs.collected_at as at,
      cs.participant_id,
      cs.stamp_id,
      s.name as stamp_name,
      st.name as station_name,
      cs.source
    from public.collected_stamps cs
    join public.stamps s on s.id = cs.stamp_id
    left join public.stations st on st.id = coalesce(cs.station_id, s.station_id)
    where cs.collected_at >= p_since
      and (p_participant is null or cs.participant_id = p_participant)
      and (
        (p_scope = 'tenant' and s.tenant_id = p_tenant)
        or (p_scope = 'b2c' and s.tenant_id is null)
        or p_scope = 'all'
      )
    order by cs.collected_at desc
    limit 8000
  ) g;

  select coalesce(jsonb_agg(jsonb_build_object('participantId', h.participant_id, 'stampId', h.stamp_id)), '[]'::jsonb)
    into v_holdings
  from (
    select distinct cs.participant_id, cs.stamp_id
    from public.collected_stamps cs
    join public.stamps s on s.id = cs.stamp_id
    where (p_participant is null or cs.participant_id = p_participant)
      and (
        (p_scope = 'tenant' and s.tenant_id = p_tenant)
        or (p_scope = 'b2c' and s.tenant_id is null)
        or p_scope = 'all'
      )
    limit 8000
  ) h;

  select coalesce(jsonb_agg(s.id), '[]'::jsonb)
    into v_stamps
  from public.stamps s
  where s.status = 'active'
    and (
      (p_scope = 'tenant' and s.tenant_id = p_tenant)
      or (p_scope = 'b2c' and s.tenant_id is null)
      or p_scope = 'all'
    );

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id,
      'displayName', p.display_name,
      'email', p.email,
      'locale', p.locale,
      'lastAt', p.last_at
    )), '[]'::jsonb)
    into v_people
  from (
    select
      part.id,
      part.display_name,
      part.email,
      part.locale,
      greatest(
        (select max(tap.tapped_at) from public.station_taps tap
          where tap.participant_id = part.id
            and (
              (p_scope = 'tenant' and tap.tenant_id = p_tenant)
              or (p_scope = 'b2c' and tap.tenant_id is null)
              or p_scope = 'all'
            )),
        (select max(cs.collected_at) from public.collected_stamps cs
          join public.stamps s on s.id = cs.stamp_id
          where cs.participant_id = part.id
            and (
              (p_scope = 'tenant' and s.tenant_id = p_tenant)
              or (p_scope = 'b2c' and s.tenant_id is null)
              or p_scope = 'all'
            ))
      ) as last_at
    from public.participants part
    where part.id in (
      select (item->>'participantId')::uuid
      from jsonb_array_elements(v_taps) item
      where item->>'participantId' is not null
      union
      select (item->>'participantId')::uuid
      from jsonb_array_elements(v_grants) item
      where item->>'participantId' is not null
      union
      select (item->>'participantId')::uuid
      from jsonb_array_elements(v_holdings) item
      where item->>'participantId' is not null
    )
  ) p;

  if p_scope = 'tenant' then
    v_quota := jsonb_build_object(
      'limits', public.tenant_effective_limits(p_tenant),
      'used', public.tenant_resource_usage(p_tenant)
    );
  else
    v_quota := null;
  end if;

  return jsonb_build_object(
    'taps', coalesce(v_taps, '[]'::jsonb),
    'grants', coalesce(v_grants, '[]'::jsonb),
    'holdings', coalesce(v_holdings, '[]'::jsonb),
    'activeStampIds', coalesce(v_stamps, '[]'::jsonb),
    'people', coalesce(v_people, '[]'::jsonb),
    'truncated', v_tap_count >= 8000 or v_grant_count >= 8000,
    'quota', v_quota
  );
end;
$$;

-- Editor+ may rename, describe, or activate the stamp tied to a station.
-- One stamp per station per collection (existing unique key). Insert when missing.
create or replace function public.tenant_upsert_stamp(
  p_station uuid,
  p_name text,
  p_description text,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant uuid;
  v_collection uuid;
  v_stamp public.stamps;
  v_sort int;
begin
  select tenant_id into v_tenant from public.stations where id = p_station;
  if v_tenant is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;
  perform public.taptap_require_tenant_role(v_tenant, array['owner','admin','editor']);
  if coalesce(trim(p_name), '') = '' then
    raise exception 'INVALID:name' using errcode = '22023';
  end if;
  if p_status not in ('active', 'inactive') then
    raise exception 'INVALID:status' using errcode = '22023';
  end if;
  select id into v_collection from public.collections
    where tenant_id = v_tenant
    order by created_at
    limit 1;
  if v_collection is null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  select * into v_stamp from public.stamps
    where station_id = p_station and tenant_id = v_tenant
    order by created_at
    limit 1;
  if v_stamp.id is null then
    select coalesce(max(sort_order), 0) + 1 into v_sort from public.stamps where collection_id = v_collection;
    insert into public.stamps (collection_id, station_id, tenant_id, name, description, sort_order, status)
      values (v_collection, p_station, v_tenant, trim(p_name), nullif(trim(p_description), ''), v_sort, p_status)
      returning * into v_stamp;
  else
    update public.stamps
      set name = trim(p_name),
          description = nullif(trim(p_description), ''),
          status = p_status
      where id = v_stamp.id
      returning * into v_stamp;
  end if;
  return to_jsonb(v_stamp);
end;
$$;

-- Log every successful resolve as a tap, including repeat visits that do not
-- grant a new stamp. Response JSON is unchanged. Does not touch gmail RPCs.
create or replace function public.collect_stamp_by_code(p_code text, p_source text default 'nfc')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_res jsonb; v_participant uuid; v_row public.collected_stamps; v_new boolean := false;
  v_stamp uuid; v_station uuid; v_tag uuid; v_collection uuid; v_required int; v_have int;
  v_source text;
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
  v_source := case when p_source in ('nfc','qr') then p_source else 'nfc' end;

  insert into public.collected_stamps (participant_id, stamp_id, nfc_tag_id, station_id, source)
    values (v_participant, v_stamp, v_tag, v_station, v_source)
    on conflict (participant_id, stamp_id) do nothing
    returning * into v_row;
  if v_row.id is not null then
    v_new := true;
  else
    select * into v_row from public.collected_stamps where participant_id = v_participant and stamp_id = v_stamp;
  end if;

  insert into public.station_taps (tenant_id, station_id, participant_id, nfc_tag_id, source, granted, tapped_at)
  values (
    (select tenant_id from public.stations where id = v_station),
    v_station, v_participant, v_tag, v_source, v_new, timezone('utc'::text, now())
  );

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

revoke all on function public.crm_activity(text, uuid, timestamptz, uuid) from public, anon;
revoke all on function public.tenant_upsert_stamp(uuid, text, text, text) from public, anon;
grant execute on function public.crm_activity(text, uuid, timestamptz, uuid) to authenticated;
grant execute on function public.tenant_upsert_stamp(uuid, text, text, text) to authenticated;
