import type { EngineeringValidation, SystemType } from "./types";

// Browser/UI preview only. Persisted engineering calculations are recomputed by Python HelioCalc.
export const CALCULATOR_PREVIEW_VERSION = "calculator-preview-v1.0.0";

export type CalculatorInputs = {
  systemType: SystemType;
  annualEnergyKwh: number;
  averageDailyEnergyKwh: number;
  peakDemandKw: number;
  essentialPeakDemandKw: number;
  targetSolarContributionPct?: number;
  specificYieldKwhPerKwpYear?: number;
  targetDcAcRatio?: number;
  peakSunHoursPerDay?: number;
  systemEfficiencyPct?: number;
  autonomyHours?: number;
  backupHours?: number;
  backupLoadKw?: number;
  batteryDodPct?: number;
  inverterHeadroomPct?: number;
};

export type CalculatorResult = {
  recommendedPvKwp: number | null;
  recommendedInverterAcKw: number | null;
  estimatedAnnualPvGenerationKwh: number | null;
  batteryUsableKwh: number | null;
  batteryNominalKwh: number | null;
  batteryPowerKw: number | null;
  validations: EngineeringValidation[];
};

function positive(value: number | undefined) {
  return value != null && Number.isFinite(value) && value > 0;
}

function pct(value: number | undefined) {
  return value != null && Number.isFinite(value) && value > 0 && value <= 100;
}

function push(checks: EngineeringValidation[], severity: EngineeringValidation["severity"], code: string, title: string, detail: string) {
  checks.push({ severity, code, title, detail });
}

export function calculateSystemSizing(input: CalculatorInputs): CalculatorResult {
  const checks: EngineeringValidation[] = [];
  const headroom = (input.inverterHeadroomPct ?? 20) / 100;
  let recommendedPvKwp: number | null = null;
  let recommendedInverterAcKw: number | null = null;
  let estimatedAnnualPvGenerationKwh: number | null = null;
  let batteryUsableKwh: number | null = null;
  let batteryNominalKwh: number | null = null;
  let batteryPowerKw: number | null = null;

  if (!positive(input.peakDemandKw)) {
    push(checks, input.systemType === "on_grid" ? "warning" : "error", "peak_demand", "Peak demand is missing", "A credible peak demand is needed to size inverter power, especially for Off-grid and Hybrid systems.");
  }

  if (input.systemType === "off_grid") {
    if (!positive(input.averageDailyEnergyKwh)) push(checks, "error", "daily_energy", "Daily energy is missing", "Off-grid PV and storage sizing require a governed average daily energy demand.");
    if (!positive(input.peakSunHoursPerDay)) push(checks, "error", "solar_resource", "Peak sun hours are required", "Enter the site-specific design peak-sun-hours assumption before sizing an Off-grid array.");
    if (!pct(input.systemEfficiencyPct)) push(checks, "error", "system_efficiency", "System efficiency is invalid", "Enter an overall system efficiency between 0 and 100 percent.");
    if (!positive(input.autonomyHours)) push(checks, "error", "autonomy", "Autonomy requirement is missing", "Off-grid storage sizing requires the autonomy duration defined for the engineering intake.");
    if (!pct(input.batteryDodPct)) push(checks, "error", "battery_dod", "Battery DoD assumption is invalid", "Enter the maximum design depth of discharge between 0 and 100 percent.");

    if (!checks.some((item) => item.severity === "error")) {
      const efficiency = (input.systemEfficiencyPct ?? 0) / 100;
      recommendedPvKwp = input.averageDailyEnergyKwh / ((input.peakSunHoursPerDay ?? 0) * efficiency);
      estimatedAnnualPvGenerationKwh = recommendedPvKwp * (input.peakSunHoursPerDay ?? 0) * 365 * efficiency;
      batteryUsableKwh = input.averageDailyEnergyKwh * ((input.autonomyHours ?? 0) / 24);
      batteryNominalKwh = batteryUsableKwh / ((input.batteryDodPct ?? 0) / 100);
      batteryPowerKw = input.peakDemandKw;
      recommendedInverterAcKw = input.peakDemandKw * (1 + headroom);
    }
  } else {
    if (!positive(input.annualEnergyKwh)) push(checks, "error", "annual_energy", "Annual energy is missing", "On-grid and Hybrid PV sizing use the governed annual energy demand.");
    if (!positive(input.specificYieldKwhPerKwpYear)) push(checks, "error", "specific_yield", "Specific yield is required", "Enter the site-specific annual yield assumption in kWh/kWp/year.");
    if (!pct(input.targetSolarContributionPct)) push(checks, "error", "solar_contribution", "Solar contribution target is invalid", "Set the share of annual demand the PV system should target between 0 and 100 percent.");
    if (!positive(input.targetDcAcRatio)) push(checks, "error", "dc_ac_ratio", "Target DC/AC ratio is required", "Enter the preliminary DC/AC ratio used to estimate inverter AC capacity.");

    if (!checks.some((item) => item.severity === "error")) {
      recommendedPvKwp = (input.annualEnergyKwh * ((input.targetSolarContributionPct ?? 0) / 100)) / (input.specificYieldKwhPerKwpYear ?? 1);
      estimatedAnnualPvGenerationKwh = recommendedPvKwp * (input.specificYieldKwhPerKwpYear ?? 0);
      recommendedInverterAcKw = recommendedPvKwp / (input.targetDcAcRatio ?? 1);

      if (input.peakDemandKw > 0 && recommendedInverterAcKw > input.peakDemandKw) {
        push(checks, "warning", "export_exposure", "PV inverter estimate exceeds recorded peak demand", "The preliminary AC capacity exceeds the recorded site peak. Review export limits, operating profile and self-consumption before detailed design.");
      }
    }

    if (input.systemType === "hybrid") {
      if (!positive(input.backupHours)) push(checks, "error", "backup_hours", "Backup duration is required", "Hybrid storage sizing needs a defined backup duration.");
      if (!positive(input.backupLoadKw)) push(checks, "error", "backup_load", "Backup load is required", "Use the essential load profile or another governed backup-load assumption.");
      if (!pct(input.batteryDodPct)) push(checks, "error", "battery_dod", "Battery DoD assumption is invalid", "Enter the maximum design depth of discharge between 0 and 100 percent.");

      if (positive(input.backupHours) && positive(input.backupLoadKw) && pct(input.batteryDodPct)) {
        batteryUsableKwh = (input.backupLoadKw ?? 0) * (input.backupHours ?? 0);
        batteryNominalKwh = batteryUsableKwh / ((input.batteryDodPct ?? 0) / 100);
        batteryPowerKw = input.backupLoadKw ?? null;
        const backupInverter = (input.backupLoadKw ?? 0) * (1 + headroom);
        recommendedInverterAcKw = Math.max(recommendedInverterAcKw ?? 0, backupInverter);
      }
    }
  }

  if (input.targetDcAcRatio != null && (input.targetDcAcRatio < 0.8 || input.targetDcAcRatio > 1.6)) {
    push(checks, "warning", "dc_ac_plausibility", "DC/AC ratio needs review", "The preliminary DC/AC ratio is outside the broad 0.8–1.6 plausibility band. Treat this as an engineering review prompt, not a compliance limit.");
  }

  if (input.systemType === "off_grid" && input.systemEfficiencyPct != null && (input.systemEfficiencyPct < 60 || input.systemEfficiencyPct > 95)) {
    push(checks, "warning", "efficiency_plausibility", "System efficiency assumption needs review", "The Off-grid system-efficiency assumption is outside the broad 60–95% plausibility band. Confirm the site and technology assumptions.");
  }

  if (!checks.some((item) => item.severity === "error")) {
    push(checks, "pass", "calculator_preview_ready", "Preliminary preview is complete", "This browser result is a preview only. Saving the revision triggers authoritative Python HelioCalc recomputation.");
  }

  return {
    recommendedPvKwp,
    recommendedInverterAcKw,
    estimatedAnnualPvGenerationKwh,
    batteryUsableKwh,
    batteryNominalKwh,
    batteryPowerKw,
    validations: checks,
  };
}
