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

## UI implementation standard

This workflow follows [UI Component Strategy](../UI-COMPONENT-STRATEGY.md).

- Lifecycle state, issue blockers and terminal-state consequences remain custom HelioCoreOS workflow surfaces.
- shadcn/ui may support accessible dialogs, confirmations, tooltips, date controls and notifications.
- A component library must not reduce issue gates to hidden validation or make destructive and terminal actions visually ambiguous.
- Issued-state immutability, disabled controls, loading feedback and failure recovery must remain explicit.
- The visual treatment must preserve the HelioCoreOS hierarchy rather than adopting a generic shadcn dashboard composition.

## Constitutional alignment

This implementation applies tenant isolation, relationship integrity, state control, progressive disclosure, immutable issued records, explicit failure handling, auditability and `CORE-UX-001`. It does not introduce final design approval, contract execution, procurement, installation or commissioning scope.
