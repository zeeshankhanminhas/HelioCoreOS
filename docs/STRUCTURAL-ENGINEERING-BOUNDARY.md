# HelioCoreOS Structural Engineering Boundary

Status: Governing Solar EPC Project Addition  
Applies to: Site Survey, Engineering, Drawing Jobs, mounting systems, roof/ground-mount design, approvals and evidence  
Related: [Drawing Authoring Integration](./DRAWING-AUTHORING-INTEGRATION.md), [Engineering Accuracy and Validation](./ENGINEERING-ACCURACY-VALIDATION.md)

## 1. Decision

HelioCoreOS must distinguish physical layout from structural engineering.

SketchUp/Skelion can show where modules, rails and structures are arranged. That geometry does **not** by itself prove structural adequacy.

The governing rule is:

> **A physically drawable PV layout is not automatically a structurally acceptable PV design.**

## 2. HelioCoreOS responsibility

HelioCoreOS governs the structural evidence workflow and relationship to the active Engineering Scenario.

It may store and reason over structured inputs such as:

- roof/building type;
- roof material;
- support spacing where surveyed;
- roof condition;
- module/mounting dead load;
- ballast quantity;
- mounting-system identity/revision;
- known design wind/snow/environmental inputs;
- structural restrictions;
- exclusion zones;
- engineer notes;
- structural-calculation evidence;
- approval status.

It must preserve which structural evidence applies to which drawing/design revision.

## 3. What HelioCoreOS must not imply

Unless a structural calculation domain has been separately implemented, benchmarked and authorised, HelioCoreOS must not claim that it has independently proven:

- roof load capacity;
- member strength;
- anchor pull-out capacity;
- wind uplift resistance;
- ballast adequacy;
- foundation adequacy;
- frame/member deflection;
- seismic adequacy;
- structural code compliance.

These require an appropriate structural method, validated calculation capability and/or competent professional evidence.

## 4. Structural evidence classes

A Project/Scenario may carry one or more of:

```text
Survey observation
Manufacturer mounting-system evidence
Third-party structural calculation
Structural engineer approval
Authority/client requirement
Assumption / pending verification
```

Each evidence item must have revision, source, date and status.

## 5. Structural readiness states

Recommended workflow state:

```text
NOT_ASSESSED
→ INPUTS_INCOMPLETE
→ ASSESSMENT_REQUIRED
→ UNDER_STRUCTURAL_REVIEW
→ ACCEPTABLE_WITH_CONDITIONS
→ ACCEPTED
→ REJECTED
→ SUPERSEDED
```

A project may not proceed through a configured structural gate while a required structural review is unresolved.

## 6. Drawing reconciliation

A drawing revision can invalidate structural evidence.

Examples:

- module quantity changes;
- ballast changes;
- array moves to another roof zone;
- mounting system changes;
- module dimensions/weight change;
- row spacing changes;
- new penetrations/anchors are introduced.

Such changes must mark affected structural evidence stale where the dependency exists.

## 7. Mounting-system catalogue

The equipment/data catalogue should eventually support mounting-system records with controlled manufacturer evidence such as:

- product family/model;
- roof/ground application;
- component identities;
- compatible module constraints;
- rail/span constraints where provided;
- fixing/anchor options;
- ballast methodology reference;
- installation constraints;
- manufacturer design-tool/report reference;
- document revision.

Manufacturer evidence is not a substitute for project-specific structural approval where one is required.

## 8. Ground-mount boundary

Ground-mount projects add further structural/civil inputs including:

- terrain/slope;
- soil/geotechnical information;
- foundation type;
- pile/anchor/foundation design;
- drainage/access constraints;
- wind exposure;
- table geometry.

HelioCoreOS should govern these inputs and documents before attempting to calculate them automatically.

## 9. Future structural calculation service

If structural calculations are later brought into HelioCoreOS, they should become a separately validated engineering domain with:

- explicit method/code profile;
- units and load combinations;
- equipment/material revision data;
- independent benchmark cases;
- scope limitations;
- professional review requirements;
- calculation provenance.

It must not be hidden inside the generic PV calculation engine as undocumented arithmetic.

## 10. Project decision

> **SketchUp proves arrangement. Structural evidence proves adequacy. HelioCoreOS governs the relationship between the two.**
