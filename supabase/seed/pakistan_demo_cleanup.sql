-- Remove only the HelioCoreOS Pakistan demonstration dataset.
-- Production/customer-created records are not matched by these identifiers.
-- Optionally set the organisation in the same session when more than one exists:
-- select set_config('heliocore.demo_organisation_id','<organisation-uuid>',false);

do $cleanup$
declare
  v_org uuid;
  v_org_count integer;
begin
  v_org := nullif(current_setting('heliocore.demo_organisation_id', true), '')::uuid;
  if v_org is null then
    select count(*) into v_org_count from public.organisations;
    if v_org_count <> 1 then
      raise exception 'Multiple organisations found. Set heliocore.demo_organisation_id before running cleanup.';
    end if;
    select id into v_org from public.organisations limit 1;
  end if;

  delete from public.activity_logs
  where organisation_id = v_org
    and (event_type like 'demo.%' or description like '%PK-DEMO-%');

  delete from public.system_designs
  where organisation_id = v_org and design_reference like 'PK-DEMO-%';

  delete from public.site_surveys
  where organisation_id = v_org and survey_reference like 'PK-DEMO-%';

  delete from public.indicative_proposals
  where organisation_id = v_org and proposal_number like 'PK-DEMO-%';

  delete from public.opportunity_readiness_items
  where organisation_id = v_org
    and opportunity_id in (
      select id from public.opportunities
      where organisation_id = v_org and reference like 'PK-DEMO-%'
    );

  update public.opportunities
  set project_id = null
  where organisation_id = v_org and reference like 'PK-DEMO-%';

  delete from public.projects
  where organisation_id = v_org and reference like 'PK-DEMO-%';

  delete from public.opportunities
  where organisation_id = v_org and reference like 'PK-DEMO-%';

  delete from public.sites
  where organisation_id = v_org
    and customer_id in (
      select id from public.customers
      where organisation_id = v_org and notes like '%[PK-DEMO]%'
    );

  delete from public.customers
  where organisation_id = v_org and notes like '%[PK-DEMO]%';

  raise notice 'Pakistan demonstration dataset removed from organisation %.', v_org;
end
$cleanup$;
