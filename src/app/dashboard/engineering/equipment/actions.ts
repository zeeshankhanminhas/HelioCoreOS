"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const equipmentTabs = ["manufacturers", "modules", "inverters", "batteries", "compatibility"] as const;
type EquipmentTab = (typeof equipmentTabs)[number];
type EquipmentEntity = "pv_module" | "inverter" | "battery";

type DbClient = Awaited<ReturnType<typeof createClient>>;

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function requiredNumber(fd: FormData, key: string, label: string) {
  const raw = text(fd, key);
  const value = Number(raw);
  if (!raw || !Number.isFinite(value)) throw new Error(`${label} is required and must be a valid number.`);
  return value;
}

function optionalNumber(fd: FormData, key: string) {
  const raw = text(fd, key);
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${key.replaceAll("_", " ")} must be a valid number.`);
  return value;
}

function nullableUrl(fd: FormData, key: string) {
  const raw = text(fd, key);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    return raw;
  } catch {
    throw new Error(`${key.replaceAll("_", " ")} must be a valid HTTP or HTTPS URL.`);
  }
}

function fail(tab: EquipmentTab, message: string): never {
  redirect(`/dashboard/engineering/equipment?tab=${tab}&error=${encodeURIComponent(message)}`);
}

function success(tab: EquipmentTab, key: "created" | "updated" = "created"): never {
  revalidatePath("/dashboard/engineering/equipment");
  revalidatePath("/dashboard/engineering");
  redirect(`/dashboard/engineering/equipment?tab=${tab}&${key}=1`);
}

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organisation_id,role")
    .eq("id", user.id)
    .single();

  if (error || !profile?.organisation_id) throw new Error("Organisation context missing");
  return { supabase, user, organisationId: profile.organisation_id, role: profile.role };
}

async function manufacturerExists(supabase: DbClient, organisationId: string, manufacturerId: string) {
  const { data } = await supabase
    .from("equipment_manufacturers")
    .select("id")
    .eq("id", manufacturerId)
    .eq("organisation_id", organisationId)
    .eq("status", "active")
    .maybeSingle();
  return Boolean(data);
}

async function logEquipmentEvent(supabase: DbClient, organisationId: string, actorId: string, eventType: string, description: string) {
  const { error } = await supabase.from("activity_logs").insert({
    organisation_id: organisationId,
    actor_id: actorId,
    event_type: eventType,
    description,
  });
  if (error) throw new Error("The equipment change could not be written to the audit trail.");
}

export async function createManufacturer(fd: FormData) {
  const { supabase, user, organisationId } = await context();
  const name = text(fd, "name");
  if (!name) fail("manufacturers", "Manufacturer name is required.");

  try {
    const { error } = await supabase.from("equipment_manufacturers").insert({
      organisation_id: organisationId,
      name,
      country_of_origin: text(fd, "country_of_origin") || null,
      website_url: nullableUrl(fd, "website_url"),
      status: "active",
      created_by: user.id,
    });
    if (error) throw error;
    await logEquipmentEvent(supabase, organisationId, user.id, "equipment.manufacturer.created", `Manufacturer ${name} added to the technical library`);
  } catch (error) {
    fail("manufacturers", error instanceof Error ? error.message : "Manufacturer could not be created.");
  }
  success("manufacturers");
}

export async function setManufacturerStatus(fd: FormData) {
  const { supabase, user, organisationId } = await context();
  const id = text(fd, "id");
  const status = text(fd, "status");
  if (!id || !["active", "inactive"].includes(status)) fail("manufacturers", "Invalid manufacturer status change.");

  const { data, error } = await supabase
    .from("equipment_manufacturers")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organisation_id", organisationId)
    .select("name")
    .maybeSingle();
  if (error || !data) fail("manufacturers", error?.message ?? "Manufacturer could not be updated.");

  try {
    await logEquipmentEvent(supabase, organisationId, user.id, "equipment.manufacturer.status_changed", `${data.name} marked ${status}`);
  } catch (error) {
    fail("manufacturers", error instanceof Error ? error.message : "Manufacturer audit event failed.");
  }
  success("manufacturers", "updated");
}

export async function createPvModule(fd: FormData) {
  const { supabase, user, organisationId } = await context();
  const manufacturerId = text(fd, "manufacturer_id");
  const model = text(fd, "model");
  if (!manufacturerId || !(await manufacturerExists(supabase, organisationId, manufacturerId))) fail("modules", "Choose an active manufacturer.");
  if (!model) fail("modules", "Module model is required.");

  try {
    const payload = {
      organisation_id: organisationId,
      manufacturer_id: manufacturerId,
      model,
      technology: text(fd, "technology") || "mono",
      pmax_w: requiredNumber(fd, "pmax_w", "Pmax"),
      voc_v: requiredNumber(fd, "voc_v", "Voc"),
      vmp_v: requiredNumber(fd, "vmp_v", "Vmp"),
      isc_a: requiredNumber(fd, "isc_a", "Isc"),
      imp_a: requiredNumber(fd, "imp_a", "Imp"),
      temp_coeff_pmax_pct_c: optionalNumber(fd, "temp_coeff_pmax_pct_c"),
      temp_coeff_voc_pct_c: optionalNumber(fd, "temp_coeff_voc_pct_c"),
      temp_coeff_isc_pct_c: optionalNumber(fd, "temp_coeff_isc_pct_c"),
      max_system_voltage_v: optionalNumber(fd, "max_system_voltage_v"),
      efficiency_pct: optionalNumber(fd, "efficiency_pct"),
      width_mm: optionalNumber(fd, "width_mm"),
      height_mm: optionalNumber(fd, "height_mm"),
      weight_kg: optionalNumber(fd, "weight_kg"),
      bifacial: text(fd, "bifacial") === "on",
      datasheet_url: nullableUrl(fd, "datasheet_url"),
      status: "draft",
      created_by: user.id,
    };
    if (payload.vmp_v >= payload.voc_v) throw new Error("Vmp must be lower than Voc.");
    if (payload.imp_a > payload.isc_a) throw new Error("Imp cannot exceed Isc.");

    const { error } = await supabase.from("pv_modules").insert(payload);
    if (error) throw error;
    await logEquipmentEvent(supabase, organisationId, user.id, "equipment.pv_module.created", `PV module ${model} added as draft technical data`);
  } catch (error) {
    fail("modules", error instanceof Error ? error.message : "PV module could not be created.");
  }
  success("modules");
}

export async function createInverter(fd: FormData) {
  const { supabase, user, organisationId } = await context();
  const manufacturerId = text(fd, "manufacturer_id");
  const model = text(fd, "model");
  if (!manufacturerId || !(await manufacturerExists(supabase, organisationId, manufacturerId))) fail("inverters", "Choose an active manufacturer.");
  if (!model) fail("inverters", "Inverter model is required.");

  try {
    const payload = {
      organisation_id: organisationId,
      manufacturer_id: manufacturerId,
      model,
      inverter_type: text(fd, "inverter_type"),
      phase: text(fd, "phase"),
      rated_ac_power_kw: requiredNumber(fd, "rated_ac_power_kw", "Rated AC power"),
      max_pv_input_power_kw: optionalNumber(fd, "max_pv_input_power_kw"),
      max_dc_voltage_v: requiredNumber(fd, "max_dc_voltage_v", "Maximum DC voltage"),
      mppt_min_v: requiredNumber(fd, "mppt_min_v", "MPPT minimum voltage"),
      mppt_max_v: requiredNumber(fd, "mppt_max_v", "MPPT maximum voltage"),
      mppt_count: requiredNumber(fd, "mppt_count", "MPPT count"),
      max_input_current_per_mppt_a: requiredNumber(fd, "max_input_current_per_mppt_a", "Maximum MPPT input current"),
      max_short_circuit_current_per_mppt_a: requiredNumber(fd, "max_short_circuit_current_per_mppt_a", "Maximum MPPT short-circuit current"),
      max_charge_power_kw: optionalNumber(fd, "max_charge_power_kw"),
      max_discharge_power_kw: optionalNumber(fd, "max_discharge_power_kw"),
      battery_voltage_min_v: optionalNumber(fd, "battery_voltage_min_v"),
      battery_voltage_max_v: optionalNumber(fd, "battery_voltage_max_v"),
      max_efficiency_pct: optionalNumber(fd, "max_efficiency_pct"),
      datasheet_url: nullableUrl(fd, "datasheet_url"),
      status: "draft",
      created_by: user.id,
    };
    if (!['grid_tied','off_grid','hybrid','pcs'].includes(payload.inverter_type)) throw new Error("Choose a valid inverter type.");
    if (!['single','three'].includes(payload.phase)) throw new Error("Choose single- or three-phase.");
    if (!Number.isInteger(payload.mppt_count) || payload.mppt_count <= 0) throw new Error("MPPT count must be a positive whole number.");
    if (payload.mppt_min_v >= payload.mppt_max_v) throw new Error("MPPT minimum voltage must be below maximum voltage.");
    if (payload.mppt_max_v > payload.max_dc_voltage_v) throw new Error("MPPT maximum voltage cannot exceed the inverter maximum DC voltage.");

    const { error } = await supabase.from("inverters").insert(payload);
    if (error) throw error;
    await logEquipmentEvent(supabase, organisationId, user.id, "equipment.inverter.created", `Inverter ${model} added as draft technical data`);
  } catch (error) {
    fail("inverters", error instanceof Error ? error.message : "Inverter could not be created.");
  }
  success("inverters");
}

export async function createBattery(fd: FormData) {
  const { supabase, user, organisationId } = await context();
  const manufacturerId = text(fd, "manufacturer_id");
  const model = text(fd, "model");
  if (!manufacturerId || !(await manufacturerExists(supabase, organisationId, manufacturerId))) fail("batteries", "Choose an active manufacturer.");
  if (!model) fail("batteries", "Battery model is required.");

  try {
    const nominalCapacity = requiredNumber(fd, "nominal_capacity_kwh", "Nominal capacity");
    const usableCapacity = requiredNumber(fd, "usable_capacity_kwh", "Usable capacity");
    if (usableCapacity > nominalCapacity) throw new Error("Usable capacity cannot exceed nominal capacity.");

    const payload = {
      organisation_id: organisationId,
      manufacturer_id: manufacturerId,
      model,
      chemistry: text(fd, "chemistry") || "lfp",
      nominal_capacity_kwh: nominalCapacity,
      usable_capacity_kwh: usableCapacity,
      nominal_voltage_v: requiredNumber(fd, "nominal_voltage_v", "Nominal voltage"),
      operating_voltage_min_v: optionalNumber(fd, "operating_voltage_min_v"),
      operating_voltage_max_v: optionalNumber(fd, "operating_voltage_max_v"),
      max_charge_power_kw: requiredNumber(fd, "max_charge_power_kw", "Maximum charge power"),
      max_discharge_power_kw: requiredNumber(fd, "max_discharge_power_kw", "Maximum discharge power"),
      max_dod_pct: optionalNumber(fd, "max_dod_pct"),
      round_trip_efficiency_pct: optionalNumber(fd, "round_trip_efficiency_pct"),
      cycle_life: optionalNumber(fd, "cycle_life"),
      datasheet_url: nullableUrl(fd, "datasheet_url"),
      status: "draft",
      created_by: user.id,
    };
    if (!['lfp','nmc','lead_acid','other'].includes(payload.chemistry)) throw new Error("Choose a valid battery chemistry.");
    if (payload.operating_voltage_min_v != null && payload.operating_voltage_max_v != null && payload.operating_voltage_min_v >= payload.operating_voltage_max_v) throw new Error("Battery minimum operating voltage must be below maximum voltage.");
    if (payload.cycle_life != null && (!Number.isInteger(payload.cycle_life) || payload.cycle_life <= 0)) throw new Error("Cycle life must be a positive whole number.");

    const { error } = await supabase.from("batteries").insert(payload);
    if (error) throw error;
    await logEquipmentEvent(supabase, organisationId, user.id, "equipment.battery.created", `Battery ${model} added as draft technical data`);
  } catch (error) {
    fail("batteries", error instanceof Error ? error.message : "Battery could not be created.");
  }
  success("batteries");
}

export async function createCompatibility(fd: FormData) {
  const { supabase, user, organisationId } = await context();
  const inverterId = text(fd, "inverter_id");
  const batteryId = text(fd, "battery_id");
  const status = text(fd, "status") || "approved";
  if (!inverterId || !batteryId) fail("compatibility", "Choose an inverter and battery.");
  if (!['approved','conditional','not_compatible'].includes(status)) fail("compatibility", "Choose a valid compatibility state.");

  const [{ data: inverter }, { data: battery }] = await Promise.all([
    supabase.from("inverters").select("id,model,inverter_type,battery_voltage_min_v,battery_voltage_max_v").eq("id", inverterId).eq("organisation_id", organisationId).maybeSingle(),
    supabase.from("batteries").select("id,model,operating_voltage_min_v,operating_voltage_max_v").eq("id", batteryId).eq("organisation_id", organisationId).maybeSingle(),
  ]);
  if (!inverter || !battery) fail("compatibility", "The selected equipment is unavailable.");
  if (inverter.inverter_type === "grid_tied") fail("compatibility", "A grid-tied PV inverter does not accept direct battery compatibility mapping.");

  const inverterMin = inverter.battery_voltage_min_v == null ? null : Number(inverter.battery_voltage_min_v);
  const inverterMax = inverter.battery_voltage_max_v == null ? null : Number(inverter.battery_voltage_max_v);
  const batteryMin = battery.operating_voltage_min_v == null ? null : Number(battery.operating_voltage_min_v);
  const batteryMax = battery.operating_voltage_max_v == null ? null : Number(battery.operating_voltage_max_v);
  if (status !== "not_compatible" && inverterMin != null && inverterMax != null && batteryMin != null && batteryMax != null && Math.max(inverterMin, batteryMin) > Math.min(inverterMax, batteryMax)) {
    fail("compatibility", "The inverter and battery voltage ranges do not overlap; they cannot be marked compatible.");
  }

  try {
    const { error } = await supabase.from("inverter_battery_compatibility").upsert({
      organisation_id: organisationId,
      inverter_id: inverterId,
      battery_id: batteryId,
      status,
      min_battery_units: optionalNumber(fd, "min_battery_units"),
      max_battery_units: optionalNumber(fd, "max_battery_units"),
      notes: text(fd, "notes") || null,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "organisation_id,inverter_id,battery_id" });
    if (error) throw error;
    await logEquipmentEvent(supabase, organisationId, user.id, "equipment.compatibility.recorded", `${inverter.model} + ${battery.model} compatibility recorded as ${status.replaceAll("_", " ")}`);
  } catch (error) {
    fail("compatibility", error instanceof Error ? error.message : "Compatibility record could not be saved.");
  }
  success("compatibility");
}

export async function setEquipmentStatus(fd: FormData) {
  const { supabase, user, organisationId } = await context();
  const entity = text(fd, "entity") as EquipmentEntity;
  const id = text(fd, "id");
  const status = text(fd, "status");
  if (!id || !['pv_module','inverter','battery'].includes(entity) || !['draft','approved','retired'].includes(status)) fail("modules", "Invalid equipment status change.");

  const config = {
    pv_module: { table: "pv_modules", tab: "modules" as const, select: "id,model,datasheet_url,temp_coeff_voc_pct_c,max_system_voltage_v" },
    inverter: { table: "inverters", tab: "inverters" as const, select: "id,model,datasheet_url,max_pv_input_power_kw" },
    battery: { table: "batteries", tab: "batteries" as const, select: "id,model,datasheet_url,max_dod_pct,round_trip_efficiency_pct" },
  }[entity];

  const { data: record, error: readError } = await supabase.from(config.table).select(config.select).eq("id", id).eq("organisation_id", organisationId).maybeSingle();
  if (readError || !record) fail(config.tab, readError?.message ?? "Equipment record not found.");

  if (status === "approved") {
    if (!record.datasheet_url) fail(config.tab, "A manufacturer datasheet is required before technical approval.");
    if (entity === "pv_module" && (record.temp_coeff_voc_pct_c == null || record.max_system_voltage_v == null)) fail(config.tab, "Record the module Voc temperature coefficient and maximum system voltage before approval.");
    if (entity === "inverter" && record.max_pv_input_power_kw == null) fail(config.tab, "Record the inverter maximum PV input power before approval.");
    if (entity === "battery" && (record.max_dod_pct == null || record.round_trip_efficiency_pct == null)) fail(config.tab, "Record battery DoD and round-trip efficiency before approval.");
  }

  const { error } = await supabase.from(config.table).update({
    status,
    approved_by: status === "approved" ? user.id : null,
    approved_at: status === "approved" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("organisation_id", organisationId);
  if (error) fail(config.tab, error.message);

  try {
    await logEquipmentEvent(supabase, organisationId, user.id, `equipment.${entity}.status_changed`, `${record.model} marked ${status}`);
  } catch (auditError) {
    fail(config.tab, auditError instanceof Error ? auditError.message : "Equipment audit event failed.");
  }
  success(config.tab, "updated");
}
