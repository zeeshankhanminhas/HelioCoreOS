# HelioCoreOS Engineering Accuracy and Validation

Status: Governing Solar EPC Project Addition  
Applies to: HelioCalc, Engineering Scenarios, equipment data, Drawing Jobs, BOM, commissioning and engineering outputs  
Parent architecture: [HelioCalc Engineering Engine](./HELIOCALC-ENGINE.md)  
Drawing integration: [Drawing Authoring Integration](./DRAWING-AUTHORING-INTEGRATION.md)  
Document governance: [Document Suite Architecture](./DOCUMENT-SUITE-ARCHITECTURE.md)

## 1. Decision

Engineering accuracy in HelioCoreOS is a governed system property, not a final-stage manual check and not a generic percentage displayed beside a result.

The governing principle is:

> **No engineering number without a source, unit, reproducible input set, calculation or measurement basis, and revision identity.**

HelioCoreOS must make engineering results:

- traceable;
- reproducible;
- independently testable;
- explicit about assumptions;
- explicit about uncertainty where modelling is involved;
- protected from stale upstream data;
- reconciled across calculations, drawings, BOM and commissioning evidence;
- reviewable before approval;
- immutable once approved or issued.

The system must never imply that a plausible-looking result is proven merely because software produced it.

## 2. Accuracy is layered

HelioCoreOS uses seven accuracy layers:

```text
Controlled source data
        ↓
Deterministic calculation / governed model
        ↓
Rules, limits and design margins
        ↓
Independent benchmark validation
        ↓
Cross-workspace reconciliation
        ↓
Engineer review and approval
        ↓
Commissioning / measured feedback
```

A failure in an upstream layer must not be hidden by a downstream approval action.

## 3. Result classes

Engineering outputs must identify what kind of result they are. Different result classes require different validation behaviour.

### 3.1 Deterministic result

A value derived from controlled inputs by a defined calculation.

Examples:

- installed DC capacity;
- cold-condition string Voc;
- hot-condition Vmp;
- MPPT current;
- DC/AC ratio;
- cable voltage drop;
- battery usable-energy arithmetic;
- equipment quantity totals.

For identical governed inputs, rule profile and engine version, a deterministic result must be reproducible within the documented numerical tolerance.

### 3.2 Modelled result

A value produced by a scientific or engineering model whose result depends on assumptions, datasets or model selection.

Examples:

- annual generation;
- plane-of-array irradiance;
- module temperature;
- shading loss;
- battery dispatch;
- self-consumption;
- degradation;
- future grid import/export.

A modelled value must be labelled as modelled and preserve its dataset, model, assumptions, timestep and software/library versions.

### 3.3 Measured result

A value captured from field inspection, survey, test or commissioning.

Examples:

- measured open-circuit voltage;
- insulation resistance;
- measured cable length;
- site dimensions;
- commissioning readings;
- meter values.

A measured value must preserve the observation context where relevant, including date/time, instrument or method, environmental conditions, actor and evidence.

### 3.4 Declared / manufacturer value

A controlled value taken directly from an identified technical source.

Examples:

- module Voc;
- inverter maximum DC voltage;
- battery usable capacity;
- cable conductor data.

It must retain the exact equipment and source-document revision from which it was obtained.

### 3.5 Assumed or estimated value

A value used because authoritative information is not yet available.

It must be visibly identified as assumed/estimated and must never be presented as verified manufacturer, survey or measured evidence.

The workflow may prevent approval when an assumption affects a safety-critical or otherwise governed design decision.

## 4. Source quality model

Every input used by an authoritative engineering calculation should have a source-quality classification.

Recommended classifications:

```text
VERIFIED_MANUFACTURER
VERIFIED_SITE
VERIFIED_STANDARD_OR_RULE_PROFILE
GOVERNED_EXTERNAL_DATASET
CONFIRMED_MANUAL_INPUT
ASSUMED
UNVERIFIED
```

Source quality is metadata on the input, not a decorative badge.

A downstream calculation inherits relevant source-quality weaknesses. For example, a deterministic formula using an unverified temperature coefficient cannot be presented as fully verified simply because the formula itself is correct.

## 5. Governed equipment data

Manufacturer technical data is engineering source data.

Every equipment revision used by HelioCalc must preserve:

- manufacturer and model;
- equipment type;
- technical parameter values and units;
- source datasheet identity;
- datasheet revision or publication date where available;
- extraction/entry actor;
- verification actor and timestamp;
- verification status;
- supersession relationship;
- source file or controlled source reference.

Manufacturer data must never be silently updated in place.

A changed datasheet creates a new equipment-data revision. Historical calculations continue to reference the revision originally used.

## 6. Unit discipline

Units are part of the engineering value and must not be treated as presentation text.

HelioCalc must define canonical internal units or strongly typed quantity boundaries for each domain.

The system must:

- validate units at ingestion;
- normalise supported alternate units explicitly;
- reject incompatible dimensions;
- preserve the original declared unit where evidence requires it;
- show units in calculation evidence;
- prevent common power/energy confusion such as kW versus kWh;
- prevent implicit temperature-coefficient convention changes;
- prevent percentage/fraction ambiguity.

Conversion rules must be testable and version controlled.

## 7. Calculation provenance contract

Every persisted authoritative calculation revision must preserve enough data to reproduce the result.

At minimum:

```text
Scenario revision
Engine version
Calculation-domain version where applicable
Rule-profile version
Equipment-data revision IDs
Survey/site revision IDs
User-entered inputs
Derived inputs
Units
Overrides
Assumptions
External dataset identity and version
Model/library version where applicable
Simulation period and timestep where applicable
Calculated timestamp
Input fingerprint
Result fingerprint
Findings
Validation-suite compatibility state
```

A result without sufficient provenance is not eligible to become an approved engineering source.

## 8. Deterministic calculation rules

For deterministic domains, accuracy means more than receiving the expected answer for one normal case.

Each calculation must define:

- equation or algorithm;
- coefficient convention;
- input units;
- output units;
- permitted input range;
- invalid input behaviour;
- boundary behaviour;
- numerical tolerance;
- rule/standard source where applicable;
- reference test cases.

Identical authoritative inputs on the same engine and rule-profile versions must produce the same governed result within documented floating-point tolerance.

## 9. Model accuracy and uncertainty

Modelled outputs must not be presented with false precision.

A modelled result should identify:

- model name/type;
- weather or environmental dataset;
- load dataset where used;
- spatial/temporal resolution where relevant;
- timestep;
- loss assumptions;
- model/library version;
- exclusions;
- uncertainty or sensitivity information where the model supports a defensible estimate.

The interface should prefer language such as `Modelled annual generation` rather than implying the number is a guaranteed future measurement.

Displayed decimal precision must match the meaningful precision of the underlying model and source data.

## 10. Independent benchmark validation

HelioCalc must not validate itself only against its own implementation.

Each engineering domain requires an independent validation set built from one or more of:

- hand-calculated known-answer cases;
- independently implemented reference calculations;
- published reference examples where licensing permits use;
- controlled comparison against an established engineering/scientific implementation;
- approved historical engineering calculations whose inputs and expected outputs are known.

Benchmark fixtures must be stored as controlled test assets with clear provenance.

A benchmark dataset must never be generated solely by the same implementation being tested and then treated as independent proof.

## 11. Test classes

Every calculation domain should contain at least the following automated test classes before production authority is granted.

### Known-answer tests

Normal representative cases with independently established expected results.

### Boundary tests

Values at, immediately below and immediately above technical limits.

Examples:

- string Voc exactly at inverter maximum;
- MPPT voltage around operating boundaries;
- current at input limit;
- cable capacity at design current threshold.

### Invalid-configuration tests

The engine must reject or create blocking findings for impossible or prohibited configurations rather than returning a plausible number.

### Unit-conversion tests

Every supported unit conversion and coefficient convention must be tested.

### Regression tests

Previously validated results must remain stable unless a deliberately approved engine/rule change explains the delta.

### Property / invariant tests

Where appropriate, calculations should enforce domain invariants.

Examples:

- array capacity cannot be negative;
- battery SOC cannot exceed configured physical bounds;
- energy-balance residual must remain within defined tolerance;
- adding identical modules cannot reduce arithmetic nameplate DC capacity.

## 12. Numerical tolerances

Exact binary floating-point equality must not be confused with engineering equality.

Each domain must define explicit comparison tolerances appropriate to the quantity and algorithm.

Tolerance rules must specify whether they are:

- absolute;
- relative;
- both;
- engineering acceptance thresholds rather than numerical implementation tolerances.

A numerical tolerance must never be used to conceal a meaningful engineering exceedance.

For example, floating-point tolerance may handle representation noise around 1000.0000000 V, while a design-margin rule separately determines whether operating close to 1000 V is acceptable.

## 13. Limits, margins and recommendations

HelioCoreOS distinguishes three concepts:

### Hard limit

A manufacturer, physical, regulatory or governed rule boundary that must not be exceeded without an explicitly permitted governance route.

### Design margin

The remaining distance between the calculated design and a hard limit.

### Recommended region

A preferred engineering range that may be narrower than the hard limit.

A result can therefore be technically within a hard limit while still producing a warning because the design margin is too small.

Example presentation:

```text
Cold string Voc        947 V
Maximum DC voltage   1,000 V
Remaining margin        53 V
Margin                  5.3%
State                  WARNING — low configured design margin
```

Pass/fail alone is insufficient for serious engineering review.

## 14. Rule-profile governance

Country-, utility-, organisation- and standards-specific rules must be versioned as explicit rule profiles.

No safety-critical engineering constant should exist only as an undocumented literal in application code.

A rule profile must preserve:

- profile identity and version;
- jurisdiction/application scope;
- source/reference;
- effective date where relevant;
- parameter values;
- severity behaviour;
- override policy;
- reviewer/approval status.

Changing a rule profile does not rewrite historical approved calculations. It may mark active designs for recalculation/review when governance requires it.

## 15. Stale-state propagation

A result becomes stale when an authoritative upstream dependency changes.

Examples:

```text
Equipment revision changed       → affected calculations stale
Survey design temperature changed → string calculations stale
String topology changed          → PV electrical + related BOM stale
Rule profile changed             → affected validation stale
Weather dataset changed          → performance result stale
Drawing module count changed      → drawing reconciliation stale
```

Stale results may remain visible for comparison but must not appear current or authoritative.

The UI must clearly distinguish:

```text
CURRENT
STALE
RECALCULATION REQUIRED
FAILED
SUPERSEDED
APPROVED / LOCKED
```

Approval must not proceed using a stale authoritative calculation.

## 16. Calculation fingerprints

HelioCalc should calculate an input fingerprint from the authoritative input set, equipment revisions, rule profile and relevant dataset identities.

A persisted result should also have a result fingerprint.

Fingerprints support:

- stale detection;
- duplicate-calculation detection;
- reproducibility checks;
- audit investigation;
- confidence that an approved result corresponds to the recorded inputs.

Fingerprinting is an integrity mechanism, not a substitute for engineering validation.

## 17. Time-series energy-balance validation

Any PV/BESS/grid simulation must contain energy-balance checks.

For each interval, the engine must be able to account for energy flows according to the configured model, including generation, load, storage, imports, exports, curtailment and modelled losses.

The simulation must calculate and test the residual against a documented numerical tolerance.

A simulation that creates or destroys unexplained material energy must fail validation rather than returning charts and annual totals.

Aggregate annual/monthly totals must reconcile with interval data within documented tolerance.

## 18. Drawing reconciliation

SketchUp/Skelion/LayOut is the physical drawing-authoring environment, but the Engineering Scenario remains the technical source of truth.

Every published Drawing Revision should reconcile structured fields that can be compared reliably.

Initial reconciliation scope:

- module manufacturer/model identity where captured;
- module quantity;
- derived array capacity;
- inverter identity/quantity where captured;
- active Scenario identity;
- drawing revision identity.

Example:

```text
Engineering Scenario
192 × 610 W = 117.12 kWp

Drawing Revision
188 × 610 W = 114.68 kWp

Result
BLOCKING — DRAWING_SCENARIO_MODULE_COUNT_MISMATCH
Difference: -4 modules / -2.44 kWp
```

A Drawing Revision may not silently rewrite the approved Scenario.

Where the drawing reveals that the Scenario is no longer physically achievable, the engineering workflow creates or amends a Scenario/revision and recalculates before approval.

## 19. BOM reconciliation

The approved BOM must derive from the approved Engineering Revision.

At minimum, governed comparisons should detect conflicts in:

- module identity and quantity;
- inverter identity and quantity;
- BESS identity/configuration;
- configured cable/protection outputs when those domains become authoritative;
- engineered accessories generated by rule logic.

Procurement data may add supplier, price, lead time, stock and commercial substitutions, but a technical substitution requires explicit engineering review rather than silently changing the BOM.

## 20. Review and approval accuracy gate

Engineer review is a controlled validation layer, not a ceremonial status transition.

Review mode must expose:

- authoritative input/source quality;
- equipment revisions;
- main deterministic calculations;
- design margins;
- unresolved findings;
- assumptions and estimates;
- model/data provenance;
- drawing reconciliation status;
- calculation freshness;
- changes since prior revision;
- validation-suite status relevant to the engine version.

Approval is blocked when:

- blocking findings remain unresolved;
- required authoritative inputs are stale;
- a safety-critical source is unverified where policy requires verification;
- drawing reconciliation has a blocking conflict;
- required validation evidence is missing;
- the calculation failed or is incomplete.

An authorised override, where permitted, must never erase the original finding or calculation.

## 21. Commissioning feedback loop

Commissioning provides measured evidence against the design, but measured and calculated values must not be compared naively when environmental conditions materially differ.

A commissioning comparison may preserve:

```text
Calculated/design value
Measured value
Measurement timestamp
Environmental/test conditions
Instrument/method
Expected tolerance or comparison basis
Difference
Review outcome
```

Examples include design-versus-measured string voltage, equipment quantities, configuration and test results.

A difference may indicate:

- normal environmental variation;
- measurement uncertainty;
- installation deviation;
- incorrect design input;
- incorrect model assumption;
- equipment/data error.

Commissioning evidence must not silently modify the approved historical design. A correction creates the appropriate governed amendment/revision.

## 22. Calibration and learning

Over time, HelioCoreOS may compare modelled results with operating or commissioning data to improve assumptions and model selection.

This feedback loop must be controlled.

A new calibrated model or changed assumption set creates a new engine/model version. Historical approved results retain the original version and remain reproducible.

The platform must not continuously self-adjust engineering formulas from production data without explicit model governance and validation.

## 23. Accuracy presentation in the UI

The UI must not show one generic `Accuracy: 98%` indicator unless a specific scientifically defensible metric has been defined for a particular model.

Instead, engineering evidence should surface relevant dimensions such as:

```text
Result class       Deterministic
Source quality     Manufacturer verified
Calculation state  Validated
Design margin      15.8%
Engine version     HelioCalc 1.4.0
Rule profile       PK-PV-DC-003
Input revision     Scenario B rev 04
Freshness          Current
```

For a modelled result, the panel may additionally show model/dataset and sensitivity or uncertainty evidence.

For a measured result, it may show measurement method and conditions.

## 24. Calculation evidence view

Any material calculated engineering value should allow an authorised user to inspect its evidence without leaving the active engineering context.

The evidence view should be able to show:

- value and unit;
- calculation/result class;
- source inputs;
- equipment/source revisions;
- formula or algorithm reference;
- actual calculation inputs;
- rule/limit tested;
- margin;
- engine version;
- calculation timestamp;
- related findings;
- input/result fingerprint;
- benchmark/validation state where useful.

The normal workspace should remain readable; deep evidence can use a contextual Sheet or dedicated review surface.

## 25. Validation status for engine releases

Each HelioCalc release that can generate authoritative engineering outputs must have a controlled validation record.

Recommended states:

```text
DEVELOPMENT
BENCHMARKING
VALIDATED_FOR_LIMITED_SCOPE
VALIDATED
RETIRED
```

Validation is domain-scoped. An engine release may be validated for PV string calculations while BESS degradation modelling remains experimental.

The product must not imply that every calculation domain has equal maturity simply because they are served by the same API version.

## 26. Release quality gate

A calculation domain is not production-authoritative until it has:

- documented equations/algorithms;
- documented units and coefficient conventions;
- governed source/rule references;
- input validation;
- known-answer tests;
- independent benchmark evidence;
- boundary tests;
- invalid-configuration tests;
- unit-conversion tests;
- numerical tolerance rules;
- regression tests;
- deterministic reproducibility where applicable;
- machine-readable findings;
- stale-state behaviour;
- calculation provenance persistence;
- failure behaviour;
- engineer validation/sign-off for the intended scope.

Passing unit tests alone is not sufficient.

## 27. Validation programme

Accuracy work should run alongside the HelioCalc build rather than after it.

### AV1 — Source and unit governance

- source-quality classification;
- equipment verification rules;
- canonical units;
- coefficient conventions;
- input fingerprints.

### AV2 — PV electrical benchmark pack

- array capacity;
- cold Voc;
- hot Vmp;
- MPPT/current limits;
- DC/AC ratio;
- independent known-answer fixtures;
- boundary and invalid cases.

### AV3 — Electrical benchmark pack

- design current;
- cable ampacity logic;
- voltage drop;
- derating;
- protection-rule evidence;
- rule-profile versioning.

### AV4 — BESS validation pack

- energy versus power sizing;
- SOC constraints;
- charge/discharge limits;
- dispatch invariants;
- energy-balance checks.

### AV5 — Performance-model validation

- governed weather/load datasets;
- model/library versioning;
- benchmark scenarios;
- sensitivity checks;
- reporting precision/uncertainty discipline.

### AV6 — Cross-system reconciliation

- Engineering Scenario ↔ Drawing Revision;
- Engineering Revision ↔ BOM;
- approved design ↔ commissioning evidence;
- stale dependency propagation.

### AV7 — Production accuracy hardening

- release validation records;
- regression suite in CI;
- calculation observability;
- audit diagnostics;
- change-impact testing for engine/rule/data revisions.

## 28. Accuracy anti-patterns

Prohibited patterns include:

- free-text equipment values treated as authoritative after governed catalogue data exists;
- a calculation without visible units;
- silent manufacturer-data replacement;
- hard-coded undocumented safety limits;
- presenting estimated data as verified;
- treating modelled annual yield as guaranteed generation;
- approving stale results;
- using the same implementation to create and validate its own independent benchmarks;
- accepting a drawing/BOM mismatch without an explicit finding;
- destructive recalculation of an approved revision;
- hiding failed calculations behind the previous successful result;
- excessive decimal precision that implies false certainty;
- one generic accuracy score spanning unrelated engineering result types.

## 29. Product decision

HelioCoreOS does not claim engineering accuracy by branding or interface polish.

It earns trust by preserving the chain from source evidence to calculation, margin, validation, drawing, approval and measured outcome.

The governing accuracy rule is:

> **No engineering number without source, unit, calculation version and reproducible input set. No approved engineering result without validation, freshness and traceable evidence.**
