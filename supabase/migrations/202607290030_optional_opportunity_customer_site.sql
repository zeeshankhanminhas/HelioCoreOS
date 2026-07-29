-- Opportunities may be captured at enquiry stage before customer and site records exist.
-- Customer and site become required progressively as the opportunity moves towards survey and proposal.

alter table public.opportunities
  alter column customer_id drop not null,
  alter column site_id drop not null;
