# Indicative Proposal Governance

## Purpose

Implement the launch-scope commercial control for an indicative Solar EPC proposal without treating it as a final engineered design, approved BOM or construction issue document.

## Governed lifecycle

`Draft → Issued → Accepted | Declined | Expired`

Backward transitions are prohibited. Accepted, Declined and Expired are terminal states.

## Issue gates

A proposal cannot be issued unless:

- the Opportunity belongs to the active Organisation;
- both Customer and Site are assigned;
- every readiness item is Accepted or Waived;
- PV capacity is greater than zero;
- indicative price is greater than zero;
- assumptions are documented;
- a future validity date is set;
- the proposal number is valid and unique within the Organisation.

## Record integrity

- Draft commercial fields remain editable.
- Once Issued, commercial fields are treated as immutable.
- An Issued proposal may only be marked Accepted, Declined or Expired.
- Customer disposition updates the parent Opportunity stage.
- Every save or transition writes a distinct audit event.

## Opportunity stage synchronisation

- Draft / Issued / Expired → Proposal
- Accepted → Won
- Declined → Lost

## Audit events

- `proposal.draft_saved`
- `proposal.issued`
- `proposal.accepted`
- `proposal.declined`
- `proposal.expired`

## Constitutional alignment

This implementation applies tenant isolation, relationship integrity, state control, progressive disclosure, immutable issued records, explicit failure handling and auditability. It does not introduce final design approval, contract execution, procurement, installation or commissioning scope.
