import type {
  LoadProfileAppliance,
  LoadProfileAssessment,
  LoadProfileInterval,
  LoadProfileSource,
  LoadProfileSummary,
  LoadProfileUtilityBill,
} from "./types";

const HOURS_PER_YEAR = 8760;
const DAYS_PER_YEAR = 365;

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function annualizeEnergy(energyKwh: number, coveredHours: number) {
  if (energyKwh < 0 || coveredHours <= 0) return 0;
  return energyKwh * (HOURS_PER_YEAR / coveredHours);
}

export function summarizeLoadProfile(intervals: LoadProfileInterval[], intervalMinutes = 60): LoadProfileSummary {
  if (!intervals.length) {
    return {
      annualEnergyKwh: 0,
      averageDailyEnergyKwh: 0,
      peakDemandKw: 0,
      essentialPeakDemandKw: 0,
      intervalCount: 0,
      coveredHours: 0,
    };
  }

  const intervalHours = intervalMinutes / 60;
  const coveredHours = intervals.length * intervalHours;
  const capturedEnergyKwh = intervals.reduce((sum, interval) => sum + Math.max(0, interval.energyKwh), 0);
  const annualEnergyKwh = annualizeEnergy(capturedEnergyKwh, coveredHours);
  const peakDemandKw = intervals.reduce((peak, interval) => Math.max(peak, Math.max(0, interval.demandKw)), 0);
  const essentialPeakDemandKw = intervals.reduce(
    (peak, interval) => interval.essential ? Math.max(peak, Math.max(0, interval.demandKw)) : peak,
    0,
  );

  return {
    annualEnergyKwh: round(annualEnergyKwh),
    averageDailyEnergyKwh: round(annualEnergyKwh / DAYS_PER_YEAR),
    peakDemandKw: round(peakDemandKw),
    essentialPeakDemandKw: round(essentialPeakDemandKw),
    intervalCount: intervals.length,
    coveredHours: round(coveredHours),
  };
}

export function summarizeUtilityBills(bills: LoadProfileUtilityBill[]): LoadProfileSummary {
  const valid = bills.filter((bill) => Number.isFinite(bill.energyKwh) && bill.energyKwh >= 0);
  if (!valid.length) return summarizeLoadProfile([]);

  const capturedEnergyKwh = valid.reduce((sum, bill) => sum + bill.energyKwh, 0);
  const annualEnergyKwh = capturedEnergyKwh * (12 / valid.length);
  const peakDemandKw = valid.reduce((peak, bill) => Math.max(peak, bill.peakDemandKw ?? 0), 0);

  return {
    annualEnergyKwh: round(annualEnergyKwh),
    averageDailyEnergyKwh: round(annualEnergyKwh / DAYS_PER_YEAR),
    peakDemandKw: round(peakDemandKw),
    essentialPeakDemandKw: 0,
    intervalCount: valid.length,
  };
}

export function summarizeApplianceSchedule(appliances: LoadProfileAppliance[]): LoadProfileSummary {
  const valid = appliances.filter((item) => item.ratedKw >= 0 && item.quantity > 0);
  const averageDailyEnergyKwh = valid.reduce(
    (sum, item) => sum + item.ratedKw * item.quantity * item.hoursPerDay * (item.daysPerWeek / 7),
    0,
  );
  const peakDemandKw = valid.reduce(
    (sum, item) => sum + item.ratedKw * item.quantity * (item.simultaneityPct / 100),
    0,
  );
  const essentialPeakDemandKw = valid.reduce(
    (sum, item) => item.essential ? sum + item.ratedKw * item.quantity * (item.simultaneityPct / 100) : sum,
    0,
  );

  return {
    annualEnergyKwh: round(averageDailyEnergyKwh * DAYS_PER_YEAR),
    averageDailyEnergyKwh: round(averageDailyEnergyKwh),
    peakDemandKw: round(peakDemandKw),
    essentialPeakDemandKw: round(essentialPeakDemandKw),
    intervalCount: valid.length,
  };
}

export function estimateDailyEnergyFromMonthlyBills(monthlyKwh: number[]) {
  const valid = monthlyKwh.filter((value) => Number.isFinite(value) && value >= 0);
  if (!valid.length) return 0;
  const annual = valid.reduce((sum, value) => sum + value, 0) * (12 / valid.length);
  return annual / DAYS_PER_YEAR;
}

export function assessLoadProfile(
  source: LoadProfileSource,
  summary: LoadProfileSummary,
  recordCount: number,
): LoadProfileAssessment[] {
  const checks: LoadProfileAssessment[] = [];

  if (summary.annualEnergyKwh <= 0) {
    checks.push({ code: "energy-missing", severity: "error", title: "Energy demand missing", detail: "Record enough demand information to calculate annual energy consumption." });
  } else {
    checks.push({ code: "energy-ready", severity: "pass", title: "Energy demand available", detail: `${summary.annualEnergyKwh.toLocaleString("en-GB")} kWh/year is available to the design engine.` });
  }

  if (summary.peakDemandKw <= 0) {
    checks.push({ code: "peak-missing", severity: "warning", title: "Peak demand not established", detail: "PV-only studies may proceed cautiously, but inverter and BESS sizing need a credible peak-demand value." });
  } else {
    checks.push({ code: "peak-ready", severity: "pass", title: "Peak demand available", detail: `${summary.peakDemandKw.toLocaleString("en-GB")} kW peak demand is recorded.` });
  }

  if (source === "interval_data") {
    const coveredHours = summary.coveredHours ?? 0;
    checks.push({
      code: "interval-coverage",
      severity: coveredHours >= 168 ? "pass" : coveredHours >= 24 ? "warning" : "error",
      title: "Interval-data coverage",
      detail: coveredHours >= 168 ? `${coveredHours} hours captured; enough for an initial operating-pattern study.` : `${coveredHours} hours captured. Aim for at least 168 hours and preferably a full year.`,
    });
  }

  if (source === "utility_bills") {
    checks.push({
      code: "bill-coverage",
      severity: recordCount >= 12 ? "pass" : recordCount >= 6 ? "warning" : "error",
      title: "Billing-history coverage",
      detail: recordCount >= 12 ? "Twelve months of billing history are available." : `${recordCount} month${recordCount === 1 ? "" : "s"} available; twelve months are preferred.`,
    });
  }

  if (source === "appliance_schedule") {
    checks.push({
      code: "appliance-coverage",
      severity: recordCount >= 3 ? "pass" : "warning",
      title: "Load schedule coverage",
      detail: `${recordCount} load item${recordCount === 1 ? "" : "s"} modelled. Confirm all material loads before detailed design.`,
    });
  }

  if (source === "manual_summary") {
    checks.push({ code: "manual-quality", severity: "warning", title: "Manual estimate", detail: "This profile is suitable for early-stage engineering only until measured, billed, or scheduled demand evidence replaces it." });
  }

  return checks;
}