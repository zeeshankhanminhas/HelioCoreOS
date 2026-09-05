# HelioCoreOS Drawing Authoring Integration

Status: Governing Solar EPC Project Addition  
Applies to: Project Engineering, HelioCalc, Drawing Workspace and Document Suite  
Parent IA: [Information Architecture](./INFORMATION-ARCHITECTURE.md)  
Engineering architecture: [HelioCalc Engineering Engine](./HELIOCALC-ENGINE.md)  
Document governance: [Document Suite Architecture](./DOCUMENT-SUITE-ARCHITECTURE.md)

## 1. Decision

HelioCoreOS will use the **SketchUp ecosystem as the supported external physical drawing-authoring environment** for the first serious Solar EPC product profile.

The supported authoring stack is:

```text
SketchUp      = site / roof / structure / physical 3D model
Skelion       = solar PV module layout and array authoring assistance
SketchUp LayOut = controlled drawing-sheet production
```

HelioCoreOS does not attempt to become a CAD or 3D modelling application.

HelioCalc does not attempt to become a drawing authoring application.

The division of responsibility is:

> **HelioCoreOS governs the design. HelioCalc validates the engineering. SketchUp authors the physical model and layout. The Document Suite controls the resulting drawing revisions.**

## 2. Why one drawing environment

The launch architecture intentionally avoids supporting several external CAD or solar-design products at once.

Supporting SketchUp + Skelion + LayOut gives the project one understandable authoring workflow for:

- site and building geometry;
- roof and terrain representation;
- physical PV module placement;
- obstructions and setbacks;
- roof and ground-mount array layouts;
- plan, elevation and section views;
- dimensioned drawing sheets;
- 3D presentation views;
- source model retention;
- PDF drawing issue;
- DWG/DXF handoff where required.

Do not introduce AutoCAD, Revit, Aurora, PVcase or another drawing-authoring dependency merely to duplicate this role during the initial product programme.

A later integration may be added only when a real operational requirement justifies it.

## 3. Product boundary

### HelioCoreOS owns

- Project and Opportunity context;
- Site and approved Survey revision;
- Engineering Scenario identity;
- selected equipment revisions;
- drawing job identity;
- drawing number and title;
- drawing revision lifecycle;
- source-model reference;
- review and approval;
- issue and supersession;
- design/drawing consistency findings;
- audit trail;
- controlled retrieval through the Document Suite.

### HelioCalc owns

- PV and BESS calculation truth;
- array capacity calculations;
- string and MPPT validation;
- inverter limits;
- cable and electrical calculations;
- design guardrails;
- performance calculations;
- machine-readable engineering findings;
- calculation revision and provenance.

### SketchUp + Skelion owns

- physical geometry;
- roof/site model;
- module placement in space;
- array layout geometry;
- obstructions and physical clearances represented in the model;
- drawing views derived from the physical model.

### SketchUp LayOut owns

- drawing-sheet composition;
- viewports;
- dimensions and annotations where authored manually;
- sheet title blocks where this remains the chosen production route;
- drawing PDF / DWG / DXF export.

## 4. Drawing Workspace inside HelioCoreOS

The **Drawing Workspace is a HelioCoreOS Engineering sub-workspace**.

SketchUp itself is not embedded as the primary modeller inside the browser.

Canonical location:

```text
Project 360
└── Engineering
    └── Active Scenario
        └── Drawings
            ├── Drawing Jobs
            ├── Physical Model
            ├── Drawing Revisions
            ├── Review
            └── Issued Drawings
```

The Drawing Workspace should answer:

1. Which Project and Scenario owns this drawing?
2. Does a source SketchUp model exist?
3. What is the current drawing revision?
4. Which engineering inputs/equipment revision is it based on?
5. Does the drawing match the active engineering Scenario?
6. What files were published?
7. What is the current review / approval / issue state?
8. What is the next permitted action?

## 5. Drawing Job as a governed child record

A Drawing Job represents a controlled authoring task, not merely an uploaded file.

Minimum identity:

```text
Drawing Job ID
Project ID
Engineering Scenario ID
Drawing number
Drawing title
Drawing type
Current revision
Author / owner
Source authoring system
Source-model state
Workflow state
Created at / updated at
```

Example:

```text
DRG-PV-001
PV Array Layout
Project: PRJ-2026-014
Scenario: B
Authoring system: SketchUp
Source model: Linked
Current revision: C
State: Under Review
```

## 6. New-case workflow

A new case may have no SketchUp model.

The workflow is therefore:

```text
Project / Opportunity
→ Approved or usable Site / Survey basis
→ Engineering Scenario
→ Create Drawing Job
→ Prepare SketchUp package
→ Create new SketchUp model
→ Author physical layout with SketchUp + Skelion
→ Produce drawing sheet in LayOut where required
→ Publish drawing revision to HelioCoreOS
→ Validate against Engineering Scenario
→ Review
→ Approve
→ Issue through Document Suite
```

### No source model exists

The Drawing Workspace shows:

```text
Source model: Not created
[Prepare SketchUp Package]
```

It must not misleadingly show `Open in SketchUp` when no connected model exists.

## 7. Existing-case workflow

When a source model already exists:

```text
Drawing Workspace
→ Continue source model
→ Update layout
→ Publish next revision
→ Compare with prior revision and active Scenario
→ Review / Approve / Issue
```

The UI may show:

```text
Source model: Linked
Current model revision: 4
Published drawing revision: C

[Download / Continue Model]
[Publish New Revision]
[View Drawing]
[Compare Revisions]
```

A future SketchUp Connector may replace manual download/upload actions with direct job opening and publishing.

## 8. Integration maturity levels

### DA1 — Controlled file handoff

This is the required first implementation.

HelioCoreOS prepares the Drawing Job and authoring package.

The engineer uses SketchUp / Skelion / LayOut externally and publishes controlled files back to HelioCoreOS.

Typical controlled outputs:

- `.skp` source model;
- drawing PDF;
- DWG/DXF where required;
- preview image;
- drawing metadata;
- actual module count;
- optional layout schedule/export.

No desktop connector is required for DA1.

### DA2 — HelioCoreOS SketchUp Connector

A future SketchUp extension provides a HelioCoreOS panel inside SketchUp.

Conceptual commands:

```text
Sign in / connect workspace
My Drawing Jobs
Open Drawing Job
Pull Engineering Basis
Sync Equipment Reference
Publish Revision
View HelioCoreOS Findings
```

For a new Drawing Job:

```text
[Create New Model]
```

For an existing Drawing Job:

```text
[Open Existing Model]
```

The connector communicates with HelioCoreOS through a controlled application API.

The preferred integration direction is:

> **SketchUp connects to HelioCoreOS.**

Do not make the web application depend on unreliable browser-to-desktop launching as the core workflow.

### DA3 — Structured model synchronisation

Only after DA2 is proven, structured metadata may synchronise automatically, for example:

- module count;
- module model / revision reference;
- arrays / roof faces;
- tilt;
- azimuth;
- key layout areas;
- layout publication timestamp;
- source model fingerprint;
- drawing sheet list.

This must remain controlled and auditable.

DA3 must not make geometry data silently authoritative over the approved Engineering Scenario.

## 9. Engineering-to-drawing handoff

A Drawing Job should inherit a frozen design basis or explicit Scenario revision reference.

Conceptual handoff:

```text
Project: PRJ-2026-014
Scenario: B rev 3
Module: LONGi 610 W · equipment rev 2
Target module count: 192
Target DC capacity: 117.12 kWp
Site Survey: SUR-014 rev 2
Drawing: PV-LYT-001
```

The drawing author should not need to manually retype governed project and equipment identity where HelioCoreOS already knows it.

## 10. Drawing-to-engineering reconciliation

A drawing publication must be checked against the Engineering Scenario.

Examples:

### Module-count mismatch

```text
Engineering Scenario: 192 modules
Published drawing: 188 modules
Difference: -4 modules
Result: BLOCKING / review required
```

### Equipment mismatch

```text
Engineering Scenario: LONGi 610 W rev 2
Drawing metadata: Jinko 585 W
Result: BLOCKING
```

### Capacity mismatch

```text
Engineering Scenario: 117.12 kWp
Drawing layout: 114.68 kWp
Difference: -2.44 kWp
Result: WARNING or BLOCKING according to rule profile
```

A drawing mismatch creates an Engineering Finding. It must never silently update the Scenario to match the drawing.

The engineer must intentionally either:

- revise the drawing; or
- create/update a governed Engineering Scenario revision and recalculate.

## 11. Physical drawings versus generated engineering documents

Do not force all engineering documentation through SketchUp.

### SketchUp authoring is appropriate for

- site plan;
- roof plan;
- PV array layout;
- module placement layout;
- mounting / physical arrangement views;
- elevations;
- sections;
- 3D design views;
- construction/detail views where the team chooses SketchUp/LayOut.

### HelioCoreOS / HelioCalc should generate where structured data is authoritative

- string schedule;
- MPPT schedule;
- cable schedule;
- protection schedule;
- equipment schedule;
- calculation report;
- design-basis report;
- performance report;
- BOM;
- potentially Single Line Diagram once a governed structured SLD generator is implemented.

This avoids redrawing data that already exists as structured engineering truth.

## 12. Document Suite integration

Every published drawing is governed by the Document Suite.

The `.skp` file is controlled source evidence; the issued drawing PDF/DWG is a governed document revision.

Conceptual relationship:

```text
Drawing Job
├── Source Model
│   └── SKP model revision / fingerprint
└── Drawing Document
    ├── Rev A
    ├── Rev B
    └── Rev C
```

Each drawing revision should retain:

- drawing identity;
- revision;
- related Project;
- related Engineering Scenario revision;
- related Survey revision where relevant;
- author;
- checker / approver;
- source-model reference;
- published files;
- module/equipment summary;
- review comments;
- issue record;
- supersession relationship;
- audit history.

Approved / Issued drawing revisions are immutable.

## 13. Drawing lifecycle

The Drawing Job uses the Document Suite lifecycle rather than inventing an unrelated state model.

Recommended mapping:

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

The source SketchUp model may continue evolving, but an issued drawing revision remains immutable and reproducible.

## 14. Drawing Workspace UI

Recommended desktop composition:

```text
┌───────────────────────────────────────────────────────────────────┐
│ PRJ-014 · Engineering · Scenario B · Drawings                     │
│ PV Array Layout · DRG-PV-001 · Rev C · Under Review              │
├─────────────────────────────────────┬─────────────────────────────┤
│ DRAWING / PREVIEW                   │ CONTROL                     │
│                                     │                             │
│ PDF / image preview                 │ Scenario basis              │
│ sheet list                          │ Model state                 │
│ model metadata                      │ Match / mismatch            │
│ revision comparison                 │ Findings                    │
│                                     │ Review state                │
│                                     │ Next action                 │
├─────────────────────────────────────┴─────────────────────────────┤
│ [Continue Model] [Publish Revision] [Submit for Review]          │
└───────────────────────────────────────────────────────────────────┘
```

Use a full workspace for sustained drawing review.

Use Right Sheets for:

- source-model metadata;
- revision evidence;
- drawing history;
- review comments;
- publication provenance.

Use Dialogs for:

- submit for review where note/reviewer selection is needed;
- approve;
- reject / request changes;
- issue;
- supersede.

## 15. Action wording

Until a desktop connector actually exists, avoid implying direct application launch.

Use:

```text
Prepare SketchUp Package
Download / Continue Model
Upload / Publish Revision
```

After the SketchUp Connector exists and is proven, the product may use:

```text
Create in SketchUp
Open Drawing Job
Publish to HelioCoreOS
```

Do not label a button `Open in SketchUp` if the implementation merely downloads a file and relies on the operating system to infer what to do.

## 16. Security and access

The connector or upload workflow must preserve tenant isolation and role permissions.

A Drawing Job must not expose source files from another organisation.

Future connector authentication should use short-lived scoped credentials or an equivalent controlled session pattern rather than embedding long-lived secrets in a SketchUp extension.

Source models and issued drawings may have different access rules.

## 17. Failure handling

A drawing publication must fail explicitly when:

- Project / Scenario relationship is invalid;
- author lacks permission;
- source model upload fails;
- required drawing metadata is missing;
- file persistence fails;
- revision sequence conflicts;
- a supposedly immutable revision would be overwritten;
- design/drawing reconciliation cannot be completed when required.

Partial publication must not look successful.

## 18. Build programme

### DA1 — Drawing Workspace + controlled handoff

- Drawing Job model;
- Engineering > Drawings IA;
- create new Drawing Job;
- prepare authoring package;
- upload/publish source `.skp` and drawing outputs;
- preview;
- revision metadata;
- basic Scenario/drawing reconciliation;
- Document Suite registration.

### DA2 — Review and revision control

- revision comparison;
- review comments;
- Changes Requested;
- approval;
- issue;
- supersession;
- Drawing Pack view.

### DA3 — SketchUp Connector

- SketchUp extension shell;
- authenticated workspace connection;
- Drawing Job list;
- create/open model workflow;
- pull governed design basis;
- publish revision.

### DA4 — Structured drawing synchronisation

- module/equipment metadata sync;
- array geometry summary;
- model fingerprint;
- automatic reconciliation findings;
- improved publication provenance.

### DA5 — Production hardening

- permissions;
- large-file handling;
- retry/idempotency;
- audit completeness;
- security review;
- end-to-end tests;
- recovery from interrupted publication.

## 19. Anti-patterns

Do not:

- build a browser CAD modeller simply to remove SketchUp;
- make SketchUp the engineering calculation authority;
- make Skelion output automatically overwrite the Engineering Scenario;
- support many CAD vendors before one workflow is proven;
- treat `.skp` as an unmanaged attachment;
- overwrite an issued drawing revision;
- require AutoCAD only because DWG/DXF may be exchanged;
- duplicate HelioCalc electrical calculations manually in drawings;
- use `Open in SketchUp` as fake integration before a connector exists;
- make the Drawing Workspace a global sidebar module.

## 20. Product rule

The drawing architecture is intentionally simple:

> **SketchUp + Skelion + LayOut is the external physical drawing-authoring environment. HelioCoreOS owns the Drawing Job, design context, revisions, review and issue. HelioCalc owns engineering calculation truth. The Document Suite preserves every controlled drawing output.**
