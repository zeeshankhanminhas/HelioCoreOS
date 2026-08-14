# HelioCalc service boundary

This directory is reserved for the Python engineering service defined in [`docs/HELIOCALC-ENGINE.md`](../../docs/HELIOCALC-ENGINE.md).

The engineering experience that consumes this service is governed by [`docs/HELIOCALC-UX.md`](../../docs/HELIOCALC-UX.md).

HelioCalc is not a replacement for the HelioCoreOS application. It is the deterministic calculation authority used by the Engineering domain.

The Python service owns calculation truth; HelioCoreOS owns the engineering cockpit, workflow context, evidence presentation, review and approval experience.

## Intended responsibilities

- equipment technical-data models;
- Solar PV sizing and electrical validation;
- string and MPPT checks;
- inverter sizing and DC/AC ratio;
- cable and voltage-drop calculations;
- BESS sizing and dispatch;
- time-series energy simulation;
- engineering guardrails;
- reproducible calculation revisions;
- structured API responses for HelioCoreOS.

## Intended runtime

```text
Python
FastAPI
Pydantic models
scientific calculation modules
unit and regression tests
```

Scientific libraries may include NumPy, Pandas, SciPy and pvlib where their use is justified and validated.

## Boundary rules

1. No user-interface code belongs in this service.
2. No HelioCoreOS workflow state is owned exclusively by this service.
3. Every calculation request must carry governed scenario/revision context.
4. Equipment technical values must resolve to controlled equipment-data revisions.
5. Results must be structured and versioned; presentation belongs to HelioCoreOS.
6. Blocking engineering findings must be machine-readable.
7. Identical governed inputs and engine/rule versions must produce reproducible results within defined numerical tolerances.
8. Historical approved results must remain reproducible after later engine or datasheet changes.
9. The service must fail explicitly when required technical data is missing or contradictory.
10. Procurement pricing must not alter calculation truth.

## Planned package shape

```text
services/heliocalc/
├── app/
│   ├── api/
│   ├── models/
│   ├── equipment/
│   ├── pv/
│   ├── electrical/
│   ├── bess/
│   ├── simulation/
│   ├── economics/
│   └── validation/
└── tests/
```

The first implementation milestone is the equipment-data foundation followed by the PV electrical core. The UI programme begins in parallel with the Engineering Cockpit shell so technical capability never grows into an unstructured long form. Production calculation code should not be added until the input/output contract and reference calculation cases are defined.
