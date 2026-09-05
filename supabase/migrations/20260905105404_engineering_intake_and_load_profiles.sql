create table if not exists public.load_profiles (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete restrict,
  name text not null,
  source text not null check (source in ('interval_data','utility_bills','appliance_schedule','manual_summary')),
  status text not null default 'draft' check (status in ('draft','ready','superseded')),
  data_quality text not null default 'estimated' check (data_quality in ('measured','derived','estimated')),
  interval_minutes integer check (interval_minutes is null or interval_minutes in (15,30,60)),
  timezone text,
  annual_energy_kwh numeric check (annual_energy_kwh is null or annual_energy_kwh >= 0),
  average_daily_energy_kwh numeric check (average_daily_energy_kwh is null or average_daily_energy_kwh >= 0),
  peak_demand_kw numeric check (peak_demand_kw is null or peak_demand_kw >= 0),
  essential_peak_demand_kw numeric check (essential_peak_demand_kw is null or essential_peak_demand_kw >= 0),
  assumptions text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organisation_id)
);

create index if not exists load_profiles_org_idx on public.load_profiles(organisation_id);
create index if not exists load_profiles_opportunity_idx on public.load_profiles(opportunity_id);
create index if not exists load_profiles_site_idx on public.load_profiles(site_id);

create table if not exists public.load_profile_intervals (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  load_profile_id uuid not null,
  interval_start timestamptz not null,
  demand_kw numeric not null check (demand_kw >= 0),
  energy_kwh numeric not null check (energy_kwh >= 0),
  essential boolean not null default false,
  category text,
  created_at timestamptz not null default now(),
  foreign key (load_profile_id, organisation_id)
    references public.load_profiles(id, organisation_id)
    on delete cascade
);

create index if not exists load_profile_intervals_profile_idx on public.load_profile_intervals(load_profile_id, interval_start);
create index if not exists load_profile_intervals_org_idx on public.load_profile_intervals(organisation_id);

create table if not exists public.engineering_intakes (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete restrict,
  load_profile_id uuid,
  system_type text not null check (system_type in ('on_grid','off_grid','hybrid')),
  design_objective text not null check (design_objective in ('reduce_imports','maximize_self_consumption','backup_resilience','off_grid_autonomy','peak_shaving','export_generation')),
  status text not null default 'draft' check (status in ('draft','ready','superseded')),
  target_pv_capacity_kwp numeric check (target_pv_capacity_kwp is null or target_pv_capacity_kwp > 0),
  autonomy_hours numeric check (autonomy_hours is null or autonomy_hours > 0),
  export_limit_kw numeric check (export_limit_kw is null or export_limit_kw >= 0),
  reserve_soc_pct numeric check (reserve_soc_pct is null or reserve_soc_pct between 0 and 100),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (load_profile_id, organisation_id)
    references public.load_profiles(id, organisation_id)
    on delete restrict,
  check (
    status <> 'ready'
    or (
      load_profile_id is not null
      and (system_type <> 'off_grid' or autonomy_hours is not null)
      and (system_type <> 'hybrid' or reserve_soc_pct is not null)
    )
  )
);

create index if not exists engineering_intakes_org_idx on public.engineering_intakes(organisation_id);
create index if not exists engineering_intakes_opportunity_idx on public.engineering_intakes(opportunity_id);
create index if not exists engineering_intakes_site_idx on public.engineering_intakes(site_id);
create index if not exists engineering_intakes_load_profile_idx on public.engineering_intakes(load_profile_id);

alter table public.system_designs
  add column if not exists engineering_intake_id uuid references public.engineering_intakes(id) on delete restrict;

create index if not exists system_designs_engineering_intake_idx on public.system_designs(engineering_intake_id);

alter table public.load_profiles enable row level security;
alter table public.load_profile_intervals enable row level security;
alter table public.engineering_intakes enable row level security;

revoke all on table public.load_profiles from anon, authenticated;
revoke all on table public.load_profile_intervals from anon, authenticated;
revoke all on table public.engineering_intakes from anon, authenticated;

grant select, insert, update, delete on table public.load_profiles to authenticated;
grant select, insert, update, delete on table public.load_profile_intervals to authenticated;
grant select, insert, update, delete on table public.engineering_intakes to authenticated;

drop policy if exists load_profiles_select on public.load_profiles;
create policy load_profiles_select on public.load_profiles for select to authenticated
using (organisation_id = public.current_organisation_id());

drop policy if exists load_profiles_insert on public.load_profiles;
create policy load_profiles_insert on public.load_profiles for insert to authenticated
with check (organisation_id = public.current_organisation_id());

drop policy if exists load_profiles_update on public.load_profiles;
create policy load_profiles_update on public.load_profiles for update to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());

drop policy if exists load_profiles_delete on public.load_profiles;
create policy load_profiles_delete on public.load_profiles for delete to authenticated
using (organisation_id = public.current_organisation_id());

drop policy if exists load_profile_intervals_select on public.load_profile_intervals;
create policy load_profile_intervals_select on public.load_profile_intervals for select to authenticated
using (organisation_id = public.current_organisation_id());

drop policy if exists load_profile_intervals_insert on public.load_profile_intervals;
create policy load_profile_intervals_insert on public.load_profile_intervals for insert to authenticated
with check (organisation_id = public.current_organisation_id());

drop policy if exists load_profile_intervals_update on public.load_profile_intervals;
create policy load_profile_intervals_update on public.load_profile_intervals for update to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());

drop policy if exists load_profile_intervals_delete on public.load_profile_intervals;
create policy load_profile_intervals_delete on public.load_profile_intervals for delete to authenticated
using (organisation_id = public.current_organisation_id());

drop policy if exists engineering_intakes_select on public.engineering_intakes;
create policy engineering_intakes_select on public.engineering_intakes for select to authenticated
using (organisation_id = public.current_organisation_id());

drop policy if exists engineering_intakes_insert on public.engineering_intakes;
create policy engineering_intakes_insert on public.engineering_intakes for insert to authenticated
with check (organisation_id = public.current_organisation_id());

drop policy if exists engineering_intakes_update on public.engineering_intakes;
create policy engineering_intakes_update on public.engineering_intakes for update to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());

drop policy if exists engineering_intakes_delete on public.engineering_intakes;
create policy engineering_intakes_delete on public.engineering_intakes for delete to authenticated
using (organisation_id = public.current_organisation_id());
