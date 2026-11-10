-- Next: B2B stamps in the passport + server-side guest progress merge.
-- Additive only: two nullable columns on participants, new SECURITY DEFINER RPCs.
-- collect_stamp_by_code keeps its signature and behaviour (body now delegates to a shared helper).

alter table public.participants
  add column if not exists merged_into uuid references public.participants(id) on delete set null,
  add column if not exists merged_at timestamptz;

comment on column public.participants.guest_token_hash is
  'sha256 hex of the httpOnly tt_guest cookie. Only the browser holding the cookie can act as this guest.';
comment on column public.participants.merged_into is
  'Set when this guest participant was merged into a signed-in participant (idempotent merge).';

-- ------------------------------------------------------------------ helpers
create or replace function public.taptap_guest_hash(p_token text)
returns text language plpgsql immutable set search_path = '' as $$
begin
  if p_token is null or length(p_token) < 32 or length(p_token) > 128 or p_token !~ '^[A-Za-z0-9_-]+$' then
    raise exception 'INVALID:guest_token' using errcode = '22023';
  end if;
  return encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
end;
$$;

-- Find (and optionally create) the guest participant that belongs to this token.
-- Never returns a participant linked to an account or already merged.
create or replace function public.taptap_guest_participant(p_token text, p_create boolean)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_hash text := public.taptap_guest_hash(p_token); v_id uuid;
begin
  select id into v_id from public.participants
    where guest_token_hash = v_hash and auth_user_id is null and merged_into is null;
  if v_id is not null or not p_create then return v_id; end if;
  insert into public.participants (guest_token_hash, display_name)
    values (v_hash, 'Guest')
    on conflict (guest_token_hash) do nothing
    returning id into v_id;
  if v_id is null then
    select id into v_id from public.participants
      where guest_token_hash = v_hash and auth_user_id is null and merged_into is null;
  end if;
  return v_id;
end;
$$;

create or replace function public.taptap_award_badges(p_participant uuid, p_collection uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_required int; v_have int;
begin
  select coalesce((completion_criteria->>'required')::int,
                  (select count(*) from public.stamps where collection_id = p_collection and status = 'active'))
    into v_required from public.collections where id = p_collection;
  select count(*) into v_have from public.collected_stamps cs join public.stamps s on s.id = cs.stamp_id
    where cs.participant_id = p_participant and s.collection_id = p_collection;
  if v_required > 0 and v_have >= v_required then
    insert into public.participant_badges (participant_id, badge_id)
      select p_participant, b.id from public.badges b where b.collection_id = p_collection
      on conflict (participant_id, badge_id) do nothing;
  end if;
end;
$$;

-- Shared collect logic (B2C and B2B tags), idempotent per participant + stamp.
create or replace function public.taptap_collect_for(p_participant uuid, p_code text, p_source text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_res jsonb; v_row public.collected_stamps; v_new boolean := false;
  v_stamp uuid; v_station uuid; v_tag uuid; v_collection uuid; v_required int; v_have int;
begin
  v_res := public.resolve_public_tag(p_code);
  if v_res->>'status' <> 'ok' then
    return jsonb_build_object('ok', false, 'status', v_res->>'status');
  end if;
  v_stamp := (v_res->'stamp'->>'id')::uuid;
  v_station := (v_res->'station'->>'id')::uuid;
  v_tag := (v_res->'tag'->>'id')::uuid;
  v_collection := (v_res->'collection'->>'id')::uuid;

  insert into public.collected_stamps (participant_id, stamp_id, nfc_tag_id, station_id, source)
    values (p_participant, v_stamp, v_tag, v_station,
            case when p_source in ('nfc','qr') then p_source else 'nfc' end)
    on conflict (participant_id, stamp_id) do nothing
    returning * into v_row;
  if v_row.id is not null then
    v_new := true;
  else
    select * into v_row from public.collected_stamps where participant_id = p_participant and stamp_id = v_stamp;
  end if;

  perform public.taptap_award_badges(p_participant, v_collection);
  select coalesce((completion_criteria->>'required')::int,
                  (select count(*) from public.stamps where collection_id = v_collection and status = 'active'))
    into v_required from public.collections where id = v_collection;
  select count(*) into v_have from public.collected_stamps cs join public.stamps s on s.id = cs.stamp_id
    where cs.participant_id = p_participant and s.collection_id = v_collection;

  return jsonb_build_object('ok', true, 'newly_collected', v_new, 'participant_id', p_participant,
    'record', jsonb_build_object('id', v_row.id, 'stamp_id', v_row.stamp_id, 'station_id', v_station,
      'nfc_tag_id', v_row.nfc_tag_id, 'public_code', v_res->'tag'->>'public_code',
      'collected_at', v_row.collected_at, 'source', v_row.source),
    'collection_progress', jsonb_build_object('have', v_have, 'required', v_required));
end;
$$;

-- Signed-in collect (same signature/behaviour as Phase 1).
create or replace function public.collect_stamp_by_code(p_code text, p_source text default 'nfc')
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  return public.taptap_collect_for(public.taptap_ensure_participant(), p_code, p_source);
end;
$$;

-- Guest collect: the token is the browser's secret (httpOnly cookie); a valid tag code is still required.
create or replace function public.collect_stamp_as_guest(p_token text, p_code text, p_source text default 'nfc')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_res jsonb; v_participant uuid;
begin
  v_res := public.resolve_public_tag(p_code);
  if v_res->>'status' <> 'ok' then
    return jsonb_build_object('ok', false, 'status', v_res->>'status');
  end if;
  v_participant := public.taptap_guest_participant(p_token, true);
  return public.taptap_collect_for(v_participant, p_code, p_source) || jsonb_build_object('guest', true);
end;
$$;

-- Passport items for one participant: B2C + B2B stamps with venue / tenant / room labels.
create or replace function public.taptap_passport_for(p_participant uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', cs.id,
      'stampId', s.id,
      'stationId', s.station_id,
      'name', s.name,
      'imageUrl', coalesce(s.image_url, st.image_url),
      'collectedAt', cs.collected_at,
      'source', case when s.tenant_id is null then 'b2c' else 'b2b' end,
      'venueName', case when s.tenant_id is null then v.name end,
      'tenantName', t.name,
      'roomName', r.name,
      'collectSource', cs.source,
      'participantId', cs.participant_id,
      'publicCode', coalesce(
        (select tg.public_code from public.nfc_tags tg where tg.id = cs.nfc_tag_id),
        (select tg.public_code from public.nfc_tags tg where tg.station_id = s.station_id and tg.status = 'active' order by tg.created_at limit 1))
    ) order by cs.collected_at desc), '[]'::jsonb)
  from public.collected_stamps cs
  join public.stamps s on s.id = cs.stamp_id
  join public.stations st on st.id = s.station_id
  left join public.venues v on v.id = st.venue_id
  left join public.tenants t on t.id = s.tenant_id
  left join public.rooms r on r.id = st.room_id
  where cs.participant_id = p_participant;
$$;

create or replace function public.my_passport_v2()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_id uuid;
begin
  if (select auth.uid()) is null then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select id into v_id from public.participants where auth_user_id = (select auth.uid());
  if v_id is null then return '[]'::jsonb; end if;
  return public.taptap_passport_for(v_id);
end;
$$;

create or replace function public.guest_passport(p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_id uuid;
begin
  select id into v_id from public.participants
    where guest_token_hash = public.taptap_guest_hash(p_token) and auth_user_id is null and merged_into is null;
  if v_id is null then return '[]'::jsonb; end if;
  return public.taptap_passport_for(v_id);
end;
$$;

-- Merge the caller's guest progress into their account. Idempotent:
-- the guest row is locked, its token is cleared and it is marked merged, so a repeat call merges nothing.
-- Ownership: requires a signed-in caller AND the guest's secret token; account-linked rows are never merged.
create or replace function public.merge_guest_into_me(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_hash text := public.taptap_guest_hash(p_token);
  v_guest uuid; v_me uuid; v_total int := 0; v_merged int := 0; c uuid;
begin
  if (select auth.uid()) is null then raise exception 'FORBIDDEN' using errcode = '42501'; end if;
  select id into v_guest from public.participants
    where guest_token_hash = v_hash and auth_user_id is null and merged_into is null
    for update;
  if v_guest is null then
    return jsonb_build_object('merged', 0, 'alreadyOwned', 0);
  end if;
  v_me := public.taptap_ensure_participant();
  if v_me = v_guest then
    return jsonb_build_object('merged', 0, 'alreadyOwned', 0);
  end if;

  select count(*) into v_total from public.collected_stamps where participant_id = v_guest;
  with moved as (
    insert into public.collected_stamps (participant_id, stamp_id, nfc_tag_id, station_id, collected_at, source)
      select v_me, g.stamp_id, g.nfc_tag_id, g.station_id, g.collected_at, g.source
      from public.collected_stamps g where g.participant_id = v_guest
      on conflict (participant_id, stamp_id) do nothing
      returning 1)
  select count(*) into v_merged from moved;

  insert into public.participant_badges (participant_id, badge_id)
    select v_me, pb.badge_id from public.participant_badges pb where pb.participant_id = v_guest
    on conflict (participant_id, badge_id) do nothing;
  for c in select distinct s.collection_id from public.collected_stamps cs join public.stamps s on s.id = cs.stamp_id
           where cs.participant_id = v_me loop
    perform public.taptap_award_badges(v_me, c);
  end loop;

  delete from public.collected_stamps where participant_id = v_guest;
  delete from public.participant_badges where participant_id = v_guest;
  update public.participants
    set guest_token_hash = null, merged_into = v_me, merged_at = now(), updated_at = now()
    where id = v_guest;

  return jsonb_build_object('merged', v_merged, 'alreadyOwned', v_total - v_merged);
end;
$$;

-- -------------------------------------------------------------------- Grants
revoke all on function public.taptap_guest_hash(text) from public, anon, authenticated;
revoke all on function public.taptap_guest_participant(text, boolean) from public, anon, authenticated;
revoke all on function public.taptap_award_badges(uuid, uuid) from public, anon, authenticated;
revoke all on function public.taptap_collect_for(uuid, text, text) from public, anon, authenticated;
revoke all on function public.taptap_passport_for(uuid) from public, anon, authenticated;

revoke all on function public.collect_stamp_by_code(text, text) from public, anon;
grant execute on function public.collect_stamp_by_code(text, text) to authenticated;
revoke all on function public.collect_stamp_as_guest(text, text, text) from public;
grant execute on function public.collect_stamp_as_guest(text, text, text) to anon, authenticated;
revoke all on function public.guest_passport(text) from public;
grant execute on function public.guest_passport(text) to anon, authenticated;
revoke all on function public.my_passport_v2() from public, anon;
grant execute on function public.my_passport_v2() to authenticated;
revoke all on function public.merge_guest_into_me(text) from public, anon;
grant execute on function public.merge_guest_into_me(text) to authenticated;
