-- Session 11: governed BOM exception layer.
-- Generated BOM snapshots remain authoritative and immutable. Exceptions are overlays
-- that require a reason, create an audit trail, and must be reviewed before they
-- affect procurement quantities.

create table if not exists public.bom_exceptions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  system_design_id uuid not null references public.system_designs(id) on delete cascade,
  generated_line_index integer,
  exception_type text not null check (exception_type in ('quantity_override','project_item')),
  description text not null,
  category text not null,
  original_quantity numeric,
  requested_quantity numeric not null check (requested_quantity > 0),
  unit text not null,
  reason text not null check (char_length(trim(reason)) >= 10),
  status text not null default 'pending_review' check (status in ('pending_review','approved','rejected','withdrawn')),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  check (
    (exception_type = 'quantity_override' and generated_line_index is not null and original_quantity is not null)
    or
    (exception_type = 'project_item' and generated_line_index is null)
  )
);

create unique index if not exists bom_exceptions_one_open_override_per_line
  on public.bom_exceptions (system_design_id, generated_line_index)
  where exception_type = 'quantity_override' and status in ('pending_review','approved');

create index if not exists bom_exceptions_design_status_idx
  on public.bom_exceptions (system_design_id, status, created_at desc);

create table if not exists public.bom_exception_events (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  exception_id uuid not null references public.bom_exceptions(id) on delete cascade,
  system_design_id uuid not null references public.system_designs(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null default auth.uid(),
  event_type text not null check (event_type in ('created','approved','rejected','withdrawn')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bom_exception_events_design_idx
  on public.bom_exception_events (system_design_id, created_at desc);

alter table public.bom_exceptions enable row level security;
alter table public.bom_exception_events enable row level security;

create policy bom_exceptions_tenant_select on public.bom_exceptions
  for select using (organisation_id = public.current_organisation_id());
create policy bom_exceptions_tenant_insert on public.bom_exceptions
  for insert with check (organisation_id = public.current_organisation_id());
create policy bom_exceptions_tenant_update on public.bom_exceptions
  for update using (organisation_id = public.current_organisation_id())
  with check (organisation_id = public.current_organisation_id());

create policy bom_exception_events_tenant_select on public.bom_exception_events
  for select using (organisation_id = public.current_organisation_id());
create policy bom_exception_events_tenant_insert on public.bom_exception_events
  for insert with check (organisation_id = public.current_organisation_id());

create or replace function public.create_bom_exception(
  p_system_design_id uuid,
  p_exception_type text,
  p_generated_line_index integer,
  p_description text,
  p_category text,
  p_original_quantity numeric,
  p_requested_quantity numeric,
  p_unit text,
  p_reason text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_organisation_id uuid := public.current_organisation_id();
  v_design public.system_designs%rowtype;
  v_exception_id uuid;
begin
  if v_organisation_id is null then raise exception 'No organisation context is available'; end if;
  if p_exception_type not in ('quantity_override','project_item') then raise exception 'Invalid BOM exception type'; end if;
  if p_requested_quantity is null or p_requested_quantity <= 0 then raise exception 'Requested quantity must be greater than zero'; end if;
  if char_length(trim(coalesce(p_reason,''))) < 10 then raise exception 'A meaningful exception reason of at least 10 characters is required'; end if;

  select * into v_design
  from public.system_designs
  where id = p_system_design_id and organisation_id = v_organisation_id
  for update;
  if not found then raise exception 'Design not found or access denied'; end if;
  if jsonb_array_length(coalesce(v_design.bom_snapshot, '[]'::jsonb)) = 0 then raise exception 'Generate the authoritative BOM before creating exceptions'; end if;

  if p_exception_type = 'quantity_override' then
    if p_generated_line_index is null or p_original_quantity is null then raise exception 'Generated line and original quantity are required for an override'; end if;
    if p_generated_line_index < 0 or p_generated_line_index >= jsonb_array_length(v_design.bom_snapshot) then raise exception 'Generated BOM line index is invalid'; end if;
  else
    if p_generated_line_index is not null then raise exception 'Project-specific items cannot replace a generated BOM line'; end if;
  end if;

  insert into public.bom_exceptions (
    organisation_id, system_design_id, generated_line_index, exception_type,
    description, category, original_quantity, requested_quantity, unit, reason
  ) values (
    v_organisation_id, p_system_design_id, p_generated_line_index, p_exception_type,
    trim(p_description), trim(p_category), p_original_quantity, p_requested_quantity, trim(p_unit), trim(p_reason)
  ) returning id into v_exception_id;

  insert into public.bom_exception_events (
    organisation_id, exception_id, system_design_id, actor_id, event_type, payload
  ) values (
    v_organisation_id, v_exception_id, p_system_design_id, auth.uid(), 'created',
    jsonb_build_object(
      'exceptionType', p_exception_type,
      'generatedLineIndex', p_generated_line_index,
      'originalQuantity', p_original_quantity,
      'requestedQuantity', p_requested_quantity,
      'unit', trim(p_unit),
      'reason', trim(p_reason)
    )
  );

  return v_exception_id;
end;
$$;

create or replace function public.review_bom_exception(
  p_exception_id uuid,
  p_decision text,
  p_reason text
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_organisation_id uuid := public.current_organisation_id();
  v_exception public.bom_exceptions%rowtype;
begin
  if p_decision not in ('approved','rejected','withdrawn') then raise exception 'Invalid exception decision'; end if;
  if char_length(trim(coalesce(p_reason,''))) < 10 then raise exception 'A meaningful review reason of at least 10 characters is required'; end if;

  select * into v_exception
  from public.bom_exceptions
  where id = p_exception_id and organisation_id = v_organisation_id
  for update;
  if not found then raise exception 'BOM exception not found or access denied'; end if;
  if v_exception.status <> 'pending_review' then raise exception 'Only pending BOM exceptions can be reviewed'; end if;

  update public.bom_exceptions
  set status = p_decision,
      reviewed_by = auth.uid(),
      review_reason = trim(p_reason),
      reviewed_at = now(),
      updated_at = now()
  where id = p_exception_id;

  insert into public.bom_exception_events (
    organisation_id, exception_id, system_design_id, actor_id, event_type, payload
  ) values (
    v_organisation_id, p_exception_id, v_exception.system_design_id, auth.uid(), p_decision,
    jsonb_build_object('reason', trim(p_reason))
  );
end;
$$;
