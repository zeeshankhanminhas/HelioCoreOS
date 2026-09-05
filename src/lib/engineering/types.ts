export type SystemType = "on_grid" | "off_grid" | "hybrid";

export type LoadProfileSource =
  | "interval_data"
  | "utility_bills"
  | "appliance_schedule"
  | "manual_summary";

export type LoadProfileInterval = {
  timestamp: string;
  demandKw: number;
  energyKwh: number;
  essential?: boolean;
  category?: string;
};

export type LoadProfileSummary = {
  annualEnergyKwh: number;
  averageDailyEnergyKwh: number;
  peakDemandKw: number;
  essentialPeakDemandKw: number;
  intervalCount: number;
};

export type DesignObjective =
  | "reduce_imports"
  | "maximize_self_consumption"
  | "backup_resilience"
  | "off_grid_autonomy"
  | "peak_shaving"
  | "export_generation";

export type EngineeringIntake = {
  systemType: SystemType;
  loadProfileSource: LoadProfileSource;
  objective: DesignObjective;
  targetPvCapacityKwp?: number;
  autonomyHours?: number;
  exportLimitKw?: number;
  reserveSocPct?: number;
};

export type ValidationSeverity = "pass" | "warning" | "error";

export type EngineeringValidation = {
  code: string;
  severity: ValidationSeverity;
  title: string;
  detail: string;
};
