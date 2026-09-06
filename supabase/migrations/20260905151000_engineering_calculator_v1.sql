create table if not exists public.engineering_calculations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  engineering_intake_id uuid not null references public.engineering_intakes(id) on delete cascade,
  calculation_reference text not null,
  revision integer not null check (revision > 0),
  system_type text not null check (system_type in ('on_grid','off_grid','hybrid')),
  status text not null default 'draft' check (status in ('draft','reviewed')),
  engine_version text not null,
  input_snapshot jsonb not null default '{}'::jsonb,
  result_snapshot jsonb not null default '{}'::jsonb,
  validation_snapshot jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint engineering_calculations_org_reference_key unique (organisation_id, calculation_reference),
  constraint engineering_calculations_org_intake_revision_key unique (organisation_id, engineering_intake_id, revision)
);

create index if not exists engineering_calculations_org_intake_idx
  on public.engineering_calculations (organisation_id, engineering_intake_id, revision desc);
create index if not exists engineering_calculations_created_by_idx
  on public.engineering_calculations (created_by);

alter table public.engineering_calculations enable row level security;

drop policy if exists engineering_calculations_select_tenant on public.engineering_calculations;
create policy engineering_calculations_select_tenant
  on public.engineering_calculations for select
  to authenticated
  using (organisation_id = (select public.current_organisation_id()));

drop policy if exists engineering_calculations_insert_tenant on public.engineering_calculations;
create policy engineering_calculations_insert_tenant
  on public.engineering_calculations for insert
  to authenticated
  with check (organisation_id = (select public.current_organisation_id()));

grant select, insert on table public.engineering_calculations to authenticated;
