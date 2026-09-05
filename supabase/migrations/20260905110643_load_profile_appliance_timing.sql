alter table public.load_profile_appliances
  add column if not exists start_hour numeric not null default 8 check (start_hour >= 0 and start_hour < 24);