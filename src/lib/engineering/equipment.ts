import type { BatterySpec, EngineeringValidation, InverterSpec, PvModuleSpec } from "./types";

export function assessPvModule(spec: PvModuleSpec): EngineeringValidation[] {
  const checks: EngineeringValidation[] = [];
  if (spec.vmpV >= spec.vocV) checks.push({ code: "module_voltage_order", severity: "error", title: "Module voltage values conflict", detail: "Vmp must be lower than Voc at STC." });
  if (spec.impA > spec.iscA) checks.push({ code: "module_current_order", severity: "error", title: "Module current values conflict", detail: "Imp should not exceed Isc at STC." });
  if (spec.tempCoeffVocPctC == null) checks.push({ code: "module_temp_coeff", severity: "warning", title: "Voc temperature coefficient missing", detail: "Cold-temperature string-voltage validation cannot be governed without the module Voc temperature coefficient." });
  if (spec.maxSystemVoltageV == null) checks.push({ code: "module_system_voltage", severity: "warning", title: "Maximum system voltage missing", detail: "Record the module maximum system voltage before approving it for design selection." });
  if (!spec.datasheetUrl) checks.push({ code: "module_datasheet", severity: "warning", title: "Datasheet evidence missing", detail: "Approved equipment should retain a traceable manufacturer datasheet." });
  if (!checks.length) checks.push({ code: "module_ready", severity: "pass", title: "Module specification complete", detail: "The core electrical values required by the string-sizing engine are present." });
  return checks;
}

export function assessInverter(spec: InverterSpec): EngineeringValidation[] {
  const checks: EngineeringValidation[] = [];
  if (spec.mpptMinV >= spec.mpptMaxV) checks.push({ code: "inverter_mppt_range", severity: "error", title: "MPPT range is invalid", detail: "MPPT minimum voltage must be lower than MPPT maximum voltage." });
  if (spec.mpptMaxV > spec.maxDcVoltageV) checks.push({ code: "inverter_dc_range", severity: "error", title: "MPPT range exceeds DC limit", detail: "MPPT maximum voltage cannot exceed the inverter maximum DC input voltage." });
  if (!spec.maxPvInputPowerKw) checks.push({ code: "inverter_pv_limit", severity: "warning", title: "Maximum PV input power missing", detail: "DC oversizing guardrails need the manufacturer maximum PV input power." });
  if (["hybrid", "off_grid", "pcs"].includes(spec.inverterType) && (spec.batteryVoltageMinV == null || spec.batteryVoltageMaxV == null)) {
    checks.push({ code: "inverter_battery_voltage", severity: "warning", title: "Battery voltage window missing", detail: "Battery compatibility cannot be validated until the supported battery voltage range is recorded." });
  }
  if (!spec.datasheetUrl) checks.push({ code: "inverter_datasheet", severity: "warning", title: "Datasheet evidence missing", detail: "Approved equipment should retain a traceable manufacturer datasheet." });
  if (!checks.length) checks.push({ code: "inverter_ready", severity: "pass", title: "Inverter specification complete", detail: "The core DC, MPPT and power limits required by the design engine are present." });
  return checks;
}

export function assessBattery(spec: BatterySpec): EngineeringValidation[] {
  const checks: EngineeringValidation[] = [];
  if (spec.usableCapacityKwh > spec.nominalCapacityKwh) checks.push({ code: "battery_capacity", severity: "error", title: "Usable capacity exceeds nominal capacity", detail: "Usable battery capacity cannot be higher than nominal stored energy." });
  if (spec.operatingVoltageMinV != null && spec.operatingVoltageMaxV != null && spec.operatingVoltageMinV >= spec.operatingVoltageMaxV) {
    checks.push({ code: "battery_voltage_range", severity: "error", title: "Battery voltage range is invalid", detail: "The minimum operating voltage must be lower than the maximum operating voltage." });
  }
  if (spec.maxDodPct == null) checks.push({ code: "battery_dod", severity: "warning", title: "Depth of discharge missing", detail: "Usable-energy and lifecycle calculations need the manufacturer DoD limit." });
  if (spec.roundTripEfficiencyPct == null) checks.push({ code: "battery_efficiency", severity: "warning", title: "Round-trip efficiency missing", detail: "Energy simulation should include the manufacturer round-trip efficiency." });
  if (!spec.datasheetUrl) checks.push({ code: "battery_datasheet", severity: "warning", title: "Datasheet evidence missing", detail: "Approved equipment should retain a traceable manufacturer datasheet." });
  if (!checks.length) checks.push({ code: "battery_ready", severity: "pass", title: "Battery specification complete", detail: "The core energy, voltage and charge/discharge limits required by BESS sizing are present." });
  return checks;
}

export function batteryVoltageOverlap(inverter: InverterSpec, battery: BatterySpec) {
  if (inverter.batteryVoltageMinV == null || inverter.batteryVoltageMaxV == null || battery.operatingVoltageMinV == null || battery.operatingVoltageMaxV == null) return null;
  return Math.max(inverter.batteryVoltageMinV, battery.operatingVoltageMinV) <= Math.min(inverter.batteryVoltageMaxV, battery.operatingVoltageMaxV);
}
