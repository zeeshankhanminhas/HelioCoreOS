# Session 08 — Full Neon database schema cutover

## Purpose
Promote the remaining HelioCoreOS application and engineering PostgreSQL schema from the legacy Supabase migration tree into Neon so Neon becomes the authoritative database for current and future runtime work.

## Production state
The Neon production branch now contains the full engineering/application schema required by the current product surface, including:

- Site Surveys
- Load Profiles, interval rows, utility bills and appliance schedules
- Engineering Intakes
- Equipment manufacturers, PV modules, inverters, batteries and inverter/battery compatibility
- Engineering Calculations
- System Designs, string groups and engineering checks
- Equipment datasheet import batches/files/candidates

All newly promoted tenant tables have Row Level Security enabled and use `public.current_organisation_id()` for tenant isolation under the Neon `authenticated` role.

## Governed database functions
The atomic workflows previously defined only in the Supabase migration history have also been promoted to Neon:

- `create_epc_project`
- `update_project_control`
- `commit_governed_proposal`
- `commit_site_survey`
- `commit_system_design`
- `replace_load_profile_intervals`

The Project `updated_at` trigger is also present in Neon.

## Supabase-specific changes
The database cutover removes Supabase Auth as a schema dependency. Equipment import audit/user references target `public.profiles`, which is backed by Neon Auth, rather than `auth.users` foreign keys.

`auth.uid()` remains part of the database contract, but it is now the Neon Auth compatibility/native request identity path established in Sessions 02–03.

## Storage boundary
This session is the PostgreSQL database-schema cutover. Supabase Storage buckets/object policies are intentionally not copied into Neon because they are not PostgreSQL application data. Any remaining datasheet-file storage path is a separate storage/runtime migration and must not be treated as a reason to keep Supabase as the authoritative application database.

## Validation performed
Production was checked after promotion for:

1. presence of all newly required engineering/application tables;
2. RLS enabled on every newly promoted tenant table;
3. presence of the governed operational functions;
4. preservation of existing Neon Auth/current-organisation helpers;
5. additive migration only — no production table or application data was dropped.

A branch-based DDL test was also performed against a Neon branch containing the current Neon Auth layer. An older preview branch was found to predate Neon Auth and was intentionally not treated as an authoritative migration target.

## Remaining migration work
The database schema itself is now present in Neon. The next cutover is application/runtime cleanup: replace the remaining modules that still import the legacy `@/lib/supabase/*` client, move any file storage dependency away from Supabase, and then retire the legacy `supabase/migrations` directory once there is no rollback/audit reason to keep it.
