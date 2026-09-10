# HelioCalc engineering architecture

## Locked product flow

Opportunity → Site → System Type → Load Profile → Calculator → Equipment Selection → Detailed Design → PVWatts Performance → SLD + BOM → Engineering Review → Proposal / Contract → Project → Delivery

A Project is a post-contract delivery object. Pre-contract engineering is governed against the Opportunity and Site.

## One engineering truth model

Detailed Design compiles selected manufacturer datasheets and project assumptions into one canonical `ElectricalDesignModel`. The same model is consumed by:

1. engineering validation,
2. PVWatts performance attachment,
3. the SLD generator, and
4. the BOM generator.

SLD and BOM must therefore never be manually maintained as separate representations of the design.

## Calculation authority

- Next.js/TypeScript may provide instant UI previews.
- Python HelioCalc recomputes all persisted engineering results.
- Selected equipment is represented by immutable datasheet snapshots at calculation time.
- Every saved revision retains the engine version, inputs, results and validation findings.
- PVWatts is a performance model, not an electrical compliance engine.

## Standards boundary

String voltage/current, equipment limits, battery power/energy and cable voltage-drop/ampacity checks can be deterministic from project inputs and manufacturer data. Final cable derating, protection coordination, breaking capacity, earthing and jurisdiction-specific approval must remain visible review gates until applicable IEC/Pakistan rules are encoded, sourced and versioned.
