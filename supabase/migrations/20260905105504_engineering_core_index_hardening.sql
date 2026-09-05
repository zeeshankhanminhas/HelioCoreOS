create index if not exists load_profiles_created_by_idx on public.load_profiles(created_by);
create index if not exists load_profile_intervals_profile_org_idx on public.load_profile_intervals(load_profile_id, organisation_id);
create index if not exists engineering_intakes_created_by_idx on public.engineering_intakes(created_by);
create index if not exists engineering_intakes_load_profile_org_idx on public.engineering_intakes(load_profile_id, organisation_id);
