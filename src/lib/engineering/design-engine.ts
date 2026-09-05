import { calculateArrayCapacityKwp, calculateDcAcRatio, calculateModuleCount, temperatureCorrectedVoltage, validateStringConfiguration } from "./pv";
import type { EngineeringValidation, SystemType } from "./types";

export const DESIGN_ENGINE_VERSION = "1.0.0";

export type DesignModule = {
  id: string;
  model: string;
  pmaxW: number;
  vocV: number;
  vmpV: number;
  iscA: number;
  impA: number;
  tempCoeffVocPctC: number;
  maxSystemVoltageV: number;
};

export type DesignInverter = {
  id: string;
  model: string;
  inverterType: "grid_tied" | "off_grid" | "hybrid" | "pcs";
  ratedAcPowerKw: number;
  maxPvInputPowerKw: number;
  maxDcVoltageV: number;
  mpptMinV: number;
  mpptMaxV: number;
  mpptCount: number;
  maxInputCurrentPerMpptA: number;
  maxShortCircuitCurrentPerMpptA: number;
  maxDischargePowerKw?: number | null;
};

export type DesignBattery = {
  id: string;
  model: string;
  usableCapacityKwh: number;
  maxDischargePowerKw: number;
};

export type StringGroup = {
  inverterIndex: number;
  mpptIndex: number;
  stringsCount: number;
  modulesPerString: number;
};

export type PvDesignInput = {
  systemType: SystemType;
  targetPvKwp: number;
  targetDcAcRatio: number;
  minimumCellTempC: number;
  maximumCellTempC: number;
  module: DesignModule;
  inverter: DesignInverter;
  modulesPerString?: number;
  inverterQuantity?: number;
};

export type PvDesignResult = {
  requestedModuleCount: number;
  installedModuleCount: number;
  arrayCapacityKwp: number;
  inverterQuantity: number;
  inverterCapacityKw: number;
  dcAcRatio: number;
  minimumModulesPerString: number;
  maximumModulesPerString: number;
  suggestedModulesPerString: number;
  modulesPerString: number;
  totalStrings: number;
  maximumStringsPerMppt: number;
  stringGroups: StringGroup[];
  validations: EngineeringValidation[];
};

export function systemTypeSupportsInverter(systemType: SystemType, inverterType: DesignInverter["inverterType"]) {
  if (systemType === "on_grid") return inverterType === "grid_tied" || inverterType === "hybrid";
  if (systemType === "off_grid") return inverterType === "off_grid" || inverterType === "hybrid";
  return inverterType === "hybrid" || inverterType === "pcs";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function stringLengthWindow(module: DesignModule, inverter: DesignInverter, minimumCellTempC: number, maximumCellTempC: number) {
  const coldVoc = temperatureCorrectedVoltage(module.vocV, module.tempCoeffVocPctC, minimumCellTempC);
  const hotVmp = temperatureCorrectedVoltage(module.vmpV, module.tempCoeffVocPctC, maximumCellTempC);
  const maxSystemVoltage = Math.min(inverter.maxDcVoltageV, module.maxSystemVoltageV);
  const maximumByVoc = coldVoc > 0 ? Math.floor(maxSystemVoltage / coldVoc) : 0;
  const maximumByMppt = module.vmpV > 0 ? Math.floor(inverter.mpptMaxV / module.vmpV) : 0;
  const maximum = Math.max(0, Math.min(maximumByVoc, maximumByMppt));
  const minimum = hotVmp > 0 ? Math.max(1, Math.ceil(inverter.mpptMinV / hotVmp)) : 0;
  const midpoint = (inverter.mpptMinV + inverter.mpptMaxV) / 2;
  const suggested = maximum >= minimum ? clamp(Math.round(midpoint / module.vmpV), minimum, maximum) : 0;
  return { minimum, maximum, suggested, coldVocPerModule: coldVoc, hotVmpPerModule: hotVmp };
}

export function allocateStrings(totalStrings: number, inverterQuantity: number, mpptCount: number, modulesPerString: number): StringGroup[] {
  const slots = Math.max(1, inverterQuantity * mpptCount);
  const base = Math.floor(totalStrings / slots);
  let remainder = totalStrings % slots;
  const groups: StringGroup[] = [];
  for (let inverterIndex = 1; inverterIndex <= inverterQuantity; inverterIndex += 1) {
    for (let mpptIndex = 1; mpptIndex <= mpptCount; mpptIndex += 1) {
      const stringsCount = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
      if (stringsCount > 0) groups.push({ inverterIndex, mpptIndex, stringsCount, modulesPerString });
    }
  }
  return groups;
}

export function buildPvDesign(input: PvDesignInput): PvDesignResult {
  const { module, inverter } = input;
  const validations: EngineeringValidation[] = [];

  if (!systemTypeSupportsInverter(input.systemType, inverter.inverterType)) {
    validations.push({ code: "INVERTER_SYSTEM_TYPE", severity: "error", title: "Inverter type does not match the system architecture", detail: `${inverter.model} is ${inverter.inverterType.replaceAll("_", " ")} and is not valid for ${input.systemType.replaceAll("_", " ")}.` });
  } else {
    validations.push({ code: "INVERTER_SYSTEM_TYPE", severity: "pass", title: "Inverter architecture compatible", detail: `${inverter.model} can be used for this ${input.systemType.replaceAll("_", " ")} design.` });
  }

  const requestedModuleCount = calculateModuleCount(input.targetPvKwp, module.pmaxW);
  const window = stringLengthWindow(module, inverter, input.minimumCellTempC, input.maximumCellTempC);
  if (window.maximum < window.minimum || window.maximum === 0) {
    validations.push({ code: "STRING_LENGTH_WINDOW", severity: "error", title: "No valid string-length window", detail: `The approved module and inverter do not produce a valid string length at ${input.minimumCellTempC}°C to ${input.maximumCellTempC}°C cell-temperature assumptions.` });
  }

  const modulesPerString = input.modulesPerString ?? window.suggested;
  if (modulesPerString < window.minimum || modulesPerString > window.maximum) {
    validations.push({ code: "STRING_LENGTH_SELECTION", severity: "error", title: "Selected string length is outside the calculated window", detail: `Use ${window.minimum}–${window.maximum} modules per string for the current temperature assumptions.` });
  } else {
    validations.push({ code: "STRING_LENGTH_SELECTION", severity: "pass", title: "String length is inside the calculated window", detail: `${modulesPerString} modules per string is within the calculated ${window.minimum}–${window.maximum} range.` });
  }

  const safeModulesPerString = Math.max(1, modulesPerString || 1);
  const totalStrings = Math.max(1, Math.ceil(requestedModuleCount / safeModulesPerString));
  const installedModuleCount = totalStrings * safeModulesPerString;
  const arrayCapacityKwp = calculateArrayCapacityKwp(installedModuleCount, module.pmaxW);
  const recommendedInverterQuantity = Math.max(1, Math.ceil(arrayCapacityKwp / Math.max(0.1, inverter.ratedAcPowerKw * input.targetDcAcRatio)));
  const inverterQuantity = input.inverterQuantity ?? recommendedInverterQuantity;
  const inverterCapacityKw = inverterQuantity * inverter.ratedAcPowerKw;
  const dcAcRatio = calculateDcAcRatio(arrayCapacityKwp, inverterCapacityKw);
  const stringGroups = allocateStrings(totalStrings, inverterQuantity, inverter.mpptCount, safeModulesPerString);
  const maximumStringsPerMppt = stringGroups.reduce((max, group) => Math.max(max, group.stringsCount), 0);

  validations.push(...validateStringConfiguration({
    module: {
      ratedPowerWp: module.pmaxW,
      vocV: module.vocV,
      vmpV: module.vmpV,
      iscA: module.iscA,
      impA: module.impA,
      tempCoeffVocPctPerC: module.tempCoeffVocPctC,
    },
    inverter: {
      ratedAcPowerKw: inverter.ratedAcPowerKw,
      maxDcVoltageV: Math.min(inverter.maxDcVoltageV, module.maxSystemVoltageV),
      mpptMinVoltageV: inverter.mpptMinV,
      mpptMaxVoltageV: inverter.mpptMaxV,
      maxInputCurrentPerMpptA: inverter.maxInputCurrentPerMpptA,
      maxShortCircuitCurrentPerMpptA: inverter.maxShortCircuitCurrentPerMpptA,
    },
    modulesPerString: safeModulesPerString,
    stringsPerMppt: maximumStringsPerMppt,
    minimumCellTemperatureC: input.minimumCellTempC,
    maximumCellTemperatureC: input.maximumCellTempC,
  }));

  const dcPerInverter = arrayCapacityKwp / inverterQuantity;
  validations.push({
    code: "INVERTER_MAX_PV_POWER",
    severity: dcPerInverter > inverter.maxPvInputPowerKw ? "error" : "pass",
    title: dcPerInverter > inverter.maxPvInputPowerKw ? "Manufacturer PV input limit exceeded" : "PV input power within manufacturer limit",
    detail: `${dcPerInverter.toFixed(2)} kWp DC per inverter against ${inverter.maxPvInputPowerKw.toFixed(2)} kW maximum PV input.`,
  });

  const ratioDelta = Math.abs(dcAcRatio - input.targetDcAcRatio);
  validations.push({
    code: "DC_AC_TARGET",
    severity: ratioDelta > 0.15 ? "warning" : "pass",
    title: ratioDelta > 0.15 ? "DC/AC ratio differs materially from design target" : "DC/AC ratio close to design target",
    detail: `Calculated DC/AC ratio is ${dcAcRatio.toFixed(2)} against the engineer target of ${input.targetDcAcRatio.toFixed(2)}.`,
  });

  if (installedModuleCount > requestedModuleCount) {
    validations.push({ code: "FULL_STRING_ROUNDING", severity: "warning", title: "Array rounded to complete strings", detail: `${installedModuleCount - requestedModuleCount} additional module(s) were added so every string has the selected length.` });
  }

  return {
    requestedModuleCount,
    installedModuleCount,
    arrayCapacityKwp,
    inverterQuantity,
    inverterCapacityKw,
    dcAcRatio,
    minimumModulesPerString: window.minimum,
    maximumModulesPerString: window.maximum,
    suggestedModulesPerString: window.suggested,
    modulesPerString: safeModulesPerString,
    totalStrings,
    maximumStringsPerMppt,
    stringGroups,
    validations,
  };
}

export function sizeBatteryUnits(args: { requiredUsableEnergyKwh: number; requiredPowerKw: number; battery: DesignBattery }) {
  const energyUnits = args.requiredUsableEnergyKwh > 0 ? Math.ceil(args.requiredUsableEnergyKwh / args.battery.usableCapacityKwh) : 0;
  const powerUnits = args.requiredPowerKw > 0 ? Math.ceil(args.requiredPowerKw / args.battery.maxDischargePowerKw) : 0;
  const quantity = Math.max(energyUnits, powerUnits, 1);
  return {
    quantity,
    installedUsableEnergyKwh: quantity * args.battery.usableCapacityKwh,
    installedDischargePowerKw: quantity * args.battery.maxDischargePowerKw,
    energyUnits,
    powerUnits,
  };
}
