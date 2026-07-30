-- Atomically commits a governed proposal, synchronises the Opportunity stage,
-- and records the audit event. Any failure rolls the whole transaction back.

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
  if p_organisation_id is distinct from public.current_organisation_id() then
    raise exception 'Organisation context mismatch';
  end if;

  if p_status not in ('draft', 'issued', 'accepted', 'declined', 'expired') then
    raise exception 'Invalid proposal status';
  end if;

  if p_opportunity_stage not in ('proposal', 'won', 'lost') then
    raise exception 'Invalid Opportunity stage';
  end if;

  insert into public.indicative_proposals (
    organisation_id,
    opportunity_id,
    proposal_number,
    status,
    pv_capacity_kwp,
    battery_capacity_kwh,
    estimated_generation_kwh,
    estimated_annual_saving_gbp,
    indicative_price_gbp,
    assumptions,
    exclusions,
    valid_until,
    issued_at,
    updated_at
  ) values (
    p_organisation_id,
    p_opportunity_id,
    p_proposal_number,
    p_status,
    nullif(p_commercial ->> 'pv_capacity_kwp', '')::numeric,
    nullif(p_commercial ->> 'battery_capacity_kwh', '')::numeric,
    nullif(p_commercial ->> 'estimated_generation_kwh', '')::numeric,
    nullif(p_commercial ->> 'estimated_annual_saving_gbp', '')::numeric,
    nullif(p_commercial ->> 'indicative_price_gbp', '')::numeric,
    nullif(p_commercial ->> 'assumptions', ''),
    nullif(p_commercial ->> 'exclusions', ''),
    nullif(p_commercial ->> 'valid_until', '')::date,
    p_issued_at,
    now()
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
  set stage = p_opportunity_stage,
      updated_at = now()
  where id = p_opportunity_id
    and organisation_id = p_organisation_id;

  if not found then
    raise exception 'Opportunity not found or access denied';
  end if;

  insert into public.activity_logs (
    organisation_id,
    actor_id,
    event_type,
    description
  ) values (
    p_organisation_id,
    auth.uid(),
    p_event_type,
    p_description
  );
end;
$$;

grant execute on function public.commit_governed_proposal(uuid, uuid, text, text, jsonb, timestamptz, text, text, text) to authenticated;
