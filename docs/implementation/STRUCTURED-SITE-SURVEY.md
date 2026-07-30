# Sprint 4 — Structured Site Survey

## Purpose

Introduce a governed Solar EPC field-survey record between commercial readiness and detailed engineering.

## Delivered capability

- One structured survey per Opportunity.
- Enforced Opportunity-to-Site relationship integrity.
- Tenant-isolated PostgreSQL storage and RLS policies.
- Roof, structure, electrical, access, safety, constraints and engineering-handover fields.
- Evidence links for survey photographs and drawings.
- Controlled lifecycle: `draft → in_progress → under_review → approved` with a review rejection loop.
- Approved-record locking.
- Required-field gates before review and approval.
- Atomic survey persistence and activity-log creation through `commit_site_survey`.
- Opportunity command-view survey status and integrated survey workspace.

## Migration

Apply:

`supabase/migrations/202607300100_structured_site_surveys.sql`

## Runtime validation matrix

1. Opportunity without a Site cannot start a survey.
2. Draft survey accepts incomplete data.
3. Survey cannot reference a Site different from the Opportunity Site.
4. Review submission is blocked without survey date, surveyor, roof facts, electrical facts, asbestos risk, recommended PV capacity and at least one photo link.
5. Approval is blocked unless the current state is `under_review`.
6. Rejected surveys can return to `in_progress` or `under_review`.
7. Approved surveys are locked against backward transitions.
8. Forced RPC failure retains neither the survey mutation nor its activity event.
9. A tenant cannot read or mutate another organisation's survey.
10. Desktop and mobile layouts preserve section hierarchy and usable controls.

## Engineering handover contract

An approved survey provides the governed input for the next programme sprint: System Design. The design module should consume the approved survey's roof geometry, electrical infrastructure, constraints, evidence links and recommended capacities without silently overwriting the survey record.
