import { createClient } from "@/lib/neon/client";
import { assessOpportunityEngineeringReadiness, type ReadinessItem } from "@/lib/application/opportunity-readiness";
import type { DesignObjective, LoadProfileSource, SystemType } from "@/lib/engineering/types";

export type OpportunityContext = {
  userId: string;
  organisationId: string;
};

export async function getOpportunityContext() {
  const client = createClient();
  const sessionResult = await client.auth.getSession();
  const user = sessionResult.data?.user;
  if (!user?.id) throw new Error("Authenticated Neon user required.");

  const { data: profile, error } = await client
    .from("profiles")
    .select("id,organisation_id,status")
    .eq("id", user.id)
    .single();

  if (error || !profile?.organisation_id) throw new Error("Organisation context is unavailable.");
  if (profile.status !== "active") throw new Error("This user is not active in the organisation.");

  return { client, context: { userId: user.id, organisationId: profile.organisation_id } as OpportunityContext };
}

export async function createOpportunityFromForm(form: {
  title: string;
  reference: string;
  customerId: string | null;
  siteId: string | null;
  ownerId: string | null;
  leadSource: string | null;
  estimatedPv: number | null;
  estimatedBattery: number | null;
  estimatedValue: number | null;
  notes: string | null;
}) {
  const { client, context } = await getOpportunityContext();

  if (form.siteId) {
    const { data: site, error: siteError } = await client
      .from("sites")
      .select("id,customer_id")
      .eq("id", form.siteId)
      .single();
    if (siteError || !site) throw new Error("The selected site is unavailable.");
    if (form.customerId && site.customer_id !== form.customerId) throw new Error("The selected site belongs to another customer.");
    form.customerId = form.customerId ?? site.customer_id ?? null;
  }

  const { data: duplicate } = await client
    .from("opportunities")
    .select("id")
    .eq("reference", form.reference)
    .maybeSingle();
  if (duplicate) throw new Error("That opportunity reference is already in use.");

  const { data: opportunity, error } = await client
    .from("opportunities")
    .insert({
      organisation_id: context.organisationId,
      customer_id: form.customerId,
      site_id: form.siteId,
      owner_id: form.ownerId,
      title: form.title,
      reference: form.reference,
      stage: "lead",
      lead_source: form.leadSource,
      estimated_pv_kwp: form.estimatedPv,
      estimated_battery_kwh: form.estimatedBattery,
      estimated_value_gbp: form.estimatedValue,
      notes: form.notes,
    })
    .select("id,reference")
    .single();

  if (error || !opportunity) throw new Error(error?.message ?? "Opportunity could not be created.");

  const readinessTypes = ["electricity_bill", "customer_id", "proof_of_address", "ownership_evidence", "meter_photo", "survey_authorisation"];
  const { error: readinessError } = await client.from("opportunity_readiness_items").insert(
    readinessTypes.map((item_type) => ({
      organisation_id: context.organisationId,
      opportunity_id: opportunity.id,
      item_type,
    })),
  );

  if (readinessError) {
    await client.from("opportunities").delete().eq("id", opportunity.id);
    throw new Error("Opportunity creation was rolled back because readiness setup failed.");
  }

  const { error: auditError } = await client.from("activity_logs").insert({
    organisation_id: context.organisationId,
    actor_id: context.userId,
    event_type: "opportunity.created",
    description: `Opportunity ${opportunity.reference} created through Neon Data API`,
  });

  if (auditError) {
    await client.from("opportunities").delete().eq("id", opportunity.id);
    throw new Error("Opportunity creation was rolled back because the audit event failed.");
  }

  return opportunity.id;
}

export async function loadOpportunityEngineeringReadiness(opportunityId: string) {
  const { client } = await getOpportunityContext();
  const [opportunityResult, readinessResult, engineeringResult] = await Promise.all([
    client.from("opportunities").select("id,title,reference,stage,customer_id,site_id,customers(name,display_name),sites(name,postcode)").eq("id", opportunityId).single(),
    client.from("opportunity_readiness_items").select("id,item_type,status,is_required,evidence_url,review_note,decision_note,updated_at").eq("opportunity_id", opportunityId).order("item_type"),
    client.from("engineering_intakes").select("id,load_profile_id,system_type,status,created_at").eq("opportunity_id", opportunityId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  if (opportunityResult.error || !opportunityResult.data) throw new Error("Opportunity not found or access denied.");
  if (readinessResult.error) throw new Error(readinessResult.error.message);

  const opportunity = opportunityResult.data;
  const readiness = (readinessResult.data ?? []) as ReadinessItem[];
  const assessment = assessOpportunityEngineeringReadiness({
    customerId: opportunity.customer_id,
    siteId: opportunity.site_id,
    items: readiness,
  });

  return {
    opportunity,
    readiness: readinessResult.data ?? [],
    engineering: engineeringResult.data ?? null,
    assessment,
  };
}

export async function updateOpportunityReadiness(input: {
  opportunityId: string;
  itemType: string;
  status: "requested" | "uploaded" | "accepted" | "rejected" | "waived";
  evidenceUrl?: string | null;
  reviewNote?: string | null;
}) {
  const { client, context } = await getOpportunityContext();
  const { error } = await client
    .from("opportunity_readiness_items")
    .update({
      status: input.status,
      evidence_url: input.evidenceUrl || null,
      review_note: input.reviewNote || null,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("opportunity_id", input.opportunityId)
    .eq("item_type", input.itemType);

  if (error) throw new Error(error.message);

  const { error: auditError } = await client.from("activity_logs").insert({
    organisation_id: context.organisationId,
    actor_id: context.userId,
    event_type: "readiness.updated",
    description: `${input.itemType.replaceAll("_", " ")} marked ${input.status}`,
  });
  if (auditError) throw new Error("Readiness changed, but its audit event could not be recorded.");
}

export async function startEngineeringFromOpportunity(input: {
  opportunityId: string;
  systemType: SystemType;
  loadProfileSource: LoadProfileSource;
  designObjective: DesignObjective;
  autonomyHours?: number | null;
  exportLimitKw?: number | null;
  reserveSocPct?: number | null;
}) {
  const { client, context } = await getOpportunityContext();
  const state = await loadOpportunityEngineeringReadiness(input.opportunityId);

  if (!state.assessment.readyForEngineering) {
    throw new Error(`Engineering is blocked: ${state.assessment.blockers.join(" ")}`);
  }
  if (!state.opportunity.site_id) throw new Error("A Site is required before engineering can begin.");
  if (state.engineering) return state.engineering.load_profile_id as string | null;

  const { data: loadProfile, error: loadError } = await client
    .from("load_profiles")
    .insert({
      organisation_id: context.organisationId,
      opportunity_id: state.opportunity.id,
      site_id: state.opportunity.site_id,
      name: `${state.opportunity.reference} load profile`,
      source: input.loadProfileSource,
      status: "draft",
      data_quality: input.loadProfileSource === "interval_data" ? "measured" : "estimated",
      created_by: context.userId,
    })
    .select("id")
    .single();

  if (loadError || !loadProfile) throw new Error(loadError?.message ?? "Load Profile could not be created.");

  const { data: intake, error: intakeError } = await client
    .from("engineering_intakes")
    .insert({
      organisation_id: context.organisationId,
      opportunity_id: state.opportunity.id,
      site_id: state.opportunity.site_id,
      load_profile_id: loadProfile.id,
      system_type: input.systemType,
      design_objective: input.designObjective,
      status: "draft",
      autonomy_hours: input.systemType === "off_grid" ? input.autonomyHours ?? null : null,
      export_limit_kw: input.systemType === "on_grid" ? input.exportLimitKw ?? null : null,
      reserve_soc_pct: input.systemType === "hybrid" ? input.reserveSocPct ?? null : null,
      created_by: context.userId,
    })
    .select("id")
    .single();

  if (intakeError || !intake) {
    await client.from("load_profiles").delete().eq("id", loadProfile.id);
    throw new Error(intakeError?.message ?? "Engineering intake could not be created.");
  }

  const { error: auditError } = await client.from("activity_logs").insert({
    organisation_id: context.organisationId,
    actor_id: context.userId,
    event_type: "engineering.intake.created",
    description: `${state.opportunity.reference} engineering intake created from readiness gate`,
  });

  if (auditError) {
    await client.from("engineering_intakes").delete().eq("id", intake.id);
    await client.from("load_profiles").delete().eq("id", loadProfile.id);
    throw new Error("Engineering intake was rolled back because its audit event failed.");
  }

  return loadProfile.id as string;
}
