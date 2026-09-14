# Session 09 — Supabase runtime and storage retirement

## Purpose
Complete the HelioCoreOS platform cutover so Supabase is no longer required by the application runtime, package graph, environment contract, file-storage path, or authoritative schema history.

## Runtime authority
HelioCoreOS now uses:

- Neon Managed Auth for identity and sessions;
- Neon Data API for application reads, writes, RLS and governed RPCs;
- Neon PostgreSQL migrations under `neon/migrations` as the authoritative database history;
- Vercel Blob for manufacturer datasheet binary storage;
- HelioCalc for the Python engineering calculation service.

The remaining legacy server-action import path is retained only as a zero-dependency compatibility re-export to the Neon client while older modules are progressively renamed. It contains no Supabase SDK, credentials, cookies, network calls or storage access.

## Datasheet storage cutover
Manufacturer PDF uploads now use browser-direct Vercel Blob client uploads. The upload-token route:

1. requires an authenticated Neon user;
2. requires an active profile and organisation;
3. verifies the Equipment Import batch belongs to that organisation;
4. restricts the Blob pathname to the organisation/batch namespace;
5. accepts PDF only;
6. enforces the existing 20 MB file limit.

After upload, the existing governed server action fetches the Blob URL, performs PDF extraction, records the import-file metadata and candidate evidence in Neon, and persists the Blob URL as the datasheet evidence URL.

## Dependency retirement
`@supabase/ssr` and `@supabase/supabase-js` are removed. The public environment contract no longer contains Supabase URL or publishable-key variables. `BLOB_READ_WRITE_TOKEN` is the only new storage secret expected by local/non-integrated environments; Vercel Blob integrations may inject this automatically.

## Schema-history retirement
The legacy `supabase/` migration tree is removed. The reusable Pakistan demo seed scripts are preserved under `neon/seed/` so demo validation remains available without retaining Supabase as a schema authority.

## Completion gate
Session 09 is complete only when the Vercel preview build succeeds with the Supabase packages absent. Production Supabase environment variables, if still present in Vercel project settings, are inert after this release and may be deleted administratively without affecting runtime behaviour.
