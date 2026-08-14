# HelioCalc Engineering Engine

Status: Planned Project Addition  
Parent product: HelioCoreOS Solar EPC Profile  
Primary domain: Engineering  
Execution boundary: Python calculation service  
Governance references: CORE-DATA-001, CORE-STATE-001, CORE-DOC-001, CORE-DOC-002, CORE-APP-001, CORE-AUDIT-001, CORE-FAIL-001, CORE-REL-001

## 1. Purpose

HelioCalc is the engineering calculation authority beneath HelioCoreOS.

HelioCoreOS governs customers, sites, opportunities, surveys, approvals, engineering revisions, procurement, delivery and audit history. HelioCalc performs deterministic Solar PV, BESS and electrical calculations using governed project inputs and governed equipment technical data.

HelioCalc must not become a second operating system. It is a domain service used by HelioCoreOS Engineering.

The architectural separation is:

```text
HelioCoreOS
Next.js + Supabase

Customer / Site / Opportunity / Survey
        ↓
Governed Engineering Scenario
        ↓
Released Equipment Data + active rule/context revisions
        ↓
HelioCalc API
Python calculation service
        ↓
Sizing + electrical checks + simulation + guardrails
        ↓
Calculation Result + Findings + Evidence
        ↓
Structural / Grid / Drawing reconciliation as applicable
        ↓
Governed Engineering Revision
        ↓
BOM / Quote / Procurement / Delivery / Commissioning
```

## 2. Product principle

A Solar EPC design must not be reduced to manually entered equipment names and headline capacities.

Where a calculation can be derived from controlled inputs and manufacturer technical data, HelioCoreOS should calculate it, validate it and preserve the calculation basis.

A user may override a calculated recommendation only when the workflow explicitly permits an engineering override. An override must record the previous value, replacement value, actor, reason and approval status.

A calculation domain becomes authoritative only after it satisfies the applicable release and benchmark gates in:

- [Engineering Accuracy and Validation](./ENGINEERING-ACCURACY-VALIDATION.md)
- [Test and Validation Strategy](./TEST-VALIDATION-STRATEGY.md)

## 3. Equipment technical-data catalogue

HelioCalc depends on a governed equipment catalogue backed by manufacturer evidence.

The source-to-release workflow is defined in [Equipment Data Verification](./EQUIPMENT-DATA-VERIFICATION.md).

Each equipment record must carry:

- manufacturer;
- model;
- equipment type;
- source datasheet reference;
- datasheet revision or publication date where available;
- technical-data extraction status;
- verification status;
- release status;
- effective-from and superseded dates where applicable;
- structured technical parameters;
- original datasheet file or controlled link;
- provenance and reviewer.

Technical values must not be silently replaced when a manufacturer publishes a revised product. A new governed equipment-data revision must be created so historical engineering calculations remain reproducible.

### 3.1 PV module parameters

The catalogue should support at minimum:

- rated maximum power (Pmax);
- open-circuit voltage (Voc);
- maximum-power voltage (Vmp);
- short-circuit current (Isc);
- maximum-power current (Imp);
- module efficiency;
- Voc temperature coefficient;
- Isc temperature coefficient;
- Pmax temperature coefficient;
- NMOT / NOCT where supplied;
- maximum system voltage;
- maximum series fuse rating;
- dimensions;
- weight;
- bifacial properties where applicable.

### 3.2 Inverter parameters

The catalogue should support at minimum:

- rated AC output;
- maximum apparent power;
- maximum recommended DC power where supplied;
- maximum DC input voltage;
- startup voltage;
- MPPT operating-voltage range;
- nominal DC voltage;
- number of MPPTs;
- allowed strings per MPPT;
- maximum current per MPPT/input;
- maximum short-circuit current per MPPT/input;
- efficiency data;
- AC voltage and phase;
- power-factor capability;
- export-control capability;
- supported battery interfaces where relevant.

### 3.3 BESS parameters

The catalogue should support at minimum:

- nominal energy;
- usable energy;
- nominal voltage;
- operating-voltage range;
- usable depth of discharge;
- maximum continuous charge power;
- maximum continuous discharge power;
- peak power and permitted duration where supplied;
- round-trip efficiency;
- cycle-life reference conditions;
- operating-temperature range;
- compatible inverter / PCS relationships;
- rack, module and parallelisation constraints;
- warranty-relevant operating limits where available.

## 4. Calculation domains

HelioCalc should be implemented as independently testable calculation domains rather than one large calculation function.

Proposed Python package boundary:

```text
heliocalc/
├── api/
├── models/
├── equipment/
├── pv/
│   ├── capacity.py
│   ├── strings.py
│   ├── temperature.py
│   ├── inverter.py
│   └── yield.py
├── electrical/
│   ├── cable.py
│   ├── voltage_drop.py
│   ├── current.py
│   └── protection.py
├── bess/
│   ├── sizing.py
│   ├── dispatch.py
│   ├── soc.py
│   └── degradation.py
├── simulation/
│   ├── timeseries.py
│   ├── load.py
│   ├── grid.py
│   └── losses.py
├── economics/
├── validation/
└── tests/
```

The package structure may evolve, but the separation between engineering domains and the HelioCoreOS application must remain clear.

Structural calculations are **not** implicitly part of the generic PV engine. The current boundary is governed by [Structural Engineering Boundary](./STRUCTURAL-ENGINEERING-BOUNDARY.md). If structural calculation capability is later implemented, it requires its own method/profile, benchmark scope and authority gate.

Grid/authority approval is also not calculated into existence by HelioCalc. Grid technical constraints are supplied through the governed [Grid and Interconnection Architecture](./GRID-INTERCONNECTION-ARCHITECTURE.md).

## 5. Core PV calculations

### 5.1 Array capacity

```text
DC array capacity = module Pmax × module quantity
```

The platform may calculate this automatically from the governed module specification and quantity. A manually entered array capacity should be treated as a confirmed or overridden value, not as the untraceable source of truth.

### 5.2 Temperature-corrected open-circuit voltage

A string-voltage check must account for minimum design temperature.

Conceptually:

```text
Voc_cold = Voc_STC × [1 + βVoc × (Tmin − 25°C)]
String Voc_cold = Voc_cold × modules_in_series
```

The exact coefficient convention and unit conversion must be normalised by the equipment-data layer before calculation.

A proposed string must not be accepted when its calculated cold open-circuit voltage exceeds the inverter maximum DC input voltage or another governed design limit.

### 5.3 Hot-condition MPPT validation

The engine must also test whether the operating voltage at the chosen high-temperature design condition remains inside the inverter MPPT operating range.

A configuration can therefore be electrically safe at cold Voc while still being unsuitable because hot Vmp falls outside an effective MPPT range.

### 5.4 String current and MPPT loading

The engine should validate:

- string operating current;
- string short-circuit current;
- parallel-string current;
- inverter input-current limits;
- inverter short-circuit-current limits;
- MPPT allocation;
- unequal-string or unsupported MPPT configurations.

### 5.5 DC/AC ratio

DC/AC ratio must be calculated from governed equipment quantities and capacities rather than independently typed.

The ratio should be presented with configurable project or organisational guardrails, because acceptable oversizing depends on technology, climate, grid limits and design intent.

## 6. Electrical calculations

HelioCalc should eventually provide controlled calculations for:

- design current;
- cable sizing;
- conductor ampacity checks;
- voltage drop;
- grouping and environmental derating inputs;
- protective-device coordination inputs;
- earthing-related design inputs where in scope;
- AC feeder sizing;
- DC cable sizing;
- inverter-to-panel and panel-to-interconnection feeder checks.

Electrical calculations must expose the assumptions and rule set used. A calculated pass/fail result without its engineering basis is insufficient for governed design.

Country-, utility- or standards-specific constraints must be represented as explicit rule profiles rather than hard-coded undocumented constants.

## 7. BESS sizing and dispatch

The BESS layer should progress beyond a manually entered battery-capacity field.

It should support scenario-based sizing from combinations of:

- site load profile;
- PV generation profile;
- desired backup duration;
- critical load;
- demand-peak target;
- permitted grid import/export;
- charge/discharge power limits;
- state-of-charge reserve;
- battery efficiency;
- degradation assumptions;
- tariff periods;
- generator interaction where applicable.

The engine should distinguish energy sizing (kWh) from power sizing (kW).

## 8. Time-series simulation

The long-term engineering target is time-series modelling rather than a single annual-energy figure.

Supported simulation resolutions may include:

- hourly: 8,760 intervals for a normal year;
- 15-minute: 35,040 intervals for a normal year;
- other resolutions when a governed source dataset requires them.

A simulation interval may model:

```text
PV generation
− site load
± battery charge/discharge
± grid import/export
− curtailment
− conversion and system losses
= balanced interval energy
```

The engine must include energy-balance validation. A simulation that creates or destroys unexplained energy must fail validation rather than producing a plausible-looking dashboard.

## 9. Performance modelling

HelioCalc may use appropriate scientific Python libraries for validated subproblems, including technologies such as NumPy, Pandas, SciPy and pvlib.

Library adoption does not replace HelioCoreOS governance. Inputs, library/model version, assumptions and outputs must remain reproducible.

Target outputs may include:

- plane-of-array irradiance;
- expected PV generation;
- specific yield;
- performance ratio;
- clipping;
- temperature losses;
- conversion losses;
- curtailment;
- self-consumption;
- self-sufficiency;
- grid import/export;
- BESS throughput;
- state-of-charge profile;
- peak-demand reduction;
- generator runtime where applicable.

## 10. Guardrail engine

HelioCalc should return machine-readable engineering findings, not only numbers.

Each finding should include:

- code;
- severity;
- domain;
- affected component or calculation;
- rule tested;
- actual value;
- allowed or recommended boundary;
- message;
- remediation hint where appropriate;
- source rule or equipment-data reference.

Suggested severity classes:

```text
INFO
ADVISORY
WARNING
BLOCKING
```

Examples:

```text
BLOCKING — PV_STRING_VOC_MAX
Cold-condition string Voc exceeds inverter maximum DC input voltage.

WARNING — PV_MPPT_LOW_MARGIN
Hot-condition string Vmp is within the MPPT range but below the configured design margin.

BLOCKING — MPPT_INPUT_CURRENT
Parallel-string short-circuit current exceeds the permitted inverter input-current limit.
```

A blocking finding must prevent the corresponding engineering state transition unless a formally authorised override route exists.

## 11. Scenario model

Engineering should support multiple governed scenarios before approval.

Examples:

- PV only;
- PV + BESS;
- PV + BESS + generator;
- alternate inverter;
- alternate module;
- alternate battery duration;
- export-limited and zero-export arrangements.

A scenario contains its own:

- equipment-data revisions;
- engineering inputs;
- active Site Survey/design-basis revision;
- active Grid Connection revision where applicable;
- structural evidence/readiness dependencies where applicable;
- calculation result;
- warnings and blockers;
- performance result;
- commercial assumptions where relevant;
- calculation timestamp;
- engine version.

Only an explicitly selected and approved scenario may become the technical source for downstream BOM and procurement.

## 12. Calculation result contract

HelioCalc should return structured results rather than presentation-ready HTML.

Conceptual response:

```json
{
  "engine_version": "...",
  "scenario_id": "...",
  "status": "valid_with_warnings",
  "inputs_fingerprint": "...",
  "equipment_revisions": [],
  "rule_profile_revisions": [],
  "results": {},
  "findings": [],
  "assumptions": [],
  "calculated_at": "..."
}
```

The API contract must be versioned. A later engine release must not silently reinterpret a historical approved design.

## 13. Reproducibility and auditability

Every persisted calculation revision must retain enough information to reproduce the result.

At minimum record:

- engine version;
- domain validation-state/version;
- rule-profile version;
- equipment-data revision IDs;
- site/survey revision used;
- grid/interconnection revision used where applicable;
- user-entered inputs;
- derived inputs;
- overrides;
- weather or load dataset identity where used;
- timestep and simulation period;
- calculation timestamp;
- result fingerprint or hash;
- warnings and blockers;
- approval decision.

An approved calculation must never be destructively recalculated in place. Recalculation after an input, equipment, rule or engine change creates a new revision.

## 14. Relationship to System Design

The existing HelioCoreOS System Design module remains the governed engineering workspace.

HelioCalc does not replace it.

System Design should evolve into the orchestration and approval surface for:

```text
Approved Site Survey
→ Engineering Scenario
→ Released Equipment Selection
→ HelioCalc Calculation
→ Engineering Findings
→ Structural / Grid / Drawing evidence as applicable
→ Design Review
→ Approved Design Revision
→ BOM
```

The current manual or semi-calculated fields are therefore transitional inputs. As HelioCalc domains become authoritative, duplicated manually entered derived values should be removed or clearly identified as overrides.

## 15. Relationship to BOM and procurement

The approved engineering revision is the only permitted technical source for an approved BOM.

The BOM generator should consume:

- approved equipment identities and revisions;
- quantities;
- string/MPPT topology;
- BESS configuration;
- cable and protection outputs where implemented;
- mounting or balance-of-system rules;
- approved engineering accessories and allowances.

Procurement may enrich the BOM with supplier, stock, lead time and price data, but must not silently change the engineering specification.

## 16. Service architecture

The intended runtime boundary is:

```text
HelioCoreOS web application
Next.js / TypeScript
        ↓
Supabase governed records
        ↓
Authenticated server-side request
        ↓
HelioCalc
Python + FastAPI
        ↓
Scientific / domain calculation modules
        ↓
Structured calculation response
        ↓
Supabase calculation revision + audit event
```

The browser must not hold privileged HelioCalc service credentials.

Calculation requests should be initiated through a controlled server-side boundary with organisation, user, scenario and revision context.

## 17. Build programme

HelioCalc should be built incrementally and proven with tests before expanding UI complexity.

### Phase H1 — Equipment data foundation

- equipment taxonomy;
- datasheet registry;
- technical parameter schemas;
- source extraction/normalisation workflow;
- equipment-data revisions;
- verification/release workflow;
- initial Pakistan-relevant module, inverter and BESS sample catalogue.

### Phase H2 — PV electrical core

- array capacity;
- temperature-adjusted Voc/Vmp;
- string sizing;
- MPPT allocation;
- current checks;
- inverter sizing;
- DC/AC ratio;
- machine-readable guardrails;
- deterministic unit-test reference cases;
- independent benchmark pack.

### Phase H3 — Cable and electrical design

- DC/AC design current;
- cable sizing framework;
- voltage drop;
- derating inputs;
- protective-device inputs;
- rule profiles and evidence;
- independent benchmark pack.

### Phase H4 — BESS core

- usable-energy sizing;
- charge/discharge power sizing;
- SOC constraints;
- critical-load/backup-duration sizing;
- equipment compatibility checks;
- validation fixtures for supported scope.

### Phase H5 — Time-series performance engine

- weather inputs;
- load profiles;
- PV generation;
- BESS dispatch;
- grid interaction;
- losses;
- energy-balance proof;
- scenario comparison;
- reference/model validation.

### Phase H6 — Governed BOM generation

- approved design to BOM;
- equipment and balance-of-system quantities;
- revision traceability;
- engineering-versus-commercial separation;
- Engineering Revision ↔ BOM reconciliation.

### Phase H7 — Production hardening

- API versioning;
- performance testing;
- calculation observability;
- deterministic regression suite;
- cross-system reconciliation tests;
- failure recovery;
- security review;
- deployment and rollback strategy.

## 18. Quality gates

A HelioCalc calculation domain is not considered production-ready because it produces numerically plausible output.

Each domain must have:

- documented equations and assumptions;
- units explicitly defined;
- input validation;
- boundary tests;
- known-answer tests;
- invalid-configuration tests;
- regression tests;
- deterministic behaviour for identical governed inputs;
- tolerance rules for floating-point comparisons;
- machine-readable findings;
- failure behaviour;
- audit integration;
- engineering review against independently calculated reference cases;
- declared validation state and scope.

## 19. Non-goals

HelioCalc is not intended to:

- replace professional engineering judgement;
- infer missing manufacturer limits without evidence;
- hide design assumptions;
- silently optimise to a commercially preferred answer;
- allow procurement to rewrite approved engineering;
- present uncertain or estimated data as verified datasheet facts;
- produce an approved design when blocking engineering checks remain unresolved;
- claim structural adequacy because a SketchUp layout fits;
- claim grid/authority acceptance because a calculation passes.

## 20. Architectural decision

HelioCoreOS remains the governed Solar EPC operating system.

HelioCalc becomes the deterministic Python engineering engine beneath its Engineering domain.

The separation is intentional:

> **HelioCoreOS governs the work. HelioCalc calculates the system. Validation earns authority. External structural/grid evidence constrains what may be approved.**

This boundary should be treated as the default architecture for future Solar PV, BESS, electrical sizing, simulation, validation and automatic BOM work.
