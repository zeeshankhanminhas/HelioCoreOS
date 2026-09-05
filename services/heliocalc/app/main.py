from __future__ import annotations

import os

from fastapi import Depends, FastAPI, Header, HTTPException

from .calculations import HELIOCALC_VERSION, compile_design, preliminary_sizing
from .generators import generate_bom, generate_sld_svg
from .models import DetailedDesignRequest, EngineeringPackage, PreliminarySizingRequest, PreliminarySizingResponse, Validation
from .pvwatts import PvWattsClient

app = FastAPI(title="HelioCalc", version=HELIOCALC_VERSION, description="Datasheet-driven engineering authority for HelioCoreOS")


def require_service_token(x_heliocalc_token: str | None = Header(default=None)) -> None:
    expected = os.getenv("HELIOCALC_SERVICE_TOKEN")
    env = os.getenv("HELIOCALC_ENV", "development")
    if expected and x_heliocalc_token != expected:
        raise HTTPException(status_code=401, detail="Invalid HelioCalc service token")
    if env == "production" and not expected:
        raise HTTPException(status_code=503, detail="HELIOCALC_SERVICE_TOKEN must be configured in production")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "engineVersion": HELIOCALC_VERSION}


@app.post("/v1/calculator/preliminary", response_model=PreliminarySizingResponse, dependencies=[Depends(require_service_token)])
def preliminary(req: PreliminarySizingRequest) -> PreliminarySizingResponse:
    return PreliminarySizingResponse(engine_version=HELIOCALC_VERSION, result=preliminary_sizing(req))


@app.post("/v1/design/compile", response_model=EngineeringPackage, dependencies=[Depends(require_service_token)])
async def design_compile(req: DetailedDesignRequest) -> EngineeringPackage:
    model, validations = compile_design(req)
    performance = None
    if req.performance and req.performance.enabled:
        try:
            performance = await PvWattsClient().simulate(
                req.performance,
                system_capacity_kw=model.pv.array_capacity_kwp,
                dc_ac_ratio=model.pv.dc_ac_ratio,
                inverter_efficiency_pct=req.inverter.max_efficiency_pct or 96.0,
            )
            for warning in performance.warnings:
                validations.append(Validation(code="pvwatts_warning", severity="warning", title="PVWatts warning", detail=warning))
        except Exception as exc:
            validations.append(Validation(code="pvwatts_unavailable", severity="warning", title="PVWatts performance result unavailable", detail=str(exc)))
    return EngineeringPackage(
        engine_version=HELIOCALC_VERSION,
        design=model,
        performance=performance,
        validations=validations,
        bom=generate_bom(model),
        sld_svg=generate_sld_svg(model),
    )
