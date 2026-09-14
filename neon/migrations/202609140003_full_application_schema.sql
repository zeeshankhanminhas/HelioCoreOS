-- Session 08: complete application schema cutover from legacy Supabase migrations to Neon.
-- Neon Auth compatibility (auth.uid(), authenticated role, profiles) is established by earlier Neon migrations.
-- Supabase Storage objects are deliberately excluded: this migration is the PostgreSQL schema cutover only.

create table if not exists public.site_surveys (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete restrict,
  survey_reference text not null,
  status text not null default 'draft' check (status in ('draft','in_progress','under_review','approved','rejected')),
  survey_date date, surveyor_name text, weather_conditions text, access_notes text,
  roof_type text, roof_covering text, roof_condition text,
  roof_orientation_deg numeric check (roof_orientation_deg is null or roof_orientation_deg between 0 and 359.99),
  roof_pitch_deg numeric check (roof_pitch_deg is null or roof_pitch_deg between 0 and 90),
  usable_roof_area_m2 numeric check (usable_roof_area_m2 is null or usable_roof_area_m2 >= 0),
  shading_summary text, structural_observations text,
  supply_phase text check (supply_phase is null or supply_phase in ('single_phase','three_phase','unknown')),
  main_fuse_rating_a numeric check (main_fuse_rating_a is null or main_fuse_rating_a >= 0),
  meter_location text, consumer_unit_location text, earthing_arrangement text, cable_route_notes text,
  inverter_location text, battery_location text, fire_safety_notes text,
  asbestos_risk text check (asbestos_risk is null or asbestos_risk in ('none_identified','possible','confirmed','unknown')),
  working_at_height_risk text, planning_constraints text, grid_constraints text, other_constraints text,
  recommended_pv_kwp numeric check (recommended_pv_kwp is null or recommended_pv_kwp >= 0),
  recommended_battery_kwh numeric check (recommended_battery_kwh is null or recommended_battery_kwh >= 0),
  photo_links text[] not null default '{}', drawing_links text[] not null default '{}', review_note text,
  approved_by uuid references public.profiles(id) on delete set null, approved_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (opportunity_id), unique (organisation_id, survey_reference)
);

create table if not exists public.system_designs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete restrict,
  survey_id uuid references public.site_surveys(id) on delete restrict,
  engineering_intake_id uuid,
  design_reference text not null,
  revision integer not null default 1 check (revision > 0),
  status text not null default 'draft' check (status in ('draft','in_progress','under_review','approved','rejected','superseded')),
  system_type text check (system_type is null or system_type in ('on_grid','off_grid','hybrid')),
  design_basis text,
  module_manufacturer text, module_model text, module_rating_wp numeric check (module_rating_wp is null or module_rating_wp > 0),
  module_quantity integer check (module_quantity is null or module_quantity > 0),
  array_capacity_kwp numeric check (array_capacity_kwp is null or array_capacity_kwp > 0),
  inverter_manufacturer text, inverter_model text, inverter_quantity integer check (inverter_quantity is null or inverter_quantity > 0),
  inverter_capacity_kw numeric check (inverter_capacity_kw is null or inverter_capacity_kw > 0),
  dc_ac_ratio numeric check (dc_ac_ratio is null or dc_ac_ratio > 0), string_configuration text, mounting_system text,
  battery_manufacturer text, battery_model text, battery_quantity integer check (battery_quantity is null or battery_quantity >= 0),
  battery_capacity_kwh numeric check (battery_capacity_kwh is null or battery_capacity_kwh >= 0),
  annual_generation_kwh numeric check (annual_generation_kwh is null or annual_generation_kwh >= 0),
  specific_yield_kwh_kwp numeric check (specific_yield_kwh_kwp is null or specific_yield_kwh_kwp >= 0),
  performance_ratio_pct numeric check (performance_ratio_pct is null or performance_ratio_pct between 0 and 100),
  export_limit_kw numeric check (export_limit_kw is null or export_limit_kw >= 0),
  grid_application_required boolean not null default false, grid_application_reference text,
  single_line_diagram_url text, layout_drawing_url text, structural_calculation_url text, generation_report_url text,
  design_assumptions text, design_constraints text, review_note text,
  approved_by uuid references public.profiles(id), approved_at timestamptz, created_by uuid references public.profiles(id),
  load_profile_id uuid, pv_module_id uuid, inverter_id uuid, battery_id uuid,
  engine_version text, input_snapshot jsonb not null default '{}'::jsonb, result_snapshot jsonb not null default '{}'::jsonb,
  validation_snapshot jsonb not null default '[]'::jsonb,
  minimum_cell_temp_c numeric, maximum_cell_temp_c numeric,
  modules_per_string integer check (modules_per_string is null or modules_per_string > 0),
  total_strings integer check (total_strings is null or total_strings > 0),
  strings_per_mppt integer check (strings_per_mppt is null or strings_per_mppt > 0),
  target_dc_ac_ratio numeric check (target_dc_ac_ratio is null or target_dc_ac_ratio > 0),
  backup_hours numeric check (backup_hours is null or backup_hours >= 0), backup_load_kw numeric check (backup_load_kw is null or backup_load_kw >= 0),
  calculator_revision_id uuid,
  electrical_design_snapshot jsonb not null default '{}'::jsonb,
  performance_snapshot jsonb not null default '{}'::jsonb,
  bom_snapshot jsonb not null default '[]'::jsonb,
  sld_svg text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organisation_id, design_reference, revision), unique (opportunity_id, revision)
);

create table if not exists public.load_profiles (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade, site_id uuid not null references public.sites(id) on delete restrict,
  name text not null, source text not null check (source in ('interval_data','utility_bills','appliance_schedule','manual_summary')),
  status text not null default 'draft' check (status in ('draft','ready','superseded')),
  data_quality text not null default 'estimated' check (data_quality in ('measured','derived','estimated')),
  interval_minutes integer check (interval_minutes is null or interval_minutes in (15,30,60)), timezone text,
  annual_energy_kwh numeric check (annual_energy_kwh is null or annual_energy_kwh >= 0),
  average_daily_energy_kwh numeric check (average_daily_energy_kwh is null or average_daily_energy_kwh >= 0),
  peak_demand_kw numeric check (peak_demand_kw is null or peak_demand_kw >= 0),
  essential_peak_demand_kw numeric check (essential_peak_demand_kw is null or essential_peak_demand_kw >= 0),
  assumptions text, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, organisation_id)
);

create table if not exists public.load_profile_intervals (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  load_profile_id uuid not null, interval_start timestamptz not null, demand_kw numeric not null check (demand_kw >= 0),
  energy_kwh numeric not null check (energy_kwh >= 0), essential boolean not null default false, category text, created_at timestamptz not null default now(),
  foreign key (load_profile_id, organisation_id) references public.load_profiles(id, organisation_id) on delete cascade
);

create table if not exists public.load_profile_utility_bills (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  load_profile_id uuid not null, bill_month date not null, energy_kwh numeric not null check (energy_kwh >= 0),
  peak_demand_kw numeric check (peak_demand_kw is null or peak_demand_kw >= 0), cost_amount numeric check (cost_amount is null or cost_amount >= 0),
  created_at timestamptz not null default now(), foreign key (load_profile_id, organisation_id) references public.load_profiles(id, organisation_id) on delete cascade,
  unique (load_profile_id, bill_month)
);

create table if not exists public.load_profile_appliances (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  load_profile_id uuid not null, name text not null, category text, rated_kw numeric not null check (rated_kw >= 0),
  quantity integer not null default 1 check (quantity > 0), hours_per_day numeric not null default 0 check (hours_per_day between 0 and 24),
  days_per_week numeric not null default 7 check (days_per_week between 0 and 7), simultaneity_pct numeric not null default 100 check (simultaneity_pct between 0 and 100),
  essential boolean not null default false, start_hour numeric not null default 8 check (start_hour >= 0 and start_hour < 24), created_at timestamptz not null default now(),
  foreign key (load_profile_id, organisation_id) references public.load_profiles(id, organisation_id) on delete cascade
);

create table if not exists public.engineering_intakes (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade, site_id uuid not null references public.sites(id) on delete restrict,
  load_profile_id uuid, system_type text not null check (system_type in ('on_grid','off_grid','hybrid')),
  design_objective text not null check (design_objective in ('reduce_imports','maximize_self_consumption','backup_resilience','off_grid_autonomy','peak_shaving','export_generation')),
  status text not null default 'draft' check (status in ('draft','ready','superseded')),
  target_pv_capacity_kwp numeric check (target_pv_capacity_kwp is null or target_pv_capacity_kwp > 0), autonomy_hours numeric check (autonomy_hours is null or autonomy_hours > 0),
  export_limit_kw numeric check (export_limit_kw is null or export_limit_kw >= 0), reserve_soc_pct numeric check (reserve_soc_pct is null or reserve_soc_pct between 0 and 100),
  notes text, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (load_profile_id, organisation_id) references public.load_profiles(id, organisation_id) on delete restrict,
  check (status <> 'ready' or (load_profile_id is not null and (system_type <> 'off_grid' or autonomy_hours is not null) and (system_type <> 'hybrid' or reserve_soc_pct is not null)))
);

alter table public.system_designs add constraint system_designs_engineering_intake_fkey foreign key (engineering_intake_id) references public.engineering_intakes(id) on delete restrict;
alter table public.system_designs add constraint system_designs_load_profile_org_fkey foreign key (load_profile_id, organisation_id) references public.load_profiles(id, organisation_id) on delete restrict;

create table if not exists public.equipment_manufacturers (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null, country_of_origin text, website_url text, status text not null default 'active' check (status in ('active','inactive')),
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (organisation_id, name), unique (id, organisation_id)
);

create table if not exists public.pv_modules (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  manufacturer_id uuid not null, model text not null, technology text not null default 'mono' check (technology in ('mono','topcon','hjt','thin_film','other')),
  pmax_w numeric not null check (pmax_w > 0), voc_v numeric not null check (voc_v > 0), vmp_v numeric not null check (vmp_v > 0), isc_a numeric not null check (isc_a > 0), imp_a numeric not null check (imp_a > 0),
  temp_coeff_pmax_pct_c numeric, temp_coeff_voc_pct_c numeric, temp_coeff_isc_pct_c numeric, max_system_voltage_v numeric check (max_system_voltage_v is null or max_system_voltage_v > 0),
  efficiency_pct numeric check (efficiency_pct is null or efficiency_pct between 0 and 100), width_mm numeric check (width_mm is null or width_mm > 0), height_mm numeric check (height_mm is null or height_mm > 0),
  weight_kg numeric check (weight_kg is null or weight_kg > 0), bifacial boolean not null default false, datasheet_url text,
  status text not null default 'draft' check (status in ('draft','approved','retired')), approved_by uuid references public.profiles(id), approved_at timestamptz,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (manufacturer_id, organisation_id) references public.equipment_manufacturers(id, organisation_id) on delete restrict,
  unique (organisation_id, manufacturer_id, model), unique (id, organisation_id)
);

create table if not exists public.inverters (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  manufacturer_id uuid not null, model text not null, inverter_type text not null check (inverter_type in ('grid_tied','off_grid','hybrid','pcs')),
  phase text not null check (phase in ('single','three')), rated_ac_power_kw numeric not null check (rated_ac_power_kw > 0), max_pv_input_power_kw numeric check (max_pv_input_power_kw is null or max_pv_input_power_kw > 0),
  max_dc_voltage_v numeric not null check (max_dc_voltage_v > 0), mppt_min_v numeric not null check (mppt_min_v > 0), mppt_max_v numeric not null check (mppt_max_v >= mppt_min_v),
  mppt_count integer not null check (mppt_count > 0), max_input_current_per_mppt_a numeric not null check (max_input_current_per_mppt_a > 0),
  max_short_circuit_current_per_mppt_a numeric not null check (max_short_circuit_current_per_mppt_a > 0), max_charge_power_kw numeric check (max_charge_power_kw is null or max_charge_power_kw >= 0),
  max_discharge_power_kw numeric check (max_discharge_power_kw is null or max_discharge_power_kw >= 0), battery_voltage_min_v numeric check (battery_voltage_min_v is null or battery_voltage_min_v > 0),
  battery_voltage_max_v numeric check (battery_voltage_max_v is null or battery_voltage_max_v >= battery_voltage_min_v), max_efficiency_pct numeric check (max_efficiency_pct is null or max_efficiency_pct between 0 and 100),
  datasheet_url text, status text not null default 'draft' check (status in ('draft','approved','retired')), approved_by uuid references public.profiles(id), approved_at timestamptz,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (manufacturer_id, organisation_id) references public.equipment_manufacturers(id, organisation_id) on delete restrict,
  unique (organisation_id, manufacturer_id, model), unique (id, organisation_id)
);

create table if not exists public.batteries (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  manufacturer_id uuid not null, model text not null, chemistry text not null default 'lfp' check (chemistry in ('lfp','nmc','lead_acid','other')),
  nominal_capacity_kwh numeric not null check (nominal_capacity_kwh > 0), usable_capacity_kwh numeric not null check (usable_capacity_kwh > 0 and usable_capacity_kwh <= nominal_capacity_kwh),
  nominal_voltage_v numeric not null check (nominal_voltage_v > 0), operating_voltage_min_v numeric check (operating_voltage_min_v is null or operating_voltage_min_v > 0),
  operating_voltage_max_v numeric check (operating_voltage_max_v is null or operating_voltage_max_v >= operating_voltage_min_v), max_charge_power_kw numeric not null check (max_charge_power_kw > 0),
  max_discharge_power_kw numeric not null check (max_discharge_power_kw > 0), max_dod_pct numeric check (max_dod_pct is null or max_dod_pct between 0 and 100),
  round_trip_efficiency_pct numeric check (round_trip_efficiency_pct is null or round_trip_efficiency_pct between 0 and 100), cycle_life integer check (cycle_life is null or cycle_life > 0),
  datasheet_url text, status text not null default 'draft' check (status in ('draft','approved','retired')), approved_by uuid references public.profiles(id), approved_at timestamptz,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (manufacturer_id, organisation_id) references public.equipment_manufacturers(id, organisation_id) on delete restrict,
  unique (organisation_id, manufacturer_id, model), unique (id, organisation_id)
);

create table if not exists public.inverter_battery_compatibility (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  inverter_id uuid not null, battery_id uuid not null, status text not null default 'approved' check (status in ('approved','conditional','not_compatible')),
  min_battery_units integer check (min_battery_units is null or min_battery_units > 0), max_battery_units integer check (max_battery_units is null or max_battery_units >= min_battery_units),
  notes text, created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (inverter_id, organisation_id) references public.inverters(id, organisation_id) on delete cascade,
  foreign key (battery_id, organisation_id) references public.batteries(id, organisation_id) on delete cascade,
  unique (organisation_id, inverter_id, battery_id)
);

alter table public.system_designs add constraint system_designs_pv_module_org_fkey foreign key (pv_module_id, organisation_id) references public.pv_modules(id, organisation_id) on delete restrict;
alter table public.system_designs add constraint system_designs_inverter_org_fkey foreign key (inverter_id, organisation_id) references public.inverters(id, organisation_id) on delete restrict;
alter table public.system_designs add constraint system_designs_battery_org_fkey foreign key (battery_id, organisation_id) references public.batteries(id, organisation_id) on delete restrict;

create table if not exists public.engineering_calculations (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  engineering_intake_id uuid not null references public.engineering_intakes(id) on delete cascade, calculation_reference text not null,
  revision integer not null check (revision > 0), system_type text not null check (system_type in ('on_grid','off_grid','hybrid')),
  status text not null default 'draft' check (status in ('draft','reviewed')), engine_version text not null,
  input_snapshot jsonb not null default '{}'::jsonb, result_snapshot jsonb not null default '{}'::jsonb, validation_snapshot jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(),
  unique (organisation_id, calculation_reference), unique (organisation_id, engineering_intake_id, revision), unique (id, organisation_id)
);

alter table public.system_designs add constraint system_designs_calculator_revision_org_fkey foreign key (calculator_revision_id, organisation_id) references public.engineering_calculations(id, organisation_id) on delete restrict;

create table if not exists public.system_design_string_groups (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  system_design_id uuid not null references public.system_designs(id) on delete cascade, inverter_index integer not null check (inverter_index > 0),
  mppt_index integer not null check (mppt_index > 0), strings_count integer not null check (strings_count > 0), modules_per_string integer not null check (modules_per_string > 0),
  created_at timestamptz not null default now(), unique(system_design_id, inverter_index, mppt_index)
);

create table if not exists public.system_design_checks (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  system_design_id uuid not null references public.system_designs(id) on delete cascade, sequence_no integer not null default 0,
  code text not null, severity text not null check (severity in ('pass','warning','error')), title text not null, detail text not null, created_at timestamptz not null default now()
);

create table if not exists public.equipment_import_batches (
  id uuid primary key default gen_random_uuid(), organisation_id uuid not null references public.organisations(id) on delete cascade,
  status text not null default 'uploading' check (status in ('uploading','processing','review','complete','failed')),
  file_count integer not null default 0 check (file_count >= 0), candidate_count integer not null default 0 check (candidate_count >= 0), error_count integer not null default 0 check (error_count >= 0),
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.equipment_import_files (
  id uuid primary key default gen_random_uuid(), batch_id uuid not null references public.equipment_import_batches(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade, category text not null check (category in ('pv_module','inverter','battery')),
  file_name text not null, storage_path text not null, file_size_bytes bigint not null default 0 check (file_size_bytes >= 0),
  extraction_status text not null default 'uploaded' check (extraction_status in ('uploaded','processing','review','failed')), page_count integer, extraction_note text,
  created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (organisation_id, storage_path)
);

create table if not exists public.equipment_import_candidates (
  id uuid primary key default gen_random_uuid(), batch_id uuid not null references public.equipment_import_batches(id) on delete cascade,
  file_id uuid not null references public.equipment_import_files(id) on delete cascade, organisation_id uuid not null references public.organisations(id) on delete cascade,
  category text not null check (category in ('pv_module','inverter','battery')), manufacturer_name text,
  manufacturer_id uuid references public.equipment_manufacturers(id) on delete set null, model text,
  specs jsonb not null default '{}'::jsonb, confidence jsonb not null default '{}'::jsonb, evidence jsonb not null default '{}'::jsonb,
  status text not null default 'review' check (status in ('review','imported','rejected')), imported_equipment_id uuid,
  created_by uuid not null references public.profiles(id), reviewed_by uuid references public.profiles(id), reviewed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index if not exists site_surveys_org_idx on public.site_surveys(organisation_id);
create index if not exists system_designs_org_idx on public.system_designs(organisation_id);
create index if not exists system_designs_opportunity_idx on public.system_designs(opportunity_id);
create unique index if not exists system_designs_intake_revision_uidx on public.system_designs(organisation_id, engineering_intake_id, revision) where engineering_intake_id is not null;
create index if not exists load_profiles_opportunity_idx on public.load_profiles(opportunity_id);
create index if not exists load_profile_intervals_profile_idx on public.load_profile_intervals(load_profile_id, interval_start);
create index if not exists load_profile_utility_bills_profile_idx on public.load_profile_utility_bills(load_profile_id, bill_month);
create index if not exists load_profile_appliances_profile_idx on public.load_profile_appliances(load_profile_id);
create index if not exists engineering_intakes_opportunity_idx on public.engineering_intakes(opportunity_id);
create index if not exists pv_modules_org_status_idx on public.pv_modules(organisation_id, status);
create index if not exists inverters_org_type_status_idx on public.inverters(organisation_id, inverter_type, status);
create index if not exists batteries_org_status_idx on public.batteries(organisation_id, status);
create index if not exists engineering_calculations_org_intake_idx on public.engineering_calculations(organisation_id, engineering_intake_id, revision desc);
create index if not exists system_design_string_groups_design_idx on public.system_design_string_groups(system_design_id);
create index if not exists system_design_checks_design_idx on public.system_design_checks(system_design_id, sequence_no);
create index if not exists equipment_import_batches_org_created_idx on public.equipment_import_batches(organisation_id, created_at desc);
create index if not exists equipment_import_files_batch_idx on public.equipment_import_files(batch_id, created_at);
create index if not exists equipment_import_candidates_batch_status_idx on public.equipment_import_candidates(batch_id, status, created_at);

-- Tenant RLS: all newly cut-over tables use the Neon-authenticated organisation context.
do $$
declare t text;
begin
  foreach t in array array[
    'site_surveys','system_designs','load_profiles','load_profile_intervals','load_profile_utility_bills','load_profile_appliances',
    'engineering_intakes','equipment_manufacturers','pv_modules','inverters','batteries','inverter_battery_compatibility',
    'engineering_calculations','system_design_string_groups','system_design_checks','equipment_import_batches','equipment_import_files','equipment_import_candidates'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_tenant_access', t);
    execute format('create policy %I on public.%I for all to authenticated using (organisation_id = public.current_organisation_id()) with check (organisation_id = public.current_organisation_id())', t || '_tenant_access', t);
  end loop;
end $$;
