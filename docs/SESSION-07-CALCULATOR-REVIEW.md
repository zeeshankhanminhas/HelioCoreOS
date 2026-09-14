# Session 07 — Calculator review / approval gate

## Purpose
Turn a saved authoritative HelioCalc sizing revision into an explicitly reviewed engineering basis before downstream equipment selection and detailed design.

## State contract
The existing `engineering_calculations.status` values are intentionally preserved for this session:

- `draft` — authoritative HelioCalc revision saved, but not approved for downstream design.
- `reviewed` — latest authoritative revision has passed engineering review and is the approved sizing basis.

A returned revision remains `draft`; the return decision is written to the immutable activity trail and the engineer must create a new HelioCalc revision before approval. This avoids mutating the engineering result itself and avoids introducing a second rejection state before the broader Approval Engine is implemented.

## Approval rules
A revision may become `reviewed` only when all of the following are true:

1. the authenticated user is active in the same tenant;
2. the user role is Owner, Admin or Manager;
3. the Engineering Intake is `ready`;
4. the governed Load Profile is `ready`;
5. the selected calculation is the latest revision for that intake;
6. the calculation was produced by HelioCalc and has no error-severity validation findings;
7. no other revision for the intake is already approved.

Approval is audited. If the audit event cannot be recorded, the calculation status is rolled back to `draft`.

## Return-for-revision rules
Owner, Admin or Manager may return the latest draft revision with a mandatory review note. The calculation remains immutable and in `draft`; an audit event records the return decision. A fresh authoritative HelioCalc revision is required before another approval decision.

## Engineering reactivation gate
Downstream engineering may treat Calculator as complete only when the latest revision is `reviewed`.

`Ready Load Profile → HelioCalc revision → Engineering review → reviewed/approved sizing basis → Equipment selection → Detailed Design`

Creating a newer HelioCalc revision after approval is blocked. If the approved basis must change, a future governed reactivation/amendment action must explicitly reopen the calculation stage rather than silently superseding an approved basis.

## Scope boundary
Session 07 approves preliminary sizing only. It does not approve datasheet-driven stringing, MPPT allocation, cable/protection design, SLD/BOM, structural evidence, grid compliance, or final design.
