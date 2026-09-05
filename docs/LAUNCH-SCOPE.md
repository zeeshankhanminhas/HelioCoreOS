# HelioCoreOS Solar EPC Launch Scope

Status: Protected Project Profile  
Parent governance: [HelioCoreOS Constitution](./CONSTITUTION.md)

## 1. Purpose

This document defines the Solar EPC launch profile for HelioCoreOS.

It does not replace the Constitution. It narrows the protected core into an executable Solar EPC delivery sequence and prevents premature expansion into unproven modules.

## 2. Launch principle

HelioCoreOS launches through proven vertical slices, not through a wide collection of incomplete modules.

A capability must not appear production-ready merely because its page, schema or calculation exists.

The launch programme prioritises:

1. governed commercial intake;
2. traceable Site and Survey evidence;
3. validated Engineering Scenario workflow;
4. controlled documents and approvals;
5. design-to-drawing/BOM reconciliation;
6. delivery and commissioning evidence.

## 3. Commercial launch path

The required commercial launch path is:

```text
Enquiry / Lead
→ Opportunity
→ Customer assignment
→ Site assignment
→ Customer Readiness
→ Indicative Proposal
```

Customer and Site may be assigned after Opportunity creation. Both are required before an indicative proposal is issued.

The commercial slice must be proven before downstream engineering breadth becomes the primary delivery focus.

## 4. Engineering launch path

The target engineering path is:

```text
Approved Site Survey
→ Engineering Scenario
→ Released Equipment Data
→ HelioCalc Calculation
→ Engineering Findings / Margins
→ Structural / Grid evidence as applicable
→ Drawing Job / Engineering Outputs
→ Reconciliation
→ Engineering Review
→ Approved Design Revision
→ BOM
```

The first implementation should prove one narrow, high-confidence Solar PV path rather than attempting every PV/BESS/electrical function at once.

## 5. Authority gates

### 5.1 Equipment data gate

A manufacturer datasheet attachment alone does not make its extracted values authoritative.

Authoritative HelioCalc inputs require the governed source/normalisation/verification/release workflow defined in [Equipment Data Verification](./EQUIPMENT-DATA-VERIFICATION.md).

### 5.2 Calculation gate

A calculation domain must satisfy the evidence and test requirements in:

- [Engineering Accuracy and Validation](./ENGINEERING-ACCURACY-VALIDATION.md)
- [Test and Validation Strategy](./TEST-VALIDATION-STRATEGY.md)

A domain may be implemented but remain `DEVELOPMENT` or `BENCHMARKING` and therefore not be used as production engineering authority.

### 5.3 Structural gate

Physical placement in SketchUp/Skelion is not structural approval.

Projects that require structural evidence must satisfy the workflow defined in [Structural Engineering Boundary](./STRUCTURAL-ENGINEERING-BOUNDARY.md) before configured downstream gates may pass.

### 5.4 Grid/interconnection gate

Grid approval, export constraints, protection/metering requirements and commissioning conditions are governed through [Grid and Interconnection Architecture](./GRID-INTERCONNECTION-ARCHITECTURE.md).

A changed network/utility condition may invalidate or stale an Engineering Scenario.

### 5.5 Drawing/BOM gate

A drawing or BOM must not silently diverge from the approved Engineering Scenario.

Reconciliation differences create findings and must be resolved or governed before approval/issue.

## 6. Drawing authoring scope

HelioCoreOS does not build a browser CAD/3D modeller for launch.

Supported external authoring stack:

```text
SketchUp
+ Skelion
+ SketchUp LayOut
```

HelioCoreOS owns Drawing Jobs, revision state, review, approval and document control.

The initial integration is controlled file handoff. A SketchUp Connector is optional after that workflow is proven.

See [Drawing Authoring Integration](./DRAWING-AUTHORING-INTEGRATION.md).

## 7. Document scope

The initial `documents` table remains a launch spine rather than the final Document Suite.

The target governed lifecycle is:

```text
Draft
→ Review
→ Changes Requested
→ Revised Draft
→ Approved
→ Issued
→ Superseded
→ Archived
```

Documents are created and operated where the work happens; the global Documents Registry provides cross-record governance and retrieval.

See [Document Suite Architecture](./DOCUMENT-SUITE-ARCHITECTURE.md).

## 8. First serious engineering vertical slice

The recommended first end-to-end slice is:

```text
Verified/released PV module + inverter revisions
→ Approved Site Survey/design basis
→ Engineering Scenario
→ array capacity + cold Voc + hot Vmp + MPPT/current + DC/AC checks
→ machine-readable findings and margins
→ calculation revision persisted with provenance
→ Drawing Job prepared
→ SketchUp/Skelion layout revision published
→ module/equipment/capacity reconciliation
→ Review
→ Approved design revision
→ controlled drawing/calculation output
```

This slice is intentionally narrower than the final product but deep enough to prove the operating model.

## 9. Deferred engineering breadth

Do not delay the first validated slice in order to fully implement:

- advanced BESS degradation;
- every tariff/economic model;
- full structural calculation engine;
- every grid/utility rule profile;
- automated SketchUp connector;
- sophisticated 3D browser viewer;
- complete procurement/warehouse system;
- O&M analytics;
- every possible document pack.

These may follow once their parent workflow is proven.

## 10. Quality gates

A release candidate must satisfy the applicable gates for its implemented scope:

```text
Application
lint → typecheck → build → relevant tests

Engineering
controlled inputs → benchmark evidence → regression tests → findings → provenance

Workflow
persistence → audit → allowed transition → stale-state propagation

Cross-system
Scenario ↔ Calculation ↔ Drawing ↔ BOM ↔ Document

Security
no private credentials/local environment files committed; tenant/RLS assumptions verified
```

A failed engineering benchmark or unresolved blocking finding must not be overridden by a green UI build.

## 11. Scope discipline

The architecture is considered sufficiently defined to begin implementation when the current protected supplements cover:

- Information Architecture;
- enterprise floorplans and interaction surfaces;
- HelioCalc engine and cockpit;
- engineering accuracy/validation;
- testing strategy;
- equipment-data verification;
- structural responsibility boundary;
- grid/interconnection;
- drawing authoring;
- Document Suite.

Further architecture should be added only when implementation exposes a genuine missing decision.

## 12. Launch decision

> **From this point, implementation depth has priority over architectural breadth. Prove the governed engineering vertical slice before expanding the system.**
