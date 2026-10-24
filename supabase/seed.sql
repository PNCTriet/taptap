-- =============================================================================
-- TAPTAP Pilot Seed: Saigon Zoo & Botanical Gardens ("Zoo Explorer")
-- 100% aligned with src/features/pilot/sample-data.ts and idempotent
-- =============================================================================

-- 1. Pilot Venue
insert into public.venues (id, name, slug, description, cover_image_url, status)
values (
  '11111111-1111-4111-8111-111111111101',
  'Saigon Zoo',
  'saigon-zoo',
  'Historic botanical gardens and wildlife sanctuary in Saigon.',
  'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=1200&q=80',
  'active'
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  cover_image_url = excluded.cover_image_url,
  status = excluded.status;

-- 2. Pilot Collection
insert into public.collections (
  id, venue_id, name, slug, description, cover_image_url, completion_criteria, status
)
values (
  '22222222-2222-4222-8222-222222222201',
  '11111111-1111-4111-8111-111111111101',
  'Zoo Explorer',
  'zoo-explorer',
  'Collect all 4 stamps across Saigon Zoo.',
  'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1200&q=80',
  '{"type": "all_stamps", "required_count": 4}'::jsonb,
  'active'
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  cover_image_url = excluded.cover_image_url,
  completion_criteria = excluded.completion_criteria,
  status = excluded.status;

-- 3. Pilot Stations (4 Checkpoints)
insert into public.stations (id, venue_id, name, slug, description, image_url, location_hint, status)
values
  (
    '33333333-3333-4333-8333-333333333301',
    '11111111-1111-4111-8111-111111111101',
    'Asian Elephant',
    'asian-elephant',
    'Gentle elephants beneath the century-old forest canopy.',
    'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=900&q=80',
    'East Heritage Path',
    'active'
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    '11111111-1111-4111-8111-111111111101',
    'Botanical Conservatory',
    'botanical-conservatory',
    'Rare orchids and tropical ferns inside the glasshouse.',
    'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
    'Botanical Glasshouse',
    'active'
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    '11111111-1111-4111-8111-111111111101',
    'Flamingo Lagoon',
    'flamingo-lagoon',
    'Coral-pink flamingos gathered along the sunlit lotus lake.',
    'https://images.unsplash.com/photo-1497206365907-f5e630693df0?auto=format&fit=crop&w=900&q=80',
    'Central Lagoon',
    'active'
  ),
  (
    '33333333-3333-4333-8333-333333333304',
    '11111111-1111-4111-8111-111111111101',
    'Giraffe Lookout',
    'giraffe-lookout',
    'Watch giraffes browse high among the acacia treetops.',
    'https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=900&q=80',
    'North Savanna Deck',
    'active'
  )
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  image_url = excluded.image_url,
  location_hint = excluded.location_hint,
  status = excluded.status;

-- 4. NFC Tags (4 Active Tags + 1 Disabled Demo Tag)
insert into public.nfc_tags (id, station_id, public_code, label, status)
values
  (
    '44444444-4444-4444-8444-444444444401',
    '33333333-3333-4333-8333-333333333301',
    'tcv-k9x2m4p8',
    'Asian Elephant — NFC #1',
    'active'
  ),
  (
    '44444444-4444-4444-8444-444444444402',
    '33333333-3333-4333-8333-333333333302',
    'tcv-b7n4q1w6',
    'Botanical Conservatory — NFC #2',
    'active'
  ),
  (
    '44444444-4444-4444-8444-444444444403',
    '33333333-3333-4333-8333-333333333303',
    'tcv-m3p9x5r2',
    'Flamingo Lagoon — NFC #3',
    'active'
  ),
  (
    '44444444-4444-4444-8444-444444444404',
    '33333333-3333-4333-8333-333333333304',
    'tcv-w2v8k6j4',
    'Giraffe Lookout — NFC #4',
    'active'
  ),
  (
    '44444444-4444-4444-8444-444444444499',
    '33333333-3333-4333-8333-333333333301',
    'tcv-disabled99',
    'Asian Elephant — Retired Tag',
    'disabled'
  )
on conflict (id) do update set
  station_id = excluded.station_id,
  public_code = excluded.public_code,
  label = excluded.label,
  status = excluded.status;

-- 5. Stamps (4 Commemorative Stamps)
insert into public.stamps (id, collection_id, station_id, name, description, image_url, sort_order, status)
values
  (
    '55555555-5555-4555-8555-555555555501',
    '22222222-2222-4222-8222-222222222201',
    '33333333-3333-4333-8333-333333333301',
    'Asian Elephant',
    'East Heritage Path',
    'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=900&q=80',
    1,
    'active'
  ),
  (
    '55555555-5555-4555-8555-555555555502',
    '22222222-2222-4222-8222-222222222201',
    '33333333-3333-4333-8333-333333333302',
    'Botanical Conservatory',
    'Botanical Glasshouse',
    'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80',
    2,
    'active'
  ),
  (
    '55555555-5555-4555-8555-555555555503',
    '22222222-2222-4222-8222-222222222201',
    '33333333-3333-4333-8333-333333333303',
    'Flamingo Lagoon',
    'Central Lagoon',
    'https://images.unsplash.com/photo-1497206365907-f5e630693df0?auto=format&fit=crop&w=900&q=80',
    3,
    'active'
  ),
  (
    '55555555-5555-4555-8555-555555555504',
    '22222222-2222-4222-8222-222222222201',
    '33333333-3333-4333-8333-333333333304',
    'Giraffe Lookout',
    'North Savanna Deck',
    'https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=900&q=80',
    4,
    'active'
  )
on conflict (id) do update set
  collection_id = excluded.collection_id,
  station_id = excluded.station_id,
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order,
  status = excluded.status;

-- 6. Completion Badge
insert into public.badges (id, collection_id, name, description, image_url)
values (
  '66666666-6666-4666-8666-666666666601',
  '22222222-2222-4222-8222-222222222201',
  'Zoo Explorer Crest',
  'Collected all 4 Zoo Explorer stamps.',
  '/badges/zoo-explorer-crest.svg'
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url;

-- 7. Pilot Reward
insert into public.rewards (id, collection_id, name, description, image_url, redemption_instructions, status)
values (
  '77777777-7777-4777-8777-777777777701',
  '22222222-2222-4222-8222-222222222201',
  'Botanical Postcard & Sticker Set',
  'Illustrated postcard and sticker set for completing your passport.',
  'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80',
  'Show your code at the Main Gate Kiosk (08:30–17:00).',
  'active'
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  redemption_instructions = excluded.redemption_instructions,
  status = excluded.status;
