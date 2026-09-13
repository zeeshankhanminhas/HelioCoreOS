-- HelioCoreOS Session 02 — Neon compatibility layer
--
-- Purpose:
-- Preserve the existing tenant/RLS contract while the application moves from
-- Supabase Auth to Neon Auth. This is intentionally transitional: Session 03
-- will move the application data/auth layer to native Neon contracts.

create extension if not exists pgcrypto;

-- Existing RLS policies and governed PostgreSQL functions target the
-- Supabase-style `authenticated` and `anon` roles. Keep those database roles
-- during the migration so the security model is not weakened.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
end
$$;

create schema if not exists auth;

-- Compatibility projection only. Do not use this view as a foreign-key target;
-- FK columns that formerly referenced auth.users must reference
-- neon_auth."user"(id) directly.
create or replace view auth.users as
select
  id,
  email,
  jsonb_build_object('full_name', name) as raw_user_meta_data
from neon_auth."user";

-- Keep the existing `auth.uid()` contract used throughout RLS/functions.
-- Neon Data API / server-side auth must set the JWT subject in the request
-- transaction. Session 03 validates the production request path end to end.
create or replace function auth.uid()
returns uuid
language plpgsql
stable
as $$
declare
  v text;
begin
  v := nullif(current_setting('request.jwt.claim.sub', true), '');

  if v is null then
    begin
      v := nullif((current_setting('request.jwt.claims', true)::jsonb ->> 'sub'), '');
    exception when others then
      v := null;
    end;
  end if;

  if v is null then
    return null;
  end if;

  return v::uuid;
exception when others then
  return null;
end
$$;

grant usage on schema auth to authenticated, anon;
grant select on auth.users to authenticated;
grant execute on function auth.uid() to authenticated, anon;
