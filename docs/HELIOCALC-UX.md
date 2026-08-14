# HelioCalc Engineering Cockpit UX

Status: Governing Project Addition UX specification  
Parent product: HelioCoreOS Solar EPC Profile  
Parent UX: [HelioCoreOS UX Constitution](./UX-CONSTITUTION.md)  
Engineering architecture: [HelioCalc Engineering Engine](./HELIOCALC-ENGINE.md)

## 1. Purpose

HelioCalc must not surface as a long technical form with a Calculate button.

Its user interface is an engineering cockpit inside HelioCoreOS: a controlled workspace where an engineer can understand the site basis, choose verified equipment, configure a system, see calculated consequences immediately, compare scenarios, resolve engineering findings, review evidence, and approve a reproducible design revision.

The interface is part of engineering control. A correct calculation hidden behind poor interaction is not sufficient.

The cockpit must make five things continuously obvious:

1. what is being designed;
2. which inputs and equipment revisions are authoritative;
3. what HelioCalc calculated;
4. which findings block or weaken the design;
5. what action is permitted next.

## 2. Product experience

HelioCalc should feel like professional engineering software without inheriting the visual complexity of legacy CAD or ERP systems.

Target character:

- Apple-like clarity;
- The Ordinary-like restraint;
- industrial and electrical precision;
- dense enough for serious engineering;
- calm enough for sustained use;
- evidence-first rather than decoration-first;
- workflow-aware rather than dashboard-led.

Avoid:

- generic KPI-card dashboards;
- one giant data-entry form;
- dozens of coloured pills;
- decorative charts without an engineering decision attached;
- modal-heavy workflows;
- hidden calculation assumptions;
- auto-generated recommendations without traceable evidence;
- diagrams used as decoration.

## 3. Engineering workspace hierarchy

HelioCalc sits inside a governed Engineering record, not as a separate application.

Recommended hierarchy:

```text
Opportunity / Project
└── Engineering
    ├── Design Basis
    ├── Scenarios
    │   ├── Scenario A — PV only
    │   ├── Scenario B — PV + BESS
    │   └── Scenario C — Alternate equipment
    ├── Electrical Design
    ├── Performance
    ├── Findings
    ├── Documents & Evidence
    └── Review & Approval
```

The engineer should be able to move between these surfaces without losing the active Scenario, selected equipment, scroll position, filters, or unsaved draft state.

## 4. Primary cockpit composition

Desktop should use a three-zone composition rather than a page of stacked cards.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Breadcrumb · Project · Engineering · Scenario B                         │
│ Design title / revision / state                    [Run calculation]     │
├───────────────┬──────────────────────────────────────┬───────────────────┤
│ DESIGN RAIL   │ ACTIVE WORKSPACE                     │ ENGINEERING RAIL  │
│               │                                      │                   │
│ Basis         │ Equipment / Strings / BESS / Cable  │ Result summary    │
│ Equipment     │ or Performance workspace            │ Findings          │
│ Strings       │                                      │ Margins           │
│ Electrical    │ Contextual technical tables         │ Evidence          │
│ BESS          │ and controlled editors              │ Next action       │
│ Performance   │                                      │                   │
│ Outputs       │                                      │                   │
├───────────────┴──────────────────────────────────────┴───────────────────┤
│ Revision / calculation provenance / save state / engine version         │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Design rail

The left rail is not global navigation. It is the local engineering structure for the active Scenario.

It should show:

- section name;
- completion state;
- unresolved blocking count where relevant;
- selected/active state;
- keyboard-accessible navigation.

It must remain compact and avoid oversized stepper styling.

### 4.2 Active workspace

The centre is where engineering work happens.

It should prioritise structured editors, technical tables, equipment selection, topology configuration, simulation views and evidence.

The centre must not be constrained into small dashboard cards. Engineering data often benefits from width.

### 4.3 Engineering rail

The right rail is persistent decision support.

It should show, contextually:

- calculated headline result;
- most important design margin;
- current warnings/blockers;
- rule or datasheet evidence;
- calculation state;
- permitted next action.

Selecting a finding should focus or scroll the central workspace to the affected input or component.

The right rail may collapse into a Sheet on smaller screens.

## 5. Scenario cockpit

Scenario comparison is a first-class interaction, not a report generated at the end.

Each Scenario should show:

- scenario name and purpose;
- state: Draft / Calculated / Needs Attention / Ready for Review / Approved / Superseded;
- equipment revision set;
- PV capacity;
- inverter capacity and DC/AC ratio;
- BESS power and energy where applicable;
- annual generation;
- self-consumption / self-sufficiency where modelled;
- blocking and warning counts;
- calculation revision and engine version.

Scenario actions:

- Duplicate scenario;
- Rename;
- Recalculate;
- Compare;
- Submit for review;
- Archive draft;
- Select as preferred design;
- Create new governed revision after approval.

Approved scenarios must be visually distinct through state and locking behaviour, not through excessive colour.

## 6. Equipment selection and datasheet UX

Equipment selection must come from governed catalogue records rather than free-text manufacturer/model fields once HelioCalc equipment data is authoritative.

### 6.1 Equipment picker

Use a searchable combobox or command-style picker with:

- manufacturer;
- model;
- key rating;
- verification state;
- datasheet revision;
- compatibility signal where known.

The engineer should be able to filter by technical constraints such as:

- module power range;
- inverter AC rating;
- max DC voltage;
- MPPT count;
- battery usable capacity;
- phase;
- approved/verified status.

### 6.2 Datasheet evidence sheet

Selecting the equipment identity or evidence action should open a side sheet, preserving the engineering workspace.

The sheet should show:

```text
Manufacturer / Model
Verification state
Datasheet revision / date
Source file
Reviewed by / reviewed at

ELECTRICAL
Pmax
Voc
Vmp
Isc
Imp
Temperature coefficients
System voltage
Fuse rating

PHYSICAL / ENVIRONMENTAL
Dimensions
Weight
Operating limits

[Open governed datasheet] [View revision history]
```

A technical value used by a calculation should be traceable back to this evidence without navigating away from the Scenario.

### 6.3 Unverified data

Unverified, estimated or manually entered technical data must be visually and semantically distinct from verified manufacturer data.

The UI must never imply that an inferred value came from a manufacturer datasheet.

## 7. PV array and string workspace

String design should be represented as a structured engineering editor rather than a textarea.

Recommended table:

```text
Array / MPPT | Strings | Modules/String | Voc cold | Vmp hot | Isc design | Result
MPPT 1       | 2       | 14             | 842 V    | 512 V   | 28.4 A     | PASS
MPPT 2       | 2       | 14             | 842 V    | 512 V   | 28.4 A     | PASS
MPPT 3       | 1       | 12             | 722 V    | 439 V   | 14.2 A     | WARNING
```

The interface should show margin, not only pass/fail.

Example:

```text
Cold Voc margin
842 V / 1,000 V maximum
158 V remaining · 15.8% margin
```

Changing modules-per-string should immediately mark the current calculation as stale and, where performance permits, offer a recalculation without pretending the old result remains current.

## 8. Guardrail interaction model

Findings are an engineering navigation system.

Severity order:

1. BLOCKING
2. WARNING
3. ADVISORY
4. INFO

Each finding should display:

- concise engineering statement;
- affected equipment/string/cable/scenario;
- actual value;
- required or recommended boundary;
- engineering margin;
- source rule or datasheet revision;
- recommended remediation;
- override availability and authority where applicable.

Example:

```text
BLOCKING
String 2 cold Voc exceeds inverter maximum DC input voltage.

Calculated       1,028 V
Inverter limit   1,000 V
Excess           28 V

Source: INV-0042 rev 3 · Max DC input voltage

[Go to string]  [View evidence]
```

A blocking finding must not be reducible to a tiny red badge.

## 9. Calculation states

The UI must distinguish at least:

- Not calculated;
- Calculating;
- Calculated and valid;
- Valid with warnings;
- Blocking findings;
- Stale — inputs changed since calculation;
- Failed — no valid result persisted;
- Approved and locked;
- Superseded.

Stale results must never look current.

When a user changes an input that affects the calculation, the UI should preserve the prior result for reference but clearly mark it as no longer authoritative until recalculated.

## 10. Calculation action

`Run calculation` is a consequential technical action but not an approval.

The button should communicate:

- whether calculation is currently required;
- which Scenario will be calculated;
- whether inputs are complete enough;
- whether an existing result will become historical.

Do not use a confirmation dialog for routine recalculation unless a governed consequence requires it.

Calculation progress should be contextual and preserve the workspace.

For longer simulations, show stages such as:

```text
Validating inputs
Resolving equipment revisions
Running PV model
Running BESS dispatch
Validating energy balance
Persisting result
```

The UI must not display success until the governed result and audit event are persisted successfully.

## 11. Performance workspace

Performance should be decision-oriented.

The first view should answer:

- How much energy is generated?
- How much is used on site?
- How much is imported/exported?
- What is curtailed?
- How does the battery operate?
- What constraint is limiting the system?

Recommended views include:

- annual energy summary;
- monthly generation/load comparison;
- representative daily profiles;
- battery SOC profile;
- grid import/export;
- clipping and curtailment;
- loss breakdown;
- peak-demand comparison.

Charts should have an engineering question attached. Do not add visualisations simply because time-series data exists.

Every chart must expose the underlying units and allow access to the source calculation or data table.

## 12. BESS workspace

Separate energy and power decisions visibly.

The engineer should see:

```text
Usable energy        200 kWh
Continuous power      80 kW
Reserve SOC           20%
Backup critical load  42 kW
Calculated autonomy   3.1 h
```

The interface should make it difficult to confuse kW and kWh.

Where a target drives sizing, show the relationship:

```text
Target: 4 h backup at 42 kW critical load
Required usable energy before losses: 168 kWh
Selected usable energy: 200 kWh
Result: PASS · 19% energy margin
```

## 13. Cable and electrical workspace

Cable sizing should be a structured calculation table with evidence, not a collection of isolated inputs.

Suggested structure:

```text
Circuit | Design current | Cable | Derating | Capacity | V-drop | Protection | Result
DC S1   | 14.2 A         | 6 mm² | 0.87     | 47 A     | 0.8%   | 20 A       | PASS
AC INV1 | 72 A           | 25 mm²| 0.80     | 89 A     | 1.3%   | 80 A       | PASS
```

Opening a circuit should reveal:

- route / length;
- conductor material;
- installation method;
- ambient temperature;
- grouping factor;
- calculated current;
- correction factors;
- allowable capacity;
- voltage drop;
- protective-device basis;
- rule-profile references.

## 14. Design basis and inherited survey data

The engineer must be able to see what came from the approved Site Survey without re-entering it.

Inherited data should be labelled as such and linked to its source revision.

Example:

```text
Minimum design temperature   2°C
Source: Site Survey SUR-2026-014 rev 2

Recommended PV capacity      118 kWp
Source: Site Survey SUR-2026-014 rev 2
```

Editing governed inherited facts should not occur silently inside the Scenario. Corrections belong in an explicit amendment or override route depending on the data class.

## 15. Review mode

Review must be a distinct mode from editing.

A reviewer should see a compact decision surface containing:

- design basis;
- chosen equipment and revisions;
- main electrical margins;
- unresolved findings;
- overrides;
- performance summary;
- controlled drawings/reports;
- calculation provenance;
- changes since prior revision;
- reviewer notes.

The reviewer should not need to inspect every edit field to understand whether the design is safe to approve.

Approval is blocked while unresolved blocking findings exist unless the governance model contains an explicit authorised override route.

## 16. Revision comparison

When a calculation or design revision changes, HelioCoreOS should be able to explain the delta.

Examples:

```text
Module changed
Jinko 575 W rev 1 → Longi 590 W rev 2

Array capacity
115.0 kWp → 118.0 kWp

Cold Voc margin
12.4% → 8.7%

Annual generation
176.2 MWh → 181.4 MWh

New warning
PV_MPPT_LOW_MARGIN
```

Comparison should prioritise material engineering changes before raw field-by-field diffs.

## 17. Command and keyboard behaviour

The cockpit should support efficient professional use.

Potential commands:

- switch Scenario;
- search equipment;
- run calculation;
- open Findings;
- open datasheet evidence;
- compare scenarios;
- submit for review.

Keyboard accessibility remains mandatory. Command-palette behaviour may complement but never replace visible navigation and actions.

## 18. Responsive strategy

HelioCalc is desktop-first because detailed engineering work benefits from width, but responsive behaviour must remain intentional.

Tablet:

- collapse the right engineering rail into a persistent toggle or Sheet;
- keep the local Design rail compact;
- preserve full technical tables with controlled horizontal handling where necessary.

Mobile:

- prioritise inspection, findings, approvals, evidence and minor edits;
- do not pretend complex string topology or cable-table editing is equally efficient on a phone;
- convert the local Design rail to a structured navigation Sheet;
- present engineering tables as purpose-designed record summaries rather than squeezed desktop tables.

## 19. Shared components to build

Recommended reusable HelioCore components:

- `EngineeringCockpitShell`
- `ScenarioSwitcher`
- `EngineeringSectionRail`
- `CalculationState`
- `EngineeringFinding`
- `FindingRail`
- `EngineeringMargin`
- `EquipmentPicker`
- `DatasheetEvidenceSheet`
- `EquipmentRevisionBadge`
- `StringConfigurationTable`
- `MPPTAllocationTable`
- `CircuitSizingTable`
- `PerformanceSummary`
- `SimulationChartFrame`
- `CalculationProvenance`
- `RevisionComparison`
- `EngineeringReviewSummary`

These components must inherit the HelioCoreOS visual system. They must not become a separate dark-mode technical theme or a generic analytics library skin.

## 20. Migration from the current System Design screen

The current `SystemDesignGovernance` implementation is a transitional governed form.

It should not be expanded indefinitely by adding more fields.

Migration path:

### UX1 — Cockpit shell

- introduce Engineering workspace shell;
- local engineering section rail;
- calculation/finding rail;
- scenario header;
- preserve current System Design data underneath.

### UX2 — Governed equipment selection

- replace manufacturer/model free text with equipment catalogue pickers;
- add datasheet evidence Sheet;
- expose equipment revision and verification state.

### UX3 — PV electrical workspace

- replace string-configuration textarea with structured string/MPPT editor;
- surface cold Voc, hot Vmp, current and DC/AC ratio calculations;
- add finding-to-input navigation.

### UX4 — Scenario comparison

- scenario creation/duplication;
- side-by-side comparison;
- preferred Scenario selection;
- calculation-state and revision handling.

### UX5 — BESS / electrical / performance workspaces

- BESS sizing surface;
- circuit/cable sizing table;
- simulation and performance views;
- decision-oriented charts.

### UX6 — Engineering review

- dedicated review mode;
- revision comparison;
- override visibility;
- approval gate and calculation provenance.

## 21. UI quality gate

A HelioCalc capability is not complete because the calculation endpoint works.

Before a capability is considered complete, the UI must prove that an engineer can:

1. identify the active Scenario and revision;
2. identify the source of every authoritative equipment value;
3. distinguish input, inherited value, calculated value and override;
4. see whether the calculation is current or stale;
5. understand every blocking finding;
6. navigate directly from a finding to the affected design item;
7. inspect the rule/datasheet evidence behind a finding;
8. understand the engineering margin, not just pass/fail;
9. compare material changes between Scenarios or revisions;
10. understand the next permitted governed action;
11. complete the workflow with keyboard access;
12. recover without data loss when a calculation or save fails.

## 22. Product decision

The HelioCalc UI is a first-class engineering product surface.

The target is not:

> form → calculate → result

The target is:

> evidence → configure → calculate → inspect margins → resolve findings → compare → review → approve

The engineering cockpit is therefore part of the HelioCalc architecture, not a later visual-polish phase.
