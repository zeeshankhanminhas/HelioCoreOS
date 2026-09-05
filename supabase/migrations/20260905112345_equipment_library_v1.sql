create table if not exists public.equipment_manufacturers (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  country_of_origin text,
  website_url text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, name),
  unique (id, organisation_id)
);

create table if not exists public.pv_modules (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  manufacturer_id uuid not null,
  model text not null,
  technology text not null default 'mono' check (technology in ('mono','topcon','hjt','thin_film','other')),
  pmax_w numeric not null check (pmax_w > 0),
  voc_v numeric not null check (voc_v > 0),
  vmp_v numeric not null check (vmp_v > 0),
  isc_a numeric not null check (isc_a > 0),
  imp_a numeric not null check (imp_a > 0),
  temp_coeff_pmax_pct_c numeric,
  temp_coeff_voc_pct_c numeric,
  temp_coeff_isc_pct_c numeric,
  max_system_voltage_v numeric check (max_system_voltage_v is null or max_system_voltage_v > 0),
  efficiency_pct numeric check (efficiency_pct is null or efficiency_pct between 0 and 100),
  width_mm numeric check (width_mm is null or width_mm > 0),
  height_mm numeric check (height_mm is null or height_mm > 0),
  weight_kg numeric check (weight_kg is null or weight_kg > 0),
  bifacial boolean not null default false,
  datasheet_url text,
  status text not null default 'draft' check (status in ('draft','approved','retired')),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (manufacturer_id, organisation_id) references public.equipment_manufacturers(id, organisation_id) on delete restrict,
  unique (organisation_id, manufacturer_id, model),
  unique (id, organisation_id)
);

create table if not exists public.inverters (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  manufacturer_id uuid not null,
  model text not null,
  inverter_type text not null check (inverter_type in ('grid_tied','off_grid','hybrid','pcs')),
  phase text not null check (phase in ('single','three')),
  rated_ac_power_kw numeric not null check (rated_ac_power_kw > 0),
  max_pv_input_power_kw numeric check (max_pv_input_power_kw is null or max_pv_input_power_kw > 0),
  max_dc_voltage_v numeric not null check (max_dc_voltage_v > 0),
  mppt_min_v numeric not null check (mppt_min_v > 0),
  mppt_max_v numeric not null check (mppt_max_v >= mppt_min_v),
  mppt_count integer not null check (mppt_count > 0),
  max_input_current_per_mppt_a numeric not null check (max_input_current_per_mppt_a > 0),
  max_short_circuit_current_per_mppt_a numeric not null check (max_short_circuit_current_per_mppt_a > 0),
  max_charge_power_kw numeric check (max_charge_power_kw is null or max_charge_power_kw >= 0),
  max_discharge_power_kw numeric check (max_discharge_power_kw is null or max_discharge_power_kw >= 0),
  battery_voltage_min_v numeric check (battery_voltage_min_v is null or battery_voltage_min_v > 0),
  battery_voltage_max_v numeric check (battery_voltage_max_v is null or battery_voltage_max_v >= battery_voltage_min_v),
  max_efficiency_pct numeric check (max_efficiency_pct is null or max_efficiency_pct between 0 and 100),
  datasheet_url text,
  status text not null default 'draft' check (status in ('draft','approved','retired')),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (manufacturer_id, organisation_id) references public.equipment_manufacturers(id, organisation_id) on delete restrict,
  unique (organisation_id, manufacturer_id, model),
  unique (id, organisation_id)
);

create table if not exists public.batteries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  manufacturer_id uuid not null,
  model text not null,
  chemistry text not null default 'lfp' check (chemistry in ('lfp','nmc','lead_acid','other')),
  nominal_capacity_kwh numeric not null check (nominal_capacity_kwh > 0),
  usable_capacity_kwh numeric not null check (usable_capacity_kwh > 0 and usable_capacity_kwh <= nominal_capacity_kwh),
  nominal_voltage_v numeric not null check (nominal_voltage_v > 0),
  operating_voltage_min_v numeric check (operating_voltage_min_v is null or operating_voltage_min_v > 0),
  operating_voltage_max_v numeric check (operating_voltage_max_v is null or operating_voltage_max_v >= operating_voltage_min_v),
  max_charge_power_kw numeric not null check (max_charge_power_kw > 0),
  max_discharge_power_kw numeric not null check (max_discharge_power_kw > 0),
  max_dod_pct numeric check (max_dod_pct is null or max_dod_pct between 0 and 100),
  round_trip_efficiency_pct numeric check (round_trip_efficiency_pct is null or round_trip_efficiency_pct between 0 and 100),
  cycle_life integer check (cycle_life is null or cycle_life > 0),
  datasheet_url text,
  status text not null default 'draft' check (status in ('draft','approved','retired')),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (manufacturer_id, organisation_id) references public.equipment_manufacturers(id, organisation_id) on delete restrict,
  unique (organisation_id, manufacturer_id, model),
  unique (id, organisation_id)
);

create table if not exists public.inverter_battery_compatibility (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  inverter_id uuid not null,
  battery_id uuid not null,
  status text not null default 'approved' check (status in ('approved','conditional','not_compatible')),
  min_battery_units integer check (min_battery_units is null or min_battery_units > 0),
  max_battery_units integer check (max_battery_units is null or max_battery_units >= min_battery_units),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (inverter_id, organisation_id) references public.inverters(id, organisation_id) on delete cascade,
  foreign key (battery_id, organisation_id) references public.batteries(id, organisation_id) on delete cascade,
  unique (organisation_id, inverter_id, battery_id)
);

create index if not exists equipment_manufacturers_org_idx on public.equipment_manufacturers(organisation_id);
create index if not exists equipment_manufacturers_created_by_idx on public.equipment_manufacturers(created_by);
create index if not exists pv_modules_org_status_idx on public.pv_modules(organisation_id, status);
create index if not exists pv_modules_manufacturer_org_idx on public.pv_modules(manufacturer_id, organisation_id);
create index if not exists pv_modules_created_by_idx on public.pv_modules(created_by);
create index if not exists pv_modules_approved_by_idx on public.pv_modules(approved_by);
create index if not exists inverters_org_type_status_idx on public.inverters(organisation_id, inverter_type, status);
create index if not exists inverters_manufacturer_org_idx on public.inverters(manufacturer_id, organisation_id);
create index if not exists inverters_created_by_idx on public.inverters(created_by);
create index if not exists inverters_approved_by_idx on public.inverters(approved_by);
create index if not exists batteries_org_status_idx on public.batteries(organisation_id, status);
create index if not exists batteries_manufacturer_org_idx on public.batteries(manufacturer_id, organisation_id);
create index if not exists batteries_created_by_idx on public.batteries(created_by);
create index if not exists batteries_approved_by_idx on public.batteries(approved_by);
create index if not exists inverter_battery_compat_org_idx on public.inverter_battery_compatibility(organisation_id);
create index if not exists inverter_battery_compat_inverter_org_idx on public.inverter_battery_compatibility(inverter_id, organisation_id);
create index if not exists inverter_battery_compat_battery_org_idx on public.inverter_battery_compatibility(battery_id, organisation_id);
create index if not exists inverter_battery_compat_created_by_idx on public.inverter_battery_compatibility(created_by);

alter table public.equipment_manufacturers enable row level security;
alter table public.pv_modules enable row level security;
alter table public.inverters enable row level security;
alter table public.batteries enable row level security;
alter table public.inverter_battery_compatibility enable row level security;

revoke all on table public.equipment_manufacturers from anon, authenticated;
revoke all on table public.pv_modules from anon, authenticated;
revoke all on table public.inverters from anon, authenticated;
revoke all on table public.batteries from anon, authenticated;
revoke all on table public.inverter_battery_compatibility from anon, authenticated;

grant select, insert, update, delete on table public.equipment_manufacturers to authenticated;
grant select, insert, update, delete on table public.pv_modules to authenticated;
grant select, insert, update, delete on table public.inverters to authenticated;
grant select, insert, update, delete on table public.batteries to authenticated;
grant select, insert, update, delete on table public.inverter_battery_compatibility to authenticated;

create policy equipment_manufacturers_select on public.equipment_manufacturers for select to authenticated using (organisation_id = public.current_organisation_id());
create policy equipment_manufacturers_insert on public.equipment_manufacturers for insert to authenticated with check (organisation_id = public.current_organisation_id());
create policy equipment_manufacturers_update on public.equipment_manufacturers for update to authenticated using (organisation_id = public.current_organisation_id()) with check (organisation_id = public.current_organisation_id());
create policy equipment_manufacturers_delete on public.equipment_manufacturers for delete to authenticated using (organisation_id = public.current_organisation_id());

create policy pv_modules_select on public.pv_modules for select to authenticated using (organisation_id = public.current_organisation_id());
create policy pv_modules_insert on public.pv_modules for insert to authenticated with check (organisation_id = public.current_organisation_id());
create policy pv_modules_update on public.pv_modules for update to authenticated using (organisation_id = public.current_organisation_id()) with check (organisation_id = public.current_organisation_id());
create policy pv_modules_delete on public.pv_modules for delete to authenticated using (organisation_id = public.current_organisation_id());

create policy inverters_select on public.inverters for select to authenticated using (organisation_id = public.current_organisation_id());
create policy inverters_insert on public.inverters for insert to authenticated with check (organisation_id = public.current_organisation_id());
create policy inverters_update on public.inverters for update to authenticated using (organisation_id = public.current_organisation_id()) with check (organisation_id = public.current_organisation_id());
create policy inverters_delete on public.inverters for delete to authenticated using (organisation_id = public.current_organisation_id());

create policy batteries_select on public.batteries for select to authenticated using (organisation_id = public.current_organisation_id());
create policy batteries_insert on public.batteries for insert to authenticated with check (organisation_id = public.current_organisation_id());
create policy batteries_update on public.batteries for update to authenticated using (organisation_id = public.current_organisation_id()) with check (organisation_id = public.current_organisation_id());
create policy batteries_delete on public.batteries for delete to authenticated using (organisation_id = public.current_organisation_id());

create policy inverter_battery_compat_select on public.inverter_battery_compatibility for select to authenticated using (organisation_id = public.current_organisation_id());
create policy inverter_battery_compat_insert on public.inverter_battery_compatibility for insert to authenticated with check (organisation_id = public.current_organisation_id());
create policy inverter_battery_compat_update on public.inverter_battery_compatibility for update to authenticated using (organisation_id = public.current_organisation_id()) with check (organisation_id = public.current_organisation_id());
create policy inverter_battery_compat_delete on public.inverter_battery_compatibility for delete to authenticated using (organisation_id = public.current_organisation_id());