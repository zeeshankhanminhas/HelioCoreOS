# Customer Readiness Hardening

Project profile: HelioCoreOS Solar EPC  
Change type: Project Extension  
Launch scope: Yes

## Core references

- CORE-DATA-001 — progressive information collection
- CORE-STATE-001 — explicit governed states
- CORE-APP-001 — recorded review decisions
- CORE-AUDIT-001 — complete traceability
- CORE-FAIL-001 — no silent or partial success
- CORE-REL-001 — relationship integrity
- CORE-SEC-001 — tenant isolation
- CORE-UX-001 — consistent operating pattern

## Governed lifecycle

```text
Requested
→ Uploaded
→ Under Review
→ Accepted / Rejected / Waived
```

Rejected evidence may return to Uploaded after replacement. Accepted and Waived decisions are terminal for the current launch workflow.

## Required and optional evidence

Each readiness item carries an `is_required` flag.

- Required items block governed proposal issue until Accepted or formally Waived.
- Optional items remain visible but do not reduce the required-readiness score or block proposal issue.
- The proposal gate is calculated only from required items.

## Evidence and decision rules

- Uploaded, Under Review and Accepted states require an evidence URL.
- Rejected and Waived states require a decision note.
- Accepted, Rejected and Waived decisions record reviewer and timestamp.
- Invalid backward or skipped transitions are blocked server-side.
- Cross-organisation item access is rejected.

## Audit events

- `readiness.evidence_uploaded`
- `readiness.review_started`
- `readiness.accepted`
- `readiness.rejected`
- `readiness.waived`

Each event records the actor and the previous and resulting readiness state in the description.

## Proposal integration

Indicative Proposal issue readiness now uses only required items:

```text
Required readiness complete
= every required item is Accepted or Waived
```

The Opportunity command view displays the readiness score and names every blocking required item.

## Migration

Apply:

```text
supabase/migrations/202607300010_customer_readiness_hardening.sql
```

before validating the interface.

## Validation gates

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- requested → uploaded with evidence
- uploaded → under review
- under review → accepted
- under review → rejected with mandatory note
- rejected → uploaded replacement
- formal waiver with mandatory rationale
- rejected skipped transition is blocked
- evidence-less acceptance is blocked
- proposal issue remains blocked while required items remain unresolved
- optional unresolved evidence does not block proposal issue
- reviewer identity, timestamp and audit events are recorded
- desktop, mobile, keyboard and focus review