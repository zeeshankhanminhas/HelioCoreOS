-- Validate the HelioCoreOS Pakistan demonstration dataset.
-- Optionally narrow to an organisation:
-- select set_config('heliocore.demo_organisation_id','<organisation-uuid>',false);

with context as (
  select coalesce(
    nullif(current_setting('heliocore.demo_organisation_id', true), '')::uuid,
    case when (select count(*) from public.organisations) = 1 then (select id from public.organisations limit 1) end
  ) as organisation_id
), counts as (
  select 'customers' as module, count(*)::bigint as actual, 25::bigint as expected
  from public.customers c, context x
  where c.organisation_id = x.organisation_id and c.notes like '%[PK-DEMO]%'
  union all
  select 'sites', count(*), 35
  from public.sites s, context x
  where s.organisation_id = x.organisation_id and s.name like '[PK-DEMO]%'
  union all
  select 'opportunities', count(*), 50
  from public.opportunities o, context x
  where o.organisation_id = x.organisation_id and o.reference like 'PK-DEMO-%'
  union all
  select 'readiness_items', count(*), 300
  from public.opportunity_readiness_items r, context x
  where r.organisation_id = x.organisation_id
    and r.opportunity_id in (select id from public.opportunities where organisation_id = x.organisation_id and reference like 'PK-DEMO-%')
  union all
  select 'indicative_proposals', count(*), 40
  from public.indicative_proposals p, context x
  where p.organisation_id = x.organisation_id and p.proposal_number like 'PK-DEMO-%'
  union all
  select 'site_surveys', count(*), 30
  from public.site_surveys s, context x
  where s.organisation_id = x.organisation_id and s.survey_reference like 'PK-DEMO-%'
  union all
  select 'system_designs', count(*), 25
  from public.system_designs d, context x
  where d.organisation_id = x.organisation_id and d.design_reference like 'PK-DEMO-%'
  union all
  select 'projects', count(*), 25
  from public.projects p, context x
  where p.organisation_id = x.organisation_id and p.reference like 'PK-DEMO-%'
  union all
  select 'activity_logs', count(*), 245
  from public.activity_logs a, context x
  where a.organisation_id = x.organisation_id and a.event_type like 'demo.%'
)
select module, actual, expected,
  case when actual = expected then 'PASS' else 'FAIL' end as result
from counts
order by module;

-- Relationship integrity checks. Every result should be zero.
with context as (
  select coalesce(
    nullif(current_setting('heliocore.demo_organisation_id', true), '')::uuid,
    case when (select count(*) from public.organisations) = 1 then (select id from public.organisations limit 1) end
  ) as organisation_id
)
select 'opportunity_without_customer' as check_name, count(*) as failures
from public.opportunities o, context x
where o.organisation_id = x.organisation_id and o.reference like 'PK-DEMO-%' and o.customer_id is null
union all
select 'opportunity_without_site', count(*)
from public.opportunities o, context x
where o.organisation_id = x.organisation_id and o.reference like 'PK-DEMO-%' and o.site_id is null
union all
select 'site_customer_mismatch', count(*)
from public.opportunities o
join public.sites s on s.id = o.site_id
cross join context x
where o.organisation_id = x.organisation_id and o.reference like 'PK-DEMO-%' and s.customer_id <> o.customer_id
union all
select 'proposal_without_opportunity', count(*)
from public.indicative_proposals p
left join public.opportunities o on o.id = p.opportunity_id
cross join context x
where p.organisation_id = x.organisation_id and p.proposal_number like 'PK-DEMO-%' and o.id is null
union all
select 'survey_site_mismatch', count(*)
from public.site_surveys s
join public.opportunities o on o.id = s.opportunity_id
cross join context x
where s.organisation_id = x.organisation_id and s.survey_reference like 'PK-DEMO-%' and s.site_id <> o.site_id
union all
select 'design_without_approved_survey', count(*)
from public.system_designs d
left join public.site_surveys s on s.id = d.survey_id
cross join context x
where d.organisation_id = x.organisation_id and d.design_reference like 'PK-DEMO-%' and coalesce(s.status,'missing') <> 'approved'
union all
select 'won_opportunity_without_project', count(*)
from public.opportunities o
cross join context x
where o.organisation_id = x.organisation_id and o.reference like 'PK-DEMO-%' and o.stage = 'won' and o.project_id is null
union all
select 'project_relationship_mismatch', count(*)
from public.opportunities o
join public.projects p on p.id = o.project_id
cross join context x
where o.organisation_id = x.organisation_id and o.reference like 'PK-DEMO-%'
  and (p.customer_id <> o.customer_id or p.site_id <> o.site_id);

-- Useful lifecycle distributions.
with context as (
  select coalesce(
    nullif(current_setting('heliocore.demo_organisation_id', true), '')::uuid,
    case when (select count(*) from public.organisations) = 1 then (select id from public.organisations limit 1) end
  ) as organisation_id
)
select 'opportunities' as module, stage as status, count(*) as records
from public.opportunities o, context x
where o.organisation_id = x.organisation_id and o.reference like 'PK-DEMO-%'
group by stage
union all
select 'proposals', status, count(*)
from public.indicative_proposals p, context x
where p.organisation_id = x.organisation_id and p.proposal_number like 'PK-DEMO-%'
group by status
union all
select 'surveys', status, count(*)
from public.site_surveys s, context x
where s.organisation_id = x.organisation_id and s.survey_reference like 'PK-DEMO-%'
group by status
union all
select 'designs', status, count(*)
from public.system_designs d, context x
where d.organisation_id = x.organisation_id and d.design_reference like 'PK-DEMO-%'
group by status
union all
select 'projects', status, count(*)
from public.projects p, context x
where p.organisation_id = x.organisation_id and p.reference like 'PK-DEMO-%'
group by status
order by module, status;
