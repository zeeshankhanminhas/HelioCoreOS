# HelioCoreOS Engineering Core V1

## Product rule

HelioCoreOS uses one shared engineering spine for every solar project:

`Project → Site → System Type → Load Profile → Design Objective → Equipment → Calculations → Validation → BOM → Costing`

The system type changes the engineering rules. It does not create three separate applications.

## System types

### On-grid

Load profile is required for self-consumption, import/export analysis, PV sizing against demand, peak-demand context and export constraints.

System-specific controls include:

- target PV capacity;
- permitted export limit;
- grid voltage and connection assumptions;
- inverter sizing and DC/AC ratio;
- string and MPPT validation.

### Off-grid

Load profile is required for energy balance, peak demand, surge demand, autonomy, inverter sizing and battery sizing.

System-specific controls include:

- autonomy target;
- essential and non-essential loads;
- battery reserve assumptions;
- generator or secondary-source assumptions where applicable;
- PV and storage energy-balance validation.

### Hybrid

Load profile is required for PV sizing, BESS sizing, backup demand, self-consumption, peak shaving and battery-dispatch strategy.

System-specific controls include:

- backup-load definition;
- reserve SOC;
- charge/discharge power;
- grid import/export behaviour;
- PV, inverter/PCS and BESS compatibility.

## Load profile contract

A load profile is a shared first-class engineering object. It may originate from:

1. interval data (15, 30 or 60 minute);
2. utility bills;
3. appliance/process schedules;
4. a governed manual summary for early-stage design.

The canonical interval model supports:

- timestamp;
- demand kW;
- interval energy kWh;
- essential/non-essential flag;
- load category.

Derived values include annual energy, average daily energy, peak demand and essential peak demand.

## Engineering engine boundary

Calculation logic lives in `src/lib/engineering` and must remain independent of React UI components.

Current calculation contracts include:

- load-profile summarisation;
- module count and array capacity;
- DC/AC ratio;
- temperature-corrected module voltage;
- maximum modules per string;
- inverter maximum-DC-voltage validation;
- MPPT operating-window validation;
- MPPT operating-current and short-circuit-current validation.

Future calculations extend this engine rather than being implemented directly in pages or forms.

## Governance

Engineering validations use three severities:

- `pass` — compliant;
- `warning` — engineer review or documented assumption required;
- `error` — design cannot progress until corrected.

Warnings and errors should use stable machine-readable codes so they can later feed design approval, audit history and generated engineering reports.

## Build sequence

### Wave E1 — Engineering intake

- system type;
- shared load-profile source;
- design objective;
- system-specific initial constraints;
- engineering readiness gate.

### Wave E2 — Persisted load model

- load profiles;
- interval records;
- bill-based and appliance-schedule import paths;
- load summary calculations;
- essential-load classification.

### Wave E3 — Equipment library

- manufacturers;
- PV modules;
- inverters and hybrid inverters;
- batteries/BESS;
- technical datasheets;
- compatibility metadata.

### Wave E4 — PV design engine

- capacity sizing;
- inverter sizing;
- DC/AC ratio;
- strings;
- MPPT allocation;
- voltage/current guardrails.

### Wave E5 — BESS design engine

- nominal and usable capacity;
- autonomy;
- DoD and reserve SOC;
- charge/discharge power;
- inverter/PCS compatibility;
- system-type-specific storage logic.

### Wave E6 — Electrical and BOM

- cable sizing;
- protection devices;
- isolators/SPDs/breakers;
- automatic BOM;
- design-to-cost handoff.
