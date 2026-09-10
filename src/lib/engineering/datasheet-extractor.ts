export type EquipmentImportCategory = "pv_module" | "inverter" | "battery";

type ExtractionResult = {
  model: string | null;
  specs: Record<string, string | number | boolean | null>;
  confidence: Record<string, "high" | "missing">;
  completeness: number;
};

function numberMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const value = Number(String(match[1]).replace(/,/g, ""));
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function textMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim().replace(/\s{2,}/g, " ").slice(0, 120);
  }
  return null;
}

function collect(specs: Record<string, string | number | boolean | null>, required: string[]) {
  const confidence: Record<string, "high" | "missing"> = {};
  let present = 0;
  for (const key of required) {
    const value = specs[key];
    const hasValue = value !== null && value !== undefined && value !== "";
    confidence[key] = hasValue ? "high" : "missing";
    if (hasValue) present += 1;
  }
  return { confidence, completeness: required.length ? Math.round((present / required.length) * 100) : 100 };
}

function modelFromText(text: string) {
  return textMatch(text, [
    /(?:model(?:\s+no\.?|\s+number)?|type)\s*[:#]?\s*([A-Z0-9][A-Z0-9._\-\/]{3,40})/i,
    /(?:module type|inverter model|battery model)\s*[:#]?\s*([A-Z0-9][A-Z0-9._\-\/]{3,40})/i,
  ]);
}

function extractPvModule(text: string): ExtractionResult {
  const specs = {
    technology: textMatch(text, [/(?:cell type|technology)\s*[:]?\s*([^\n]{3,60})/i]),
    pmax_w: numberMatch(text, [/(?:maximum power|rated power|pmax|pmax\s*\(w\))[^\d]{0,30}(\d{3,4}(?:\.\d+)?)/i]),
    voc_v: numberMatch(text, [/(?:open[ -]?circuit voltage|voc)[^\d]{0,20}(\d{1,3}(?:\.\d+)?)/i]),
    vmp_v: numberMatch(text, [/(?:voltage at (?:pmax|maximum power)|vmp|vmpp)[^\d]{0,20}(\d{1,3}(?:\.\d+)?)/i]),
    isc_a: numberMatch(text, [/(?:short[ -]?circuit current|isc)[^\d]{0,20}(\d{1,3}(?:\.\d+)?)/i]),
    imp_a: numberMatch(text, [/(?:current at (?:pmax|maximum power)|imp|impp)[^\d]{0,20}(\d{1,3}(?:\.\d+)?)/i]),
    temp_coeff_pmax_pct_c: numberMatch(text, [/(?:temperature coefficient[^\n]{0,25}(?:pmax|pmax)|temp\. coefficient[^\n]{0,25}pmax)[^\-+\d]{0,12}([\-+]?\d+(?:\.\d+)?)/i]),
    temp_coeff_voc_pct_c: numberMatch(text, [/(?:temperature coefficient[^\n]{0,25}voc|temp\. coefficient[^\n]{0,25}voc)[^\-+\d]{0,12}([\-+]?\d+(?:\.\d+)?)/i]),
    temp_coeff_isc_pct_c: numberMatch(text, [/(?:temperature coefficient[^\n]{0,25}isc|temp\. coefficient[^\n]{0,25}isc)[^\-+\d]{0,12}([\-+]?\d+(?:\.\d+)?)/i]),
    max_system_voltage_v: numberMatch(text, [/(?:maximum|max\.?)(?: system)? voltage[^\d]{0,20}(\d{3,4})/i]),
    efficiency_pct: numberMatch(text, [/(?:module efficiency|efficiency)[^\d]{0,20}(\d{1,2}(?:\.\d+)?)/i]),
    width_mm: null,
    height_mm: null,
    weight_kg: numberMatch(text, [/(?:weight)[^\d]{0,20}(\d{1,3}(?:\.\d+)?)\s*kg/i]),
    bifacial: /bifacial/i.test(text),
  } as Record<string, string | number | boolean | null>;
  const dimensions = text.match(/(\d{3,4})\s*[×xX]\s*(\d{3,4})(?:\s*[×xX]\s*\d+(?:\.\d+)?)?\s*mm/i);
  if (dimensions) {
    specs.height_mm = Number(dimensions[1]);
    specs.width_mm = Number(dimensions[2]);
  }
  const required = ["pmax_w","voc_v","vmp_v","isc_a","imp_a","temp_coeff_voc_pct_c","max_system_voltage_v"];
  const summary = collect(specs, required);
  return { model: modelFromText(text), specs, ...summary };
}

function extractInverter(text: string): ExtractionResult {
  const specs = {
    inverter_type: textMatch(text, [/(?:inverter type|topology)\s*[:]?\s*([^\n]{3,50})/i]),
    phase: /three[ -]?phase|3[ -]?phase/i.test(text) ? "three_phase" : /single[ -]?phase|1[ -]?phase/i.test(text) ? "single_phase" : null,
    rated_ac_power_kw: numberMatch(text, [/(?:rated (?:ac )?(?:output )?power|nominal ac power)[^\d]{0,25}(\d+(?:\.\d+)?)\s*k?w/i]),
    max_pv_input_power_kw: numberMatch(text, [/(?:max(?:imum)? (?:recommended )?(?:pv|dc) input power)[^\d]{0,25}(\d+(?:\.\d+)?)\s*k?w/i]),
    max_dc_voltage_v: numberMatch(text, [/(?:max(?:imum)? (?:dc|input) voltage)[^\d]{0,20}(\d{2,4}(?:\.\d+)?)/i]),
    mppt_min_v: null,
    mppt_max_v: null,
    mppt_count: numberMatch(text, [/(?:number of mppt|no\. of mppt|mppt trackers?)[^\d]{0,20}(\d{1,2})/i]),
    max_input_current_per_mppt_a: numberMatch(text, [/(?:max(?:imum)? input current(?: per mppt)?)[^\d]{0,25}(\d+(?:\.\d+)?)/i]),
    max_short_circuit_current_per_mppt_a: numberMatch(text, [/(?:max(?:imum)? short[ -]?circuit current(?: per mppt)?)[^\d]{0,25}(\d+(?:\.\d+)?)/i]),
    max_charge_power_kw: numberMatch(text, [/(?:max(?:imum)? charge power)[^\d]{0,25}(\d+(?:\.\d+)?)\s*k?w/i]),
    max_discharge_power_kw: numberMatch(text, [/(?:max(?:imum)? discharge power)[^\d]{0,25}(\d+(?:\.\d+)?)\s*k?w/i]),
    battery_voltage_min_v: null,
    battery_voltage_max_v: null,
    max_efficiency_pct: numberMatch(text, [/(?:max(?:imum)? efficiency)[^\d]{0,20}(\d{1,3}(?:\.\d+)?)/i]),
  } as Record<string, string | number | boolean | null>;
  const mppt = text.match(/(?:mppt|mpp)(?: voltage)? range[^\d]{0,20}(\d{2,4}(?:\.\d+)?)\s*(?:-|–|~|to)\s*(\d{2,4}(?:\.\d+)?)/i);
  if (mppt) { specs.mppt_min_v = Number(mppt[1]); specs.mppt_max_v = Number(mppt[2]); }
  const batt = text.match(/battery voltage range[^\d]{0,20}(\d{2,4}(?:\.\d+)?)\s*(?:-|–|~|to)\s*(\d{2,4}(?:\.\d+)?)/i);
  if (batt) { specs.battery_voltage_min_v = Number(batt[1]); specs.battery_voltage_max_v = Number(batt[2]); }
  const required = ["rated_ac_power_kw","max_dc_voltage_v","mppt_min_v","mppt_max_v","mppt_count","max_input_current_per_mppt_a"];
  const summary = collect(specs, required);
  return { model: modelFromText(text), specs, ...summary };
}

function extractBattery(text: string): ExtractionResult {
  const specs = {
    chemistry: textMatch(text, [/(?:cell chemistry|chemistry|battery type)\s*[:]?\s*([^\n]{2,50})/i]),
    nominal_capacity_kwh: numberMatch(text, [/(?:nominal (?:energy|capacity)|rated energy)[^\d]{0,20}(\d+(?:\.\d+)?)\s*kwh/i]),
    usable_capacity_kwh: numberMatch(text, [/(?:usable (?:energy|capacity))[^\d]{0,20}(\d+(?:\.\d+)?)\s*kwh/i]),
    nominal_voltage_v: numberMatch(text, [/(?:nominal voltage)[^\d]{0,20}(\d+(?:\.\d+)?)\s*v/i]),
    operating_voltage_min_v: null,
    operating_voltage_max_v: null,
    max_charge_power_kw: numberMatch(text, [/(?:max(?:imum)? charge power)[^\d]{0,20}(\d+(?:\.\d+)?)\s*kw/i]),
    max_discharge_power_kw: numberMatch(text, [/(?:max(?:imum)? discharge power)[^\d]{0,20}(\d+(?:\.\d+)?)\s*kw/i]),
    max_dod_pct: numberMatch(text, [/(?:depth of discharge|dod)[^\d]{0,20}(\d+(?:\.\d+)?)\s*%/i]),
    round_trip_efficiency_pct: numberMatch(text, [/(?:round[ -]?trip efficiency|rt efficiency)[^\d]{0,20}(\d+(?:\.\d+)?)\s*%/i]),
    cycle_life: numberMatch(text, [/(?:cycle life|cycles)[^\d]{0,20}(\d{3,6})/i]),
  } as Record<string, string | number | boolean | null>;
  const voltage = text.match(/(?:operating|working) voltage(?: range)?[^\d]{0,20}(\d+(?:\.\d+)?)\s*(?:-|–|~|to)\s*(\d+(?:\.\d+)?)\s*v/i);
  if (voltage) { specs.operating_voltage_min_v = Number(voltage[1]); specs.operating_voltage_max_v = Number(voltage[2]); }
  const required = ["nominal_capacity_kwh","usable_capacity_kwh","nominal_voltage_v","max_discharge_power_kw"];
  const summary = collect(specs, required);
  return { model: modelFromText(text), specs, ...summary };
}

export function extractEquipmentSpecs(category: EquipmentImportCategory, rawText: string): ExtractionResult {
  const text = rawText.replace(/\u0000/g, " ").replace(/[ \t]+/g, " ");
  if (category === "pv_module") return extractPvModule(text);
  if (category === "inverter") return extractInverter(text);
  return extractBattery(text);
}
