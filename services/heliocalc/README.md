# HelioCalc

HelioCalc is the Python/FastAPI engineering authority behind HelioCoreOS.

## Responsibility split

- **Preliminary Calculator**: load-based system sizing before equipment is chosen.
- **Datasheet design engine**: selected PV module, inverter/PCS, BESS, cable and protection datasheets drive deterministic electrical calculations.
- **PVWatts V8**: site/weather-backed PV energy performance; it does not replace electrical design checks.
- **ElectricalDesignModel**: canonical calculated topology used by both the SLD and BOM generators.
- **SLD generator**: deterministic SVG generated from the canonical design model.
- **BOM generator**: equipment/material quantities generated from that same design model.

The service intentionally treats jurisdiction/standards-dependent protection coordination and final cable derating as explicit engineering review gates until the applicable IEC/Pakistan rules are encoded and versioned.

## Run

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

## Test

```bash
python -m unittest discover -s tests
```

## API

- `GET /health`
- `POST /v1/calculator/preliminary`
- `POST /v1/design/compile`

`/v1/design/compile` returns a single engineering package containing the canonical `ElectricalDesignModel`, validations, PVWatts performance when configured, an SVG SLD and a BOM.

## PVWatts

Set `NLR_API_KEY`. HelioCalc calls the current PVWatts V8 endpoint at `https://developer.nlr.gov/api/pvwatts/v8.json`. The API call is server-side so the key never enters the browser.
