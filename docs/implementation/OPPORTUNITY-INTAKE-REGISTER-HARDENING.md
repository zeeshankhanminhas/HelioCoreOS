# Opportunity Intake & Register Hardening

Project profile: HelioCoreOS Solar EPC  
Change type: Project Extension  
Launch scope: Yes

## Core references

- CORE-CTX-001 — Location and context
- CORE-DATA-001 — Governed data integrity
- CORE-STATE-001 — Explicit lifecycle state
- CORE-AUDIT-001 — Complete traceability
- CORE-FAIL-001 — No silent failure
- CORE-REL-001 — Relationship integrity
- CORE-SEC-001 — Tenant isolation
- CORE-UX-001 — Consistent operating pattern

## Implemented scope

### Intake

- permits progressive capture before Customer or Site assignment;
- validates title, reference format and non-negative commercial estimates;
- rejects duplicate references within the organisation;
- validates Customer, Site and Owner against the active organisation;
- prevents assigning a Site to a conflicting Customer;
- derives Customer from the Site where appropriate;
- creates the readiness checklist as part of initial setup;
- records the creation audit event;
- removes an incomplete Opportunity if readiness or initial audit setup fails.

### Register

- adds title/reference search;
- adds lifecycle-stage filtering;
- distinguishes unassigned relationships from generic placeholders;
- distinguishes a zero estimate from no estimate;
- supplies explicit loading failure and filtered-empty states.

### Record control

- adds governed editing for the core Opportunity record;
- supports deliberate lifecycle movement through Lead, Qualified, Readiness, Proposal, Won and Lost;
- records update and stage-change audit events;
- validates all relationship changes against organisation context;
- warns when Customer or Site remains unassigned;
- warns when related workflow data is incomplete.

## Launch lifecycle

```text
Lead
→ Qualified
→ Readiness
→ Proposal
→ Won / Lost
```

Customer and Site are optional during initial Lead capture. Their absence is visible and must be resolved before a governed proposal is issued.

## Acceptance criteria

1. An Opportunity can be created without a Customer or Site.
2. Duplicate organisation references are rejected clearly.
3. Cross-organisation Customer, Site or Owner assignments are rejected.
4. A Site cannot conflict with the selected Customer.
5. A successful creation includes readiness items and an audit event.
6. Register query failures are not displayed as an empty register.
7. Users can search and filter without introducing new modules.
8. Core Opportunity updates are auditable.
9. Missing Customer or Site assignment remains visible.
10. No workflow failure is silently presented as success.

## Validation required before merge

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- create Opportunity with no Customer/Site
- create Opportunity with matching Customer/Site
- reject conflicting Customer/Site
- reject duplicate reference
- update stage and verify activity event
- verify search, stage filter, empty and error states
- verify desktop and mobile layouts
