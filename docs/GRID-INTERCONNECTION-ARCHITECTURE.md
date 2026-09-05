# HelioCoreOS Grid and Interconnection Architecture

Status: Governing Solar EPC Project Addition  
Applies to: Engineering, Projects, grid applications, export control, metering, protection, commissioning and approvals  
Related: [HelioCalc Engineering Engine](./HELIOCALC-ENGINE.md), [Engineering Accuracy and Validation](./ENGINEERING-ACCURACY-VALIDATION.md)

## 1. Decision

Grid/interconnection is a governed engineering workflow, not a single text field called `grid reference` and not a hidden assumption inside inverter sizing.

The system must separate:

- technical interconnection requirements;
- application/authority workflow;
- approved export/import limits;
- protection/metering requirements;
- commissioning evidence;
- versioned country/utility rule profiles.

## 2. Core principle

> **The Engineering Scenario proposes the system. The grid/interconnection record defines what the network permits. HelioCalc validates the design against the active permitted constraints.**

A later grid approval or changed export limit can therefore mark an Engineering Scenario stale without silently editing it.

## 3. Grid connection record

Each Project/Site may carry a governed Grid Connection record containing, as applicable:

- network/utility/distribution company;
- connection point;
- supply voltage and phase;
- existing sanctioned/contracted load where relevant;
- transformer/interface details where known;
- import limit;
- export limit;
- zero-export requirement;
- metering arrangement;
- protection/interface requirements;
- power-factor/reactive-power requirements;
- application/reference number;
- submission date;
- authority response;
- conditions/notes;
- validity/expiry date;
- evidence documents;
- active rule-profile version.

## 4. Workflow state

Recommended lifecycle:

```text
NOT_REQUIRED
DRAFT
INPUTS_INCOMPLETE
READY_TO_SUBMIT
SUBMITTED
IN_REVIEW
CHANGES_REQUESTED
CONDITIONALLY_ACCEPTED
ACCEPTED
REJECTED
COMMISSIONING_PENDING
COMMISSIONED
SUPERSEDED
```

Exact state transitions may be profile-specific, but history must remain immutable.

## 5. Rule profiles

Country-, utility- and programme-specific requirements must not be scattered as undocumented constants in UI or Python code.

A governed rule profile may define:

- voltage/frequency operating boundaries;
- permitted export/import constraints;
- inverter/certification requirements;
- protection requirements;
- metering rules;
- zero-export/control requirements;
- reactive-power/power-factor requirements;
- application evidence requirements;
- commissioning tests;
- effective date/version.

Rule profiles are evidence/configuration, not source code comments.

## 6. Engineering dependency

The active Grid Connection revision becomes an input to the Engineering Scenario where applicable.

Examples of validation findings:

```text
BLOCKING — GRID_EXPORT_LIMIT
Modelled/export-capable system exceeds approved export limit without an accepted control strategy.

WARNING — GRID_APPROVAL_PENDING
Technical design is calculable but cannot become issue-for-construction under the configured project gate while grid approval is pending.

BLOCKING — GRID_PHASE_MISMATCH
Selected inverter/interface configuration is incompatible with the governed site/grid phase arrangement.
```

## 7. Export-control architecture

Export control must be treated as an engineered function with evidence.

A governed configuration may include:

- control mode: unrestricted / export-limited / zero-export;
- limit value and unit;
- meter/CT identity;
- controller identity;
- inverter compatibility;
- fail-safe behaviour where defined;
- commissioning test evidence;
- rule/authority reference.

The existence of a software setting alone must not be treated as proof that the export-control requirement has been commissioned successfully.

## 8. Protection and metering

Grid-related protection and metering should link to structured engineering outputs where those domains exist.

Potential objects/evidence include:

- protection schedule;
- relay/interface settings;
- CT/VT/meter details;
- anti-islanding evidence;
- point-of-connection SLD;
- commissioning test results;
- seal/inspection/authority sign-off where relevant.

## 9. Documents and approvals

Grid application and approval documents live in the Project/Grid workflow and are also registered in the Document Suite.

Examples:

- application form;
- SLD submitted to authority;
- load/export calculations;
- approval/conditional approval;
- correspondence;
- protection settings;
- metering schedule;
- commissioning certificate.

An approval document must be linked to the exact Grid Connection revision it authorises.

## 10. Stale-state propagation

Changes that may invalidate grid/interconnection evidence include:

- inverter model/quantity change;
- AC capacity change;
- export-control strategy change;
- connection point change;
- battery/grid-forming behaviour change;
- phase arrangement change;
- transformer/interface change;
- revised authority rule profile.

Affected approvals/calculations must be marked stale or superseded according to the dependency graph.

## 11. Commissioning closeout

The grid workflow does not end at approval.

Commissioning should reconcile:

```text
Approved grid conditions
↔ installed equipment
↔ protection/export settings
↔ measured/test evidence
↔ final issued documents
```

Only then should the configured Grid Connection workflow move to `COMMISSIONED`.

## 12. Implementation sequence

### GI1 — Grid record and evidence
- governed connection record;
- lifecycle;
- document linkage;
- export/import constraints.

### GI2 — Scenario integration
- active grid revision as Scenario input;
- stale-state propagation;
- export/phase/capacity findings.

### GI3 — Rule profiles
- versioned country/utility profiles;
- evidence requirements;
- approval gates.

### GI4 — Commissioning integration
- protection/metering/export-control evidence;
- design-vs-installed reconciliation.

## 13. Product decision

> **Grid approval is not a note attached to a Project. It is a governed technical constraint that can change what may be designed, issued and commissioned.**
