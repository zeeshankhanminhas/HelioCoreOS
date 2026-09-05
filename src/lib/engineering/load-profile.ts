import type { LoadProfileInterval, LoadProfileSummary } from "./types";

const HOURS_PER_YEAR = 8760;
const DAYS_PER_YEAR = 365;

export function summarizeLoadProfile(intervals: LoadProfileInterval[]): LoadProfileSummary {
  if (!intervals.length) {
    return {
      annualEnergyKwh: 0,
      averageDailyEnergyKwh: 0,
      peakDemandKw: 0,
      essentialPeakDemandKw: 0,
      intervalCount: 0,
    };
  }

  const annualEnergyKwh = intervals.reduce((sum, interval) => sum + Math.max(0, interval.energyKwh), 0);
  const peakDemandKw = intervals.reduce((peak, interval) => Math.max(peak, Math.max(0, interval.demandKw)), 0);
  const essentialPeakDemandKw = intervals.reduce(
    (peak, interval) => interval.essential ? Math.max(peak, Math.max(0, interval.demandKw)) : peak,
    0,
  );

  return {
    annualEnergyKwh,
    averageDailyEnergyKwh: annualEnergyKwh / DAYS_PER_YEAR,
    peakDemandKw,
    essentialPeakDemandKw,
    intervalCount: intervals.length,
  };
}

export function annualizeEnergy(energyKwh: number, coveredHours: number) {
  if (energyKwh < 0 || coveredHours <= 0) return 0;
  return energyKwh * (HOURS_PER_YEAR / coveredHours);
}

export function estimateDailyEnergyFromMonthlyBills(monthlyKwh: number[]) {
  const valid = monthlyKwh.filter((value) => Number.isFinite(value) && value >= 0);
  if (!valid.length) return 0;
  const annual = valid.reduce((sum, value) => sum + value, 0) * (12 / valid.length);
  return annual / DAYS_PER_YEAR;
}
