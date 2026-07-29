alter table public.opportunity_readiness_items
  add column if not exists is_required boolean not null default true,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists reviewed_at timestamptz,
  add column if not exists decision_note text;

alter table public.opportunity_readiness_items
  drop constraint if exists opportunity_readiness_items_status_check;

alter table public.opportunity_readiness_items
  add constraint opportunity_readiness_items_status_check
  check (status in ('requested','uploaded','under_review','accepted','rejected','waived'));

create index if not exists readiness_required_status_idx
  on public.opportunity_readiness_items (opportunity_id, is_required, status);

comment on column public.opportunity_readiness_items.is_required is
  'Required items block governed proposal issue until accepted or formally waived.';
comment on column public.opportunity_readiness_items.reviewed_by is
  'Organisation member who made the latest governed review decision.';
comment on column public.opportunity_readiness_items.reviewed_at is
  'Timestamp of the latest accepted, rejected or waived decision.';
comment on column public.opportunity_readiness_items.decision_note is
  'Mandatory rationale for rejected or waived decisions and optional reviewer context for acceptance.';