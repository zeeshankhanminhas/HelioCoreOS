create extension if not exists pgcrypto;

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organisation_id uuid references public.organisations(id) on delete set null,
  full_name text,
  role text not null default 'project_manager' check (role in ('executive','project_manager','design_engineer','site_supervisor')),
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  contact_name text,
  contact_email text,
  created_at timestamptz not null default now()
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null,
  address text,
  postcode text,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  site_id uuid not null references public.sites(id) on delete restrict,
  name text not null,
  reference text not null,
  status text not null default 'qualification' check (status in ('qualification','survey','design','commercial','procurement','installation','commissioning','handover','complete','on_hold')),
  risk_status text not null default 'green' check (risk_status in ('green','amber','red')),
  pv_capacity_kwp numeric(12,2),
  battery_capacity_kwh numeric(12,2),
  contract_value_gbp numeric(14,2),
  target_completion_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, reference)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  status text not null default 'open' check (status in ('open','in_progress','blocked','complete')),
  due_date date,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  category text not null,
  storage_path text not null,
  status text not null default 'draft' check (status in ('draft','in_review','approved','superseded')),
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id bigint generated always as identity primary key,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create or replace function public.current_organisation_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organisation_id from public.profiles where id = auth.uid()
$$;

alter table public.organisations enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.sites enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.activity_logs enable row level security;

create policy "organisation members can read their organisation"
on public.organisations for select to authenticated
using (id = public.current_organisation_id());

create policy "users can read organisation profiles"
on public.profiles for select to authenticated
using (organisation_id = public.current_organisation_id());

create policy "organisation access to customers"
on public.customers for all to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());

create policy "organisation access to sites"
on public.sites for all to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());

create policy "organisation access to projects"
on public.projects for all to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());

create policy "organisation access to tasks"
on public.tasks for all to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());

create policy "organisation access to documents"
on public.documents for all to authenticated
using (organisation_id = public.current_organisation_id())
with check (organisation_id = public.current_organisation_id());

create policy "organisation access to activity logs"
on public.activity_logs for select to authenticated
using (organisation_id = public.current_organisation_id());

create index projects_organisation_status_idx on public.projects (organisation_id, status);
create index tasks_project_status_idx on public.tasks (project_id, status);
create index documents_project_category_idx on public.documents (project_id, category);
