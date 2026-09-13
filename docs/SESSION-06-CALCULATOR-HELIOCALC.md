# Session 06 — Calculator UX + authoritative HelioCalc revisions

## Objective

Session 06 closes the governed transition from a Ready Load Profile into an authoritative preliminary sizing revision.

The operating contract is now:

```text
Ready Load Profile
      ↓
Calculator browser preview
      ↓
Save revision
      ↓
Python HelioCalc recomputation
      ↓
Validation gate
      ↓
Immutable engineering_calculations revision
      ↓
Equipment selection / Detailed Design
```

## Authority boundary

The TypeScript calculator remains a responsive operator preview only. It may help the engineer tune assumptions, but it is not persisted as engineering authority.

A saved calculation is authoritative only when all of the following are true:

1. the Engineering Intake is `ready`;
2. the linked Load Profile is `ready`;
3. the request is recomputed by the Python HelioCalc service;
4. the HelioCalc response contract is valid;
5. no HelioCalc validation has severity `error`;
6. the result is inserted as a new `engineering_calculations` revision;
7. the audit event is recorded.

If HelioCalc is unavailable, times out, rejects the service token, returns an invalid response, or reports blocking validations, no revision is issued.

## Neon application data layer

`src/lib/neon/calculators.ts` owns the Session 06 application boundary:

- authenticated Neon user and organisation context;
- RLS-protected Calculator workspace retrieval;
- governed Load Profile and Engineering Intake checks;
- Python HelioCalc invocation;
- authoritative result persistence through Neon Data API;
- sequential revision/reference generation;
- immutable input/result/validation snapshots;
- audit logging and rollback if audit persistence fails.

The active Calculator page and server action no longer use the Supabase runtime.

## Revision evidence

Each saved revision records:

- calculation reference;
- revision number;
- system type;
- HelioCalc engine version;
- complete sizing input snapshot;
- governed Load Profile reference;
- design objective;
- authority marker `heliocalc_python`;
- result snapshot;
- validation snapshot;
- creator and timestamp.

Existing uniqueness constraints on organisation + intake + revision and organisation + calculation reference continue to prevent duplicate revision identities.

## UX

The Calculator workspace now makes the authority split explicit:

- **TypeScript — non-authoritative preview**
- **Python HelioCalc — saved authority**

The latest authoritative revision is surfaced separately from the live browser preview, including PV, inverter and BESS recommendations plus warning/error counts. The revision register exposes the engine version for every saved result.

## HelioCalc transport hardening

The Next.js → HelioCalc service boundary now:

- requires `HELIOCALC_URL` before persistence;
- continues to support the service token header;
- uses a 15 second timeout;
- validates the minimum HelioCalc response contract;
- fails closed: transport or validation failure cannot create an engineering revision.

## Scope boundary

Session 06 is preliminary system sizing, not Detailed Design approval.

It does not select final equipment, prove string/MPPT compatibility, perform final cable/protection coordination, issue SLD/BOM, or create a Project.

Those remain downstream governed stages.

The Session 03 real two-user browser-auth validation remains deferred and is not represented as passed.
