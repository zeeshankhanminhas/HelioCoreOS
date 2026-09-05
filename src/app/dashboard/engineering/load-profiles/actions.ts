"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { summarizeApplianceSchedule, summarizeUtilityBills } from "@/lib/engineering/load-profile";
import type { LoadProfileAppliance, LoadProfileUtilityBill } from "@/lib/engineering/types";

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function numberField(fd: FormData, key: string, options?: { min?: number; max?: number; required?: boolean }) {
  const raw = text(fd, key);
  if (!raw && !options?.required) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return Number.NaN;
  if (options?.min != null && value < options.min) return Number.NaN;
  if (options?.max != null && value > options.max) return Number.NaN;
  return value;
}

function pathFor(profileId: string) {
  return `/dashboard/engineering/load-profiles/${profileId}`;
}

function fail(profileId: string, message: string): never {
  redirect(`${pathFor(profileId)}?error=${encodeURIComponent(message)}`);
}

function success(profileId: string, message: string): never {
  revalidatePath(pathFor(profileId));
  revalidatePath("/dashboard/engineering");
  redirect(`${pathFor(profileId)}?updated=${encodeURIComponent(message)}`);
}

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  if (error || !profile?.organisation_id) throw new Error("Organisation context missing");
  return { supabase, user, organisationId: profile.organisation_id };
}

async function getLoadProfile(profileId: string) {
  const { supabase, user, organisationId } = await context();
  const { data: profile } = await supabase
    .from("load_profiles")
    .select("id,opportunity_id,site_id,source,status,annual_energy_kwh,average_daily_energy_kwh,peak_demand_kw,essential_peak_demand_kw")
    .eq("id", profileId)
    .eq("organisation_id", organisationId)
    .maybeSingle();
  if (!profile) fail(profileId, "Load profile not found or access denied.");
  return { supabase, user, organisationId, profile };
}

async function recordActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organisationId: string,
  userId: string,
  eventType: string,
  description: string,
) {
  const { error } = await supabase.from("activity_logs").insert({
    organisation_id: organisationId,
    actor_id: userId,
    event_type: eventType,
    description,
  });
  if (error) throw new Error(error.message);
}

export async function saveManualLoadSummary(fd: FormData) {
  const profileId = text(fd, "profile_id");
  if (!profileId) redirect("/dashboard/engineering");
  const { supabase, user, organisationId, profile } = await getLoadProfile(profileId);
  if (profile.source !== "manual_summary") fail(profileId, "This load profile is not configured for manual summary input.");

  const daily = numberField(fd, "average_daily_energy_kwh", { min: 0, required: true });
  const peak = numberField(fd, "peak_demand_kw", { min: 0, required: true });
  const essentialPeak = numberField(fd, "essential_peak_demand_kw", { min: 0 }) ?? 0;
  const assumptions = text(fd, "assumptions") || null;
  if ([daily, peak, essentialPeak].some((value) => Number.isNaN(value))) fail(profileId, "Enter valid non-negative demand values.");

  const annual = Number(daily) * 365;
  const { error } = await supabase
    .from("load_profiles")
    .update({
      annual_energy_kwh: annual,
      average_daily_energy_kwh: daily,
      peak_demand_kw: peak,
      essential_peak_demand_kw: essentialPeak,
      assumptions,
      data_quality: "estimated",
      status: "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .eq("organisation_id", organisationId);
  if (error) fail(profileId, error.message);

  await recordActivity(supabase, organisationId, user.id, "engineering.load_profile.manual_saved", "Manual load summary updated");
  success(profileId, "Manual load summary saved.");
}

export async function addUtilityBill(fd: FormData) {
  const profileId = text(fd, "profile_id");
  if (!profileId) redirect("/dashboard/engineering");
  const { supabase, user, organisationId, profile } = await getLoadProfile(profileId);
  if (profile.source !== "utility_bills") fail(profileId, "This load profile is not configured for utility bills.");

  const month = text(fd, "bill_month");
  const energy = numberField(fd, "energy_kwh", { min: 0, required: true });
  const peak = numberField(fd, "peak_demand_kw", { min: 0 });
  const cost = numberField(fd, "cost_amount", { min: 0 });
  if (!/^\d{4}-\d{2}$/.test(month) || [energy, peak, cost].some((value) => Number.isNaN(value))) fail(profileId, "Enter a valid bill month and non-negative values.");

  const { error: billError } = await supabase.from("load_profile_utility_bills").upsert({
    organisation_id: organisationId,
    load_profile_id: profileId,
    bill_month: `${month}-01`,
    energy_kwh: energy,
    peak_demand_kw: peak,
    cost_amount: cost,
  }, { onConflict: "load_profile_id,bill_month" });
  if (billError) fail(profileId, billError.message);

  const { data: bills, error: readError } = await supabase
    .from("load_profile_utility_bills")
    .select("bill_month,energy_kwh,peak_demand_kw,cost_amount")
    .eq("load_profile_id", profileId)
    .eq("organisation_id", organisationId)
    .order("bill_month");
  if (readError) fail(profileId, readError.message);

  const summary = summarizeUtilityBills((bills ?? []).map((bill) => ({
    month: bill.bill_month,
    energyKwh: Number(bill.energy_kwh),
    peakDemandKw: bill.peak_demand_kw == null ? undefined : Number(bill.peak_demand_kw),
    costAmount: bill.cost_amount == null ? undefined : Number(bill.cost_amount),
  } satisfies LoadProfileUtilityBill)));

  const { error: profileError } = await supabase.from("load_profiles").update({
    annual_energy_kwh: summary.annualEnergyKwh,
    average_daily_energy_kwh: summary.averageDailyEnergyKwh,
    peak_demand_kw: summary.peakDemandKw,
    essential_peak_demand_kw: 0,
    data_quality: (bills?.length ?? 0) >= 12 ? "derived" : "estimated",
    status: "draft",
    updated_at: new Date().toISOString(),
  }).eq("id", profileId).eq("organisation_id", organisationId);
  if (profileError) fail(profileId, profileError.message);

  await recordActivity(supabase, organisationId, user.id, "engineering.load_profile.bill_saved", `Utility bill ${month} recorded`);
  success(profileId, "Utility bill recorded and demand summary recalculated.");
}

export async function deleteUtilityBill(fd: FormData) {
  const profileId = text(fd, "profile_id");
  const billId = text(fd, "bill_id");
  if (!profileId || !billId) redirect("/dashboard/engineering");
  const { supabase, user, organisationId } = await getLoadProfile(profileId);

  const { error } = await supabase.from("load_profile_utility_bills").delete().eq("id", billId).eq("organisation_id", organisationId).eq("load_profile_id", profileId);
  if (error) fail(profileId, error.message);

  const { data: bills } = await supabase.from("load_profile_utility_bills").select("bill_month,energy_kwh,peak_demand_kw,cost_amount").eq("load_profile_id", profileId).eq("organisation_id", organisationId);
  const summary = summarizeUtilityBills((bills ?? []).map((bill) => ({
    month: bill.bill_month,
    energyKwh: Number(bill.energy_kwh),
    peakDemandKw: bill.peak_demand_kw == null ? undefined : Number(bill.peak_demand_kw),
    costAmount: bill.cost_amount == null ? undefined : Number(bill.cost_amount),
  })));
  await supabase.from("load_profiles").update({
    annual_energy_kwh: summary.annualEnergyKwh,
    average_daily_energy_kwh: summary.averageDailyEnergyKwh,
    peak_demand_kw: summary.peakDemandKw,
    data_quality: (bills?.length ?? 0) >= 12 ? "derived" : "estimated",
    status: "draft",
    updated_at: new Date().toISOString(),
  }).eq("id", profileId).eq("organisation_id", organisationId);
  await recordActivity(supabase, organisationId, user.id, "engineering.load_profile.bill_removed", "Utility bill removed");
  success(profileId, "Utility bill removed and demand summary recalculated.");
}

export async function addAppliance(fd: FormData) {
  const profileId = text(fd, "profile_id");
  if (!profileId) redirect("/dashboard/engineering");
  const { supabase, user, organisationId, profile } = await getLoadProfile(profileId);
  if (profile.source !== "appliance_schedule") fail(profileId, "This load profile is not configured for appliance scheduling.");

  const name = text(fd, "name");
  const category = text(fd, "category") || null;
  const ratedKw = numberField(fd, "rated_kw", { min: 0, required: true });
  const quantity = numberField(fd, "quantity", { min: 1, required: true });
  const hours = numberField(fd, "hours_per_day", { min: 0, max: 24, required: true });
  const days = numberField(fd, "days_per_week", { min: 0, max: 7, required: true });
  const simultaneity = numberField(fd, "simultaneity_pct", { min: 0, max: 100, required: true });
  const startHour = numberField(fd, "start_hour", { min: 0, max: 23.75, required: true });
  const essential = fd.get("essential") === "on";
  if (!name || [ratedKw, quantity, hours, days, simultaneity, startHour].some((value) => Number.isNaN(value))) fail(profileId, "Complete the appliance row with valid engineering values.");

  const { error: insertError } = await supabase.from("load_profile_appliances").insert({
    organisation_id: organisationId,
    load_profile_id: profileId,
    name,
    category,
    rated_kw: ratedKw,
    quantity: Math.trunc(Number(quantity)),
    hours_per_day: hours,
    days_per_week: days,
    simultaneity_pct: simultaneity,
    start_hour: startHour,
    essential,
  });
  if (insertError) fail(profileId, insertError.message);

  const { data: appliances, error: readError } = await supabase
    .from("load_profile_appliances")
    .select("name,category,rated_kw,quantity,hours_per_day,days_per_week,simultaneity_pct,essential")
    .eq("load_profile_id", profileId)
    .eq("organisation_id", organisationId);
  if (readError) fail(profileId, readError.message);

  const summary = summarizeApplianceSchedule((appliances ?? []).map((item) => ({
    name: item.name,
    category: item.category ?? undefined,
    ratedKw: Number(item.rated_kw),
    quantity: Number(item.quantity),
    hoursPerDay: Number(item.hours_per_day),
    daysPerWeek: Number(item.days_per_week),
    simultaneityPct: Number(item.simultaneity_pct),
    essential: Boolean(item.essential),
  } satisfies LoadProfileAppliance)));

  const { error: profileError } = await supabase.from("load_profiles").update({
    annual_energy_kwh: summary.annualEnergyKwh,
    average_daily_energy_kwh: summary.averageDailyEnergyKwh,
    peak_demand_kw: summary.peakDemandKw,
    essential_peak_demand_kw: summary.essentialPeakDemandKw,
    data_quality: "derived",
    status: "draft",
    updated_at: new Date().toISOString(),
  }).eq("id", profileId).eq("organisation_id", organisationId);
  if (profileError) fail(profileId, profileError.message);

  await recordActivity(supabase, organisationId, user.id, "engineering.load_profile.appliance_saved", `${name} added to load schedule`);
  success(profileId, "Load item added and profile recalculated.");
}

export async function deleteAppliance(fd: FormData) {
  const profileId = text(fd, "profile_id");
  const applianceId = text(fd, "appliance_id");
  if (!profileId || !applianceId) redirect("/dashboard/engineering");
  const { supabase, user, organisationId } = await getLoadProfile(profileId);
  const { error } = await supabase.from("load_profile_appliances").delete().eq("id", applianceId).eq("organisation_id", organisationId).eq("load_profile_id", profileId);
  if (error) fail(profileId, error.message);

  const { data: appliances } = await supabase.from("load_profile_appliances").select("name,category,rated_kw,quantity,hours_per_day,days_per_week,simultaneity_pct,essential").eq("load_profile_id", profileId).eq("organisation_id", organisationId);
  const summary = summarizeApplianceSchedule((appliances ?? []).map((item) => ({
    name: item.name,
    category: item.category ?? undefined,
    ratedKw: Number(item.rated_kw),
    quantity: Number(item.quantity),
    hoursPerDay: Number(item.hours_per_day),
    daysPerWeek: Number(item.days_per_week),
    simultaneityPct: Number(item.simultaneity_pct),
    essential: Boolean(item.essential),
  })));
  await supabase.from("load_profiles").update({
    annual_energy_kwh: summary.annualEnergyKwh,
    average_daily_energy_kwh: summary.averageDailyEnergyKwh,
    peak_demand_kw: summary.peakDemandKw,
    essential_peak_demand_kw: summary.essentialPeakDemandKw,
    status: "draft",
    updated_at: new Date().toISOString(),
  }).eq("id", profileId).eq("organisation_id", organisationId);
  await recordActivity(supabase, organisationId, user.id, "engineering.load_profile.appliance_removed", "Load item removed from appliance schedule");
  success(profileId, "Load item removed and profile recalculated.");
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { current += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else current += char;
  }
  values.push(current.trim());
  return values;
}

export async function importIntervalCsv(fd: FormData) {
  const profileId = text(fd, "profile_id");
  if (!profileId) redirect("/dashboard/engineering");
  const { supabase, user, organisationId, profile } = await getLoadProfile(profileId);
  if (profile.source !== "interval_data") fail(profileId, "This load profile is not configured for interval data.");

  const intervalMinutes = numberField(fd, "interval_minutes", { min: 15, max: 60, required: true });
  const timezone = text(fd, "timezone") || "Asia/Karachi";
  const csv = text(fd, "csv_data");
  if (![15, 30, 60].includes(Number(intervalMinutes))) fail(profileId, "Interval must be 15, 30 or 60 minutes.");
  if (!csv) fail(profileId, "Paste interval CSV data before importing.");

  const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) fail(profileId, "CSV needs a header and at least one data row.");
  if (lines.length > 10001) fail(profileId, "Load Profile V1 accepts up to 10,000 interval rows per import.");

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase());
  const timestampIndex = headers.indexOf("timestamp");
  const demandIndex = headers.indexOf("demand_kw");
  const energyIndex = headers.indexOf("energy_kwh");
  const essentialIndex = headers.indexOf("essential");
  const categoryIndex = headers.indexOf("category");
  if (timestampIndex < 0 || demandIndex < 0) fail(profileId, "CSV headers must include timestamp and demand_kw.");

  const intervalHours = Number(intervalMinutes) / 60;
  const rows = lines.slice(1).map((line, rowIndex) => {
    const cells = parseCsvLine(line);
    const timestamp = new Date(cells[timestampIndex]);
    const demand = Number(cells[demandIndex]);
    const suppliedEnergy = energyIndex >= 0 && cells[energyIndex] !== "" ? Number(cells[energyIndex]) : null;
    if (Number.isNaN(timestamp.getTime()) || !Number.isFinite(demand) || demand < 0 || (suppliedEnergy != null && (!Number.isFinite(suppliedEnergy) || suppliedEnergy < 0))) {
      fail(profileId, `Invalid interval data on CSV row ${rowIndex + 2}.`);
    }
    const essentialRaw = essentialIndex >= 0 ? String(cells[essentialIndex] ?? "").toLowerCase() : "";
    return {
      interval_start: timestamp.toISOString(),
      demand_kw: demand,
      energy_kwh: suppliedEnergy ?? demand * intervalHours,
      essential: ["1", "true", "yes", "y"].includes(essentialRaw),
      category: categoryIndex >= 0 ? cells[categoryIndex] || "" : "",
    };
  });

  const { error } = await supabase.rpc("replace_load_profile_intervals", {
    p_load_profile_id: profileId,
    p_interval_minutes: Number(intervalMinutes),
    p_timezone: timezone,
    p_rows: rows,
  });
  if (error) fail(profileId, error.message);

  await recordActivity(supabase, organisationId, user.id, "engineering.load_profile.intervals_imported", `${rows.length} interval rows imported`);
  success(profileId, `${rows.length} interval rows imported and load demand recalculated.`);
}

export async function markLoadProfileReady(fd: FormData) {
  const profileId = text(fd, "profile_id");
  if (!profileId) redirect("/dashboard/engineering");
  const { supabase, user, organisationId, profile } = await getLoadProfile(profileId);

  const annual = Number(profile.annual_energy_kwh ?? 0);
  const peak = Number(profile.peak_demand_kw ?? 0);
  if (annual <= 0) fail(profileId, "Annual energy demand must be established before this profile can be marked ready.");

  const { data: intake } = await supabase
    .from("engineering_intakes")
    .select("id,system_type,autonomy_hours,reserve_soc_pct")
    .eq("load_profile_id", profileId)
    .eq("organisation_id", organisationId)
    .maybeSingle();
  if (!intake) fail(profileId, "Linked engineering intake could not be found.");
  if ((intake.system_type === "off_grid" || intake.system_type === "hybrid") && peak <= 0) {
    fail(profileId, "Off-grid and Hybrid design require peak demand before the load profile can be marked ready.");
  }

  const { error: profileError } = await supabase.from("load_profiles").update({ status: "ready", updated_at: new Date().toISOString() }).eq("id", profileId).eq("organisation_id", organisationId);
  if (profileError) fail(profileId, profileError.message);

  const { error: intakeError } = await supabase.from("engineering_intakes").update({ status: "ready", updated_at: new Date().toISOString() }).eq("id", intake.id).eq("organisation_id", organisationId);
  if (intakeError) {
    await supabase.from("load_profiles").update({ status: "draft", updated_at: new Date().toISOString() }).eq("id", profileId).eq("organisation_id", organisationId);
    fail(profileId, intakeError.message);
  }

  await recordActivity(supabase, organisationId, user.id, "engineering.load_profile.ready", "Load profile approved for engineering calculations");
  success(profileId, "Load profile is ready for engineering calculations.");
}