-- Read-only counts for next_demo_cleanup.sql (run before and after).
with demo_accounts as (
  select id from public.participants
  where lower(email) in ('platform-admin.demo@example.com','tenant-owner.demo@example.com',
                         'tenant-editor.demo@example.com','tenant-viewer.demo@example.com','visitor.demo@example.com')
), demo_tenant as (
  select id from public.tenants where slug = 'demo-toy-studio' and is_demo is true
), guests as (
  select p.id from public.participants p
  where p.auth_user_id is null and p.email is null
    and (p.guest_token_hash is null or p.guest_token_hash ~ '^[0-9a-f]{64}$')
    and p.created_at >= '2026-11-10 12:54:41+00'
    and (
      (p.created_at < '2026-11-10 13:53:16+00' and (p.merged_into is null or p.merged_into in (select id from demo_accounts)))
      or p.merged_into in (select id from demo_accounts)
      or (
        p.merged_into is null
        and exists (select 1 from public.collected_stamps cs where cs.participant_id = p.id)
        and not exists (select 1 from public.collected_stamps cs join public.stamps s on s.id = cs.stamp_id
                    where cs.participant_id = p.id and s.tenant_id is distinct from (select id from demo_tenant))
        and not exists (select 1 from public.station_taps t
                        where t.participant_id = p.id and t.tenant_id is distinct from (select id from demo_tenant))
      )
    )
)
select jsonb_build_object(
  'participants_total', (select count(*) from public.participants),
  'guest_rows_in_scope', (select count(*) from guests),
  'guest_rows_all', (select count(*) from public.participants where auth_user_id is null and email is null),
  'guest_collected_stamps', (select count(*) from public.collected_stamps where participant_id in (select id from guests)),
  'guest_taps', (select count(*) from public.station_taps where participant_id in (select id from guests)),
  'orphan_demo_taps', (select count(*) from public.station_taps where participant_id is null and tenant_id = (select id from demo_tenant)),
  'demo_account_collected_stamps', (select count(*) from public.collected_stamps where participant_id in (select id from demo_accounts)),
  'demo_account_taps', (select count(*) from public.station_taps where participant_id in (select id from demo_accounts)),
  'seed_demo_visitors', (select count(*) from public.participants where email like 'demo-visitor-%@example.com'),
  'seed_taps', (select count(*) from public.station_taps where id::text like 'd2220000-%'),
  'b2c_stamps', (select count(*) from public.stamps where tenant_id is null),
  'b2c_stations', (select count(*) from public.stations where tenant_id is null),
  'non_demo_collected_stamps', (select count(*) from public.collected_stamps
      where participant_id not in (select id from guests union all select id from demo_accounts)
        and participant_id not in (select id from public.participants where email like 'demo-visitor-%@example.com'))
) as counts;
