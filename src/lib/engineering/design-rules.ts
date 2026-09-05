import type { EngineeringIntake, EngineeringValidation, SystemType } from "./types";

export const systemTypeLabels: Record<SystemType, string> = {
  on_grid: "On-grid",
  off_grid: "Off-grid",
  hybrid: "Hybrid",
};

export const systemTypeDescriptions: Record<SystemType, string> = {
  on_grid: "Grid-connected PV with load-led self-consumption, import/export analysis and grid constraints.",
  off_grid: "Standalone supply where load, autonomy and storage determine PV, inverter and battery requirements.",
  hybrid: "Grid-connected PV and BESS with backup, self-consumption, peak-shaving and reserve-SOC controls.",
};

export function validateEngineeringIntake(intake: EngineeringIntake): EngineeringValidation[] {
  const results: EngineeringValidation[] = [];

  if (!intake.systemType) {
    results.push({ code: "SYSTEM_TYPE_REQUIRED", severity: "error", title: "System type required", detail: "Choose On-grid, Off-grid or Hybrid before engineering can begin." });
  }

  if (!intake.loadProfileSource) {
    results.push({ code: "LOAD_PROFILE_REQUIRED", severity: "error", title: "Load profile required", detail: "Every system type must have a load profile or a governed load estimate." });
  } else {
    results.push({ code: "LOAD_PROFILE_PRESENT", severity: "pass", title: "Load profile path selected", detail: "The design has a defined load-data source." });
  }

  if (intake.systemType === "off_grid" && (!intake.autonomyHours || intake.autonomyHours <= 0)) {
    results.push({ code: "AUTONOMY_REQUIRED", severity: "error", title: "Autonomy target required", detail: "Off-grid design requires a positive autonomy target before BESS sizing." });
  }

  if (intake.systemType === "hybrid" && (intake.reserveSocPct == null || intake.reserveSocPct < 0 || intake.reserveSocPct > 100)) {
    results.push({ code: "RESERVE_SOC_REQUIRED", severity: "warning", title: "Reserve SOC not defined", detail: "Set a battery reserve SOC between 0% and 100% for hybrid backup behaviour." });
  }

  if (intake.systemType === "on_grid" && intake.exportLimitKw == null) {
    results.push({ code: "EXPORT_LIMIT_UNKNOWN", severity: "warning", title: "Export limit not recorded", detail: "Record the permitted export limit or explicitly confirm no export constraint." });
  }

  if (!results.some((result) => result.severity === "error")) {
    results.push({ code: "INTAKE_READY", severity: "pass", title: "Engineering intake ready", detail: "The shared project inputs can proceed into system-specific design calculations." });
  }

  return results;
}
