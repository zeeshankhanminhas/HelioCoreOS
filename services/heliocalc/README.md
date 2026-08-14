# HelioCalc Service Boundary

HelioCalc is the planned Python/FastAPI engineering calculation service beneath HelioCoreOS.

HelioCoreOS remains responsible for authentication, tenancy, workflow, persistence, approvals, revisions and audit history. HelioCalc is responsible for deterministic Solar PV, BESS and electrical calculations using governed inputs and released equipment-data revisions.

Governing architecture:

- [`docs/HELIOCALC-ENGINE.md`](../../docs/HELIOCALC-ENGINE.md)
- [`docs/ENGINEERING-ACCURACY-VALIDATION.md`](../../docs/ENGINEERING-ACCURACY-VALIDATION.md)
- [`docs/TEST-VALIDATION-STRATEGY.md`](../../docs/TEST-VALIDATION-STRATEGY.md)
- [`docs/EQUIPMENT-DATA-VERIFICATION.md`](../../docs/EQUIPMENT-DATA-VERIFICATION.md)
- [`docs/STRUCTURAL-ENGINEERING-BOUNDARY.md`](../../docs/STRUCTURAL-ENGINEERING-BOUNDARY.md)
- [`docs/GRID-INTERCONNECTION-ARCHITECTURE.md`](../../docs/GRID-INTERCONNECTION-ARCHITECTURE.md)

## Runtime boundary

```text
HelioCoreOS web application
Next.js / TypeScript
        ↓
Governed Engineering Scenario
        ↓
Authenticated server-side request
        ↓
HelioCalc
Python / FastAPI
        ↓
PV / Electrical / BESS / Simulation / Validation
        ↓
Structured Calculation Result + Findings + Provenance
        ↓
Supabase Calculation Revision + Audit Event
```

The browser must not hold privileged service credentials.

## Planned package shape

```text
heliocalc/
├── api/
├── models/
├── equipment/
├── pv/
├── electrical/
├── bess/
├── simulation/
├── economics/
└── validation/
```

The initial validation scaffold is reserved under [`tests/`](./tests/README.md). [`pyproject.toml`](./pyproject.toml) establishes the first pytest/coverage/Ruff toolchain boundary.

## Calculation authority

A calculation domain is not authoritative merely because implementation exists.

Domains progress through:

```text
DEVELOPMENT
→ BENCHMARKING
→ VALIDATED_FOR_LIMITED_SCOPE
→ VALIDATED
→ RETIRED
```

Promotion requires the test/benchmark and engineering evidence defined by the validation strategy.

## Source data

Authoritative calculations use released equipment-data revisions, not free-text model names or unverified extracted values.

The equipment-data pipeline is:

```text
Manufacturer evidence
→ extraction/entry
→ unit normalisation
→ verification
→ released data revision
→ HelioCalc
```

Historical calculations retain the exact source/data revisions they used.

## Non-goals

HelioCalc does not own:

- Customer, Site or Project workflow;
- approvals or document issue;
- physical 3D drawing authoring;
- procurement substitutions;
- structural adequacy unless a separately validated structural calculation domain is explicitly introduced;
- grid/authority approval state.

Those remain governed by HelioCoreOS and its project workflows.

## First implementation target

The first serious vertical slice should prove:

```text
Released PV module + inverter data
→ Engineering Scenario
→ array/string/MPPT calculation
→ margin + machine-readable finding
→ persisted calculation revision
→ Drawing Job reconciliation
→ Review/Approval gate
→ controlled engineering output
```

That slice should be benchmarked before broader HelioCalc domains are added.
