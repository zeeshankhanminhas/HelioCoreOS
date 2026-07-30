# Proposal Runtime and E2E Integrity Proof

## Purpose

This sprint proves and hardens the launch-critical commercial chain:

`Opportunity → Customer/Site → Required Readiness → Indicative Proposal → Opportunity Stage → Audit`

## Runtime controls

### Required readiness alignment

Proposal issue now evaluates only readiness items marked `is_required`. Optional unresolved evidence no longer blocks issue, matching the Customer Readiness governance model and the Opportunity UI.

### Atomic workflow commit

Proposal persistence, Opportunity-stage synchronisation and audit creation are committed through `public.commit_governed_proposal` in one PostgreSQL transaction.

A failure in any of the three writes rolls back the complete operation. The application no longer retains a proposal without its corresponding stage or audit event.

### Live workflow proof

The Opportunity command view displays five runtime checks:

1. Customer relationship
2. Site relationship
3. Required readiness completion
4. Proposal record
5. Proposal-to-Opportunity lifecycle alignment

A lifecycle mismatch is surfaced as a blocking integrity warning.

## Governed lifecycle mapping

| Proposal state | Opportunity stage |
| --- | --- |
| Draft | Proposal |
| Issued | Proposal |
| Accepted | Won |
| Declined | Lost |
| Expired | Proposal |

## Validation matrix

- Save a Draft proposal and confirm Proposal stage and audit event.
- Attempt issue without Customer and Site.
- Attempt issue with unresolved required readiness.
- Confirm unresolved optional readiness does not block issue.
- Issue with valid commercial fields and a future validity date.
- Confirm issued commercial fields remain immutable.
- Record Accepted, Declined and Expired dispositions.
- Confirm backward transitions are rejected.
- Force an RPC write failure and confirm no partial proposal, stage or audit change remains.
- Confirm the runtime integrity panel reflects persisted data after every transition.

## Migration

Apply:

`supabase/migrations/202607300020_proposal_runtime_atomic_commit.sql`

before exercising governed proposal writes in the deployed environment.
