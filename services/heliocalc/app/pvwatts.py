from __future__ import annotations

import os

import httpx

from .models import PvWattsResult, SitePerformanceInput


class PvWattsClient:
    def __init__(self, api_key: str | None = None, base_url: str | None = None):
        self.api_key = api_key or os.getenv("NLR_API_KEY")
        self.base_url = base_url or os.getenv("NLR_PVWATTS_BASE_URL", "https://developer.nlr.gov/api/pvwatts/v8.json")

    async def simulate(self, site: SitePerformanceInput, system_capacity_kw: float, dc_ac_ratio: float, inverter_efficiency_pct: float) -> PvWattsResult:
        if not self.api_key:
            raise RuntimeError("NLR_API_KEY is not configured for PVWatts V8.")
        params: dict[str, object] = {
            "api_key": self.api_key,
            "system_capacity": round(system_capacity_kw, 4),
            "module_type": site.module_type,
            "losses": site.losses_pct,
            "array_type": site.array_type,
            "tilt": site.tilt_deg,
            "azimuth": site.azimuth_deg,
            "lat": site.latitude,
            "lon": site.longitude,
            "dataset": site.dataset,
            "radius": site.radius_miles,
            "timeframe": "monthly",
            "dc_ac_ratio": dc_ac_ratio,
            "gcr": site.gcr,
            "inv_eff": inverter_efficiency_pct,
        }
        if site.albedo is not None:
            params["albedo"] = site.albedo
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(self.base_url, params=params)
            response.raise_for_status()
            payload = response.json()
        errors = payload.get("errors") or []
        if errors:
            raise RuntimeError("PVWatts V8: " + " · ".join(str(item) for item in errors))
        outputs = payload.get("outputs") or {}
        station = payload.get("station_info") or {}
        return PvWattsResult(
            service_version=payload.get("version"),
            weather_data_source=station.get("weather_data_source"),
            station_distance_m=station.get("distance"),
            annual_ac_kwh=outputs.get("ac_annual"),
            monthly_ac_kwh=outputs.get("ac_monthly") or [],
            monthly_dc_kwh=outputs.get("dc_monthly") or [],
            monthly_poa_kwh_m2=outputs.get("poa_monthly") or [],
            warnings=[str(item) for item in (payload.get("warnings") or [])],
        )
