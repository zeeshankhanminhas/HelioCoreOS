alter table public.system_designs alter column survey_id drop not null;

alter table public.system_designs
  add column if not exists system_type text,
  add column if not exists load_profile_id uuid,
  add column if not exists pv_module_id uuid,
  add column if not exists inverter_id uuid,
  add column if not exists battery_id uuid,
  add column if not exists engine_version text,
  add column if not exists input_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists result_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists validation_snapshot jsonb not null default '[]'::jsonb,
  add column if not exists minimum_cell_temp_c numeric,
  add column if not exists maximum_cell_temp_c numeric,
  add column if not exists modules_per_string integer,
  add column if not exists total_strings integer,
  add column if not exists strings_per_mppt integer,
  add column if not exists target_dc_ac_ratio numeric,
  add column if not exists backup_hours numeric,
  add column if not exists backup_load_kw numeric;

alter table public.system_designs
  drop constraint if exists system_designs_system_type_check,
  add constraint system_designs_system_type_check check (system_type is null or system_type in ('on_grid','off_grid','hybrid')),
  drop constraint if exists system_designs_modules_per_string_check,
  add constraint system_designs_modules_per_string_check check (modules_per_string is null or modules_per_string > 0),
  drop constraint if exists system_designs_total_strings_check,
  add constraint system_designs_total_strings_check check (total_strings is null or total_strings > 0),
  drop constraint if exists system_designs_strings_per_mppt_check,
  add constraint system_designs_strings_per_mppt_check check (strings_per_mppt is null or strings_per_mppt > 0),
  drop constraint if exists system_designs_target_dc_ac_ratio_check,
  add constraint system_designs_target_dc_ac_ratio_check check (target_dc_ac_ratio is null or target_dc_ac_ratio > 0),
  drop constraint if exists system_designs_backup_hours_check,
  add constraint system_designs_backup_hours_check check (backup_hours is null or backup_hours >= 0),
  drop constraint if exists system_designs_backup_load_kw_check,
  add constraint system_designs_backup_load_kw_check check (backup_load_kw is null or backup_load_kw >= 0);

alter table public.system_designs
  drop constraint if exists system_designs_load_profile_org_fkey,
  add constraint system_designs_load_profile_org_fkey foreign key (load_profile_id, organisation_id) references public.load_profiles(id, organisation_id) on delete restrict,
  drop constraint if exists system_designs_pv_module_org_fkey,
  add constraint system_designs_pv_module_org_fkey foreign key (pv_module_id, organisation_id) references public.pv_modules(id, organisation_id) on delete restrict,
  drop constraint if exists system_designs_inverter_org_fkey,
  add constraint system_designs_inverter_org_fkey foreign key (inverter_id, organisation_id) references public.inverters(id, organisation_id) on delete restrict,
  drop constraint if exists system_designs_battery_org_fkey,
  add constraint system_designs_battery_org_fkey foreign key (battery_id, organisation_id) references public.batteries(id, organisation_id) on delete restrict;

create unique index if not exists system_designs_intake_revision_uidx on public.system_designs(organisation_id, engineering_intake_id, revision) where engineering_intake_id is not null;
create index if not exists system_designs_equipment_idx on public.system_designs(organisation_id, pv_module_id, inverter_id, battery_id);

create table if not exists public.system_design_string_groups (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  system_design_id uuid not null references public.system_designs(id) on delete cascade,
  inverter_index integer not null check (inverter_index > 0),
  mppt_index integer not null check (mppt_index > 0),
  strings_count integer not null check (strings_count > 0),
  modules_per_string integer not null check (modules_per_string > 0),
  created_at timestamptz not null default now(),
  unique(system_design_id, inverter_index, mppt_index)
);

create table if not exists public.system_design_checks (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  system_design_id uuid not null references public.system_designs(id) on delete cascade,
  sequence_no integer not null default 0,
  code text not null,
  severity text not null check (severity in ('pass','warning','error')),
  title text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

create index if not exists system_design_string_groups_design_idx on public.system_design_string_groups(system_design_id);
create index if not exists system_design_checks_design_idx on public.system_design_checks(system_design_id, sequence_no);

alter table public.system_design_string_groups enable row level security;
alter table public.system_design_checks enable row level security;
revoke all on table public.system_design_string_groups from anon, authenticated;
revoke all on table public.system_design_checks from anon, authenticated;
grant select, insert, update, delete on table public.system_design_string_groups to authenticated;
grant select, insert, update, delete on table public.system_design_checks to authenticated;

drop policy if exists system_design_string_groups_tenant_access on public.system_design_string_groups;
create policy system_design_string_groups_tenant_access on public.system_design_string_groups for all to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());

drop policy if exists system_design_checks_tenant_access on public.system_design_checks;
create policy system_design_checks_tenant_access on public.system_design_checks for all to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());
