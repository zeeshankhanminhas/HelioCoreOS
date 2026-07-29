alter table public.customers
  add column if not exists customer_kind text,
  add column if not exists display_name text,
  add column if not exists title text,
  add column if not exists given_name text,
  add column if not exists middle_name text,
  add column if not exists family_name text,
  add column if not exists organisation_name text,
  add column if not exists customer_category text,
  add column if not exists country_code text,
  add column if not exists phone text,
  add column if not exists registration_identifier text,
  add column if not exists tax_identifier text,
  add column if not exists currency_code text,
  add column if not exists payment_terms_days integer,
  add column if not exists status text,
  add column if not exists notes text;

update public.customers
set
  customer_kind = coalesce(customer_kind, 'organisation'),
  display_name = coalesce(nullif(display_name, ''), name),
  organisation_name = coalesce(nullif(organisation_name, ''), name),
  country_code = coalesce(country_code, 'GB'),
  currency_code = coalesce(currency_code, 'GBP'),
  status = coalesce(status, 'active')
where customer_kind is null
   or display_name is null
   or organisation_name is null
   or country_code is null
   or currency_code is null
   or status is null;

alter table public.customers
  alter column customer_kind set default 'organisation',
  alter column country_code set default 'GB',
  alter column currency_code set default 'GBP',
  alter column status set default 'active';

alter table public.customers
  drop constraint if exists customers_customer_kind_check,
  add constraint customers_customer_kind_check
    check (customer_kind in ('individual', 'organisation'));

alter table public.customers
  drop constraint if exists customers_status_check,
  add constraint customers_status_check
    check (status in ('prospect', 'active', 'inactive', 'blocked', 'archived'));

alter table public.customers
  drop constraint if exists customers_payment_terms_days_check,
  add constraint customers_payment_terms_days_check
    check (payment_terms_days is null or payment_terms_days between 0 and 365);

alter table public.customers
  drop constraint if exists customers_identity_check,
  add constraint customers_identity_check
    check (
      (customer_kind = 'individual' and coalesce(nullif(display_name, ''), nullif(given_name, ''), nullif(family_name, '')) is not null)
      or
      (customer_kind = 'organisation' and coalesce(nullif(display_name, ''), nullif(organisation_name, '')) is not null)
    );

create index if not exists customers_organisation_display_name_idx
  on public.customers (organisation_id, display_name);

create index if not exists customers_organisation_status_idx
  on public.customers (organisation_id, status);

comment on column public.customers.customer_kind is 'Whether the customer is an individual or an organisation.';
comment on column public.customers.display_name is 'User-facing customer name used throughout HelioCoreOS.';
comment on column public.customers.title is 'Optional personal salutation such as Mr, Mrs, Ms or Dr; used only for individuals.';
comment on column public.customers.registration_identifier is 'Country-neutral organisation registration identifier.';
comment on column public.customers.tax_identifier is 'Country-neutral tax identifier.';