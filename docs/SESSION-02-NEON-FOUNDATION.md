# Session 02 — Neon Foundation

Status: migration branch validated  
Date: 2026-09-13  
Repository baseline: `de7d77e4e8334a69251b15e76ef492d94e0ac5c6`

## Purpose

Session 02 establishes a Neon PostgreSQL foundation for HelioCoreOS without changing the product workflow or weakening tenant governance.

This session does **not** switch the Next.js application from Supabase to Neon. It proves that the existing business schema, engineering persistence, PostgreSQL functions and tenant-security model can exist on Neon before the application data/auth layer is migrated in Session 03.

## Neon target

- Project: `HelioCoreOS`
- Region: AWS `eu-west-2` (London)
- PostgreSQL: 18
- Database: `neondb`
- Production branch: `production`
- Isolated migration branch: `session-02-neon-migration`

All Session 02 schema work was performed on the isolated migration branch. The production branch was not modified.

## Source migration inventory

The existing Supabase migration history remains the source model for the current product schema. Session 02 audited and ported the implemented schema through:

- commercial/customer/site/project foundation;
- teams, roles and organisation subscription metadata;
- opportunities, readiness and indicative proposals;
- atomic governed proposal persistence;
- structured Site Surveys;
- governed System Designs;
- Load Profiles and engineering intake;
- source load records and atomic interval imports;
- Equipment Library V1;
- detailed design / string group / engineering checks;
- engineering calculation revisions;
- HelioCalc design-artifact persistence;
- equipment datasheet import staging.

## Authentication compatibility boundary

Neon Auth is provisioned with Better Auth and stores users under `neon_auth."user"`.

The former Supabase schema depended heavily on two contracts:

1. PostgreSQL role `authenticated` for grants and RLS policies;
2. `auth.uid()` for resolving the current user.

Rather than weaken or rewrite approximately the entire tenant-policy surface during the database migration, Session 02 introduced a transitional compatibility layer:

- no-login PostgreSQL roles `authenticated` and `anon`;
- schema `auth`;
- `auth.users` compatibility view over `neon_auth."user"`;
- `auth.uid()` reading the JWT subject from request-scoped PostgreSQL settings.

The compatibility migration is stored at:

`neon/migrations/202609130001_neon_auth_compatibility.sql`

Important: `auth.users` is a view and therefore is **not** used as a foreign-key target. Foreign keys that previously referenced Supabase `auth.users(id)` are mapped directly to `neon_auth."user"(id)` on Neon. This currently affects the profile identity and equipment-import actor/reviewer relationships.

Session 03 must validate the real authenticated request path and may replace this compatibility surface with a more native application identity context if doing so preserves the same security properties.

## Schema validation result

The isolated Neon branch currently contains:

- 30 public tables;
- 80 public RLS policies;
- the governed PostgreSQL functions required by the current workflows;
- the existing engineering, load-profile, equipment and calculation relationships;
- indexes and compound foreign keys required by the current engineering model.

The following identity resolution was tested successfully using a request-scoped JWT subject:

`auth.uid() → public.profiles → current_organisation_id() → current_user_role()`

The resolved test identity returned the expected organisation and `owner` role.

A full authenticated Data API/RLS request test is intentionally deferred to Session 03, because Session 02 does not yet switch the application's request/auth layer.

## Pakistan demonstration dataset

A fictional Neon Auth demo operator and isolated demo organisation were created **only on the Session 02 migration branch** to validate schema integrity.

The Pakistan demo dataset completed successfully with the expected counts:

| Object | Expected | Neon result |
| --- | ---: | ---: |
| Customers | 25 | 25 |
| Sites | 35 | 35 |
| Opportunities | 50 | 50 |
| Readiness items | 300 | 300 |
| Indicative proposals | 40 | 40 |
| Site surveys | 30 | 30 |
| System designs | 25 | 25 |
| Projects | 25 | 25 |
| Demo activity events | 270 | 270 |

This proves the current relational structure, constraints and historical workflow dataset can operate on Neon PostgreSQL.

## Object-storage finding

The Supabase migration `202609100010_equipment_datasheet_import_staging.sql` originally creates a Supabase Storage bucket and policies in `storage.buckets` / `storage.objects`.

Those Supabase-specific storage statements were **not** ported into PostgreSQL.

The database-side import records were ported and their `storage_path` fields remain provider-neutral.

During Session 02, Neon reported that branchable object storage is not available for this project's `eu-west-2` region. Therefore object storage is a separate infrastructure decision rather than a blocker for the PostgreSQL migration.

The rule going forward is:

- Postgres stores governed file/document metadata and storage keys;
- binary files live in an object-storage provider;
- no database table is allowed to assume Supabase Storage internals;
- the eventual storage adapter must preserve tenant separation and controlled document revision behaviour.

## What was deliberately not changed

Session 02 does not:

- change the Next.js Supabase client;
- change environment variables used by the deployed application;
- point Vercel at Neon;
- migrate production data;
- delete the old Supabase implementation;
- change HelioCalc's engineering authority;
- change Project conversion rules;
- redesign application roles/RLS;
- make the Neon migration branch the production branch.

## Session 02 exit state

The database-platform feasibility question is now resolved:

> HelioCoreOS' current PostgreSQL business and engineering model can run on Neon while retaining RLS, tenant context, governed functions, engineering revisions and the existing demonstration dataset.

The remaining migration risk is primarily the **application/auth/data-access layer**, not the relational PostgreSQL schema.

## Session 03 entry criteria

Session 03 should now migrate the runtime boundary in controlled steps:

1. choose the production Next.js Neon access pattern;
2. wire Neon Auth into the application;
3. establish request-scoped user/organisation context;
4. prove authenticated RLS isolation across two tenants;
5. replace Supabase client database calls;
6. preserve or adapt governed PostgreSQL function calls;
7. update environment configuration;
8. run the existing vertical workflow against Neon;
9. only then consider promotion of the Neon schema into the production branch.

## Production promotion rule

Do not modify the Neon `production` branch merely because the migration branch is structurally valid.

Production promotion requires an explicit review after Session 03 proves authenticated application behaviour, tenant isolation and the required vertical workflow.
