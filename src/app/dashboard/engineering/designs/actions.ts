"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildPvDesign, DESIGN_ENGINE_VERSION, sizeBatteryUnits } from "@/lib/engineering/design-engine";
import type { SystemType } from "@/lib/engineering/types";

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function requiredNumber(fd: FormData, key: string) {
  const raw = text(fd, key);
  const value = Number(raw);
  if (!raw || !Number.isFinite(value)) throw new Error(`${key.replaceAll("_", " ")} is required.`);
  return value;
}

function optionalNumber(fd: FormData, key: string) {
  const raw = text(fd, key);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${key.replaceAll("_", " ")} must be a valid number.`);
  return value;
}

function fail(intakeId: string, message: string): never {
  redirect(`/dashboard/engineering/designs/${intakeId}?error=${encodeURIComponent(message)}`);
}

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organisation_id").eq("id", user.id).single();
  if (!profile?.organisation_id) throw new Error("Organisation context missing");
  return { supabase, user, organisationId: profile.organisation_id };
}

export async function saveDesignRevision(fd: FormData) {
  const intakeId = text(fd, "engineering_intake_id");
  if (!intakeId) fail("missing", "Engineering intake identifier is missing.");

  const { supabase, user, organisationId } = await context();

  try {
    const moduleId = text(fd, "pv_module_id");
    const inverterId = text(fd, "inverter_id");
    const batteryId = text(fd, "battery_id") || null;
    const targetPvKwp = requiredNumber(fd, "target_pv_kwp");
    const targetDcAcRatio = requiredNumber(fd, "target_dc_ac_ratio");
    const minimumCellTempC = requiredNumber(fd, "minimum_cell_temp_c");
    const maximumCellTempC = requiredNumber(fd, "maximum_cell_temp_c");
    const modulesPerString = optionalNumber(fd, "modules_per_string");
    const inverterQuantity = optionalNumber(fd, "inverter_quantity");
    const backupHours = optionalNumber(fd, "backup_hours") ?? 0;
    const backupLoadKwInput = optionalNumber(fd, "backup_load_kw");

    if (!moduleId || !inverterId) throw new Error("Choose an approved PV module and inverter.");
    if (targetPvKwp <= 0 || targetDcAcRatio <= 0) throw new Error("PV capacity and target DC/AC ratio must be greater than zero.");
    if (minimumCellTempC >= maximumCellTempC) throw new Error("Minimum cell temperature must be lower than maximum cell temperature.");
    if (modulesPerString != null && (!Number.isInteger(modulesPerString) || modulesPerString <= 0)) throw new Error("Modules per string must be a positive whole number.");
    if (inverterQuantity != null && (!Number.isInteger(inverterQuantity) || inverterQuantity <= 0)) throw new Error("Inverter quantity must be a positive whole number.");

    const [{ data: intake }, { data: module }, { data: inverter }] = await Promise.all([
      supabase.from("engineering_intakes").select("id,opportunity_id,site_id,load_profile_id,system_type,design_objective,autonomy_hours,export_limit_kw,reserve_soc_pct,status").eq("id", intakeId).eq("organisation_id", organisationId).maybeSingle(),
      supabase.from("pv_modules").select("id,manufacturer_id,model,pmax_w,voc_v,vmp_v,isc_a,imp_a,temp_coeff_voc_pct_c,max_system_voltage_v,status").eq("id", moduleId).eq("organisation_id", organisationId).eq("status", "approved").maybeSingle(),
      supabase.from("inverters").select("id,manufacturer_id,model,inverter_type,rated_ac_power_kw,max_pv_input_power_kw,max_dc_voltage_v,mppt_min_v,mppt_max_v,mppt_count,max_input_current_per_mppt_a,max_short_circuit_current_per_mppt_a,max_discharge_power_kw,status").eq("id", inverterId).eq("organisation_id", organisationId).eq("status", "approved").maybeSingle(),
    ]);

    if (!intake?.load_profile_id) throw new Error("This intake does not have a linked load profile.");
    if (!module || module.temp_coeff_voc_pct_c == null || module.max_system_voltage_v == null) throw new Error("The selected module is not complete enough for governed string sizing.");
    if (!inverter || inverter.max_pv_input_power_kw == null) throw new Error("The selected inverter is not complete enough for governed PV sizing.");

    const [{ data: loadProfile }, { data: opportunity }, { data: latestSurvey }] = await Promise.all([
      supabase.from("load_profiles").select("id,status,annual_energy_kwh,average_daily_energy_kwh,peak_demand_kw,essential_peak_demand_kw").eq("id", intake.load_profile_id).eq("organisation_id", organisationId).maybeSingle(),
      supabase.from("opportunities").select("id,reference,title").eq("id", intake.opportunity_id).eq("organisation_id", organisationId).maybeSingle(),
      supabase.from("site_surveys").select("id").eq("opportunity_id", intake.opportunity_id).eq("organisation_id", organisationId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (!loadProfile || loadProfile.status !== "ready") throw new Error("Mark the load profile Ready before creating a design revision.");
    if (!opportunity) throw new Error("Opportunity context is unavailable.");

    const pvResult = buildPvDesign({
      systemType: intake.system_type as SystemType,
      targetPvKwp,
      targetDcAcRatio,
      minimumCellTempC,
      maximumCellTempC,
      modulesPerString: modulesPerString ?? undefined,
      inverterQuantity: inverterQuantity ?? undefined,
      module: {
        id: module.id,
        model: module.model,
        pmaxW: Number(module.pmax_w),
        vocV: Number(module.voc_v),
        vmpV: Number(module.vmp_v),
        iscA: Number(module.isc_a),
        impA: Number(module.imp_a),
        tempCoeffVocPctC: Number(module.temp_coeff_voc_pct_c),
        maxSystemVoltageV: Number(module.max_system_voltage_v),
      },
      inverter: {
        id: inverter.id,
        model: inverter.model,
        inverterType: inverter.inverter_type,
        ratedAcPowerKw: Number(inverter.rated_ac_power_kw),
        maxPvInputPowerKw: Number(inverter.max_pv_input_power_kw),
        maxDcVoltageV: Number(inverter.max_dc_voltage_v),
        mpptMinV: Number(inverter.mppt_min_v),
        mpptMaxV: Number(inverter.mppt_max_v),
        mpptCount: Number(inverter.mppt_count),
        maxInputCurrentPerMpptA: Number(inverter.max_input_current_per_mppt_a),
        maxShortCircuitCurrentPerMpptA: Number(inverter.max_short_circuit_current_per_mppt_a),
        maxDischargePowerKw: inverter.max_discharge_power_kw == null ? null : Number(inverter.max_discharge_power_kw),
      },
    });

    let battery: null | { id: string; manufacturer_id: string; model: string; nominal_capacity_kwh: number; usable_capacity_kwh: number; max_discharge_power_kw: number } = null;
    let batteryResult: null | ReturnType<typeof sizeBatteryUnits> = null;
    let compatibilityStatus: string | null = null;
    let requiredBatteryEnergyKwh = 0;
    let requiredBatteryPowerKw = 0;

    if (intake.system_type !== "on_grid") {
      if (!batteryId) throw new Error("Off-grid and Hybrid designs require an approved battery selection.");
      const { data: selectedBattery } = await supabase.from("batteries").select("id,manufacturer_id,model,nominal_capacity_kwh,usable_capacity_kwh,max_discharge_power_kw,status").eq("id", batteryId).eq("organisation_id", organisationId).eq("status", "approved").maybeSingle();
      if (!selectedBattery) throw new Error("The selected battery is unavailable or not approved.");
      battery = {
        id: selectedBattery.id,
        manufacturer_id: selectedBattery.manufacturer_id,
        model: selectedBattery.model,
        nominal_capacity_kwh: Number(selectedBattery.nominal_capacity_kwh),
        usable_capacity_kwh: Number(selectedBattery.usable_capacity_kwh),
        max_discharge_power_kw: Number(selectedBattery.max_discharge_power_kw),
      };

      const { data: compatibility } = await supabase.from("inverter_battery_compatibility").select("status,min_battery_units,max_battery_units").eq("organisation_id", organisationId).eq("inverter_id", inverter.id).eq("battery_id", battery.id).maybeSingle();
      compatibilityStatus = compatibility?.status ?? null;
      if (!compatibility || compatibility.status === "not_compatible") throw new Error("The selected inverter and battery do not have an approved or conditional compatibility record.");

      if (intake.system_type === "off_grid") {
        const autonomyHours = Number(intake.autonomy_hours ?? 0);
        requiredBatteryEnergyKwh = Number(loadProfile.average_daily_energy_kwh ?? 0) * (autonomyHours / 24);
        requiredBatteryPowerKw = Number(loadProfile.peak_demand_kw ?? 0);
      } else {
        const backupLoadKw = backupLoadKwInput ?? Number(loadProfile.essential_peak_demand_kw ?? loadProfile.peak_demand_kw ?? 0);
        if (backupHours <= 0 || backupLoadKw <= 0) throw new Error("Hybrid design needs a positive backup duration and backup load.");
        requiredBatteryEnergyKwh = backupLoadKw * backupHours;
        requiredBatteryPowerKw = backupLoadKw;
      }

      batteryResult = sizeBatteryUnits({
        requiredUsableEnergyKwh: requiredBatteryEnergyKwh,
        requiredPowerKw: requiredBatteryPowerKw,
        battery: { id: battery.id, model: battery.model, usableCapacityKwh: battery.usable_capacity_kwh, maxDischargePowerKw: battery.max_discharge_power_kw },
      });

      if (compatibility.min_battery_units != null && batteryResult.quantity < Number(compatibility.min_battery_units)) batteryResult.quantity = Number(compatibility.min_battery_units);
      if (compatibility.max_battery_units != null && batteryResult.quantity > Number(compatibility.max_battery_units)) throw new Error(`Battery quantity exceeds the compatibility maximum of ${compatibility.max_battery_units}.`);
      batteryResult.installedUsableEnergyKwh = batteryResult.quantity * battery.usable_capacity_kwh;
      batteryResult.installedDischargePowerKw = batteryResult.quantity * battery.max_discharge_power_kw;
    }

    const manufacturerIds = [module.manufacturer_id, inverter.manufacturer_id, battery?.manufacturer_id].filter(Boolean) as string[];
    const { data: manufacturers } = await supabase.from("equipment_manufacturers").select("id,name").eq("organisation_id", organisationId).in("id", manufacturerIds);
    const manufacturerMap = new Map((manufacturers ?? []).map((item) => [item.id, item.name]));

    const { data: existing } = await supabase.from("system_designs").select("revision").eq("organisation_id", organisationId).eq("engineering_intake_id", intake.id).order("revision", { ascending: false }).limit(1).maybeSingle();
    const revision = Number(existing?.revision ?? 0) + 1;
    const designReference = `${opportunity.reference}-DES-${String(revision).padStart(2, "0")}`;

    const inputSnapshot = {
      systemType: intake.system_type,
      designObjective: intake.design_objective,
      loadProfileId: loadProfile.id,
      targetPvKwp,
      targetDcAcRatio,
      minimumCellTempC,
      maximumCellTempC,
      modulesPerString: pvResult.modulesPerString,
      inverterQuantity: pvResult.inverterQuantity,
      backupHours: intake.system_type === "hybrid" ? backupHours : null,
      backupLoadKw: intake.system_type === "hybrid" ? (backupLoadKwInput ?? Number(loadProfile.essential_peak_demand_kw ?? loadProfile.peak_demand_kw ?? 0)) : null,
      equipment: { pvModuleId: module.id, inverterId: inverter.id, batteryId: battery?.id ?? null },
    };

    const resultSnapshot = {
      pv: pvResult,
      battery: batteryResult ? { ...batteryResult, requiredUsableEnergyKwh: requiredBatteryEnergyKwh, requiredPowerKw: requiredBatteryPowerKw, compatibilityStatus } : null,
      load: {
        annualEnergyKwh: loadProfile.annual_energy_kwh,
        averageDailyEnergyKwh: loadProfile.average_daily_energy_kwh,
        peakDemandKw: loadProfile.peak_demand_kw,
        essentialPeakDemandKw: loadProfile.essential_peak_demand_kw,
      },
    };

    const { data: design, error: designError } = await supabase.from("system_designs").insert({
      organisation_id: organisationId,
      opportunity_id: intake.opportunity_id,
      site_id: intake.site_id,
      survey_id: latestSurvey?.id ?? null,
      engineering_intake_id: intake.id,
      design_reference: designReference,
      revision,
      status: "draft",
      system_type: intake.system_type,
      load_profile_id: loadProfile.id,
      pv_module_id: module.id,
      inverter_id: inverter.id,
      battery_id: battery?.id ?? null,
      engine_version: DESIGN_ENGINE_VERSION,
      input_snapshot: inputSnapshot,
      result_snapshot: resultSnapshot,
      validation_snapshot: pvResult.validations,
      minimum_cell_temp_c: minimumCellTempC,
      maximum_cell_temp_c: maximumCellTempC,
      modules_per_string: pvResult.modulesPerString,
      total_strings: pvResult.totalStrings,
      strings_per_mppt: pvResult.maximumStringsPerMppt,
      target_dc_ac_ratio: targetDcAcRatio,
      backup_hours: intake.system_type === "hybrid" ? backupHours : null,
      backup_load_kw: intake.system_type === "hybrid" ? (backupLoadKwInput ?? Number(loadProfile.essential_peak_demand_kw ?? loadProfile.peak_demand_kw ?? 0)) : null,
      module_manufacturer: manufacturerMap.get(module.manufacturer_id) ?? null,
      module_model: module.model,
      module_rating_wp: module.pmax_w,
      module_quantity: pvResult.installedModuleCount,
      array_capacity_kwp: pvResult.arrayCapacityKwp,
      inverter_manufacturer: manufacturerMap.get(inverter.manufacturer_id) ?? null,
      inverter_model: inverter.model,
      inverter_quantity: pvResult.inverterQuantity,
      inverter_capacity_kw: pvResult.inverterCapacityKw,
      dc_ac_ratio: pvResult.dcAcRatio,
      string_configuration: `${pvResult.totalStrings} strings × ${pvResult.modulesPerString} modules; max ${pvResult.maximumStringsPerMppt} strings/MPPT`,
      battery_manufacturer: battery ? manufacturerMap.get(battery.manufacturer_id) ?? null : null,
      battery_model: battery?.model ?? null,
      battery_quantity: batteryResult?.quantity ?? null,
      battery_capacity_kwh: battery && batteryResult ? battery.nominal_capacity_kwh * batteryResult.quantity : null,
      export_limit_kw: intake.export_limit_kw,
      design_basis: "HelioCoreOS governed engineering intake + approved equipment library",
      design_assumptions: `Cell temperature range ${minimumCellTempC}°C to ${maximumCellTempC}°C; target DC/AC ${targetDcAcRatio.toFixed(2)}.`,
      created_by: user.id,
    }).select("id").single();

    if (designError || !design) throw new Error(designError?.message ?? "Design revision could not be created.");

    const stringRows = pvResult.stringGroups.map((group) => ({ organisation_id: organisationId, system_design_id: design.id, inverter_index: group.inverterIndex, mppt_index: group.mpptIndex, strings_count: group.stringsCount, modules_per_string: group.modulesPerString }));
    const checkRows = pvResult.validations.map((check, index) => ({ organisation_id: organisationId, system_design_id: design.id, sequence_no: index + 1, code: check.code, severity: check.severity, title: check.title, detail: check.detail }));
    const [stringInsert, checkInsert] = await Promise.all([
      supabase.from("system_design_string_groups").insert(stringRows),
      supabase.from("system_design_checks").insert(checkRows),
    ]);
    if (stringInsert.error || checkInsert.error) {
      await supabase.from("system_designs").delete().eq("id", design.id).eq("organisation_id", organisationId);
      throw new Error(stringInsert.error?.message ?? checkInsert.error?.message ?? "Design detail records could not be saved.");
    }

    await supabase.from("activity_logs").insert({ organisation_id: organisationId, actor_id: user.id, event_type: "engineering.design_revision.created", description: `${designReference} created with HelioCoreOS engine ${DESIGN_ENGINE_VERSION}` });

    revalidatePath("/dashboard/engineering");
    revalidatePath(`/dashboard/engineering/designs/${intake.id}`);
    redirect(`/dashboard/engineering/designs/${intake.id}?saved=${design.id}`);
  } catch (error) {
    fail(intakeId, error instanceof Error ? error.message : "Design revision could not be created.");
  }
}
