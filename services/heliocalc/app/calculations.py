from __future__ import annotations

import math

from .models import (
    BatterySubsystem,
    CableRunResult,
    DetailedDesignRequest,
    ElectricalDesignModel,
    PreliminarySizingRequest,
    PreliminarySizingResult,
    ProtectionResult,
    PvSubsystem,
    StringGroup,
    Validation,
)

HELIOCALC_VERSION = "heliocalc-0.1.0"


def check(code: str, severity: str, title: str, detail: str) -> Validation:
    return Validation(code=code, severity=severity, title=title, detail=detail)


def corrected_voltage(stc_v: float, coefficient_pct_c: float, cell_temp_c: float) -> float:
    return stc_v * (1 + (coefficient_pct_c / 100.0) * (cell_temp_c - 25.0))


def preliminary_sizing(req: PreliminarySizingRequest) -> PreliminarySizingResult:
    checks: list[Validation] = []
    headroom = (req.inverter_headroom_pct or 20) / 100
    pv_kwp = inverter_kw = generation = battery_usable = battery_nominal = battery_power = None

    if req.peak_demand_kw <= 0:
        checks.append(check("peak_demand", "warning" if req.system_type.value == "on_grid" else "error", "Peak demand is missing", "A governed peak demand is required for power sizing."))

    if req.system_type.value == "off_grid":
        if req.average_daily_energy_kwh <= 0:
            checks.append(check("daily_energy", "error", "Daily energy is missing", "Off-grid sizing requires governed daily energy demand."))
        if not req.peak_sun_hours_per_day or req.peak_sun_hours_per_day <= 0:
            checks.append(check("solar_resource", "error", "Peak-sun-hours input is required", "Use a site-specific resource assumption or PVWatts-backed performance run."))
        if not req.system_efficiency_pct or not 0 < req.system_efficiency_pct <= 100:
            checks.append(check("system_efficiency", "error", "System efficiency is invalid", "Overall system efficiency must be between 0 and 100 percent."))
        if not req.autonomy_hours or req.autonomy_hours <= 0:
            checks.append(check("autonomy", "error", "Autonomy requirement is missing", "Off-grid storage sizing requires autonomy hours."))
        if not req.battery_dod_pct or not 0 < req.battery_dod_pct <= 100:
            checks.append(check("battery_dod", "error", "Battery DoD assumption is invalid", "Maximum design depth of discharge must be between 0 and 100 percent."))
        if not any(item.severity == "error" for item in checks):
            efficiency = (req.system_efficiency_pct or 0) / 100
            pv_kwp = req.average_daily_energy_kwh / ((req.peak_sun_hours_per_day or 1) * efficiency)
            generation = pv_kwp * (req.peak_sun_hours_per_day or 0) * 365 * efficiency
            battery_usable = req.average_daily_energy_kwh * ((req.autonomy_hours or 0) / 24)
            battery_nominal = battery_usable / ((req.battery_dod_pct or 100) / 100)
            battery_power = req.peak_demand_kw
            inverter_kw = req.peak_demand_kw * (1 + headroom)
    else:
        if req.annual_energy_kwh <= 0:
            checks.append(check("annual_energy", "error", "Annual energy is missing", "On-grid and Hybrid sizing requires annual demand."))
        if not req.specific_yield_kwh_per_kwp_year or req.specific_yield_kwh_per_kwp_year <= 0:
            checks.append(check("specific_yield", "error", "Specific yield is required", "Use PVWatts or a governed site-specific yield input."))
        if not req.target_solar_contribution_pct or not 0 < req.target_solar_contribution_pct <= 100:
            checks.append(check("solar_contribution", "error", "Solar contribution target is invalid", "Target contribution must be between 0 and 100 percent."))
        if not req.target_dc_ac_ratio or req.target_dc_ac_ratio <= 0:
            checks.append(check("dc_ac_ratio", "error", "DC/AC target is required", "Enter the preliminary DC/AC ratio."))
        if not any(item.severity == "error" for item in checks):
            pv_kwp = (req.annual_energy_kwh * ((req.target_solar_contribution_pct or 0) / 100)) / (req.specific_yield_kwh_per_kwp_year or 1)
            generation = pv_kwp * (req.specific_yield_kwh_per_kwp_year or 0)
            inverter_kw = pv_kwp / (req.target_dc_ac_ratio or 1)
        if req.system_type.value == "hybrid":
            if not req.backup_hours or req.backup_hours <= 0:
                checks.append(check("backup_hours", "error", "Backup duration is required", "Hybrid storage requires backup duration."))
            if not req.backup_load_kw or req.backup_load_kw <= 0:
                checks.append(check("backup_load", "error", "Backup load is required", "Use the governed essential-load demand or another reviewed backup basis."))
            if not req.battery_dod_pct or not 0 < req.battery_dod_pct <= 100:
                checks.append(check("battery_dod", "error", "Battery DoD assumption is invalid", "Maximum design depth of discharge must be between 0 and 100 percent."))
            if req.backup_hours and req.backup_load_kw and req.battery_dod_pct:
                battery_usable = req.backup_load_kw * req.backup_hours
                battery_nominal = battery_usable / (req.battery_dod_pct / 100)
                battery_power = req.backup_load_kw
                inverter_kw = max(inverter_kw or 0, req.backup_load_kw * (1 + headroom))

    if req.target_dc_ac_ratio and not 0.8 <= req.target_dc_ac_ratio <= 1.6:
        checks.append(check("dc_ac_plausibility", "warning", "DC/AC ratio needs review", "The ratio is outside the broad preliminary 0.8–1.6 review band; this is not a compliance limit."))
    if not any(item.severity == "error" for item in checks):
        checks.append(check("calculator_ready", "pass", "Preliminary sizing is complete", "The sizing can feed equipment selection and datasheet-driven detailed design."))

    return PreliminarySizingResult(
        recommended_pv_kwp=pv_kwp,
        recommended_inverter_ac_kw=inverter_kw,
        estimated_annual_pv_generation_kwh=generation,
        battery_usable_kwh=battery_usable,
        battery_nominal_kwh=battery_nominal,
        battery_power_kw=battery_power,
        validations=checks,
    )


def _string_window(req: DetailedDesignRequest) -> tuple[int, int, float, float]:
    module = req.pv_module
    inverter = req.inverter
    vmp_coeff = module.temp_coeff_vmp_pct_c if module.temp_coeff_vmp_pct_c is not None else module.temp_coeff_voc_pct_c
    cold_voc_unit = corrected_voltage(module.voc_v, module.temp_coeff_voc_pct_c, req.minimum_cell_temp_c)
    cold_vmp_unit = corrected_voltage(module.vmp_v, vmp_coeff, req.minimum_cell_temp_c)
    hot_vmp_unit = corrected_voltage(module.vmp_v, vmp_coeff, req.maximum_cell_temp_c)
    absolute_dc_limit = min(module.max_system_voltage_v, inverter.max_dc_voltage_v)
    max_by_voc = math.floor(absolute_dc_limit / cold_voc_unit)
    max_by_mppt = math.floor(inverter.mppt_max_v / cold_vmp_unit)
    maximum = min(max_by_voc, max_by_mppt)
    minimum = math.ceil(inverter.mppt_min_v / hot_vmp_unit)
    return minimum, maximum, cold_voc_unit, hot_vmp_unit


def _choose_modules_per_string(req: DetailedDesignRequest, minimum: int, maximum: int) -> int:
    if minimum > maximum:
        return 0
    if req.requested_modules_per_string:
        return req.requested_modules_per_string
    target_v = req.inverter.mppt_min_v + 0.65 * (req.inverter.mppt_max_v - req.inverter.mppt_min_v)
    vmp_coeff = req.pv_module.temp_coeff_vmp_pct_c if req.pv_module.temp_coeff_vmp_pct_c is not None else req.pv_module.temp_coeff_voc_pct_c
    nominal_vmp = corrected_voltage(req.pv_module.vmp_v, vmp_coeff, 25)
    suggested = round(target_v / nominal_vmp)
    return max(minimum, min(maximum, suggested))


def compile_design(req: DetailedDesignRequest) -> tuple[ElectricalDesignModel, list[Validation]]:
    validations: list[Validation] = []
    if req.minimum_cell_temp_c >= req.maximum_cell_temp_c:
        validations.append(check("temperature_range", "error", "Temperature range is invalid", "Minimum cell temperature must be below maximum cell temperature."))

    minimum, maximum, cold_voc_unit, hot_vmp_unit = _string_window(req)
    modules_per_string = _choose_modules_per_string(req, minimum, maximum)
    if minimum > maximum or modules_per_string <= 0:
        validations.append(check("string_window", "error", "No valid module string length", f"Calculated string window is {minimum}–{maximum} modules for the selected datasheets and temperature range."))
        modules_per_string = max(1, minimum)
    elif not minimum <= modules_per_string <= maximum:
        validations.append(check("string_length", "error", "Selected string length is outside the valid window", f"Use {minimum}–{maximum} modules per string for the selected datasheets."))

    raw_modules = math.ceil(req.target_pv_kwp * 1000 / req.pv_module.pmax_w)
    total_strings = max(1, math.ceil(raw_modules / modules_per_string))
    module_quantity = total_strings * modules_per_string
    array_kwp = module_quantity * req.pv_module.pmax_w / 1000

    quantity_from_ratio = math.ceil(array_kwp / (req.inverter.rated_ac_power_kw * req.target_dc_ac_ratio))
    quantity_from_pv_limit = math.ceil(array_kwp / req.inverter.max_pv_input_power_kw)
    inverter_quantity = req.requested_inverter_quantity or max(1, quantity_from_ratio, quantity_from_pv_limit)
    inverter_ac_kw = inverter_quantity * req.inverter.rated_ac_power_kw
    dc_ac_ratio = array_kwp / inverter_ac_kw
    total_mppts = inverter_quantity * req.inverter.mppt_count
    strings_per_mppt = math.ceil(total_strings / total_mppts)

    cold_string_voc = corrected_voltage(req.pv_module.voc_v, req.pv_module.temp_coeff_voc_pct_c, req.minimum_cell_temp_c) * modules_per_string
    vmp_coeff = req.pv_module.temp_coeff_vmp_pct_c if req.pv_module.temp_coeff_vmp_pct_c is not None else req.pv_module.temp_coeff_voc_pct_c
    hot_string_vmp = corrected_voltage(req.pv_module.vmp_v, vmp_coeff, req.maximum_cell_temp_c) * modules_per_string

    dc_limit = min(req.pv_module.max_system_voltage_v, req.inverter.max_dc_voltage_v)
    validations.append(check("cold_voc", "pass" if cold_string_voc <= dc_limit else "error", "Cold string Voc" if cold_string_voc <= dc_limit else "Cold string Voc exceeds DC limit", f"Calculated cold Voc {cold_string_voc:.1f} V; governing DC limit {dc_limit:.1f} V."))
    validations.append(check("hot_vmp", "pass" if hot_string_vmp >= req.inverter.mppt_min_v else "error", "Hot Vmp inside MPPT range" if hot_string_vmp >= req.inverter.mppt_min_v else "Hot Vmp below MPPT minimum", f"Calculated hot Vmp {hot_string_vmp:.1f} V; MPPT minimum {req.inverter.mppt_min_v:.1f} V."))

    operating_current = req.pv_module.imp_a * strings_per_mppt
    short_circuit_current = req.pv_module.isc_a * strings_per_mppt
    validations.append(check("mppt_current", "pass" if operating_current <= req.inverter.max_input_current_per_mppt_a else "error", "MPPT operating current compliant" if operating_current <= req.inverter.max_input_current_per_mppt_a else "MPPT operating current exceeded", f"Calculated {operating_current:.2f} A vs {req.inverter.max_input_current_per_mppt_a:.2f} A maximum."))
    validations.append(check("mppt_isc", "pass" if short_circuit_current <= req.inverter.max_short_circuit_current_per_mppt_a else "error", "MPPT short-circuit current compliant" if short_circuit_current <= req.inverter.max_short_circuit_current_per_mppt_a else "MPPT short-circuit current exceeded", f"Calculated {short_circuit_current:.2f} A vs {req.inverter.max_short_circuit_current_per_mppt_a:.2f} A maximum."))
    if req.inverter.max_strings_per_mppt is not None:
        validations.append(check("strings_per_mppt", "pass" if strings_per_mppt <= req.inverter.max_strings_per_mppt else "error", "String input count compliant" if strings_per_mppt <= req.inverter.max_strings_per_mppt else "String input count exceeded", f"Maximum allocation {strings_per_mppt} strings/MPPT vs datasheet limit {req.inverter.max_strings_per_mppt}."))
    if array_kwp > req.inverter.max_pv_input_power_kw * inverter_quantity:
        validations.append(check("max_pv_power", "error", "Maximum PV input power exceeded", "Selected inverter quantity cannot accept the calculated array capacity."))

    groups: list[StringGroup] = []
    remaining = total_strings
    for inverter_index in range(1, inverter_quantity + 1):
        for mppt_index in range(1, req.inverter.mppt_count + 1):
            slots_left = (inverter_quantity - inverter_index) * req.inverter.mppt_count + (req.inverter.mppt_count - mppt_index + 1)
            count = math.ceil(remaining / slots_left) if remaining > 0 else 0
            groups.append(StringGroup(inverter_index=inverter_index, mppt_index=mppt_index, strings_count=count, modules_per_string=modules_per_string))
            remaining -= count

    battery_system = None
    if req.system_type.value != "on_grid":
        if req.battery is None:
            validations.append(check("battery_required", "error", "Battery datasheet is required", "Off-grid and Hybrid detailed design requires a selected battery product."))
        else:
            if req.system_type.value == "off_grid":
                if not req.autonomy_hours:
                    validations.append(check("autonomy_required", "error", "Autonomy hours are required", "Off-grid battery design requires autonomy duration."))
                    required_usable = 0
                else:
                    required_usable = req.load.average_daily_energy_kwh * req.autonomy_hours / 24
                required_power = req.load.peak_demand_kw
            else:
                backup_load = req.backup_load_kw or req.load.essential_peak_demand_kw
                if not req.backup_hours or backup_load <= 0:
                    validations.append(check("backup_basis", "error", "Hybrid backup basis is incomplete", "Provide backup duration and a positive governed backup load."))
                    required_usable = 0
                else:
                    required_usable = backup_load * req.backup_hours
                required_power = backup_load

            quantity_energy = math.ceil(required_usable / req.battery.usable_capacity_kwh) if required_usable > 0 else 0
            quantity_power = math.ceil(required_power / req.battery.max_discharge_power_kw) if required_power > 0 else 0
            quantity = max(1, quantity_energy, quantity_power)
            voltage_compatible = None
            if req.inverter.battery_voltage_min_v is not None and req.inverter.battery_voltage_max_v is not None and req.battery.operating_voltage_min_v is not None and req.battery.operating_voltage_max_v is not None:
                voltage_compatible = max(req.inverter.battery_voltage_min_v, req.battery.operating_voltage_min_v) <= min(req.inverter.battery_voltage_max_v, req.battery.operating_voltage_max_v)
                validations.append(check("battery_voltage", "pass" if voltage_compatible else "error", "Battery voltage window compatible" if voltage_compatible else "Battery voltage window incompatible", "Selected battery operating-voltage range was compared against the inverter battery-voltage window."))
            else:
                validations.append(check("battery_voltage_evidence", "warning", "Battery voltage compatibility needs review", "One or both datasheets do not contain a complete operating-voltage window."))
            battery_system = BatterySubsystem(
                battery=req.battery,
                quantity=quantity,
                required_usable_kwh=required_usable,
                installed_usable_kwh=quantity * req.battery.usable_capacity_kwh,
                required_power_kw=required_power,
                installed_discharge_power_kw=quantity * req.battery.max_discharge_power_kw,
                voltage_compatible=voltage_compatible,
            )

    cable_results: list[CableRunResult] = []
    for run in req.cable_runs:
        factor = math.sqrt(3) if run.phase == "three" else 2 if run.phase in ("dc", "single") else 1
        drop_v = factor * run.design_current_a * run.cable.resistance_ohm_per_km * (run.length_m / 1000)
        drop_pct = drop_v / run.system_voltage_v * 100
        ampacity_ok = run.design_current_a <= run.cable.ampacity_a
        voltage_ok = None if run.cable.max_voltage_v is None else run.system_voltage_v <= run.cable.max_voltage_v
        cable_results.append(CableRunResult(input=run, voltage_drop_v=drop_v, voltage_drop_pct=drop_pct, ampacity_ok=ampacity_ok, voltage_ok=voltage_ok))
        validations.append(check(f"cable_ampacity_{run.name}", "pass" if ampacity_ok else "error", f"{run.name} cable ampacity" if ampacity_ok else f"{run.name} cable ampacity exceeded", f"Design current {run.design_current_a:.2f} A vs datasheet ampacity {run.cable.ampacity_a:.2f} A."))
        validations.append(check(f"cable_drop_{run.name}", "pass" if drop_pct <= run.max_voltage_drop_pct else "warning", f"{run.name} voltage drop", f"Calculated voltage drop {drop_pct:.2f}% against the project review threshold {run.max_voltage_drop_pct:.2f}%."))

    protection_results: list[ProtectionResult] = []
    for selection in req.protection:
        current_ok = None if selection.device.rated_current_a is None else selection.device.rated_current_a >= selection.required_current_a
        voltage_ok = None if selection.device.rated_voltage_v is None else selection.device.rated_voltage_v >= selection.required_voltage_v
        protection_results.append(ProtectionResult(selection=selection, current_rating_ok=current_ok, voltage_rating_ok=voltage_ok))
        if current_ok is False or voltage_ok is False:
            validations.append(check(f"protection_{selection.location}", "error", f"Protection selection at {selection.location} is underspecified", "Selected device rating is below the required current or voltage."))
        else:
            validations.append(check(f"protection_{selection.location}", "warning", f"Protection selection at {selection.location} needs standards review", "Nominal ratings are checked; breaking capacity, coordination and the applicable IEC/Pakistan rules remain an explicit engineering approval step."))

    pv = PvSubsystem(
        module=req.pv_module,
        inverter=req.inverter,
        module_quantity=module_quantity,
        modules_per_string=modules_per_string,
        total_strings=total_strings,
        inverter_quantity=inverter_quantity,
        array_capacity_kwp=array_kwp,
        inverter_ac_capacity_kw=inverter_ac_kw,
        dc_ac_ratio=dc_ac_ratio,
        minimum_modules_per_string=minimum,
        maximum_modules_per_string=maximum,
        cold_string_voc_v=cold_string_voc,
        hot_string_vmp_v=hot_string_vmp,
        strings_per_mppt_max=strings_per_mppt,
        string_groups=groups,
    )
    model = ElectricalDesignModel(engine_version=HELIOCALC_VERSION, system_type=req.system_type, load=req.load, pv=pv, battery=battery_system, cables=cable_results, protection=protection_results)
    if not any(item.severity == "error" for item in validations):
        validations.append(check("design_compiled", "pass", "Datasheet-driven design compiled", "The canonical ElectricalDesignModel is internally consistent. Standards-dependent approvals remain visible review gates."))
    return model, validations
