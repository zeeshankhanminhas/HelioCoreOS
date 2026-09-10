from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, serialize_by_alias=True)


class SystemType(str, Enum):
    ON_GRID = "on_grid"
    OFF_GRID = "off_grid"
    HYBRID = "hybrid"


class Validation(CamelModel):
    code: str
    severity: Literal["pass", "warning", "error"]
    title: str
    detail: str


class LoadBasis(CamelModel):
    annual_energy_kwh: float = 0
    average_daily_energy_kwh: float = 0
    peak_demand_kw: float = 0
    essential_peak_demand_kw: float = 0


class PreliminarySizingRequest(LoadBasis):
    system_type: SystemType
    target_solar_contribution_pct: float | None = None
    specific_yield_kwh_per_kwp_year: float | None = None
    target_dc_ac_ratio: float | None = None
    peak_sun_hours_per_day: float | None = None
    system_efficiency_pct: float | None = None
    autonomy_hours: float | None = None
    backup_hours: float | None = None
    backup_load_kw: float | None = None
    battery_dod_pct: float | None = None
    inverter_headroom_pct: float | None = None


class PreliminarySizingResult(CamelModel):
    recommended_pv_kwp: float | None = None
    recommended_inverter_ac_kw: float | None = None
    estimated_annual_pv_generation_kwh: float | None = None
    battery_usable_kwh: float | None = None
    battery_nominal_kwh: float | None = None
    battery_power_kw: float | None = None
    validations: list[Validation]


class PreliminarySizingResponse(CamelModel):
    engine_version: str
    result: PreliminarySizingResult


class PvModuleDatasheet(CamelModel):
    equipment_id: str | None = None
    manufacturer: str
    model: str
    pmax_w: float = Field(gt=0)
    voc_v: float = Field(gt=0)
    vmp_v: float = Field(gt=0)
    isc_a: float = Field(gt=0)
    imp_a: float = Field(gt=0)
    temp_coeff_voc_pct_c: float
    temp_coeff_vmp_pct_c: float | None = None
    max_system_voltage_v: float = Field(gt=0)
    bifaciality: float | None = Field(default=None, ge=0, le=1)
    datasheet_url: str | None = None


class InverterDatasheet(CamelModel):
    equipment_id: str | None = None
    manufacturer: str
    model: str
    inverter_type: Literal["grid_tied", "off_grid", "hybrid", "pcs"]
    rated_ac_power_kw: float = Field(gt=0)
    max_pv_input_power_kw: float = Field(gt=0)
    max_dc_voltage_v: float = Field(gt=0)
    mppt_min_v: float = Field(gt=0)
    mppt_max_v: float = Field(gt=0)
    mppt_count: int = Field(gt=0)
    max_input_current_per_mppt_a: float = Field(gt=0)
    max_short_circuit_current_per_mppt_a: float = Field(gt=0)
    max_strings_per_mppt: int | None = Field(default=None, gt=0)
    max_efficiency_pct: float | None = Field(default=None, gt=0, le=100)
    battery_voltage_min_v: float | None = Field(default=None, gt=0)
    battery_voltage_max_v: float | None = Field(default=None, gt=0)
    max_charge_power_kw: float | None = Field(default=None, gt=0)
    max_discharge_power_kw: float | None = Field(default=None, gt=0)
    datasheet_url: str | None = None


class BatteryDatasheet(CamelModel):
    equipment_id: str | None = None
    manufacturer: str
    model: str
    nominal_capacity_kwh: float = Field(gt=0)
    usable_capacity_kwh: float = Field(gt=0)
    nominal_voltage_v: float = Field(gt=0)
    operating_voltage_min_v: float | None = Field(default=None, gt=0)
    operating_voltage_max_v: float | None = Field(default=None, gt=0)
    max_charge_power_kw: float = Field(gt=0)
    max_discharge_power_kw: float = Field(gt=0)
    max_dod_pct: float | None = Field(default=None, gt=0, le=100)
    round_trip_efficiency_pct: float | None = Field(default=None, gt=0, le=100)
    datasheet_url: str | None = None


class CableDatasheet(CamelModel):
    equipment_id: str | None = None
    manufacturer: str | None = None
    model: str
    conductor_size_mm2: float = Field(gt=0)
    resistance_ohm_per_km: float = Field(gt=0)
    ampacity_a: float = Field(gt=0)
    max_voltage_v: float | None = Field(default=None, gt=0)


class CableRunInput(CamelModel):
    name: str
    role: Literal["dc_string", "dc_array", "ac_output", "battery_dc", "other"]
    length_m: float = Field(gt=0)
    design_current_a: float = Field(gt=0)
    system_voltage_v: float = Field(gt=0)
    phase: Literal["dc", "single", "three"] = "dc"
    max_voltage_drop_pct: float = Field(default=2.0, gt=0)
    cable: CableDatasheet


class ProtectionDeviceDatasheet(CamelModel):
    equipment_id: str | None = None
    manufacturer: str | None = None
    model: str
    device_type: Literal["fuse", "mcb", "mccb", "isolator", "spd", "rcd", "other"]
    rated_current_a: float | None = Field(default=None, gt=0)
    rated_voltage_v: float | None = Field(default=None, gt=0)
    poles: int | None = Field(default=None, gt=0)


class ProtectionSelection(CamelModel):
    location: str
    required_current_a: float = Field(gt=0)
    required_voltage_v: float = Field(gt=0)
    device: ProtectionDeviceDatasheet


class SitePerformanceInput(CamelModel):
    enabled: bool = True
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    tilt_deg: float = Field(ge=0, le=90)
    azimuth_deg: float = Field(ge=0, lt=360)
    losses_pct: float = Field(default=14, ge=-5, le=99)
    array_type: int = Field(default=1, ge=0, le=4)
    module_type: int = Field(default=0, ge=0, le=2)
    dataset: Literal["nsrdb", "intl", "tmy2", "tmy3"] = "nsrdb"
    radius_miles: int = Field(default=0, ge=0)
    gcr: float = Field(default=0.4, gt=0, lt=1)
    albedo: float | None = Field(default=None, gt=0, lt=1)


class DetailedDesignRequest(CamelModel):
    system_type: SystemType
    target_pv_kwp: float = Field(gt=0)
    target_dc_ac_ratio: float = Field(default=1.2, gt=0)
    minimum_cell_temp_c: float
    maximum_cell_temp_c: float
    load: LoadBasis
    pv_module: PvModuleDatasheet
    inverter: InverterDatasheet
    battery: BatteryDatasheet | None = None
    autonomy_hours: float | None = Field(default=None, gt=0)
    backup_hours: float | None = Field(default=None, gt=0)
    backup_load_kw: float | None = Field(default=None, gt=0)
    reserve_soc_pct: float = Field(default=10, ge=0, lt=100)
    requested_modules_per_string: int | None = Field(default=None, gt=0)
    requested_inverter_quantity: int | None = Field(default=None, gt=0)
    ac_voltage_v: float = Field(default=400, gt=0)
    ac_phase: Literal["single", "three"] = "three"
    cable_runs: list[CableRunInput] = []
    protection: list[ProtectionSelection] = []
    performance: SitePerformanceInput | None = None


class StringGroup(CamelModel):
    inverter_index: int
    mppt_index: int
    strings_count: int
    modules_per_string: int


class PvSubsystem(CamelModel):
    module: PvModuleDatasheet
    inverter: InverterDatasheet
    module_quantity: int
    modules_per_string: int
    total_strings: int
    inverter_quantity: int
    array_capacity_kwp: float
    inverter_ac_capacity_kw: float
    dc_ac_ratio: float
    minimum_modules_per_string: int
    maximum_modules_per_string: int
    cold_string_voc_v: float
    hot_string_vmp_v: float
    strings_per_mppt_max: int
    string_groups: list[StringGroup]


class BatterySubsystem(CamelModel):
    battery: BatteryDatasheet
    quantity: int
    required_usable_kwh: float
    installed_usable_kwh: float
    required_power_kw: float
    installed_discharge_power_kw: float
    voltage_compatible: bool | None


class CableRunResult(CamelModel):
    input: CableRunInput
    voltage_drop_v: float
    voltage_drop_pct: float
    ampacity_ok: bool
    voltage_ok: bool | None


class ProtectionResult(CamelModel):
    selection: ProtectionSelection
    current_rating_ok: bool | None
    voltage_rating_ok: bool | None


class ElectricalDesignModel(CamelModel):
    engine_version: str
    system_type: SystemType
    load: LoadBasis
    pv: PvSubsystem
    battery: BatterySubsystem | None = None
    cables: list[CableRunResult] = []
    protection: list[ProtectionResult] = []


class PvWattsResult(CamelModel):
    service_version: str | None = None
    weather_data_source: str | None = None
    station_distance_m: int | None = None
    annual_ac_kwh: float | None = None
    monthly_ac_kwh: list[float] = []
    monthly_dc_kwh: list[float] = []
    monthly_poa_kwh_m2: list[float] = []
    warnings: list[str] = []


class BomItem(CamelModel):
    category: str
    description: str
    manufacturer: str | None = None
    model: str | None = None
    quantity: float
    unit: str
    equipment_id: str | None = None
    status: Literal["selected", "engineering_review"] = "selected"


class EngineeringPackage(CamelModel):
    engine_version: str
    design: ElectricalDesignModel
    performance: PvWattsResult | None = None
    validations: list[Validation]
    bom: list[BomItem]
    sld_svg: str
