-- TAPTAP Phase 1 — subscription package catalogue v1 (owner decision Q4).
insert into public.subscription_packages (code, name, max_rooms, max_stations, max_members, max_active_nfc_tags)
values
  ('starter', 'Starter', 1, 10, 3, 10),
  ('growth',  'Growth',  5, 50, 10, 50),
  ('pro',     'Pro',    20, 200, 50, 200)
on conflict (code) do nothing;
