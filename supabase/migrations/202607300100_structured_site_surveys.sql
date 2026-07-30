-- Sprint 4: governed structured Site Survey records.

create table if not exists public.site_surveys (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete restrict,
  survey_reference text not null,
  status text not null default 'draft' check (status in ('draft','in_progress','under_review','approved','rejected')),
  survey_date date,
  surveyor_name text,
  weather_conditions text,
  access_notes text,
  roof_type text,
  roof_covering text,
  roof_condition text,
  roof_orientation_deg numeric check (roof_orientation_deg is null or roof_orientation_deg between 0 and 359.99),
  roof_pitch_deg numeric check (roof_pitch_deg is null or roof_pitch_deg between 0 and 90),
  usable_roof_area_m2 numeric check (usable_roof_area_m2 is null or usable_roof_area_m2 >= 0),
  shading_summary text,
  structural_observations text,
  supply_phase text check (supply_phase is null or supply_phase in ('single_phase','three_phase','unknown')),
  main_fuse_rating_a numeric check (main_fuse_rating_a is null or main_fuse_rating_a >= 0),
  meter_location text,
  consumer_unit_location text,
  earthing_arrangement text,
  cable_route_notes text,
  inverter_location text,
  battery_location text,
  fire_safety_notes text,
  asbestos_risk text check (asbestos_risk is null or asbestos_risk in ('none_identified','possible','confirmed','unknown')),
  working_at_height_risk text,
  planning_constraints text,
  grid_constraints text,
  other_constraints text,
  recommended_pv_kwp numeric check (recommended_pv_kwp is null or recommended_pv_kwp >= 0),
  recommended_battery_kwh numeric check (recommended_battery_kwh is null or recommended_battery_kwh >= 0),
  photo_links text[] not null default '{}',
  drawing_links text[] not null default '{}',
  review_note text,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (opportunity_id),
  unique (organisation_id, survey_reference)
);

create index if not exists site_surveys_org_idx on public.site_surveys (organisation_id);
create index if not exists site_surveys_site_idx on public.site_surveys (site_id);
create index if not exists site_surveys_status_idx on public.site_surveys (organisation_id, status);

alter table public.site_surveys enable row level security;

drop policy if exists "site_surveys_tenant_select" on public.site_surveys;
create policy "site_surveys_tenant_select" on public.site_surveys
for select to authenticated
using (organisation_id = public.current_organisation_id());

drop policy if exists "site_surveys_tenant_insert" on public.site_surveys;
create policy "site_surveys_tenant_insert" on public.site_surveys
for insert to authenticated
with check (organisation_id = public.current_organisation_id());

drop policy if exists "site_surveys_tenant_update" on public.site_surveys;
create policy "site_surveys_tenant_update" on public.site_surveys
for update to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());

drop policy if exists "site_surveys_tenant_delete" on public.site_surveys;
create policy "site_surveys_tenant_delete" on public.site_surveys
for delete to authenticated
using (organisation_id = public.current_organisation_id());

create or replace function public.commit_site_survey(
  p_organisation_id uuid,
  p_opportunity_id uuid,
  p_site_id uuid,
  p_survey_reference text,
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
  v_current_status text;
begin
  if p_organisation_id is distinct from public.current_organisation_id() then
    raise exception 'Organisation context mismatch';
  end if;

  if p_status not in ('draft','in_progress','under_review','approved','rejected') then
    raise exception 'Invalid survey status';
  end if;

  select status into v_current_status
  from public.site_surveys
  where opportunity_id = p_opportunity_id
    and organisation_id = p_organisation_id;

  if v_current_status = 'approved' and p_status <> 'approved' then
    raise exception 'Approved surveys are locked';
  end if;

  if not exists (
    select 1 from public.opportunities
    where id = p_opportunity_id
      and organisation_id = p_organisation_id
      and site_id = p_site_id
  ) then
    raise exception 'Opportunity and Site relationship mismatch';
  end if;

  insert into public.site_surveys (
    organisation_id, opportunity_id, site_id, survey_reference, status,
    survey_date, surveyor_name, weather_conditions, access_notes,
    roof_type, roof_covering, roof_condition, roof_orientation_deg, roof_pitch_deg,
    usable_roof_area_m2, shading_summary, structural_observations,
    supply_phase, main_fuse_rating_a, meter_location, consumer_unit_location,
    earthing_arrangement, cable_route_notes, inverter_location, battery_location,
    fire_safety_notes, asbestos_risk, working_at_height_risk, planning_constraints,
    grid_constraints, other_constraints, recommended_pv_kwp, recommended_battery_kwh,
    photo_links, drawing_links, review_note, approved_by, approved_at, updated_at
  ) values (
    p_organisation_id, p_opportunity_id, p_site_id, p_survey_reference, p_status,
    nullif(p_payload->>'survey_date','')::date,
    nullif(p_payload->>'surveyor_name',''), nullif(p_payload->>'weather_conditions',''), nullif(p_payload->>'access_notes',''),
    nullif(p_payload->>'roof_type',''), nullif(p_payload->>'roof_covering',''), nullif(p_payload->>'roof_condition',''),
    nullif(p_payload->>'roof_orientation_deg','')::numeric, nullif(p_payload->>'roof_pitch_deg','')::numeric,
    nullif(p_payload->>'usable_roof_area_m2','')::numeric, nullif(p_payload->>'shading_summary',''), nullif(p_payload->>'structural_observations',''),
    nullif(p_payload->>'supply_phase',''), nullif(p_payload->>'main_fuse_rating_a','')::numeric,
    nullif(p_payload->>'meter_location',''), nullif(p_payload->>'consumer_unit_location',''), nullif(p_payload->>'earthing_arrangement',''),
    nullif(p_payload->>'cable_route_notes',''), nullif(p_payload->>'inverter_location',''), nullif(p_payload->>'battery_location',''),
    nullif(p_payload->>'fire_safety_notes',''), nullif(p_payload->>'asbestos_risk',''), nullif(p_payload->>'working_at_height_risk',''),
    nullif(p_payload->>'planning_constraints',''), nullif(p_payload->>'grid_constraints',''), nullif(p_payload->>'other_constraints',''),
    nullif(p_payload->>'recommended_pv_kwp','')::numeric, nullif(p_payload->>'recommended_battery_kwh','')::numeric,
    coalesce(array(select jsonb_array_elements_text(coalesce(p_payload->'photo_links','[]'::jsonb))), '{}'),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_payload->'drawing_links','[]'::jsonb))), '{}'),
    nullif(p_payload->>'review_note',''),
    case when p_status = 'approved' then auth.uid() else null end,
    case when p_status = 'approved' then now() else null end,
    now()
  )
  on conflict (opportunity_id) do update set
    site_id = excluded.site_id,
    survey_reference = excluded.survey_reference,
    status = excluded.status,
    survey_date = excluded.survey_date,
    surveyor_name = excluded.surveyor_name,
    weather_conditions = excluded.weather_conditions,
    access_notes = excluded.access_notes,
    roof_type = excluded.roof_type,
    roof_covering = excluded.roof_covering,
    roof_condition = excluded.roof_condition,
    roof_orientation_deg = excluded.roof_orientation_deg,
    roof_pitch_deg = excluded.roof_pitch_deg,
    usable_roof_area_m2 = excluded.usable_roof_area_m2,
    shading_summary = excluded.shading_summary,
    structural_observations = excluded.structural_observations,
    supply_phase = excluded.supply_phase,
    main_fuse_rating_a = excluded.main_fuse_rating_a,
    meter_location = excluded.meter_location,
    consumer_unit_location = excluded.consumer_unit_location,
    earthing_arrangement = excluded.earthing_arrangement,
    cable_route_notes = excluded.cable_route_notes,
    inverter_location = excluded.inverter_location,
    battery_location = excluded.battery_location,
    fire_safety_notes = excluded.fire_safety_notes,
    asbestos_risk = excluded.asbestos_risk,
    working_at_height_risk = excluded.working_at_height_risk,
    planning_constraints = excluded.planning_constraints,
    grid_constraints = excluded.grid_constraints,
    other_constraints = excluded.other_constraints,
    recommended_pv_kwp = excluded.recommended_pv_kwp,
    recommended_battery_kwh = excluded.recommended_battery_kwh,
    photo_links = excluded.photo_links,
    drawing_links = excluded.drawing_links,
    review_note = excluded.review_note,
    approved_by = excluded.approved_by,
    approved_at = excluded.approved_at,
    updated_at = now();

  insert into public.activity_logs (organisation_id, actor_id, event_type, description)
  values (p_organisation_id, auth.uid(), p_event_type, p_description);
end;
$$;

grant execute on function public.commit_site_survey(uuid, uuid, uuid, text, text, jsonb, text, text) to authenticated;
