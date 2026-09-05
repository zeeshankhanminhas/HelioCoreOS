# Sprint 5 — Governed System Design

## Objective

Convert an approved Structured Site Survey into a controlled Solar PV and battery design record that engineering, procurement and delivery can trust.

## Governance contract

A System Design cannot begin until:

1. the Opportunity has a governed Site;
2. the Site Survey belongs to the same Organisation, Opportunity and Site;
3. the Site Survey status is `approved`.

Lifecycle:

`Draft → In Progress → Under Review → Approved`

An `Under Review` design may be rejected and returned to `In Progress`. An approved revision is locked. Future changes must be issued as a new revision rather than silently overwriting approved engineering.

## Controlled design content

- design basis and survey inheritance;
- module manufacturer, model, rating and quantity;
- calculated or confirmed array capacity;
- inverter manufacturer, model, quantity and capacity;
- automatic DC/AC ratio calculation;
- string and MPPT configuration;
- mounting system;
- battery equipment, quantity and usable capacity;
- annual generation, specific yield and performance ratio;
- export limitation and grid application control;
- single-line diagram;
- array layout drawing;
- structural calculations;
- generation report;
- assumptions, constraints and review note.

## Review gates

Submission for review and approval requires:

- complete PV module specification;
- complete inverter specification;
- array capacity;
- string configuration;
- mounting system;
- annual generation estimate;
- design basis and assumptions;
- single-line diagram URL;
- layout drawing URL;
- grid application reference when grid approval is required.

Approval is only permitted from `under_review`.

## Data integrity

The `commit_system_design` PostgreSQL RPC performs the design write and audit event in one transaction. A failure in either operation retains no partial workflow state.

Tenant isolation is enforced through RLS and explicit Organisation matching. Opportunity, Site and Survey relationships are revalidated server-side and again inside the database function.

## HelioCalc integration boundary

The existing System Design module is the governed engineering workspace, not the final calculation authority.

The future calculation authority is the Python-based [HelioCalc Engineering Engine](../HELIOCALC-ENGINE.md).

The intended evolution is:

```text
Approved Site Survey
→ Engineering Scenario
→ Governed Equipment Selection
→ HelioCalc Calculation
→ Engineering Findings
→ Design Review
→ Approved Design Revision
→ BOM
```

### Current-state interpretation

The current System Design implementation contains a mixture of:

- governed user inputs;
- equipment selections;
- simple derived values such as array capacity and DC/AC ratio;
- manually confirmed engineering values;
- evidence/document references.

These fields remain valid as the governed design record, but they must not be mistaken for the finished engineering engine.

As HelioCalc calculation domains become authoritative:

1. manufacturer/model text should resolve to governed equipment-data revision IDs;
2. datasheet-backed electrical limits should be loaded from the equipment catalogue rather than re-keyed per design;
3. derived values should be calculated by HelioCalc rather than independently typed;
4. machine-readable warnings and blocking findings should be persisted with the design revision;
5. user overrides should be explicit, reasoned and auditable;
6. an approved calculation must be frozen with its engine version, rule profile and equipment-data revisions;
7. recalculation after any material input, datasheet, rule or engine change must create a new revision rather than alter the approved result.

### Engineering scenarios

System Design should support multiple governed scenarios before approval, including combinations such as:

- PV only;
- PV + BESS;
- PV + BESS + generator;
- alternate module or inverter selection;
- alternate battery duration;
- export-limited or zero-export configurations.

Only one explicitly selected and approved scenario may become the technical source for downstream BOM and procurement.

### Calculation gates

When the relevant HelioCalc domains are implemented, design review must be blocked when unresolved `BLOCKING` findings exist, including examples such as:

- cold-condition PV string Voc above inverter maximum DC voltage;
- hot-condition string voltage outside the permitted MPPT operating range;
- MPPT/input current above equipment limits;
- invalid equipment compatibility;
- missing required verified datasheet parameters;
- failed energy-balance validation in time-series simulation where simulation is required by the scenario.

A warning may permit review if the governing rule allows it, but the warning and any accepted engineering rationale must remain attached to the revision.

## Runtime validation matrix

- draft save with partial information;
- blocked start without a Site;
- blocked start without an approved Site Survey;
- blocked cross-Site or cross-Opportunity Survey relationship;
- automatic array-capacity calculation;
- automatic DC/AC-ratio calculation;
- rejected decimal equipment quantities;
- blocked review when required engineering fields are incomplete;
- blocked grid-controlled review without application reference;
- approved only from `under_review`;
- rejection and rework path;
- approved-revision locking;
- forced RPC failure with zero partial persistence;
- tenant-isolation proof;
- desktop, mobile and keyboard review.

Future HelioCalc validation must extend this matrix with known-answer engineering cases, equipment-limit boundary cases, invalid configurations, reproducibility checks and regression tests.

## Migration

`supabase/migrations/202607300200_governed_system_design.sql`

## Downstream handover

An approved design becomes the governed technical source for Sprint 6: BOM and Procurement. Procurement must consume equipment identities and quantities from the approved revision rather than re-keying uncontrolled values.

When HelioCalc is implemented, the approved design must also carry the selected calculation revision and equipment-data revisions so the BOM is traceable back to the exact engineering basis that produced it.
