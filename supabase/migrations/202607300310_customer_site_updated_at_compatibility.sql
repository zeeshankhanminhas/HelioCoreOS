-- Align legacy Customer and Site tables with current application writes and demo seed.
-- Safe to run repeatedly.

alter table public.customers
  add column if not exists updated_at timestamptz not null default now();

alter table public.sites
  add column if not exists updated_at timestamptz not null default now();

comment on column public.customers.updated_at is
  'Timestamp of the latest governed Customer record change.';

comment on column public.sites.updated_at is
  'Timestamp of the latest governed Site record change.';
