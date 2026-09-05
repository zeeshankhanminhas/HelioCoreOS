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

export type LoadProfileUtilityBill = {
  month: string;
  energyKwh: number;
  peakDemandKw?: number;
  costAmount?: number;
};

export type LoadProfileAppliance = {
  name: string;
  category?: string;
  ratedKw: number;
  quantity: number;
  hoursPerDay: number;
  daysPerWeek: number;
  simultaneityPct: number;
  essential: boolean;
};

export type LoadProfileSummary = {
  annualEnergyKwh: number;
  averageDailyEnergyKwh: number;
  peakDemandKw: number;
  essentialPeakDemandKw: number;
  intervalCount: number;
  coveredHours?: number;
};

export type LoadProfileAssessment = {
  code: string;
  severity: "pass" | "warning" | "error";
  title: string;
  detail: string;
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

export type EquipmentStatus = "draft" | "approved" | "retired";
export type InverterType = "grid_tied" | "off_grid" | "hybrid" | "pcs";
export type ElectricalPhase = "single" | "three";
export type ModuleTechnology = "mono" | "topcon" | "hjt" | "thin_film" | "other";
export type BatteryChemistry = "lfp" | "nmc" | "lead_acid" | "other";
export type CompatibilityStatus = "approved" | "conditional" | "not_compatible";

export type PvModuleSpec = {
  pmaxW: number;
  vocV: number;
  vmpV: number;
  iscA: number;
  impA: number;
  tempCoeffVocPctC?: number | null;
  maxSystemVoltageV?: number | null;
  datasheetUrl?: string | null;
};

export type InverterSpec = {
  inverterType: InverterType;
  ratedAcPowerKw: number;
  maxPvInputPowerKw?: number | null;
  maxDcVoltageV: number;
  mpptMinV: number;
  mpptMaxV: number;
  mpptCount: number;
  maxInputCurrentPerMpptA: number;
  maxShortCircuitCurrentPerMpptA: number;
  batteryVoltageMinV?: number | null;
  batteryVoltageMaxV?: number | null;
  maxChargePowerKw?: number | null;
  maxDischargePowerKw?: number | null;
  datasheetUrl?: string | null;
};

export type BatterySpec = {
  nominalCapacityKwh: number;
  usableCapacityKwh: number;
  nominalVoltageV: number;
  operatingVoltageMinV?: number | null;
  operatingVoltageMaxV?: number | null;
  maxChargePowerKw: number;
  maxDischargePowerKw: number;
  maxDodPct?: number | null;
  roundTripEfficiencyPct?: number | null;
  datasheetUrl?: string | null;
};
