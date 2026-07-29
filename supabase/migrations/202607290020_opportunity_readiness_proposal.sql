create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  site_id uuid not null references public.sites(id) on delete restrict,
  owner_id uuid references public.profiles(id) on delete set null,
  title text not null,
  reference text not null,
  stage text not null default 'lead' check (stage in ('lead','qualified','readiness','proposal','survey','won','lost','on_hold')),
  lead_source text,
  estimated_pv_kwp numeric(12,2),
  estimated_battery_kwh numeric(12,2),
  estimated_value_gbp numeric(14,2),
  notes text,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, reference)
);

create table public.opportunity_readiness_items (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  item_type text not null check (item_type in ('electricity_bill','customer_id','proof_of_address','ownership_evidence','meter_photo','survey_authorisation')),
  status text not null default 'requested' check (status in ('requested','uploaded','accepted','rejected','waived')),
  evidence_url text,
  review_note text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (opportunity_id, item_type)
);

create table public.indicative_proposals (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  opportunity_id uuid not null unique references public.opportunities(id) on delete cascade,
  proposal_number text not null,
  status text not null default 'draft' check (status in ('draft','issued','accepted','declined','expired')),
  pv_capacity_kwp numeric(12,2),
  battery_capacity_kwh numeric(12,2),
  estimated_generation_kwh numeric(14,2),
  estimated_annual_saving_gbp numeric(14,2),
  indicative_price_gbp numeric(14,2),
  assumptions text,
  exclusions text,
  valid_until date,
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, proposal_number)
);

alter table public.opportunities enable row level security;
alter table public.opportunity_readiness_items enable row level security;
alter table public.indicative_proposals enable row level security;

create policy "organisation access to opportunities" on public.opportunities for all to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());

create policy "organisation access to readiness" on public.opportunity_readiness_items for all to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());

create policy "organisation access to indicative proposals" on public.indicative_proposals for all to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());

create policy "organisation members can add activity" on public.activity_logs for insert to authenticated
with check (organisation_id = public.current_organisation_id() and actor_id = auth.uid());

create index opportunities_org_stage_idx on public.opportunities (organisation_id, stage);
create index readiness_opportunity_status_idx on public.opportunity_readiness_items (opportunity_id, status);
create index proposals_org_status_idx on public.indicative_proposals (organisation_id, status);
