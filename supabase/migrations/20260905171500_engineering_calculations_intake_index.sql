-- Cover the direct engineering_calculations.engineering_intake_id foreign key.
create index if not exists engineering_calculations_intake_idx
  on public.engineering_calculations (engineering_intake_id);
