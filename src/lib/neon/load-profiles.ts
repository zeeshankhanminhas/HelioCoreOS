import { createClient } from "@/lib/neon/client";
import { assessLoadProfile, summarizeApplianceSchedule, summarizeUtilityBills } from "@/lib/engineering/load-profile";
import type { LoadProfileAppliance, LoadProfileSource, LoadProfileSummary, LoadProfileUtilityBill } from "@/lib/engineering/types";

export type LoadProfileWorkspace = {
  profile: any;
  intake: any;
  opportunity: any;
  site: any;
  bills: any[];
  appliances: any[];
  intervals: any[];
  summary: LoadProfileSummary;
  assessments: ReturnType<typeof assessLoadProfile>;
};

async function context() {
  const client = createClient();
  const session = await client.auth.getSession();
  const user = session.data?.user;
  if (!user?.id) throw new Error("Authenticated Neon user required.");
  const { data: profile, error } = await client.from("profiles").select("id,organisation_id,status").eq("id", user.id).single();
  if (error || !profile?.organisation_id) throw new Error("Organisation context is unavailable.");
  if (profile.status !== "active") throw new Error("This user is not active in the organisation.");
  return { client, userId: user.id, organisationId: profile.organisation_id as string };
}

async function activity(client: ReturnType<typeof createClient>, organisationId: string, userId: string, eventType: string, description: string) {
  const { error } = await client.from("activity_logs").insert({ organisation_id: organisationId, actor_id: userId, event_type: eventType, description });
  if (error) throw new Error(`Change saved but audit event failed: ${error.message}`);
}

function number(value: unknown) { return value == null ? 0 : Number(value); }

export async function loadEngineeringRegister() {
  const { client } = await context();
  const [opportunitiesResult, sitesResult, intakesResult, calculationsResult] = await Promise.all([
    client.from("opportunities").select("id,reference,title,site_id,customer_id,created_at").order("created_at", { ascending: false }).limit(50),
    client.from("sites").select("id,name,postcode"),
    client.from("engineering_intakes").select("id,opportunity_id,load_profile_id,system_type,design_objective,status,created_at").order("created_at", { ascending: false }).limit(20),
    client.from("engineering_calculations").select("engineering_intake_id,revision,created_at").order("revision", { ascending: false }),
  ]);
  for (const result of [opportunitiesResult, sitesResult, intakesResult, calculationsResult]) if (result.error) throw new Error(result.error.message);
  return {
    opportunities: opportunitiesResult.data ?? [],
    sites: sitesResult.data ?? [],
    intakes: intakesResult.data ?? [],
    calculations: calculationsResult.data ?? [],
  };
}

export async function loadLoadProfileWorkspace(profileId: string): Promise<LoadProfileWorkspace> {
  const { client } = await context();
  const { data: profile, error: profileError } = await client.from("load_profiles").select("*").eq("id", profileId).maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (!profile) throw new Error("Load profile not found or access denied.");

  const [intakeResult, opportunityResult, siteResult, billsResult, appliancesResult, intervalsResult] = await Promise.all([
    client.from("engineering_intakes").select("id,system_type,design_objective,status,autonomy_hours,export_limit_kw,reserve_soc_pct").eq("load_profile_id", profileId).maybeSingle(),
    client.from("opportunities").select("id,reference,title").eq("id", profile.opportunity_id).maybeSingle(),
    client.from("sites").select("id,name,postcode,address").eq("id", profile.site_id).maybeSingle(),
    profile.source === "utility_bills" ? client.from("load_profile_utility_bills").select("id,bill_month,energy_kwh,peak_demand_kw,cost_amount").eq("load_profile_id", profileId).order("bill_month", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    profile.source === "appliance_schedule" ? client.from("load_profile_appliances").select("id,name,category,rated_kw,quantity,hours_per_day,days_per_week,simultaneity_pct,start_hour,essential").eq("load_profile_id", profileId).order("created_at") : Promise.resolve({ data: [], error: null }),
    profile.source === "interval_data" ? client.from("load_profile_intervals").select("interval_start,demand_kw,energy_kwh,essential,category").eq("load_profile_id", profileId).order("interval_start").limit(10000) : Promise.resolve({ data: [], error: null }),
  ]);
  for (const result of [intakeResult, opportunityResult, siteResult, billsResult, appliancesResult, intervalsResult]) if (result.error) throw new Error(result.error.message);

  const bills = billsResult.data ?? [];
  const appliances = appliancesResult.data ?? [];
  const intervals = intervalsResult.data ?? [];
  const recordCount = profile.source === "interval_data" ? intervals.length : profile.source === "utility_bills" ? bills.length : profile.source === "appliance_schedule" ? appliances.length : (number(profile.annual_energy_kwh) > 0 || number(profile.peak_demand_kw) > 0 ? 1 : 0);
  const summary: LoadProfileSummary = {
    annualEnergyKwh: number(profile.annual_energy_kwh),
    averageDailyEnergyKwh: number(profile.average_daily_energy_kwh),
    peakDemandKw: number(profile.peak_demand_kw),
    essentialPeakDemandKw: number(profile.essential_peak_demand_kw),
    intervalCount: recordCount,
    coveredHours: profile.source === "interval_data" ? intervals.length * (number(profile.interval_minutes) / 60) : undefined,
  };

  return {
    profile,
    intake: intakeResult.data ?? null,
    opportunity: opportunityResult.data ?? null,
    site: siteResult.data ?? null,
    bills,
    appliances,
    intervals,
    summary,
    assessments: assessLoadProfile(profile.source as LoadProfileSource, summary, recordCount),
  };
}

async function recalcBills(client: ReturnType<typeof createClient>, profileId: string) {
  const { data: bills, error } = await client.from("load_profile_utility_bills").select("bill_month,energy_kwh,peak_demand_kw,cost_amount").eq("load_profile_id", profileId).order("bill_month");
  if (error) throw new Error(error.message);
  const summary = summarizeUtilityBills((bills ?? []).map((bill: any) => ({ month: bill.bill_month, energyKwh: Number(bill.energy_kwh), peakDemandKw: bill.peak_demand_kw == null ? undefined : Number(bill.peak_demand_kw), costAmount: bill.cost_amount == null ? undefined : Number(bill.cost_amount) } satisfies LoadProfileUtilityBill)));
  return { bills: bills ?? [], summary };
}

async function recalcAppliances(client: ReturnType<typeof createClient>, profileId: string) {
  const { data: appliances, error } = await client.from("load_profile_appliances").select("name,category,rated_kw,quantity,hours_per_day,days_per_week,simultaneity_pct,essential").eq("load_profile_id", profileId);
  if (error) throw new Error(error.message);
  const summary = summarizeApplianceSchedule((appliances ?? []).map((item: any) => ({ name: item.name, category: item.category ?? undefined, ratedKw: Number(item.rated_kw), quantity: Number(item.quantity), hoursPerDay: Number(item.hours_per_day), daysPerWeek: Number(item.days_per_week), simultaneityPct: Number(item.simultaneity_pct), essential: Boolean(item.essential) } satisfies LoadProfileAppliance)));
  return { appliances: appliances ?? [], summary };
}

export async function saveManualSummary(profileId: string, input: { daily: number; peak: number; essentialPeak: number; assumptions?: string }) {
  const { client, organisationId, userId } = await context();
  if ([input.daily, input.peak, input.essentialPeak].some((v) => !Number.isFinite(v) || v < 0)) throw new Error("Demand values must be valid non-negative numbers.");
  const { error } = await client.from("load_profiles").update({ annual_energy_kwh: input.daily * 365, average_daily_energy_kwh: input.daily, peak_demand_kw: input.peak, essential_peak_demand_kw: input.essentialPeak, assumptions: input.assumptions || null, data_quality: "estimated", status: "draft", updated_at: new Date().toISOString() }).eq("id", profileId);
  if (error) throw new Error(error.message);
  await activity(client, organisationId, userId, "engineering.load_profile.manual_saved", "Manual load summary updated through Neon Data API");
}

export async function saveUtilityBill(profileId: string, input: { month: string; energyKwh: number; peakDemandKw?: number | null; costAmount?: number | null }) {
  const { client, organisationId, userId } = await context();
  if (!/^\d{4}-\d{2}$/.test(input.month) || !Number.isFinite(input.energyKwh) || input.energyKwh < 0) throw new Error("Enter a valid month and energy value.");
  const { error } = await client.from("load_profile_utility_bills").upsert({ organisation_id: organisationId, load_profile_id: profileId, bill_month: `${input.month}-01`, energy_kwh: input.energyKwh, peak_demand_kw: input.peakDemandKw ?? null, cost_amount: input.costAmount ?? null }, { onConflict: "load_profile_id,bill_month" });
  if (error) throw new Error(error.message);
  const { bills, summary } = await recalcBills(client, profileId);
  const { error: updateError } = await client.from("load_profiles").update({ annual_energy_kwh: summary.annualEnergyKwh, average_daily_energy_kwh: summary.averageDailyEnergyKwh, peak_demand_kw: summary.peakDemandKw, essential_peak_demand_kw: 0, data_quality: bills.length >= 12 ? "derived" : "estimated", status: "draft", updated_at: new Date().toISOString() }).eq("id", profileId);
  if (updateError) throw new Error(updateError.message);
  await activity(client, organisationId, userId, "engineering.load_profile.bill_saved", `Utility bill ${input.month} recorded through Neon Data API`);
}

export async function removeUtilityBill(profileId: string, billId: string) {
  const { client, organisationId, userId } = await context();
  const { error } = await client.from("load_profile_utility_bills").delete().eq("id", billId).eq("load_profile_id", profileId);
  if (error) throw new Error(error.message);
  const { bills, summary } = await recalcBills(client, profileId);
  await client.from("load_profiles").update({ annual_energy_kwh: summary.annualEnergyKwh, average_daily_energy_kwh: summary.averageDailyEnergyKwh, peak_demand_kw: summary.peakDemandKw, data_quality: bills.length >= 12 ? "derived" : "estimated", status: "draft", updated_at: new Date().toISOString() }).eq("id", profileId);
  await activity(client, organisationId, userId, "engineering.load_profile.bill_removed", "Utility bill removed through Neon Data API");
}

export async function saveAppliance(profileId: string, input: { name: string; category?: string; ratedKw: number; quantity: number; hoursPerDay: number; daysPerWeek: number; simultaneityPct: number; startHour: number; essential: boolean }) {
  const { client, organisationId, userId } = await context();
  if (!input.name || input.ratedKw < 0 || input.quantity < 1 || input.hoursPerDay < 0 || input.hoursPerDay > 24 || input.daysPerWeek < 0 || input.daysPerWeek > 7 || input.simultaneityPct < 0 || input.simultaneityPct > 100) throw new Error("Complete the appliance row with valid engineering values.");
  const { error } = await client.from("load_profile_appliances").insert({ organisation_id: organisationId, load_profile_id: profileId, name: input.name, category: input.category || null, rated_kw: input.ratedKw, quantity: Math.trunc(input.quantity), hours_per_day: input.hoursPerDay, days_per_week: input.daysPerWeek, simultaneity_pct: input.simultaneityPct, start_hour: input.startHour, essential: input.essential });
  if (error) throw new Error(error.message);
  const { summary } = await recalcAppliances(client, profileId);
  const { error: updateError } = await client.from("load_profiles").update({ annual_energy_kwh: summary.annualEnergyKwh, average_daily_energy_kwh: summary.averageDailyEnergyKwh, peak_demand_kw: summary.peakDemandKw, essential_peak_demand_kw: summary.essentialPeakDemandKw, data_quality: "derived", status: "draft", updated_at: new Date().toISOString() }).eq("id", profileId);
  if (updateError) throw new Error(updateError.message);
  await activity(client, organisationId, userId, "engineering.load_profile.appliance_saved", `${input.name} added through Neon Data API`);
}

export async function removeAppliance(profileId: string, applianceId: string) {
  const { client, organisationId, userId } = await context();
  const { error } = await client.from("load_profile_appliances").delete().eq("id", applianceId).eq("load_profile_id", profileId);
  if (error) throw new Error(error.message);
  const { summary } = await recalcAppliances(client, profileId);
  await client.from("load_profiles").update({ annual_energy_kwh: summary.annualEnergyKwh, average_daily_energy_kwh: summary.averageDailyEnergyKwh, peak_demand_kw: summary.peakDemandKw, essential_peak_demand_kw: summary.essentialPeakDemandKw, data_quality: "derived", status: "draft", updated_at: new Date().toISOString() }).eq("id", profileId);
  await activity(client, organisationId, userId, "engineering.load_profile.appliance_removed", "Load item removed through Neon Data API");
}

function parseCsvLine(line: string) {
  const values: string[] = []; let current = ""; let quoted = false;
  for (let i = 0; i < line.length; i += 1) { const c = line[i]; if (c === '"') { if (quoted && line[i + 1] === '"') { current += '"'; i += 1; } else quoted = !quoted; } else if (c === "," && !quoted) { values.push(current.trim()); current = ""; } else current += c; }
  values.push(current.trim()); return values;
}

export async function importIntervalData(profileId: string, input: { csv: string; intervalMinutes: 15 | 30 | 60; timezone: string }) {
  const { client, organisationId, userId } = await context();
  const lines = input.csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2 || lines.length > 10001) throw new Error("CSV requires a header and 1–10,000 data rows.");
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const ti = headers.indexOf("timestamp"), di = headers.indexOf("demand_kw"), ei = headers.indexOf("energy_kwh"), xi = headers.indexOf("essential"), ci = headers.indexOf("category");
  if (ti < 0 || di < 0) throw new Error("CSV headers must include timestamp and demand_kw.");
  const intervalHours = input.intervalMinutes / 60;
  const rows = lines.slice(1).map((line, index) => { const cells = parseCsvLine(line); const timestamp = new Date(cells[ti]); const demand = Number(cells[di]); const supplied = ei >= 0 && cells[ei] !== "" ? Number(cells[ei]) : null; if (Number.isNaN(timestamp.getTime()) || !Number.isFinite(demand) || demand < 0 || (supplied != null && (!Number.isFinite(supplied) || supplied < 0))) throw new Error(`Invalid interval data on CSV row ${index + 2}.`); return { interval_start: timestamp.toISOString(), demand_kw: demand, energy_kwh: supplied ?? demand * intervalHours, essential: xi >= 0 && ["1","true","yes","y"].includes(String(cells[xi] ?? "").toLowerCase()), category: ci >= 0 ? cells[ci] || "" : "" }; });
  const { error } = await client.rpc("replace_load_profile_intervals", { p_load_profile_id: profileId, p_interval_minutes: input.intervalMinutes, p_timezone: input.timezone || "Asia/Karachi", p_rows: rows });
  if (error) throw new Error(error.message);
  await activity(client, organisationId, userId, "engineering.load_profile.intervals_imported", `${rows.length} interval rows imported through Neon Data API`);
}

export async function markProfileReady(profileId: string) {
  const { client, organisationId, userId } = await context();
  const workspace = await loadLoadProfileWorkspace(profileId);
  if (workspace.assessments.some((item) => item.severity === "error")) throw new Error("Resolve the load-profile quality blockers before marking it ready.");
  if (!workspace.intake?.id) throw new Error("Linked engineering intake could not be found.");
  if ((workspace.intake.system_type === "off_grid" || workspace.intake.system_type === "hybrid") && workspace.summary.peakDemandKw <= 0) throw new Error("Off-grid and Hybrid design require peak demand.");
  const now = new Date().toISOString();
  const { error: profileError } = await client.from("load_profiles").update({ status: "ready", updated_at: now }).eq("id", profileId);
  if (profileError) throw new Error(profileError.message);
  const { error: intakeError } = await client.from("engineering_intakes").update({ status: "ready", updated_at: now }).eq("id", workspace.intake.id);
  if (intakeError) { await client.from("load_profiles").update({ status: "draft", updated_at: new Date().toISOString() }).eq("id", profileId); throw new Error(intakeError.message); }
  await activity(client, organisationId, userId, "engineering.load_profile.ready", "Load profile approved for Calculator through Neon Data API");
  return workspace.intake.id as string;
}
