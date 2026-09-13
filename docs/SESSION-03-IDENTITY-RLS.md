# Session 03 — Neon identity, tenant security and RLS hardening

## Purpose

Session 03 replaces the transitional Supabase-auth compatibility model from Session 02 with the Neon-native request path:

```text
Managed Better Auth
        ↓
JWT subject / Neon session
        ↓
Neon Data API
        ↓
authenticated / anonymous PostgreSQL role
        ↓
auth.uid()
        ↓
profiles.organisation_id
        ↓
HelioCoreOS RLS policies
```

The business tenancy model remains HelioCoreOS-owned. Neon Auth proves identity; `profiles` maps that identity into an Organisation and HelioCoreOS role.

## Native contracts

### Identity

The authoritative user directory is:

```sql
neon_auth."user"
```

Foreign keys that represent application users must target `neon_auth."user"(id)` directly.

### Request identity

RLS and governed functions use Neon's native:

```sql
auth.uid()
```

Do not recreate a PL/pgSQL compatibility implementation of `auth.uid()`.

### Data API roles

Authenticated application requests execute through the Neon Data API `authenticated` role. Unauthenticated requests use `anonymous` and receive no HelioCoreOS operational-table privileges.

The Data API does not replace RLS. GRANT determines which tables the API role can touch; RLS determines which rows are visible or writable.

## Transitional compatibility namespace

`supabase_auth_legacy` is retained temporarily as a deprecated compatibility namespace only.

Rules:

- no new RLS policy may reference it;
- no application query may reference it;
- no foreign key may target it;
- no new function may depend on it;
- it may be removed in a later cleanup migration once historical migration replay no longer requires it.

The Session 02 file `neon/migrations/202609130001_neon_auth_compatibility.sql` is historical migration evidence, not the target runtime contract.

## Session 03 migration

`neon/migrations/202609130002_neon_native_identity_rls.sql` assumes Managed Better Auth and Neon Data API have already been provisioned on the target branch. It then:

- requires the Neon-native `authenticated` and `anonymous` roles;
- rebinds public RLS policies to `authenticated`;
- moves remaining request-identity expressions to native `auth.uid()`;
- grants authenticated Data API access to public application tables/sequences;
- revokes operational data access from `anonymous`;
- marks `supabase_auth_legacy` deprecated.

## Decisive isolation proof

Validated on Neon branch `session-03-identity-rls` (`br-long-frost-zaxmy80u`). Production was not modified.

### Read isolation

Tenant A identity resolved to Organisation A and could read the Tenant A marker customer. Tenant B marker visibility count was **0**.

Tenant B identity resolved to Organisation B and could read the Tenant B marker customer. Tenant A marker visibility count was **0**.

```text
Tenant A → Tenant A rows      PASS
Tenant A → Tenant B rows      BLOCKED
Tenant B → Tenant B rows      PASS
Tenant B → Tenant A rows      BLOCKED
```

### Cross-tenant write isolation

While authenticated as Tenant A, an UPDATE targeting the Tenant B marker customer affected **0 rows**.

```text
Tenant A → write Tenant B     BLOCKED
```

### Policy state after transition

- public RLS policies attached to Neon-native `authenticated`: **80**
- policies attached to the temporary transition role: **0**
- policies referencing `supabase_auth_legacy.uid()`: **0**
- transition-role dependencies after rebind: **0**

The temporary transition role was deleted after these checks passed.

## Application integration contract

The Next.js application should use:

- `@neondatabase/auth` for Managed Better Auth in App Router/server contexts;
- `@neondatabase/neon-js` for Data API queries where `.from()` / `.rpc()` compatibility is useful;
- `NEON_AUTH_BASE_URL` for the Managed Better Auth service;
- `NEON_AUTH_COOKIE_SECRET` for signed application session cookies;
- `NEXT_PUBLIC_NEON_DATABASE_URL` or explicit Data API/Auth URLs for browser Data API access.

Authenticated Data API calls must carry the Neon-issued JWT. A direct PostgreSQL owner connection is never a substitute for testing RLS.

## Session 03 exit gate

Session 03 is only complete when the application-level path also proves:

```text
Sign in as Tenant A
  → Customers / Sites / Opportunities show only Tenant A

Sign in as Tenant B
  → Customers / Sites / Opportunities show only Tenant B

Direct cross-tenant record URL/API request
  → blocked / not found
```

The SQL-level tenant proof is complete. The runtime application test is tracked by the Session 03 Playwright specification and must be executed against a deployment configured to the Session 03 Neon branch.
