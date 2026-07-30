-- Sprint 5: governed Solar EPC system design.
-- Design records inherit an approved Site Survey and remain tenant isolated.

create table if not exists public.system_designs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete restrict,
  survey_id uuid not null references public.site_surveys(id) on delete restrict,
  design_reference text not null,
  revision integer not null default 1 check (revision > 0),
  status text not null default 'draft' check (status in ('draft','in_progress','under_review','approved','rejected','superseded')),
  design_basis text,
  module_manufacturer text,
  module_model text,
  module_rating_wp numeric check (module_rating_wp is null or module_rating_wp > 0),
  module_quantity integer check (module_quantity is null or module_quantity > 0),
  array_capacity_kwp numeric check (array_capacity_kwp is null or array_capacity_kwp > 0),
  inverter_manufacturer text,
  inverter_model text,
  inverter_quantity integer check (inverter_quantity is null or inverter_quantity > 0),
  inverter_capacity_kw numeric check (inverter_capacity_kw is null or inverter_capacity_kw > 0),
  dc_ac_ratio numeric check (dc_ac_ratio is null or dc_ac_ratio > 0),
  string_configuration text,
  mounting_system text,
  battery_manufacturer text,
  battery_model text,
  battery_quantity integer check (battery_quantity is null or battery_quantity >= 0),
  battery_capacity_kwh numeric check (battery_capacity_kwh is null or battery_capacity_kwh >= 0),
  annual_generation_kwh numeric check (annual_generation_kwh is null or annual_generation_kwh >= 0),
  specific_yield_kwh_kwp numeric check (specific_yield_kwh_kwp is null or specific_yield_kwh_kwp >= 0),
  performance_ratio_pct numeric check (performance_ratio_pct is null or performance_ratio_pct between 0 and 100),
  export_limit_kw numeric check (export_limit_kw is null or export_limit_kw >= 0),
  grid_application_required boolean not null default false,
  grid_application_reference text,
  single_line_diagram_url text,
  layout_drawing_url text,
  structural_calculation_url text,
  generation_report_url text,
  design_assumptions text,
  design_constraints text,
  review_note text,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, design_reference, revision),
  unique (opportunity_id, revision)
);

create index if not exists system_designs_org_idx on public.system_designs(organisation_id);
create index if not exists system_designs_opportunity_idx on public.system_designs(opportunity_id);
create index if not exists system_designs_site_idx on public.system_designs(site_id);

alter table public.system_designs enable row level security;

drop policy if exists system_designs_tenant_access on public.system_designs;
create policy system_designs_tenant_access on public.system_designs
for all to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());

create or replace function public.commit_system_design(
  p_organisation_id uuid,
  p_opportunity_id uuid,
  p_site_id uuid,
  p_survey_id uuid,
  p_design_reference text,
  p_revision integer,
  p_status text,
  p_payload jsonb,
  p_event_type text,
  p_description text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_survey_status text;
  v_existing_status text;
begin
  if p_organisation_id is distinct from public.current_organisation_id() then
    raise exception 'Organisation context mismatch';
  end if;

  if p_status not in ('draft','in_progress','under_review','approved','rejected','superseded') then
    raise exception 'Invalid design status';
  end if;

  if not exists (
    select 1 from public.opportunities
    where id = p_opportunity_id and organisation_id = p_organisation_id and site_id = p_site_id
  ) then
    raise exception 'Opportunity and Site relationship mismatch';
  end if;

  select status into v_survey_status
  from public.site_surveys
  where id = p_survey_id
    and organisation_id = p_organisation_id
    and opportunity_id = p_opportunity_id
    and site_id = p_site_id;

  if v_survey_status is null then
    raise exception 'Approved Site Survey not found for this Opportunity';
  end if;
  if v_survey_status <> 'approved' then
    raise exception 'System Design requires an approved Site Survey';
  end if;

  select status into v_existing_status
  from public.system_designs
  where opportunity_id = p_opportunity_id and revision = p_revision;

  if v_existing_status = 'approved' and p_status <> 'approved' then
    raise exception 'Approved design revisions are locked';
  end if;

  insert into public.system_designs (
    organisation_id, opportunity_id, site_id, survey_id, design_reference, revision, status,
    design_basis, module_manufacturer, module_model, module_rating_wp, module_quantity,
    array_capacity_kwp, inverter_manufacturer, inverter_model, inverter_quantity,
    inverter_capacity_kw, dc_ac_ratio, string_configuration, mounting_system,
    battery_manufacturer, battery_model, battery_quantity, battery_capacity_kwh,
    annual_generation_kwh, specific_yield_kwh_kwp, performance_ratio_pct,
    export_limit_kw, grid_application_required, grid_application_reference,
    single_line_diagram_url, layout_drawing_url, structural_calculation_url,
    generation_report_url, design_assumptions, design_constraints, review_note,
    approved_by, approved_at, created_by, updated_at
  ) values (
    p_organisation_id, p_opportunity_id, p_site_id, p_survey_id, p_design_reference, p_revision, p_status,
    nullif(p_payload->>'design_basis',''), nullif(p_payload->>'module_manufacturer',''), nullif(p_payload->>'module_model',''),
    nullif(p_payload->>'module_rating_wp','')::numeric, nullif(p_payload->>'module_quantity','')::integer,
    nullif(p_payload->>'array_capacity_kwp','')::numeric, nullif(p_payload->>'inverter_manufacturer',''),
    nullif(p_payload->>'inverter_model',''), nullif(p_payload->>'inverter_quantity','')::integer,
    nullif(p_payload->>'inverter_capacity_kw','')::numeric, nullif(p_payload->>'dc_ac_ratio','')::numeric,
    nullif(p_payload->>'string_configuration',''), nullif(p_payload->>'mounting_system',''),
    nullif(p_payload->>'battery_manufacturer',''), nullif(p_payload->>'battery_model',''),
    nullif(p_payload->>'battery_quantity','')::integer, nullif(p_payload->>'battery_capacity_kwh','')::numeric,
    nullif(p_payload->>'annual_generation_kwh','')::numeric, nullif(p_payload->>'specific_yield_kwh_kwp','')::numeric,
    nullif(p_payload->>'performance_ratio_pct','')::numeric, nullif(p_payload->>'export_limit_kw','')::numeric,
    coalesce((p_payload->>'grid_application_required')::boolean,false), nullif(p_payload->>'grid_application_reference',''),
    nullif(p_payload->>'single_line_diagram_url',''), nullif(p_payload->>'layout_drawing_url',''),
    nullif(p_payload->>'structural_calculation_url',''), nullif(p_payload->>'generation_report_url',''),
    nullif(p_payload->>'design_assumptions',''), nullif(p_payload->>'design_constraints',''), nullif(p_payload->>'review_note',''),
    case when p_status = 'approved' then auth.uid() else null end,
    case when p_status = 'approved' then now() else null end,
    auth.uid(), now()
  )
  on conflict (opportunity_id, revision) do update set
    survey_id = excluded.survey_id,
    design_reference = excluded.design_reference,
    status = excluded.status,
    design_basis = excluded.design_basis,
    module_manufacturer = excluded.module_manufacturer,
    module_model = excluded.module_model,
    module_rating_wp = excluded.module_rating_wp,
    module_quantity = excluded.module_quantity,
    array_capacity_kwp = excluded.array_capacity_kwp,
    inverter_manufacturer = excluded.inverter_manufacturer,
    inverter_model = excluded.inverter_model,
    inverter_quantity = excluded.inverter_quantity,
    inverter_capacity_kw = excluded.inverter_capacity_kw,
    dc_ac_ratio = excluded.dc_ac_ratio,
    string_configuration = excluded.string_configuration,
    mounting_system = excluded.mounting_system,
    battery_manufacturer = excluded.battery_manufacturer,
    battery_model = excluded.battery_model,
    battery_quantity = excluded.battery_quantity,
    battery_capacity_kwh = excluded.battery_capacity_kwh,
    annual_generation_kwh = excluded.annual_generation_kwh,
    specific_yield_kwh_kwp = excluded.specific_yield_kwh_kwp,
    performance_ratio_pct = excluded.performance_ratio_pct,
    export_limit_kw = excluded.export_limit_kw,
    grid_application_required = excluded.grid_application_required,
    grid_application_reference = excluded.grid_application_reference,
    single_line_diagram_url = excluded.single_line_diagram_url,
    layout_drawing_url = excluded.layout_drawing_url,
    structural_calculation_url = excluded.structural_calculation_url,
    generation_report_url = excluded.generation_report_url,
    design_assumptions = excluded.design_assumptions,
    design_constraints = excluded.design_constraints,
    review_note = excluded.review_note,
    approved_by = excluded.approved_by,
    approved_at = excluded.approved_at,
    updated_at = now();

  insert into public.activity_logs (organisation_id, actor_id, event_type, description)
  values (p_organisation_id, auth.uid(), p_event_type, p_description);
end;
$$;

grant execute on function public.commit_system_design(uuid, uuid, uuid, uuid, text, integer, text, jsonb, text, text) to authenticated;
