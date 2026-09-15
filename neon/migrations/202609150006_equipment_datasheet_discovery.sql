-- Session 12: official-manufacturer datasheet discovery for the Equipment Library.
-- This is intentionally additive. Existing PDF import/extraction remains the downstream authority.

create table if not exists public.equipment_datasheet_sources (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  manufacturer_id uuid not null,
  source_url text not null,
  source_host text not null,
  categories text[] not null default array['pv_module','inverter','battery']::text[],
  status text not null default 'active' check (status in ('active','inactive')),
  last_scanned_at timestamptz,
  last_scan_count integer not null default 0 check (last_scan_count >= 0),
  last_scan_note text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (manufacturer_id, organisation_id) references public.equipment_manufacturers(id, organisation_id) on delete cascade,
  check (cardinality(categories) > 0),
  check (categories <@ array['pv_module','inverter','battery']::text[]),
  unique (organisation_id, manufacturer_id, source_url),
  unique (id, organisation_id)
);

create table if not exists public.equipment_datasheet_discoveries (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  source_id uuid not null,
  manufacturer_id uuid not null,
  document_url text not null,
  file_name text not null,
  category text check (category is null or category in ('pv_module','inverter','battery')),
  status text not null default 'discovered' check (status in ('discovered','queued','imported','ignored','failed')),
  discovered_at timestamptz not null default now(),
  processed_at timestamptz,
  note text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now(),
  foreign key (source_id, organisation_id) references public.equipment_datasheet_sources(id, organisation_id) on delete cascade,
  foreign key (manufacturer_id, organisation_id) references public.equipment_manufacturers(id, organisation_id) on delete cascade,
  unique (organisation_id, document_url)
);

create index if not exists equipment_datasheet_sources_org_status_idx
  on public.equipment_datasheet_sources(organisation_id, status, updated_at desc);
create index if not exists equipment_datasheet_discoveries_source_status_idx
  on public.equipment_datasheet_discoveries(source_id, status, discovered_at desc);
create index if not exists equipment_datasheet_discoveries_org_status_idx
  on public.equipment_datasheet_discoveries(organisation_id, status, discovered_at desc);

alter table public.equipment_datasheet_sources enable row level security;
alter table public.equipment_datasheet_discoveries enable row level security;
grant select, insert, update, delete on table public.equipment_datasheet_sources to authenticated;
grant select, insert, update, delete on table public.equipment_datasheet_discoveries to authenticated;

drop policy if exists equipment_datasheet_sources_tenant_access on public.equipment_datasheet_sources;
create policy equipment_datasheet_sources_tenant_access
  on public.equipment_datasheet_sources for all to authenticated
  using (organisation_id = public.current_organisation_id())
  with check (organisation_id = public.current_organisation_id());

drop policy if exists equipment_datasheet_discoveries_tenant_access on public.equipment_datasheet_discoveries;
create policy equipment_datasheet_discoveries_tenant_access
  on public.equipment_datasheet_discoveries for all to authenticated
  using (organisation_id = public.current_organisation_id())
  with check (organisation_id = public.current_organisation_id());
