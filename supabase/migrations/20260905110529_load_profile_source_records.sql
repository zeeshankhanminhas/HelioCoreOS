create table if not exists public.load_profile_utility_bills (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  load_profile_id uuid not null,
  bill_month date not null,
  energy_kwh numeric not null check (energy_kwh >= 0),
  peak_demand_kw numeric check (peak_demand_kw is null or peak_demand_kw >= 0),
  cost_amount numeric check (cost_amount is null or cost_amount >= 0),
  created_at timestamptz not null default now(),
  foreign key (load_profile_id, organisation_id)
    references public.load_profiles(id, organisation_id)
    on delete cascade,
  unique (load_profile_id, bill_month)
);

create index if not exists load_profile_utility_bills_profile_idx on public.load_profile_utility_bills(load_profile_id, bill_month);
create index if not exists load_profile_utility_bills_org_idx on public.load_profile_utility_bills(organisation_id);

create table if not exists public.load_profile_appliances (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  load_profile_id uuid not null,
  name text not null,
  category text,
  rated_kw numeric not null check (rated_kw >= 0),
  quantity integer not null default 1 check (quantity > 0),
  hours_per_day numeric not null default 0 check (hours_per_day between 0 and 24),
  days_per_week numeric not null default 7 check (days_per_week between 0 and 7),
  simultaneity_pct numeric not null default 100 check (simultaneity_pct between 0 and 100),
  essential boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (load_profile_id, organisation_id)
    references public.load_profiles(id, organisation_id)
    on delete cascade
);

create index if not exists load_profile_appliances_profile_idx on public.load_profile_appliances(load_profile_id);
create index if not exists load_profile_appliances_org_idx on public.load_profile_appliances(organisation_id);

alter table public.load_profile_utility_bills enable row level security;
alter table public.load_profile_appliances enable row level security;

revoke all on table public.load_profile_utility_bills from anon, authenticated;
revoke all on table public.load_profile_appliances from anon, authenticated;
grant select, insert, update, delete on table public.load_profile_utility_bills to authenticated;
grant select, insert, update, delete on table public.load_profile_appliances to authenticated;

create policy load_profile_utility_bills_select on public.load_profile_utility_bills for select to authenticated
using (organisation_id = public.current_organisation_id());
create policy load_profile_utility_bills_insert on public.load_profile_utility_bills for insert to authenticated
with check (organisation_id = public.current_organisation_id());
create policy load_profile_utility_bills_update on public.load_profile_utility_bills for update to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());
create policy load_profile_utility_bills_delete on public.load_profile_utility_bills for delete to authenticated
using (organisation_id = public.current_organisation_id());

create policy load_profile_appliances_select on public.load_profile_appliances for select to authenticated
using (organisation_id = public.current_organisation_id());
create policy load_profile_appliances_insert on public.load_profile_appliances for insert to authenticated
with check (organisation_id = public.current_organisation_id());
create policy load_profile_appliances_update on public.load_profile_appliances for update to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());
create policy load_profile_appliances_delete on public.load_profile_appliances for delete to authenticated
using (organisation_id = public.current_organisation_id());