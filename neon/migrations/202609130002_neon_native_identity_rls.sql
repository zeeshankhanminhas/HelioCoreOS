-- HelioCoreOS Session 03 — Neon-native identity + Data API RLS
--
-- Preconditions:
-- 1. Managed Better Auth is enabled for the target Neon branch.
-- 2. Neon Data API has been provisioned for `neondb` with Managed Better Auth.
-- 3. The native Neon roles `authenticated` and `anonymous` exist.
--
-- This migration finalises the transition away from the Session 02
-- Supabase-role compatibility contract. `supabase_auth_legacy` remains only as
-- an explicitly deprecated compatibility namespace for forensic/reference use.

begin;

create schema if not exists supabase_auth_legacy;

-- Native Neon Data API roles are expected to exist. Fail closed if the branch
-- has not been provisioned correctly rather than silently recreating legacy
-- roles with different semantics.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    raise exception 'Neon Data API role authenticated is missing. Provision Neon Data API first.';
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anonymous') then
    raise exception 'Neon Data API role anonymous is missing. Provision Neon Data API first.';
  end if;
end
$$;

-- All application-facing tenant policies execute as the Neon-native
-- `authenticated` role. This is deliberately dynamic so future public tables
-- that reuse existing authenticated policies are not left attached to the
-- Session 03 transition role.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format(
      'alter policy %I on %I.%I to authenticated',
      p.policyname,
      p.schemaname,
      p.tablename
    );
  end loop;
end
$$;

-- Session 02 used a compatibility uid() implementation while the Data API
-- request path was not yet active. Session 03 uses Neon's native auth.uid()
-- supplied by pg_session_jwt. Update the remaining policies/default that were
-- deliberately held on the transitional helper during the role replacement.
alter policy "users can read their own profile"
  on public.profiles
  using (id = auth.uid());

alter policy "organisation members can add activity"
  on public.activity_logs
  with check (
    organisation_id = public.current_organisation_id()
    and actor_id = auth.uid()
  );

alter policy "organisation members can insert activity logs"
  on public.activity_logs
  with check (
    organisation_id = public.current_organisation_id()
    and actor_id = auth.uid()
  );

alter table public.site_surveys
  alter column created_by set default auth.uid();

-- Data API table privileges. RLS remains the row-level authority.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to authenticated;

-- Anonymous callers are fail-closed for HelioCoreOS operational data.
revoke all on all tables in schema public from anonymous;
revoke all on all sequences in schema public from anonymous;

comment on schema supabase_auth_legacy is
  'DEPRECATED Session 02 compatibility namespace. Do not use for new policies, functions, foreign keys, or application code. Native Neon auth.* is authoritative.';

commit;
