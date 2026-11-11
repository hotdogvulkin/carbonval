-- V5 methodology: store the inputs needed to reproduce a shared valuation.
-- Not applied automatically. Run in the Supabase SQL editor (or `supabase db push`).
-- The app works without these columns: saves fall back to the original columns,
-- and shared links fall back to safe defaults.
alter table public.valuations
  add column if not exists cps_number integer,
  add column if not exists irrigated boolean default false,
  add column if not exists adverse_selection boolean default true,
  add column if not exists detected_land_type text,
  add column if not exists eco_region_code text,
  add column if not exists permanence_factor double precision,
  add column if not exists integrity_risk text;
