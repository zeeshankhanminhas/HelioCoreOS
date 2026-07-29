alter table public.projects
  add column if not exists project_type text,
  add column if not exists notes text,
  add column if not exists project_owner_id uuid references public.profiles(id) on delete set null;

create index if not exists projects_organisation_risk_idx
  on public.projects (organisation_id, risk_status);

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

create policy "organisation members can insert activity logs"
on public.activity_logs for insert to authenticated
with check (
  organisation_id = public.current_organisation_id()
  and actor_id = auth.uid()
);

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

  insert into public.activity_logs (
    organisation_id, project_id, actor_id, event_type, description
  ) values (
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
  select * into v_project
  from public.projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'Project not found';
  end if;

  if v_project.status is distinct from p_status then
    v_changes := array_append(v_changes, 'stage changed from ' || replace(v_project.status, '_', ' ') || ' to ' || replace(p_status, '_', ' '));
  end if;

  if v_project.risk_status is distinct from p_risk_status then
    v_changes := array_append(v_changes, 'risk changed from ' || v_project.risk_status || ' to ' || p_risk_status);
  end if;

  update public.projects
  set status = p_status, risk_status = p_risk_status
  where id = p_project_id;

  if cardinality(v_changes) > 0 then
    insert into public.activity_logs (
      organisation_id, project_id, actor_id, event_type, description
    ) values (
      v_project.organisation_id, p_project_id, auth.uid(), 'project_control_updated',
      initcap(array_to_string(v_changes, '; ')) || '.'
    );
  end if;
end;
$$;

grant execute on function public.create_epc_project(uuid, uuid, text, text, text, text, text, numeric, numeric, numeric, date, uuid, text) to authenticated;
grant execute on function public.update_project_control(uuid, text, text) to authenticated;
