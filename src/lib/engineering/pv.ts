import type { EngineeringValidation } from "./types";

export type PvModuleSpec = {
  ratedPowerWp: number;
  vocV: number;
  vmpV: number;
  iscA: number;
  impA: number;
  tempCoeffVocPctPerC: number;
  tempCoeffVmpPctPerC?: number;
};

export type InverterSpec = {
  ratedAcPowerKw: number;
  maxDcVoltageV: number;
  mpptMinVoltageV: number;
  mpptMaxVoltageV: number;
  maxInputCurrentPerMpptA?: number;
  maxShortCircuitCurrentPerMpptA?: number;
};

export function calculateModuleCount(targetCapacityKwp: number, modulePowerWp: number) {
  if (targetCapacityKwp <= 0 || modulePowerWp <= 0) return 0;
  return Math.ceil((targetCapacityKwp * 1000) / modulePowerWp);
}

export function calculateArrayCapacityKwp(moduleCount: number, modulePowerWp: number) {
  if (moduleCount <= 0 || modulePowerWp <= 0) return 0;
  return (moduleCount * modulePowerWp) / 1000;
}

export function calculateDcAcRatio(arrayCapacityKwp: number, inverterAcCapacityKw: number) {
  if (arrayCapacityKwp <= 0 || inverterAcCapacityKw <= 0) return 0;
  return arrayCapacityKwp / inverterAcCapacityKw;
}

export function temperatureCorrectedVoltage(
  stcVoltageV: number,
  tempCoeffPctPerC: number,
  cellTemperatureC: number,
) {
  if (stcVoltageV <= 0) return 0;
  return stcVoltageV * (1 + (tempCoeffPctPerC / 100) * (cellTemperatureC - 25));
}

export function maximumModulesPerString(module: PvModuleSpec, inverter: InverterSpec, minimumCellTemperatureC: number) {
  const coldVoc = temperatureCorrectedVoltage(module.vocV, module.tempCoeffVocPctPerC, minimumCellTemperatureC);
  if (coldVoc <= 0 || inverter.maxDcVoltageV <= 0) return 0;
  return Math.floor(inverter.maxDcVoltageV / coldVoc);
}

export function validateStringConfiguration(args: {
  module: PvModuleSpec;
  inverter: InverterSpec;
  modulesPerString: number;
  stringsPerMppt: number;
  minimumCellTemperatureC: number;
  maximumCellTemperatureC: number;
}): EngineeringValidation[] {
  const { module, inverter, modulesPerString, stringsPerMppt, minimumCellTemperatureC, maximumCellTemperatureC } = args;
  const validations: EngineeringValidation[] = [];

  const coldVoc = temperatureCorrectedVoltage(module.vocV, module.tempCoeffVocPctPerC, minimumCellTemperatureC) * modulesPerString;
  const vmpCoefficient = module.tempCoeffVmpPctPerC ?? module.tempCoeffVocPctPerC;
  const hotVmp = temperatureCorrectedVoltage(module.vmpV, vmpCoefficient, maximumCellTemperatureC) * modulesPerString;
  const stcVmp = module.vmpV * modulesPerString;

  if (coldVoc > inverter.maxDcVoltageV) {
    validations.push({
      code: "STRING_MAX_DC_VOLTAGE",
      severity: "error",
      title: "Cold string voltage exceeds inverter limit",
      detail: `Calculated cold Voc is ${coldVoc.toFixed(1)} V against an inverter maximum of ${inverter.maxDcVoltageV.toFixed(1)} V.`,
    });
  } else {
    validations.push({
      code: "STRING_MAX_DC_VOLTAGE",
      severity: "pass",
      title: "Maximum DC voltage compliant",
      detail: `Calculated cold Voc is ${coldVoc.toFixed(1)} V.`,
    });
  }

  if (hotVmp < inverter.mpptMinVoltageV) {
    validations.push({
      code: "STRING_MPPT_MIN_VOLTAGE",
      severity: "error",
      title: "Hot operating voltage falls below MPPT window",
      detail: `Calculated hot Vmp is ${hotVmp.toFixed(1)} V against an MPPT minimum of ${inverter.mpptMinVoltageV.toFixed(1)} V.`,
    });
  } else if (stcVmp > inverter.mpptMaxVoltageV) {
    validations.push({
      code: "STRING_MPPT_MAX_VOLTAGE",
      severity: "error",
      title: "Operating voltage exceeds MPPT window",
      detail: `String Vmp at STC is ${stcVmp.toFixed(1)} V against an MPPT maximum of ${inverter.mpptMaxVoltageV.toFixed(1)} V.`,
    });
  } else {
    validations.push({
      code: "STRING_MPPT_WINDOW",
      severity: "pass",
      title: "String operates inside MPPT voltage window",
      detail: `Hot Vmp is ${hotVmp.toFixed(1)} V and STC Vmp is ${stcVmp.toFixed(1)} V.`,
    });
  }

  if (inverter.maxInputCurrentPerMpptA) {
    const operatingCurrent = module.impA * stringsPerMppt;
    validations.push({
      code: "MPPT_INPUT_CURRENT",
      severity: operatingCurrent > inverter.maxInputCurrentPerMpptA ? "error" : "pass",
      title: operatingCurrent > inverter.maxInputCurrentPerMpptA ? "MPPT input current exceeded" : "MPPT input current compliant",
      detail: `Calculated operating current is ${operatingCurrent.toFixed(2)} A against ${inverter.maxInputCurrentPerMpptA.toFixed(2)} A maximum.`,
    });
  }

  if (inverter.maxShortCircuitCurrentPerMpptA) {
    const shortCircuitCurrent = module.iscA * stringsPerMppt;
    validations.push({
      code: "MPPT_SHORT_CIRCUIT_CURRENT",
      severity: shortCircuitCurrent > inverter.maxShortCircuitCurrentPerMpptA ? "error" : "pass",
      title: shortCircuitCurrent > inverter.maxShortCircuitCurrentPerMpptA ? "MPPT short-circuit current exceeded" : "MPPT short-circuit current compliant",
      detail: `Calculated Isc is ${shortCircuitCurrent.toFixed(2)} A against ${inverter.maxShortCircuitCurrentPerMpptA.toFixed(2)} A maximum.`,
    });
  }

  return validations;
}
