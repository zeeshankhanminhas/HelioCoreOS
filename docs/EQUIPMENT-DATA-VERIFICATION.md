# HelioCoreOS Equipment Data Verification

Status: Governing Solar EPC Project Addition  
Applies to: Equipment catalogue, manufacturer datasheets, HelioCalc inputs, BOM, drawings and engineering approvals  
Related: [HelioCalc Engineering Engine](./HELIOCALC-ENGINE.md), [Engineering Accuracy and Validation](./ENGINEERING-ACCURACY-VALIDATION.md)

## 1. Decision

Manufacturer technical data becomes engineering source data only after it passes a governed verification workflow.

The canonical pipeline is:

```text
Source received
→ Document registered
→ Values extracted/entered
→ Units normalised
→ Required fields checked
→ Independent verification
→ Released equipment-data revision
→ Used by HelioCalc
→ Superseded when manufacturer evidence changes
```

The original source evidence must remain linked to every released technical-data revision.

## 2. Source hierarchy

Preferred evidence order:

1. manufacturer-issued datasheet/manual/certificate;
2. manufacturer technical portal or controlled product database;
3. authorised distributor evidence where manufacturer evidence is unavailable;
4. engineer-entered value with explicit source;
5. assumption/estimate.

Lower-quality sources must never be presented as manufacturer-verified facts.

## 3. Equipment data object

Each equipment-data revision must preserve:

- equipment identity;
- manufacturer/model/type;
- source document ID;
- source revision/date where available;
- source URL/reference if applicable;
- extraction method;
- entered/extracted by;
- verification state;
- verified by/date;
- parameter values;
- canonical units;
- original source units/text where useful;
- notes/ambiguities;
- effective date;
- supersession relationship.

## 4. Verification states

Recommended states:

```text
DRAFT
SOURCE_ATTACHED
EXTRACTED
NORMALISED
UNDER_REVIEW
CHANGES_REQUIRED
VERIFIED
RELEASED
SUPERSEDED
RETIRED
```

`VERIFIED` means the technical values have been checked against evidence. `RELEASED` means that verified revision is permitted as an authoritative HelioCalc input.

## 5. Extraction rules

Automated or AI-assisted extraction may accelerate data entry, but it never self-approves.

Extraction must preserve confidence/ambiguity information and flag:

- unreadable fields;
- conflicting values;
- values that appear only in graphs;
- unit uncertainty;
- coefficient convention uncertainty;
- conditions of measurement;
- footnotes affecting limits.

An extraction result remains non-authoritative until reviewed.

## 6. Unit normalisation

HelioCalc consumes canonical units and coefficient conventions.

For every parameter, the data layer should define:

- canonical unit;
- accepted source units;
- conversion rule;
- sign convention;
- temperature/reference condition;
- whether value is nominal, maximum, minimum or typical.

The source value should remain recoverable so a reviewer can verify the conversion.

## 7. Required parameter profiles

Required fields vary by equipment type and intended calculation domain.

Example PV module release profile may require:

- Pmax;
- Voc;
- Vmp;
- Isc;
- Imp;
- relevant temperature coefficients;
- maximum system voltage;
- series fuse rating where needed;
- dimensions/weight for layout and structural reconciliation.

Example inverter release profile may require:

- rated AC power;
- maximum DC voltage;
- MPPT voltage range;
- MPPT count;
- input/current limits;
- AC voltage/phase;
- efficiency and export/control characteristics where relevant.

A record may be verified for catalogue purposes but not released for a calculation domain if required parameters for that domain are missing.

## 8. Validation checks

Before release, automated checks should detect obvious inconsistencies such as:

- Vmp greater than/equal to Voc;
- Imp greater than Isc where source convention does not support it;
- negative dimensions or capacities;
- impossible efficiency values;
- missing units;
- duplicate model identities with conflicting released values;
- coefficient sign/convention inconsistencies;
- inverter MPPT minimum greater than maximum;
- battery usable energy greater than nominal energy without explicit explanation.

These checks find suspicious data; they do not replace source verification.

## 9. Revision and supersession

A manufacturer update must create a new equipment-data revision rather than editing the old released revision in place.

Historical calculations retain the exact equipment revision they used.

When a new revision is released, HelioCoreOS may identify affected draft/current designs. It must not silently recalculate or rewrite approved historical designs.

## 10. Data dependency and stale state

A changed released parameter may make downstream work stale.

Potential dependencies:

```text
Equipment revision
→ HelioCalc calculation
→ Engineering Scenario
→ Drawing reconciliation
→ BOM
→ procurement specification
→ commissioning evidence
```

Dependency propagation should be parameter-aware where practical; a corrected marketing description should not invalidate an electrical calculation, while a changed Voc or current limit may do so.

## 11. Catalogue UX

Engineering users should see concise trust signals such as:

- Released / Verified / Unverified;
- source revision/date;
- evidence available;
- missing fields for active calculation domain;
- superseded warning.

The evidence Sheet should allow inspection of the source document and parameter provenance without leaving the Engineering workspace.

## 12. Initial catalogue programme

### ED1 — Schema and source registry
- equipment identities;
- source documents;
- technical-data revisions;
- verification state.

### ED2 — PV module profile
- canonical parameter schema;
- unit conversions;
- first benchmark equipment set.

### ED3 — Inverter profile
- voltage/current/MPPT fields;
- compatibility/release checks.

### ED4 — BESS profile
- energy/power/voltage/SOC/compatibility fields.

### ED5 — Mounting/electrical BOS
Expand only as required by implemented engineering domains.

## 13. Product decision

> **A datasheet file is evidence. A released equipment-data revision is the governed machine-readable interpretation of that evidence. HelioCalc calculates only from the latter when authoritative data is required.**
