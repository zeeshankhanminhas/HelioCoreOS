-- HelioCoreOS launch platform foundation
-- Keeps the first commercial release intentionally small: one tenant, simple teams,
-- four roles, and a manually governed subscription state.

alter table public.organisations
  add column if not exists slug text,
  add column if not exists subscription_plan text not null default 'launch'
    check (subscription_plan in ('trial', 'launch', 'professional', 'enterprise')),
  add column if not exists subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'past_due', 'suspended', 'cancelled')),
  add column if not exists user_limit integer not null default 5 check (user_limit > 0),
  add column if not exists trial_ends_at timestamptz,
  add column if not exists billing_currency text not null default 'PKR',
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists organisations_slug_unique_idx
  on public.organisations (lower(slug))
  where slug is not null;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, name)
);

alter table public.profiles
  add column if not exists team_id uuid references public.teams(id) on delete set null,
  add column if not exists job_title text,
  add column if not exists status text not null default 'active'
    check (status in ('invited', 'active', 'suspended')),
  add column if not exists updated_at timestamptz not null default now();

-- Replace the original delivery-role constraint with the launch SaaS role model.
alter table public.profiles drop constraint if exists profiles_role_check;

update public.profiles
set role = case role
  when 'executive' then 'owner'
  when 'project_manager' then 'manager'
  else 'member'
end
where role in ('executive', 'project_manager', 'design_engineer', 'site_supervisor');

alter table public.profiles
  alter column role set default 'member';

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('owner', 'admin', 'manager', 'member'));

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_organisation_administrator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('owner', 'admin'), false)
$$;

alter table public.teams enable row level security;

drop policy if exists "organisation members can read teams" on public.teams;
create policy "organisation members can read teams"
on public.teams for select to authenticated
using (organisation_id = public.current_organisation_id());

drop policy if exists "organisation administrators can create teams" on public.teams;
create policy "organisation administrators can create teams"
on public.teams for insert to authenticated
with check (
  organisation_id = public.current_organisation_id()
  and public.is_organisation_administrator()
);

drop policy if exists "organisation administrators can update teams" on public.teams;
create policy "organisation administrators can update teams"
on public.teams for update to authenticated
using (
  organisation_id = public.current_organisation_id()
  and public.is_organisation_administrator()
)
with check (
  organisation_id = public.current_organisation_id()
  and public.is_organisation_administrator()
);

drop policy if exists "organisation administrators can delete teams" on public.teams;
create policy "organisation administrators can delete teams"
on public.teams for delete to authenticated
using (
  organisation_id = public.current_organisation_id()
  and public.is_organisation_administrator()
);

-- Members may see colleagues. Only owners/admins may change tenant user records.
drop policy if exists "organisation administrators can update profiles" on public.profiles;
create policy "organisation administrators can update profiles"
on public.profiles for update to authenticated
using (
  organisation_id = public.current_organisation_id()
  and public.is_organisation_administrator()
)
with check (
  organisation_id = public.current_organisation_id()
  and public.is_organisation_administrator()
);

create index if not exists teams_organisation_active_idx
  on public.teams (organisation_id, is_active);

create index if not exists profiles_organisation_team_idx
  on public.profiles (organisation_id, team_id);
