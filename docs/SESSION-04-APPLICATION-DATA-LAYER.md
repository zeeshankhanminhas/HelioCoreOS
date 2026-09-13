# Session 04 — Application Data Layer + Opportunity Engineering Readiness

## Outcome

Session 04 establishes the governed commercial-to-engineering handoff on the Neon runtime.

```text
Customer
  ↓
Site
  ↓
Opportunity
  ↓
Engineering Readiness
  ↓
System Type + Load Evidence + Design Objective
  ↓
Load Profile
  ↓
Engineering Intake
```

A Project is **not** created anywhere in this flow. Project creation remains contract-gated.

## Application data layer

`src/lib/neon/opportunities.ts` is the first dedicated application-service boundary over the Neon browser client. It owns:

- authenticated user / organisation context resolution
- Opportunity creation
- Customer ↔ Site integrity checks
- automatic readiness-checklist creation
- readiness updates and audit events
- readiness assessment loading
- controlled creation of Load Profile + Engineering Intake
- rollback when intake/audit persistence fails

This keeps PostgREST-style `.from()` semantics while moving business workflow calls away from Supabase-specific runtime assumptions.

## Readiness authority

`src/lib/application/opportunity-readiness.ts` is the canonical application-level readiness evaluator for this phase.

Engineering is allowed only when:

1. Customer is assigned.
2. Site is assigned.
3. Every required readiness item is `accepted` or `waived`.

Possible UI states are:

- `not_ready`
- `action_required`
- `ready`

The evaluator returns the readiness score and explicit blockers. UI labels never replace the actual gate.

## Neon engineering-readiness workspace

Route:

`/dashboard/opportunities/[id]/engineering-readiness`

The workspace:

- loads the Opportunity through Neon Data API and tenant RLS
- loads required readiness evidence
- communicates blockers and next action
- allows governed readiness status updates
- requires System Type, Load Profile source and Design Objective
- creates the Load Profile and Engineering Intake only after readiness passes
- sends the operator directly into the Load Profile workspace
- shows that Project creation remains contract-gated

## Opportunity creation

`/dashboard/opportunities/new` now creates records through Neon Data API rather than the Supabase server action.

After successful creation the operator is sent directly to the engineering-readiness workspace. The Opportunity remains a commercial/pre-contract object.

## Anti-bypass rule

The legacy engineering server action now evaluates the same Opportunity readiness contract before creating an intake. A direct visit to the Engineering workspace therefore cannot bypass Customer/Site/evidence readiness.

## Session boundary

Session 04 does **not** migrate the entire engineering module away from Supabase. That is intentionally Session 05 work.

Session 04 owns the commercial-to-engineering application boundary. Session 05 owns the Engineering data layer and Load Profile finalisation.

## Deferred verification

The real two-tenant browser credential test from Session 03 remains a carried validation gate. Session 04 does not weaken or replace that requirement.
