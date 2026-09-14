import { createClient } from "@/lib/neon/client";
import { runPreliminarySizing } from "@/lib/engineering/heliocalc-client";
import type { CalculatorInputs, CalculatorResult } from "@/lib/engineering/calculator";
import type { EngineeringValidation, SystemType } from "@/lib/engineering/types";

export type CalculatorRevision = {
  id: string;
  calculation_reference: string;
  revision: number;
  status: "draft" | "reviewed";
  engine_version: string;
  input_snapshot: Record<string, unknown>;
  result_snapshot: CalculatorResult;
  validation_snapshot: EngineeringValidation[];
  created_at: string;
};

export type CalculatorWorkspaceRecord = {
  intake: {
    id: string;
    opportunity_id: string;
    site_id: string;
    load_profile_id: string;
    system_type: SystemType;
    design_objective: string;
    status: string;
    autonomy_hours: number | string | null;
  };
  opportunity: { id: string; reference: string; title: string };
  site: { id: string; name: string; postcode: string | null };
  load: {
    id: string;
    status: string;
    data_quality: string | null;
    annual_energy_kwh: number | string | null;
    average_daily_energy_kwh: number | string | null;
    peak_demand_kw: number | string | null;
    essential_peak_demand_kw: number | string | null;
  };
  revisions: CalculatorRevision[];
  reviewer: { role: string; canReview: boolean };
};

async function context() {
  const client = createClient();
  const session = await client.auth.getSession();
  const user = session.data?.user;
  if (!user?.id) throw new Error("Authenticated Neon user required.");

  const { data: profile, error } = await client
    .from("profiles")
    .select("id,organisation_id,status,role")
    .eq("id", user.id)
    .single();

  if (error || !profile?.organisation_id) throw new Error("Organisation context is unavailable.");
  if (profile.status !== "active") throw new Error("This user is not active in the organisation.");

  const role = String(profile.role ?? "member").toLowerCase();
  return {
    client,
    userId: user.id,
    organisationId: profile.organisation_id as string,
    role,
    canReview: ["owner", "admin", "manager"].includes(role),
  };
}

export async function loadCalculatorWorkspace(intakeId: string): Promise<CalculatorWorkspaceRecord> {
  const { client, role, canReview } = await context();

  const { data: intake, error: intakeError } = await client
    .from("engineering_intakes")
    .select("id,opportunity_id,site_id,load_profile_id,system_type,design_objective,status,autonomy_hours")
    .eq("id", intakeId)
    .maybeSingle();

  if (intakeError) throw new Error(intakeError.message);
  if (!intake?.load_profile_id) throw new Error("Calculator record not found or access denied.");

  const [opportunityResult, siteResult, loadResult, revisionsResult] = await Promise.all([
    client.from("opportunities").select("id,reference,title").eq("id", intake.opportunity_id).maybeSingle(),
    client.from("sites").select("id,name,postcode").eq("id", intake.site_id).maybeSingle(),
    client.from("load_profiles").select("id,status,data_quality,annual_energy_kwh,average_daily_energy_kwh,peak_demand_kw,essential_peak_demand_kw").eq("id", intake.load_profile_id).maybeSingle(),
    client.from("engineering_calculations").select("id,calculation_reference,revision,status,engine_version,input_snapshot,result_snapshot,validation_snapshot,created_at").eq("engineering_intake_id", intakeId).order("revision", { ascending: false }),
  ]);

  for (const result of [opportunityResult, siteResult, loadResult, revisionsResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  if (!opportunityResult.data || !siteResult.data || !loadResult.data) {
    throw new Error("Calculator context is incomplete or access is denied.");
  }

  return {
    intake: intake as CalculatorWorkspaceRecord["intake"],
    opportunity: opportunityResult.data as CalculatorWorkspaceRecord["opportunity"],
    site: siteResult.data as CalculatorWorkspaceRecord["site"],
    load: loadResult.data as CalculatorWorkspaceRecord["load"],
    revisions: (revisionsResult.data ?? []) as CalculatorRevision[],
    reviewer: { role, canReview },
  };
}

export async function saveAuthoritativeCalculatorRevision(intakeId: string, assumptions: Omit<CalculatorInputs, "systemType" | "annualEnergyKwh" | "averageDailyEnergyKwh" | "peakDemandKw" | "essentialPeakDemandKw" | "autonomyHours"> & { autonomyHours?: number }) {
  const { client, userId, organisationId } = await context();
  const workspace = await loadCalculatorWorkspace(intakeId);
  const { intake, opportunity, load } = workspace;

  if (workspace.revisions.some((revision) => revision.status === "reviewed")) {
    throw new Error("This sizing basis is already approved. Reopening an approved calculation requires a governed engineering amendment.");
  }
  if (load.status !== "ready") throw new Error("The Load Profile must be Ready before HelioCalc can issue a sizing revision.");
  if (intake.status !== "ready") throw new Error("The Engineering Intake must be Ready before HelioCalc can issue a sizing revision.");

  const inputs: CalculatorInputs = {
    systemType: intake.system_type,
    annualEnergyKwh: Number(load.annual_energy_kwh ?? 0),
    averageDailyEnergyKwh: Number(load.average_daily_energy_kwh ?? 0),
    peakDemandKw: Number(load.peak_demand_kw ?? 0),
    essentialPeakDemandKw: Number(load.essential_peak_demand_kw ?? 0),
    targetSolarContributionPct: assumptions.targetSolarContributionPct,
    specificYieldKwhPerKwpYear: assumptions.specificYieldKwhPerKwpYear,
    targetDcAcRatio: assumptions.targetDcAcRatio,
    peakSunHoursPerDay: assumptions.peakSunHoursPerDay,
    systemEfficiencyPct: assumptions.systemEfficiencyPct,
    autonomyHours: intake.autonomy_hours == null ? assumptions.autonomyHours : Number(intake.autonomy_hours),
    backupHours: assumptions.backupHours,
    backupLoadKw: assumptions.backupLoadKw,
    batteryDodPct: assumptions.batteryDodPct,
    inverterHeadroomPct: assumptions.inverterHeadroomPct,
  };

  const authoritative = await runPreliminarySizing(inputs);
  const blocking = authoritative.result.validations.filter((item) => item.severity === "error");
  if (blocking.length) throw new Error(blocking.map((item) => item.title).join(" · "));

  const revision = Number(workspace.revisions[0]?.revision ?? 0) + 1;
  const calculationReference = `${opportunity.reference}-CAL-${String(revision).padStart(2, "0")}`;
  const inputSnapshot = { ...inputs, loadProfileId: load.id, designObjective: intake.design_objective, source: "governed_load_profile", authority: "heliocalc_python" };

  const { data: saved, error: saveError } = await client
    .from("engineering_calculations")
    .insert({ organisation_id: organisationId, engineering_intake_id: intake.id, calculation_reference: calculationReference, revision, system_type: intake.system_type, status: "draft", engine_version: authoritative.engineVersion, input_snapshot: inputSnapshot, result_snapshot: authoritative.result, validation_snapshot: authoritative.result.validations, created_by: userId })
    .select("id,calculation_reference,revision,engine_version")
    .single();

  if (saveError || !saved) throw new Error(saveError?.message ?? "Authoritative calculation revision could not be saved.");

  const { error: auditError } = await client.from("activity_logs").insert({ organisation_id: organisationId, actor_id: userId, event_type: "engineering.calculation.authoritative_saved", description: `${calculationReference} recomputed by ${authoritative.engineVersion} and stored as an immutable preliminary sizing revision for ${opportunity.reference}.` });
  if (auditError) {
    await client.from("engineering_calculations").delete().eq("id", saved.id);
    throw new Error("Calculation was rolled back because its audit event could not be recorded.");
  }

  return { id: saved.id as string, calculationReference: saved.calculation_reference as string, revision: Number(saved.revision), engineVersion: saved.engine_version as string, result: authoritative.result };
}

function assertReviewAuthority(canReview: boolean) {
  if (!canReview) throw new Error("Only an Owner, Admin or Manager can review the Calculator sizing basis.");
}

export async function approveLatestCalculatorRevision(intakeId: string, calculationId: string, note?: string) {
  const { client, userId, organisationId, canReview } = await context();
  assertReviewAuthority(canReview);
  const workspace = await loadCalculatorWorkspace(intakeId);
  const latest = workspace.revisions[0];
  if (!latest || latest.id !== calculationId) throw new Error("Only the latest authoritative calculation revision can be approved.");
  if (latest.status === "reviewed") return latest;
  if (workspace.intake.status !== "ready" || workspace.load.status !== "ready") throw new Error("Engineering Intake and Load Profile must both remain Ready at approval time.");
  const blockers = latest.validation_snapshot.filter((item) => item.severity === "error");
  if (blockers.length) throw new Error("A calculation with blocking validation findings cannot be approved.");
  if (String(latest.input_snapshot.authority ?? "") !== "heliocalc_python") throw new Error("Only a Python HelioCalc authoritative revision can be approved.");

  const { error } = await client.from("engineering_calculations").update({ status: "reviewed" }).eq("id", latest.id).eq("status", "draft");
  if (error) throw new Error(error.message);
  const suffix = note?.trim() ? ` Review note: ${note.trim()}` : "";
  const { error: auditError } = await client.from("activity_logs").insert({ organisation_id: organisationId, actor_id: userId, event_type: "engineering.calculation.approved", description: `${latest.calculation_reference} approved as the governed preliminary sizing basis.${suffix}` });
  if (auditError) {
    await client.from("engineering_calculations").update({ status: "draft" }).eq("id", latest.id);
    throw new Error("Approval was rolled back because its audit event could not be recorded.");
  }
  return { ...latest, status: "reviewed" as const };
}

export async function returnLatestCalculatorRevision(intakeId: string, calculationId: string, note: string) {
  const { client, userId, organisationId, canReview } = await context();
  assertReviewAuthority(canReview);
  const reviewNote = note.trim();
  if (reviewNote.length < 8) throw new Error("A clear review note is required when returning a calculation for revision.");
  const workspace = await loadCalculatorWorkspace(intakeId);
  const latest = workspace.revisions[0];
  if (!latest || latest.id !== calculationId) throw new Error("Only the latest authoritative calculation revision can be returned.");
  if (latest.status === "reviewed") throw new Error("An approved sizing basis cannot be returned without a governed engineering amendment.");
  const { error } = await client.from("activity_logs").insert({ organisation_id: organisationId, actor_id: userId, event_type: "engineering.calculation.returned_for_revision", description: `${latest.calculation_reference} returned for a new authoritative HelioCalc revision. Review note: ${reviewNote}` });
  if (error) throw new Error(error.message);
  return latest;
}
