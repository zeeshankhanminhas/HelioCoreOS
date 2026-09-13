# HelioCoreOS

HelioCoreOS is a governed solar EPC operating platform with a calculation-first engineering workflow.

## Engineering product flow

Opportunity → Site → System Type → Load Profile → Calculator → Equipment Selection → Detailed Design → PVWatts Performance → SLD + BOM → Engineering Review → Proposal / Contract → Project → Delivery

Projects are created only after contract sign-off. Pre-contract engineering remains attached to the Opportunity and Site.

## Engineering authority

- Next.js / TypeScript provides the operator workspace and instant preview behaviour.
- Python **HelioCalc** recomputes persisted engineering calculations and detailed design outputs.
- The approved equipment library supplies manufacturer datasheet values.
- PVWatts V8 supplies site/weather-backed PV performance estimates.
- A canonical `ElectricalDesignModel` feeds both the SLD generator and BOM generator so those deliverables cannot silently diverge.

See `docs/HELIOCALC_ARCHITECTURE.md` and `services/heliocalc/README.md` for the engineering architecture.
