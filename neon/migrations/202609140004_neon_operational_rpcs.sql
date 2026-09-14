-- Session 08: Neon-native operational database functions.
-- These preserve the governed atomic workflows previously defined only in the
-- legacy Supabase migration tree. All functions execute against Neon Auth via
-- auth.uid() and the existing tenant context helpers.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create or replace function public.create_epc_project(
  p_customer_id uuid,
  p_site_id uuid,
  p_name text,
  p_reference text,
  p_status text default 'qualification',
  p_risk_status text default 'green',
  p_project_type text default null,
  p_pv_capacity_kwp numeric default null,
  p_battery_capacity_kwh numeric default null,
  p_contract_value_gbp numeric default null,
  p_target_completion_date date default null,
  p_project_owner_id uuid default null,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_organisation_id uuid := public.current_organisation_id();
  v_project_id uuid;
begin
  if v_organisation_id is null then
    raise exception 'No organisation context is available';
  end if;

  insert into public.projects (
    organisation_id, customer_id, site_id, name, reference, status,
    risk_status, project_type, pv_capacity_kwp, battery_capacity_kwh,
    contract_value_gbp, target_completion_date, project_owner_id, notes
  ) values (
    v_organisation_id, p_customer_id, p_site_id, trim(p_name), upper(trim(p_reference)), p_status,
    p_risk_status, nullif(trim(p_project_type), ''), p_pv_capacity_kwp, p_battery_capacity_kwh,
    p_contract_value_gbp, p_target_completion_date, p_project_owner_id, nullif(trim(p_notes), '')
  ) returning id into v_project_id;

  insert into public.activity_logs (organisation_id, project_id, actor_id, event_type, description)
  values (
    v_organisation_id, v_project_id, auth.uid(), 'project_created',
    'Project ' || upper(trim(p_reference)) || ' created in ' || replace(p_status, '_', ' ') || ' stage.'
  );

  return v_project_id;
end;
$$;

create or replace function public.update_project_control(
  p_project_id uuid,
  p_status text,
  p_risk_status text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_project public.projects%rowtype;
  v_changes text[] := array[]::text[];
begin
  select * into v_project from public.projects where id = p_project_id for update;
  if not found then raise exception 'Project not found'; end if;

  if v_project.status is distinct from p_status then
    v_changes := array_append(v_changes, 'stage changed from ' || replace(v_project.status, '_', ' ') || ' to ' || replace(p_status, '_', ' '));
  end if;
  if v_project.risk_status is distinct from p_risk_status then
    v_changes := array_append(v_changes, 'risk changed from ' || v_project.risk_status || ' to ' || p_risk_status);
  end if;

  update public.projects set status = p_status, risk_status = p_risk_status where id = p_project_id;

  if cardinality(v_changes) > 0 then
    insert into public.activity_logs (organisation_id, project_id, actor_id, event_type, description)
    values (
      v_project.organisation_id, p_project_id, auth.uid(), 'project_control_updated',
      initcap(array_to_string(v_changes, '; ')) || '.'
    );
  end if;
end;
$$;

create or replace function public.commit_governed_proposal(
  p_organisation_id uuid,
  p_opportunity_id uuid,
  p_proposal_number text,
  p_status text,
  p_commercial jsonb,
  p_issued_at timestamptz,
  p_opportunity_stage text,
  p_event_type text,
  p_description text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_organisation_id is distinct from public.current_organisation_id() then raise exception 'Organisation context mismatch'; end if;
  if p_status not in ('draft','issued','accepted','declined','expired') then raise exception 'Invalid proposal status'; end if;
  if p_opportunity_stage not in ('proposal','won','lost') then raise exception 'Invalid Opportunity stage'; end if;

  insert into public.indicative_proposals (
    organisation_id, opportunity_id, proposal_number, status,
    pv_capacity_kwp, battery_capacity_kwh, estimated_generation_kwh,
    estimated_annual_saving_gbp, indicative_price_gbp, assumptions, exclusions,
    valid_until, issued_at, updated_at
  ) values (
    p_organisation_id, p_opportunity_id, p_proposal_number, p_status,
    nullif(p_commercial->>'pv_capacity_kwp','')::numeric,
    nullif(p_commercial->>'battery_capacity_kwh','')::numeric,
    nullif(p_commercial->>'estimated_generation_kwh','')::numeric,
    nullif(p_commercial->>'estimated_annual_saving_gbp','')::numeric,
    nullif(p_commercial->>'indicative_price_gbp','')::numeric,
    nullif(p_commercial->>'assumptions',''),
    nullif(p_commercial->>'exclusions',''),
    nullif(p_commercial->>'valid_until','')::date,
    p_issued_at, now()
  )
  on conflict (opportunity_id) do update set
    proposal_number = excluded.proposal_number,
    status = excluded.status,
    pv_capacity_kwp = excluded.pv_capacity_kwp,
    battery_capacity_kwh = excluded.battery_capacity_kwh,
    estimated_generation_kwh = excluded.estimated_generation_kwh,
    estimated_annual_saving_gbp = excluded.estimated_annual_saving_gbp,
    indicative_price_gbp = excluded.indicative_price_gbp,
    assumptions = excluded.assumptions,
    exclusions = excluded.exclusions,
    valid_until = excluded.valid_until,
    issued_at = excluded.issued_at,
    updated_at = now();

  update public.opportunities
  set stage = p_opportunity_stage, updated_at = now()
  where id = p_opportunity_id and organisation_id = p_organisation_id;
  if not found then raise exception 'Opportunity not found or access denied'; end if;

  insert into public.activity_logs (organisation_id, actor_id, event_type, description)
  values (p_organisation_id, auth.uid(), p_event_type, p_description);
end;
$$;

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
  if p_organisation_id is distinct from public.current_organisation_id() then raise exception 'Organisation context mismatch'; end if;
  if p_status not in ('draft','in_progress','under_review','approved','rejected') then raise exception 'Invalid survey status'; end if;

  select status into v_current_status
  from public.site_surveys
  where opportunity_id = p_opportunity_id and organisation_id = p_organisation_id;

  if v_current_status = 'approved' and p_status <> 'approved' then raise exception 'Approved surveys are locked'; end if;
  if not exists (
    select 1 from public.opportunities
    where id = p_opportunity_id and organisation_id = p_organisation_id and site_id = p_site_id
  ) then raise exception 'Opportunity and Site relationship mismatch'; end if;

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
  if p_organisation_id is distinct from public.current_organisation_id() then raise exception 'Organisation context mismatch'; end if;
  if p_status not in ('draft','in_progress','under_review','approved','rejected','superseded') then raise exception 'Invalid design status'; end if;
  if not exists (
    select 1 from public.opportunities
    where id = p_opportunity_id and organisation_id = p_organisation_id and site_id = p_site_id
  ) then raise exception 'Opportunity and Site relationship mismatch'; end if;

  select status into v_survey_status
  from public.site_surveys
  where id = p_survey_id and organisation_id = p_organisation_id
    and opportunity_id = p_opportunity_id and site_id = p_site_id;

  if v_survey_status is null then raise exception 'Approved Site Survey not found for this Opportunity'; end if;
  if v_survey_status <> 'approved' then raise exception 'System Design requires an approved Site Survey'; end if;

  select status into v_existing_status
  from public.system_designs
  where opportunity_id = p_opportunity_id and revision = p_revision;
  if v_existing_status = 'approved' and p_status <> 'approved' then raise exception 'Approved design revisions are locked'; end if;

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

create or replace function public.replace_load_profile_intervals(
  p_load_profile_id uuid,
  p_interval_minutes integer,
  p_timezone text,
  p_rows jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_organisation_id uuid;
  v_count integer;
  v_total_energy numeric;
  v_peak numeric;
  v_essential_peak numeric;
  v_covered_hours numeric;
  v_annual_energy numeric;
begin
  if p_interval_minutes not in (15,30,60) then raise exception 'Interval minutes must be 15, 30 or 60'; end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then raise exception 'At least one interval row is required'; end if;

  select organisation_id into v_organisation_id
  from public.load_profiles
  where id = p_load_profile_id and organisation_id = public.current_organisation_id();
  if v_organisation_id is null then raise exception 'Load profile not found or access denied'; end if;

  delete from public.load_profile_intervals
  where load_profile_id = p_load_profile_id and organisation_id = v_organisation_id;

  insert into public.load_profile_intervals (
    organisation_id, load_profile_id, interval_start, demand_kw, energy_kwh, essential, category
  )
  select
    v_organisation_id, p_load_profile_id,
    (row_data->>'interval_start')::timestamptz,
    (row_data->>'demand_kw')::numeric,
    (row_data->>'energy_kwh')::numeric,
    coalesce((row_data->>'essential')::boolean,false),
    nullif(row_data->>'category','')
  from jsonb_array_elements(p_rows) as row_data;

  select count(*), coalesce(sum(energy_kwh),0), coalesce(max(demand_kw),0),
         coalesce(max(demand_kw) filter (where essential),0)
  into v_count, v_total_energy, v_peak, v_essential_peak
  from public.load_profile_intervals
  where load_profile_id = p_load_profile_id and organisation_id = v_organisation_id;

  v_covered_hours := v_count * (p_interval_minutes::numeric / 60);
  v_annual_energy := case when v_covered_hours > 0 then v_total_energy * (8760 / v_covered_hours) else 0 end;

  update public.load_profiles
  set interval_minutes = p_interval_minutes,
      timezone = nullif(p_timezone,''),
      annual_energy_kwh = round(v_annual_energy,2),
      average_daily_energy_kwh = round(v_annual_energy/365,2),
      peak_demand_kw = round(v_peak,2),
      essential_peak_demand_kw = round(v_essential_peak,2),
      data_quality = 'measured',
      status = 'draft',
      updated_at = now()
  where id = p_load_profile_id and organisation_id = v_organisation_id;
end;
$$;

revoke all on function public.create_epc_project(uuid, uuid, text, text, text, text, text, numeric, numeric, numeric, date, uuid, text) from public;
revoke all on function public.update_project_control(uuid, text, text) from public;
revoke all on function public.commit_governed_proposal(uuid, uuid, text, text, jsonb, timestamptz, text, text, text) from public;
revoke all on function public.commit_site_survey(uuid, uuid, uuid, text, text, jsonb, text, text) from public;
revoke all on function public.commit_system_design(uuid, uuid, uuid, uuid, text, integer, text, jsonb, text, text) from public;
revoke all on function public.replace_load_profile_intervals(uuid, integer, text, jsonb) from public;

grant execute on function public.create_epc_project(uuid, uuid, text, text, text, text, text, numeric, numeric, numeric, date, uuid, text) to authenticated;
grant execute on function public.update_project_control(uuid, text, text) to authenticated;
grant execute on function public.commit_governed_proposal(uuid, uuid, text, text, jsonb, timestamptz, text, text, text) to authenticated;
grant execute on function public.commit_site_survey(uuid, uuid, uuid, text, text, jsonb, text, text) to authenticated;
grant execute on function public.commit_system_design(uuid, uuid, uuid, uuid, text, integer, text, jsonb, text, text) to authenticated;
grant execute on function public.replace_load_profile_intervals(uuid, integer, text, jsonb) to authenticated;
