-- ============================================================================
-- TAPTAP — Development Seed Data (Saigon Zoo & Botanical Gardens Demo)
-- Notice: Development seed/demo dataset only. Does not imply an official
-- commercial partnership. Contains zero credentials or private keys.
-- ============================================================================

begin;

-- 1. Venue: Saigon Zoo and Botanical Gardens (Thảo Cầm Viên Sài Gòn)
insert into public.venues (
  id,
  name,
  slug,
  description,
  cover_image_url,
  status
) values (
  '11111111-1111-4111-8111-111111111101',
  'Saigon Zoo and Botanical Gardens (Thảo Cầm Viên Sài Gòn)',
  'saigon-zoo',
  'Development demo venue inspired by one of the world''s oldest continuously operating zoos and botanical gardens in District 1, Ho Chi Minh City.',
  'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=1200&q=80',
  'active'
) on conflict (id) do nothing;

-- 2. Collection: Zoo Explorer (Hành Trình Khám Phá Thảo Cầm Viên)
insert into public.collections (
  id,
  venue_id,
  name,
  slug,
  description,
  cover_image_url,
  completion_criteria,
  status,
  starts_at
) values (
  '22222222-2222-4222-8222-222222222201',
  '11111111-1111-4111-8111-111111111101',
  'Zoo Explorer',
  'zoo-explorer',
  'Follow the shaded botanical paths to visit the Asian Elephant sanctuary, the Giraffe lookout, the Flamingo lagoon, and the Tropical Conservatory. Tap each NFC checkpoint to stamp your explorer passport!',
  'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1200&q=80',
  '{"type": "all", "required": 4}'::jsonb,
  'active',
  '2026-01-01T00:00:00Z'
) on conflict (id) do nothing;

-- 3. Stations: Elephant, Giraffe, Flamingo, Conservatory
insert into public.stations (
  id,
  venue_id,
  name,
  slug,
  description,
  image_url,
  location_hint,
  status
) values
  (
    '33333333-3333-4333-8333-333333333301',
    '11111111-1111-4111-8111-111111111101',
    'Elephant',
    'elephant',
    'Meet the gentle Asian elephants under the historic canopy and learn about conservation efforts in southern Vietnam.',
    'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=900&q=80',
    'East Heritage Path — Asian Elephant Sanctuary',
    'active'
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    '11111111-1111-4111-8111-111111111101',
    'Giraffe',
    'giraffe',
    'Step onto the elevated timber deck to spot the reticulated giraffes browsing high among the acacia branches.',
    'https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=900&q=80',
    'North Savanna Lawn — Elevated Feeding Deck',
    'active'
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    '11111111-1111-4111-8111-111111111101',
    'Flamingo',
    'flamingo',
    'Pause by the tranquil lotus pond where vibrant flamingos gather along the sunlit water''s edge.',
    'https://images.unsplash.com/photo-1497206365907-f5e630693df0?auto=format&fit=crop&w=900&q=80',
    'Central Waterfowl Lagoon — West Viewing Bridge',
    'active'
  ),
  (
    '33333333-3333-4333-8333-333333333304',
    '11111111-1111-4111-8111-111111111101',
    'Botanical Conservatory',
    'botanical-conservatory',
    'Explore rare Indochinese orchids, ancient cycads, and tropical ferns inside the Glasshouse Conservatory.',
    'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
    'Botanical Quarter — Glasshouse Pavilion',
    'active'
  )
on conflict (id) do nothing;

-- 4. NFC Tags (non-sequential public codes + 1 disabled tag for testing error states)
insert into public.nfc_tags (
  id,
  station_id,
  public_code,
  label,
  status
) values
  (
    '44444444-4444-4444-8444-444444444401',
    '33333333-3333-4333-8333-333333333301',
    'tcv-k9x2m4p8',
    'Elephant Sanctuary — Brass Plaque NFC #1',
    'active'
  ),
  (
    '44444444-4444-4444-8444-444444444402',
    '33333333-3333-4333-8333-333333333302',
    'tcv-q7w3n5r2',
    'Giraffe Lookout — Timber Rail NFC #1',
    'active'
  ),
  (
    '44444444-4444-4444-8444-444444444403',
    '33333333-3333-4333-8333-333333333303',
    'tcv-h4j8v6b1',
    'Flamingo Lagoon — Viewing Bridge NFC #1',
    'active'
  ),
  (
    '44444444-4444-4444-8444-444444444404',
    '33333333-3333-4333-8333-333333333304',
    'tcv-z2c9f3t7',
    'Botanical Conservatory — Archway NFC #1',
    'active'
  ),
  (
    '44444444-4444-4444-8444-444444444405',
    '33333333-3333-4333-8333-333333333301',
    'tcv-disabled99',
    'Elephant Sanctuary — Retired Test Tag',
    'disabled'
  )
on conflict (id) do nothing;

-- 5. Stamps
insert into public.stamps (
  id,
  collection_id,
  station_id,
  name,
  description,
  image_url,
  sort_order,
  status
) values
  (
    '55555555-5555-4555-8555-555555555501',
    '22222222-2222-4222-8222-222222222201',
    '33333333-3333-4333-8333-333333333301',
    'Asian Elephant Stamp',
    'Commemorative wildlife stamp from the Asian Elephant Sanctuary.',
    'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=900&q=80',
    1,
    'active'
  ),
  (
    '55555555-5555-4555-8555-555555555502',
    '22222222-2222-4222-8222-222222222201',
    '33333333-3333-4333-8333-333333333302',
    'Giraffe Lookout Stamp',
    'Commemorative wildlife stamp from the North Savanna Giraffe Deck.',
    'https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=900&q=80',
    2,
    'active'
  ),
  (
    '55555555-5555-4555-8555-555555555503',
    '22222222-2222-4222-8222-222222222201',
    '33333333-3333-4333-8333-333333333303',
    'Flamingo Lagoon Stamp',
    'Commemorative wildlife stamp from the Central Flamingo Lagoon.',
    'https://images.unsplash.com/photo-1497206365907-f5e630693df0?auto=format&fit=crop&w=900&q=80',
    3,
    'active'
  ),
  (
    '55555555-5555-4555-8555-555555555504',
    '22222222-2222-4222-8222-222222222201',
    '33333333-3333-4333-8333-333333333304',
    'Botanical Orchid Stamp',
    'Commemorative botanical stamp from the Glasshouse Conservatory.',
    'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
    4,
    'active'
  )
on conflict (id) do nothing;

-- 6. Badge
insert into public.badges (
  id,
  collection_id,
  name,
  description,
  image_url
) values (
  '66666666-6666-4666-8666-666666666601',
  '22222222-2222-4222-8222-222222222201',
  'Saigon Zoo Explorer Crest',
  'Awarded for collecting all stamps in the Zoo Explorer passport trail.',
  '/badges/zoo-explorer-crest.svg'
) on conflict (id) do nothing;

-- 7. Reward
insert into public.rewards (
  id,
  collection_id,
  name,
  description,
  image_url,
  redemption_instructions,
  status
) values (
  '77777777-7777-4777-8777-777777777701',
  '22222222-2222-4222-8222-222222222201',
  'Explorer Botanical Postcard & Sticker Set',
  'Claim a limited-edition illustrated Zoo Explorer postcard and waterproof sticker pack at the Visitor Information Kiosk.',
  'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80',
  'Present your unlocked redemption code to the staff member at the Main Gate Visitor Kiosk before 17:00.',
  'active'
) on conflict (id) do nothing;

commit;
