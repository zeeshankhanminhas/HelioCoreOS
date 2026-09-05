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
  if p_interval_minutes not in (15, 30, 60) then
    raise exception 'Interval minutes must be 15, 30 or 60';
  end if;

  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    raise exception 'At least one interval row is required';
  end if;

  select organisation_id into v_organisation_id
  from public.load_profiles
  where id = p_load_profile_id
    and organisation_id = public.current_organisation_id();

  if v_organisation_id is null then
    raise exception 'Load profile not found or access denied';
  end if;

  delete from public.load_profile_intervals
  where load_profile_id = p_load_profile_id
    and organisation_id = v_organisation_id;

  insert into public.load_profile_intervals (
    organisation_id, load_profile_id, interval_start, demand_kw, energy_kwh, essential, category
  )
  select
    v_organisation_id,
    p_load_profile_id,
    (row_data->>'interval_start')::timestamptz,
    (row_data->>'demand_kw')::numeric,
    (row_data->>'energy_kwh')::numeric,
    coalesce((row_data->>'essential')::boolean, false),
    nullif(row_data->>'category', '')
  from jsonb_array_elements(p_rows) as row_data;

  select
    count(*),
    coalesce(sum(energy_kwh), 0),
    coalesce(max(demand_kw), 0),
    coalesce(max(demand_kw) filter (where essential), 0)
  into v_count, v_total_energy, v_peak, v_essential_peak
  from public.load_profile_intervals
  where load_profile_id = p_load_profile_id
    and organisation_id = v_organisation_id;

  v_covered_hours := v_count * (p_interval_minutes::numeric / 60);
  v_annual_energy := case when v_covered_hours > 0 then v_total_energy * (8760 / v_covered_hours) else 0 end;

  update public.load_profiles
  set interval_minutes = p_interval_minutes,
      timezone = nullif(p_timezone, ''),
      annual_energy_kwh = round(v_annual_energy, 2),
      average_daily_energy_kwh = round(v_annual_energy / 365, 2),
      peak_demand_kw = round(v_peak, 2),
      essential_peak_demand_kw = round(v_essential_peak, 2),
      data_quality = 'measured',
      status = 'draft',
      updated_at = now()
  where id = p_load_profile_id
    and organisation_id = v_organisation_id;
end;
$$;

revoke all on function public.replace_load_profile_intervals(uuid, integer, text, jsonb) from public, anon;
grant execute on function public.replace_load_profile_intervals(uuid, integer, text, jsonb) to authenticated;