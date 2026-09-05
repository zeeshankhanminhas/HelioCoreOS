"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateSystemSizing, CALCULATOR_ENGINE_VERSION } from "@/lib/engineering/calculator";
import type { SystemType } from "@/lib/engineering/types";

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function optionalNumber(fd: FormData, key: string) {
  const raw = text(fd, key);
  if (!raw) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`${key.replaceAll("_", " ")} must be a valid number.`);
  return value;
}

function fail(intakeId: string, message: string): never {
  redirect(`/dashboard/engineering/calculators/${intakeId}?error=${encodeURIComponent(message)}`);
}

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organisation_id").eq("id", user.id).single();
  if (!profile?.organisation_id) throw new Error("Organisation context missing");
  return { supabase, user, organisationId: profile.organisation_id };
}

export async function saveCalculatorRevision(fd: FormData) {
  const intakeId = text(fd, "engineering_intake_id");
  if (!intakeId) fail("missing", "Engineering intake identifier is missing.");

  const { supabase, user, organisationId } = await context();

  try {
    const [{ data: intake }, { data: opportunity }] = await Promise.all([
      supabase
        .from("engineering_intakes")
        .select("id,opportunity_id,site_id,load_profile_id,system_type,design_objective,status,autonomy_hours")
        .eq("id", intakeId)
        .eq("organisation_id", organisationId)
        .maybeSingle(),
      supabase
        .from("opportunities")
        .select("id,reference,title")
        .eq("organisation_id", organisationId)
        .eq("id", text(fd, "opportunity_id"))
        .maybeSingle(),
    ]);

    if (!intake?.load_profile_id) throw new Error("This engineering intake does not have a linked Load Profile.");

    const { data: load } = await supabase
      .from("load_profiles")
      .select("id,status,annual_energy_kwh,average_daily_energy_kwh,peak_demand_kw,essential_peak_demand_kw")
      .eq("id", intake.load_profile_id)
      .eq("organisation_id", organisationId)
      .maybeSingle();

    if (!load || load.status !== "ready") throw new Error("The Load Profile must be Ready before the Calculator can save a sizing revision.");

    const actualOpportunity = opportunity?.id === intake.opportunity_id
      ? opportunity
      : (await supabase.from("opportunities").select("id,reference,title").eq("id", intake.opportunity_id).eq("organisation_id", organisationId).maybeSingle()).data;
    if (!actualOpportunity) throw new Error("Opportunity context is unavailable.");

    const inputs = {
      systemType: intake.system_type as SystemType,
      annualEnergyKwh: Number(load.annual_energy_kwh ?? 0),
      averageDailyEnergyKwh: Number(load.average_daily_energy_kwh ?? 0),
      peakDemandKw: Number(load.peak_demand_kw ?? 0),
      essentialPeakDemandKw: Number(load.essential_peak_demand_kw ?? 0),
      targetSolarContributionPct: optionalNumber(fd, "target_solar_contribution_pct"),
      specificYieldKwhPerKwpYear: optionalNumber(fd, "specific_yield_kwh_per_kwp_year"),
      targetDcAcRatio: optionalNumber(fd, "target_dc_ac_ratio"),
      peakSunHoursPerDay: optionalNumber(fd, "peak_sun_hours_per_day"),
      systemEfficiencyPct: optionalNumber(fd, "system_efficiency_pct"),
      autonomyHours: intake.autonomy_hours == null ? optionalNumber(fd, "autonomy_hours") : Number(intake.autonomy_hours),
      backupHours: optionalNumber(fd, "backup_hours"),
      backupLoadKw: optionalNumber(fd, "backup_load_kw"),
      batteryDodPct: optionalNumber(fd, "battery_dod_pct"),
      inverterHeadroomPct: optionalNumber(fd, "inverter_headroom_pct"),
    };

    const result = calculateSystemSizing(inputs);
    const blockers = result.validations.filter((item) => item.severity === "error");
    if (blockers.length) throw new Error(blockers.map((item) => item.title).join(" · "));

    const { data: latest } = await supabase
      .from("engineering_calculations")
      .select("revision")
      .eq("organisation_id", organisationId)
      .eq("engineering_intake_id", intake.id)
      .order("revision", { ascending: false })
      .limit(1)
      .maybeSingle();

    const revision = Number(latest?.revision ?? 0) + 1;
    const calculationReference = `${actualOpportunity.reference}-CAL-${String(revision).padStart(2, "0")}`;

    const { error } = await supabase.from("engineering_calculations").insert({
      organisation_id: organisationId,
      engineering_intake_id: intake.id,
      calculation_reference: calculationReference,
      revision,
      system_type: intake.system_type,
      status: "draft",
      engine_version: CALCULATOR_ENGINE_VERSION,
      input_snapshot: {
        ...inputs,
        loadProfileId: load.id,
        designObjective: intake.design_objective,
      },
      result_snapshot: result,
      validation_snapshot: result.validations,
      created_by: user.id,
    });
    if (error) throw new Error(error.message);

    await supabase.from("activity_logs").insert({
      organisation_id: organisationId,
      actor_id: user.id,
      event_type: "engineering_calculation_saved",
      description: `${calculationReference} saved as preliminary ${intake.system_type.replaceAll("_", " ")} sizing for ${actualOpportunity.reference}.`,
    });

    revalidatePath("/dashboard/engineering");
    revalidatePath(`/dashboard/engineering/calculators/${intake.id}`);
    redirect(`/dashboard/engineering/calculators/${intake.id}?saved=1`);
  } catch (error) {
    fail(intakeId, error instanceof Error ? error.message : "Calculator revision could not be saved.");
  }
}
