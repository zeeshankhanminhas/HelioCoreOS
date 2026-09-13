"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assessOpportunityEngineeringReadiness } from "@/lib/application/opportunity-readiness";
import type { DesignObjective, LoadProfileSource, SystemType } from "@/lib/engineering/types";

const systemTypes: SystemType[] = ["on_grid", "off_grid", "hybrid"];
const loadSources: LoadProfileSource[] = ["interval_data", "utility_bills", "appliance_schedule", "manual_summary"];
const objectives: DesignObjective[] = [
  "reduce_imports",
  "maximize_self_consumption",
  "backup_resilience",
  "off_grid_autonomy",
  "peak_shaving",
  "export_generation",
];

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function optionalNumber(fd: FormData, key: string) {
  const raw = text(fd, key);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : Number.NaN;
}

function fail(message: string): never {
  redirect(`/dashboard/engineering?error=${encodeURIComponent(message)}`);
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

export async function createEngineeringIntake(fd: FormData) {
  const { supabase, user, organisationId } = await context();

  const opportunityId = text(fd, "opportunity_id");
  const systemType = text(fd, "system_type") as SystemType;
  const loadProfileSource = text(fd, "load_profile_source") as LoadProfileSource;
  const objective = text(fd, "design_objective") as DesignObjective;
  const autonomyHours = optionalNumber(fd, "autonomy_hours");
  const exportLimitKw = optionalNumber(fd, "export_limit_kw");
  const reserveSocPct = optionalNumber(fd, "reserve_soc_pct");

  if (!opportunityId) fail("Choose an opportunity before starting engineering.");
  if (!systemTypes.includes(systemType)) fail("Choose a valid system type.");
  if (!loadSources.includes(loadProfileSource)) fail("Choose a valid load-profile source.");
  if (!objectives.includes(objective)) fail("Choose a valid design objective.");
  if ([autonomyHours, exportLimitKw, reserveSocPct].some((value) => Number.isNaN(value))) fail("Engineering constraints must be valid numbers.");
  if (autonomyHours != null && autonomyHours <= 0) fail("Autonomy must be greater than zero hours.");
  if (exportLimitKw != null && exportLimitKw < 0) fail("Export limit cannot be negative.");
  if (reserveSocPct != null && (reserveSocPct < 0 || reserveSocPct > 100)) fail("Reserve SOC must be between 0% and 100%.");

  const [{ data: opportunity }, { data: readiness, error: readinessError }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id,reference,customer_id,site_id")
      .eq("id", opportunityId)
      .eq("organisation_id", organisationId)
      .maybeSingle(),
    supabase
      .from("opportunity_readiness_items")
      .select("item_type,status,is_required")
      .eq("opportunity_id", opportunityId)
      .eq("organisation_id", organisationId),
  ]);

  if (!opportunity) fail("Opportunity not found or access denied.");
  if (readinessError) fail("Opportunity readiness could not be verified.");

  const assessment = assessOpportunityEngineeringReadiness({
    customerId: opportunity.customer_id,
    siteId: opportunity.site_id,
    items: (readiness ?? []) as Parameters<typeof assessOpportunityEngineeringReadiness>[0]["items"],
  });

  if (!assessment.readyForEngineering) {
    redirect(`/dashboard/opportunities/${opportunityId}/engineering-readiness?blocked=1`);
  }
  if (!opportunity.site_id) fail("This opportunity needs a site before engineering can begin.");

  const { data: loadProfile, error: loadProfileError } = await supabase
    .from("load_profiles")
    .insert({
      organisation_id: organisationId,
      opportunity_id: opportunity.id,
      site_id: opportunity.site_id,
      name: `${opportunity.reference} load profile`,
      source: loadProfileSource,
      status: "draft",
      data_quality: loadProfileSource === "interval_data" ? "measured" : "estimated",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (loadProfileError || !loadProfile) fail(loadProfileError?.message ?? "Load profile draft could not be created.");

  const { data: intake, error: intakeError } = await supabase
    .from("engineering_intakes")
    .insert({
      organisation_id: organisationId,
      opportunity_id: opportunity.id,
      site_id: opportunity.site_id,
      load_profile_id: loadProfile.id,
      system_type: systemType,
      design_objective: objective,
      status: "draft",
      autonomy_hours: systemType === "off_grid" ? autonomyHours : null,
      export_limit_kw: systemType === "on_grid" ? exportLimitKw : null,
      reserve_soc_pct: systemType === "hybrid" ? reserveSocPct : null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (intakeError || !intake) {
    await supabase.from("load_profiles").delete().eq("id", loadProfile.id).eq("organisation_id", organisationId);
    fail(intakeError?.message ?? "Engineering intake could not be created.");
  }

  const { error: activityError } = await supabase.from("activity_logs").insert({
    organisation_id: organisationId,
    actor_id: user.id,
    event_type: "engineering.intake.created",
    description: `${opportunity.reference} engineering intake created as ${systemType.replaceAll("_", " ")}`,
  });

  if (activityError) {
    await supabase.from("engineering_intakes").delete().eq("id", intake.id).eq("organisation_id", organisationId);
    await supabase.from("load_profiles").delete().eq("id", loadProfile.id).eq("organisation_id", organisationId);
    fail("Engineering intake was rolled back because its audit event could not be recorded.");
  }

  revalidatePath("/dashboard/engineering");
  revalidatePath("/dashboard");
  redirect(`/dashboard/engineering/load-profiles/${loadProfile.id}`);
}
