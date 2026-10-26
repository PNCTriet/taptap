-- =============================================================================
-- Migration: Add GPS coordinates (latitude, longitude) to stations
-- Saigon Zoo & Botanical Gardens (Thảo Cầm Viên Sài Gòn)
-- =============================================================================

alter table public.stations
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

update public.stations
set latitude = 10.7872, longitude = 106.7051
where id = '33333333-3333-4333-8333-333333333301' or slug = 'asian-elephant';

update public.stations
set latitude = 10.7881, longitude = 106.7048
where id = '33333333-3333-4333-8333-333333333302' or slug = 'botanical-conservatory';

update public.stations
set latitude = 10.7886, longitude = 106.7061
where id = '33333333-3333-4333-8333-333333333303' or slug = 'flamingo-lagoon';

update public.stations
set latitude = 10.7895, longitude = 106.7056
where id = '33333333-3333-4333-8333-333333333304' or slug = 'giraffe-lookout';
