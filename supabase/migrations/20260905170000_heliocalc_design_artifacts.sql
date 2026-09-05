-- Prepare governed design persistence for HelioCalc outputs.
-- Detailed Design remains downstream of the Calculator UI, but the storage contract is ready.

alter table public.system_designs
  add column if not exists calculator_revision_id uuid,
  add column if not exists electrical_design_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists performance_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists bom_snapshot jsonb not null default '[]'::jsonb,
  add column if not exists sld_svg text;

create unique index if not exists engineering_calculations_id_org_key
  on public.engineering_calculations (id, organisation_id);

alter table public.system_designs
  drop constraint if exists system_designs_calculator_revision_org_fkey;

alter table public.system_designs
  add constraint system_designs_calculator_revision_org_fkey
  foreign key (calculator_revision_id, organisation_id)
  references public.engineering_calculations (id, organisation_id)
  on delete restrict;

create index if not exists system_designs_calculator_revision_org_idx
  on public.system_designs (calculator_revision_id, organisation_id)
  where calculator_revision_id is not null;
