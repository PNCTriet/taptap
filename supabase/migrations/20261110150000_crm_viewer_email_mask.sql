-- TAPTAP CRM polish — additive. CREATE OR REPLACE of public.crm_activity only.
-- Same signature, same grants (create or replace keeps them), same role checks.
-- Change: when a tenant VIEWER reads scope 'tenant', visitor emails are masked
-- server-side as  x***@domain  and each person carries emailMasked=true.
-- Owner/admin/editor and platform admin are unchanged.
-- Does not touch any *_gmail_participant_* function.

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
  v_mask boolean := false;
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

  -- Tenant viewers get masked visitor emails (enforced here, not only in the UI).
  -- Owners, admins, editors and platform admins see the full address.
  if p_scope = 'tenant'
     and not public.is_platform_admin()
     and not public.has_tenant_role(p_tenant, array['owner','admin','editor']) then
    v_mask := true;
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
      'email', case
        when p.email is null or not v_mask then p.email
        when position('@' in p.email) > 1 then
          left(p.email, 1) || '***' || substr(p.email, position('@' in p.email))
        else '***'
      end,
      'emailMasked', v_mask and p.email is not null,
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

