# Session 12 — Engineering 360

HelioCoreOS now exposes each Engineering Intake as one governed record workspace at `/dashboard/engineering/[intakeId]`.

Persistent in-record navigation:

1. Overview
2. Load Profile
3. Calculator
4. Equipment
5. Design
6. Performance
7. SLD
8. BOM
9. Engineering Review

The Engineering register routes active work into Engineering 360. Existing specialist pages remain the authoritative editors for Load Profile, Calculator, Equipment Library and Detailed Design; Engineering 360 provides the shared context, stage state, evidence summaries and governed progression between them.

Engineering release remains gated by the governed Load Profile, approved authoritative HelioCalc sizing revision, approved Detailed Design, generated SLD and a BOM with no unresolved engineering-review lines.
