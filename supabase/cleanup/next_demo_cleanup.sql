-- TAPTAP — remove test-generated rows from the Next work. Data only, no schema change.
-- Strict scope:
--   * Guest participants (auth_user_id null, email null, guest token hash null or sha256 hex)
--     created after next_passport_guest_merge was applied (2026-11-10 12:54:41 UTC), and either
--       - created before the guest flow reached production (2026-11-10 13:53:16 UTC; only
--         automated tests could create guests on previews/local), or
--       - merged into one of the 5 demo accounts, or
--       - unmerged, with at least one stamp, and all stamps and taps inside demo-toy-studio.
--     Their collected stamps, badges and redemptions go by ON DELETE CASCADE; their taps are deleted first.
--   * Collected stamps and taps of the 5 demo accounts (*.demo@example.com).
--   * demo-toy-studio taps whose participant was already deleted (participant_id null).
-- Never touches: demo-visitor-NN seed rows, the demo accounts themselves, any other
-- participant, any station/stamp/tag/venue/tenant, badges/redemptions of demo accounts,
-- or any function (including *_gmail_participant_*).
do $$
declare
  v_tenant uuid;
  v_accounts uuid[];
  v_guests uuid[];
begin
  select id into v_tenant from public.tenants where slug = 'demo-toy-studio' and is_demo is true;
  if v_tenant is null then
    raise exception 'next_demo_cleanup: demo-toy-studio (is_demo) not found; nothing changed';
  end if;

  select coalesce(array_agg(id), '{}') into v_accounts from public.participants
   where lower(email) in ('platform-admin.demo@example.com','tenant-owner.demo@example.com',
                          'tenant-editor.demo@example.com','tenant-viewer.demo@example.com','visitor.demo@example.com');

  select coalesce(array_agg(p.id), '{}') into v_guests from public.participants p
   where p.auth_user_id is null and p.email is null
     and (p.guest_token_hash is null or p.guest_token_hash ~ '^[0-9a-f]{64}$')
     and p.created_at >= '2026-11-10 12:54:41+00'
     and (
       (p.created_at < '2026-11-10 13:53:16+00' and (p.merged_into is null or p.merged_into = any (v_accounts)))
       or p.merged_into = any (v_accounts)
       or (
         p.merged_into is null
         and exists (select 1 from public.collected_stamps cs where cs.participant_id = p.id)
         and not exists (select 1 from public.collected_stamps cs join public.stamps s on s.id = cs.stamp_id
                     where cs.participant_id = p.id and s.tenant_id is distinct from v_tenant)
         and not exists (select 1 from public.station_taps t
                         where t.participant_id = p.id and t.tenant_id is distinct from v_tenant)
       )
     );

  delete from public.station_taps where participant_id = any (v_guests);
  delete from public.station_taps where participant_id = any (v_accounts);
  delete from public.station_taps where participant_id is null and tenant_id = v_tenant
     and id::text not like 'd2220000-%';
  delete from public.collected_stamps where participant_id = any (v_accounts);
  -- merged_into references from other guests are ON DELETE SET NULL.
  delete from public.participants where id = any (v_guests);

  raise notice 'next_demo_cleanup: % guest rows, % demo accounts cleaned', cardinality(v_guests), cardinality(v_accounts);
end $$;
