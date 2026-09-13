# Session 05 — Engineering Data Layer + Load Profile Finalisation

## Goal

Move the active Engineering register and governed Load Profile workflow from the transitional Supabase application runtime onto Neon Auth + Neon Data API, while preserving the pre-contract engineering boundary.

Canonical flow:

`Opportunity readiness → Engineering Intake → Load Profile → governed evidence → engineering-ready → Calculator`

Project creation remains downstream of accepted proposal / signed contract.

## Neon application data layer

`src/lib/neon/load-profiles.ts` now owns the active Load Profile data path.

It provides:

- authenticated Neon identity and organisation context;
- Engineering register queries;
- Load Profile workspace retrieval;
- manual demand summary persistence;
- utility-bill history persistence and deterministic recalculation;
- appliance/process schedule persistence and deterministic recalculation;
- interval CSV parsing and the governed interval replacement RPC;
- audit events for engineering evidence mutations;
- Load Profile readiness approval;
- linked Engineering Intake transition to `ready`;
- rollback of the Load Profile ready state if the Engineering Intake transition fails.

All Data API requests remain subject to the Session 03 Neon JWT + RLS contract.

## Engineering register

`/dashboard/engineering` now loads through Neon Data API in the authenticated browser path.

The register:

- displays only tenant-visible Opportunities, Sites, Intakes and Calculations;
- re-evaluates Opportunity readiness before offering new engineering intake;
- exposes the governed work queue;
- routes draft work to Load Profile and ready work to Calculator.

The Engineering intake UI no longer posts to the Supabase server action. It calls the Session 04 Neon readiness handoff (`startEngineeringFromOpportunity`) and therefore cannot bypass the Customer + Site + readiness gate.

## Load Profile finalisation

`/dashboard/engineering/load-profiles/[id]` is now a Neon Data API workspace.

Supported evidence modes remain:

1. Interval data
2. Utility bills
3. Appliance/process schedule
4. Manual early-stage summary

The workspace keeps source-aware quality assessment. A profile cannot become engineering-ready while blocking quality findings remain. Off-grid and Hybrid designs still require peak demand.

When accepted:

`Load Profile: draft → ready`

and

`Engineering Intake: draft → ready`

The Calculator then becomes the next governed destination.

## Interval evidence

Interval CSV remains bounded to 10,000 rows per import and requires `timestamp` and `demand_kw`. Optional fields are `energy_kwh`, `essential`, and `category`.

The existing database RPC `replace_load_profile_intervals` remains the atomic replacement authority; Session 05 changes the transport from the Supabase application client to Neon Data API rather than replacing the database transaction contract.

## Boundary

Session 05 does not migrate Equipment Library or Calculator persistence. Those are subsequent engineering slices. It also does not promote the isolated Neon schema branch to production or change the contract-gated Project rule.

## Deferred validation

The real two-user browser authentication E2E from Session 03 remains deferred because test-user passwords are not available. Session 05 does not claim that deferred browser test has passed.
