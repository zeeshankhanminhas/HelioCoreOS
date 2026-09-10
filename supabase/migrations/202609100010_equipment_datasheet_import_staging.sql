create table if not exists public.equipment_import_batches (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  status text not null default 'uploading' check (status in ('uploading','processing','review','complete','failed')),
  file_count integer not null default 0 check (file_count >= 0),
  candidate_count integer not null default 0 check (candidate_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.equipment_import_files (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.equipment_import_batches(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  category text not null check (category in ('pv_module','inverter','battery')),
  file_name text not null,
  storage_path text not null,
  file_size_bytes bigint not null default 0 check (file_size_bytes >= 0),
  extraction_status text not null default 'uploaded' check (extraction_status in ('uploaded','processing','review','failed')),
  page_count integer,
  extraction_note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, storage_path)
);

create table if not exists public.equipment_import_candidates (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.equipment_import_batches(id) on delete cascade,
  file_id uuid not null references public.equipment_import_files(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  category text not null check (category in ('pv_module','inverter','battery')),
  manufacturer_name text,
  manufacturer_id uuid references public.equipment_manufacturers(id) on delete set null,
  model text,
  specs jsonb not null default '{}'::jsonb,
  confidence jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'review' check (status in ('review','imported','rejected')),
  imported_equipment_id uuid,
  created_by uuid not null references auth.users(id),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists equipment_import_batches_org_created_idx on public.equipment_import_batches(organisation_id, created_at desc);
create index if not exists equipment_import_files_batch_idx on public.equipment_import_files(batch_id, created_at);
create index if not exists equipment_import_candidates_batch_status_idx on public.equipment_import_candidates(batch_id, status, created_at);

alter table public.equipment_import_batches enable row level security;
alter table public.equipment_import_files enable row level security;
alter table public.equipment_import_candidates enable row level security;

drop policy if exists equipment_import_batches_select on public.equipment_import_batches;
drop policy if exists equipment_import_batches_insert on public.equipment_import_batches;
drop policy if exists equipment_import_batches_update on public.equipment_import_batches;
drop policy if exists equipment_import_batches_delete on public.equipment_import_batches;
drop policy if exists equipment_import_files_select on public.equipment_import_files;
drop policy if exists equipment_import_files_insert on public.equipment_import_files;
drop policy if exists equipment_import_files_update on public.equipment_import_files;
drop policy if exists equipment_import_files_delete on public.equipment_import_files;
drop policy if exists equipment_import_candidates_select on public.equipment_import_candidates;
drop policy if exists equipment_import_candidates_insert on public.equipment_import_candidates;
drop policy if exists equipment_import_candidates_update on public.equipment_import_candidates;
drop policy if exists equipment_import_candidates_delete on public.equipment_import_candidates;

create policy equipment_import_batches_select on public.equipment_import_batches for select to authenticated using (organisation_id = current_organisation_id());
create policy equipment_import_batches_insert on public.equipment_import_batches for insert to authenticated with check (organisation_id = current_organisation_id());
create policy equipment_import_batches_update on public.equipment_import_batches for update to authenticated using (organisation_id = current_organisation_id()) with check (organisation_id = current_organisation_id());
create policy equipment_import_batches_delete on public.equipment_import_batches for delete to authenticated using (organisation_id = current_organisation_id());
create policy equipment_import_files_select on public.equipment_import_files for select to authenticated using (organisation_id = current_organisation_id());
create policy equipment_import_files_insert on public.equipment_import_files for insert to authenticated with check (organisation_id = current_organisation_id());
create policy equipment_import_files_update on public.equipment_import_files for update to authenticated using (organisation_id = current_organisation_id()) with check (organisation_id = current_organisation_id());
create policy equipment_import_files_delete on public.equipment_import_files for delete to authenticated using (organisation_id = current_organisation_id());
create policy equipment_import_candidates_select on public.equipment_import_candidates for select to authenticated using (organisation_id = current_organisation_id());
create policy equipment_import_candidates_insert on public.equipment_import_candidates for insert to authenticated with check (organisation_id = current_organisation_id());
create policy equipment_import_candidates_update on public.equipment_import_candidates for update to authenticated using (organisation_id = current_organisation_id()) with check (organisation_id = current_organisation_id());
create policy equipment_import_candidates_delete on public.equipment_import_candidates for delete to authenticated using (organisation_id = current_organisation_id());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('equipment-datasheets','equipment-datasheets',false,20971520,array['application/pdf'])
on conflict (id) do update set public=false, file_size_limit=20971520, allowed_mime_types=array['application/pdf'];

drop policy if exists equipment_datasheets_select on storage.objects;
drop policy if exists equipment_datasheets_insert on storage.objects;
drop policy if exists equipment_datasheets_delete on storage.objects;

create policy equipment_datasheets_select on storage.objects for select to authenticated using (bucket_id = 'equipment-datasheets' and (storage.foldername(name))[1] = current_organisation_id()::text);
create policy equipment_datasheets_insert on storage.objects for insert to authenticated with check (bucket_id = 'equipment-datasheets' and (storage.foldername(name))[1] = current_organisation_id()::text);
create policy equipment_datasheets_delete on storage.objects for delete to authenticated using (bucket_id = 'equipment-datasheets' and (storage.foldername(name))[1] = current_organisation_id()::text);
