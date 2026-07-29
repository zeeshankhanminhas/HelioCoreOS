-- HelioCoreOS Sprint 1: governed user and organisation bootstrap
-- Creates exactly one organisation/profile pair for a newly authenticated user
-- without exposing unrestricted insert access through RLS.

create or replace function public.bootstrap_current_user(
  organisation_name text default null,
  user_full_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  authenticated_user auth.users;
  existing_organisation_id uuid;
  new_organisation_id uuid;
  resolved_organisation_name text;
  resolved_full_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select organisation_id
  into existing_organisation_id
  from public.profiles
  where id = auth.uid();

  if existing_organisation_id is not null then
    return existing_organisation_id;
  end if;

  select *
  into authenticated_user
  from auth.users
  where id = auth.uid();

  if authenticated_user.id is null then
    raise exception 'Authenticated user record not found';
  end if;

  resolved_full_name := coalesce(
    nullif(trim(user_full_name), ''),
    nullif(trim(authenticated_user.raw_user_meta_data ->> 'full_name'), ''),
    split_part(authenticated_user.email, '@', 1)
  );

  resolved_organisation_name := coalesce(
    nullif(trim(organisation_name), ''),
    nullif(trim(authenticated_user.raw_user_meta_data ->> 'organisation_name'), ''),
    resolved_full_name || ' Solar EPC'
  );

  insert into public.organisations (name)
  values (resolved_organisation_name)
  returning id into new_organisation_id;

  insert into public.profiles (id, organisation_id, full_name, role)
  values (auth.uid(), new_organisation_id, resolved_full_name, 'executive')
  on conflict (id) do update
  set organisation_id = excluded.organisation_id,
      full_name = coalesce(public.profiles.full_name, excluded.full_name);

  return new_organisation_id;
end;
$$;

revoke all on function public.bootstrap_current_user(text, text) from public;
grant execute on function public.bootstrap_current_user(text, text) to authenticated;

create policy "users can read their own profile"
on public.profiles for select to authenticated
using (id = auth.uid());
