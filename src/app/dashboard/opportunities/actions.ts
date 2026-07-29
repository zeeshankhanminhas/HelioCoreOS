"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const readinessTypes = ["electricity_bill", "customer_id", "proof_of_address", "ownership_evidence", "meter_photo", "survey_authorisation"] as const;
const readinessStatuses = ["requested", "uploaded", "accepted", "rejected", "waived"] as const;
const proposalStatuses = ["draft", "issued", "accepted", "declined", "expired"] as const;
const opportunityStages = ["lead", "qualified", "readiness", "proposal", "won", "lost"] as const;

type OpportunityInput = {
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
};

type OpportunityPayloadResult =
  | { ok: true; value: OpportunityInput }
  | { ok: false; error: string };

type RelationshipResult =
  | { ok: true; customerId: string | null }
  | { ok: false; error: string };

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function numberOrNull(fd: FormData, key: string) {
  const value = text(fd, key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function context() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  if (error || !profile?.organisation_id) throw new Error("Organisation context missing");
  return { supabase, user, organisationId: profile.organisation_id };
}

async function validateRelationships(
  supabase: Awaited<ReturnType<typeof createClient>>,
  organisationId: string,
  customerId: string | null,
  siteId: string | null,
  ownerId: string | null,
): Promise<RelationshipResult> {
  let resolvedCustomerId = customerId;

  if (customerId) {
    const { data } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .eq("organisation_id", organisationId)
      .maybeSingle();
    if (!data) return { ok: false, error: "The selected customer is unavailable in this organisation." };
  }

  if (siteId) {
    const { data } = await supabase
      .from("sites")
      .select("id,customer_id")
      .eq("id", siteId)
      .eq("organisation_id", organisationId)
      .maybeSingle();
    if (!data) return { ok: false, error: "The selected site is unavailable in this organisation." };
    if (customerId && data.customer_id && data.customer_id !== customerId) {
      return { ok: false, error: "The selected site belongs to a different customer." };
    }
    resolvedCustomerId = resolvedCustomerId ?? data.customer_id ?? null;
  }

  if (ownerId) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", ownerId)
      .eq("organisation_id", organisationId)
      .eq("status", "active")
      .maybeSingle();
    if (!data) return { ok: false, error: "The selected owner is not an active member of this organisation." };
  }

  return { ok: true, customerId: resolvedCustomerId };
}

function opportunityPayload(fd: FormData): OpportunityPayloadResult {
  const title = text(fd, "title");
  const reference = text(fd, "reference").toUpperCase();
  const estimatedPv = numberOrNull(fd, "estimated_pv_kwp");
  const estimatedBattery = numberOrNull(fd, "estimated_battery_kwh");
  const estimatedValue = numberOrNull(fd, "estimated_value_gbp");

  if (!title || !reference) return { ok: false, error: "Opportunity title and reference are required." };
  if (title.length > 160) return { ok: false, error: "Opportunity title must be 160 characters or fewer." };
  if (!/^[A-Z0-9][A-Z0-9._/-]{2,39}$/.test(reference)) {
    return { ok: false, error: "Reference must be 3–40 characters using letters, numbers, dots, slashes, underscores or hyphens." };
  }
  if ([estimatedPv, estimatedBattery, estimatedValue].some((value) => Number.isNaN(value))) {
    return { ok: false, error: "Estimated capacities and value must be valid non-negative numbers." };
  }

  return {
    ok: true,
    value: {
      title,
      reference,
      customerId: text(fd, "customer_id") || null,
      siteId: text(fd, "site_id") || null,
      ownerId: text(fd, "owner_id") || null,
      leadSource: text(fd, "lead_source") || null,
      estimatedPv,
      estimatedBattery,
      estimatedValue,
      notes: text(fd, "notes") || null,
    },
  };
}

export async function createOpportunity(fd: FormData) {
  const { supabase, user, organisationId } = await context();
  const parsed = opportunityPayload(fd);
  if (!parsed.ok) fail("/dashboard/opportunities/new", parsed.error);
  const input = parsed.value;

  const relationship = await validateRelationships(supabase, organisationId, input.customerId, input.siteId, input.ownerId);
  if (!relationship.ok) fail("/dashboard/opportunities/new", relationship.error);

  const { data: duplicate } = await supabase
    .from("opportunities")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("reference", input.reference)
    .maybeSingle();
  if (duplicate) fail("/dashboard/opportunities/new", "That opportunity reference is already in use.");

  const { data, error } = await supabase
    .from("opportunities")
    .insert({
      organisation_id: organisationId,
      customer_id: relationship.customerId,
      site_id: input.siteId,
      owner_id: input.ownerId,
      title: input.title,
      reference: input.reference,
      stage: "lead",
      lead_source: input.leadSource,
      estimated_pv_kwp: input.estimatedPv,
      estimated_battery_kwh: input.estimatedBattery,
      estimated_value_gbp: input.estimatedValue,
      notes: input.notes,
    })
    .select("id")
    .single();

  if (error || !data) fail("/dashboard/opportunities/new", error?.message ?? "Opportunity could not be created.");

  const { error: readinessError } = await supabase.from("opportunity_readiness_items").insert(
    readinessTypes.map((item_type) => ({ organisation_id: organisationId, opportunity_id: data.id, item_type })),
  );

  if (readinessError) {
    await supabase.from("opportunities").delete().eq("id", data.id).eq("organisation_id", organisationId);
    fail("/dashboard/opportunities/new", "Opportunity setup failed before the readiness checklist was created.");
  }

  const { error: activityError } = await supabase.from("activity_logs").insert({
    organisation_id: organisationId,
    actor_id: user.id,
    event_type: "opportunity.created",
    description: `Opportunity ${input.reference} created`,
  });

  if (activityError) {
    await supabase.from("opportunities").delete().eq("id", data.id).eq("organisation_id", organisationId);
    fail("/dashboard/opportunities/new", "Opportunity setup failed before the audit event was recorded.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/opportunities");
  redirect(`/dashboard/opportunities/${data.id}?created=1`);
}

export async function updateOpportunity(fd: FormData) {
  const { supabase, user, organisationId } = await context();
  const opportunityId = text(fd, "opportunity_id");
  const path = `/dashboard/opportunities/${opportunityId}`;
  if (!opportunityId) fail("/dashboard/opportunities", "Opportunity identifier is missing.");

  const parsed = opportunityPayload(fd);
  if (!parsed.ok) fail(path, parsed.error);
  const input = parsed.value;

  const stage = text(fd, "stage") || "lead";
  if (!opportunityStages.includes(stage as (typeof opportunityStages)[number])) fail(path, "Invalid opportunity stage.");

  const relationship = await validateRelationships(supabase, organisationId, input.customerId, input.siteId, input.ownerId);
  if (!relationship.ok) fail(path, relationship.error);

  const { data: duplicate } = await supabase
    .from("opportunities")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("reference", input.reference)
    .neq("id", opportunityId)
    .maybeSingle();
  if (duplicate) fail(path, "That opportunity reference is already in use.");

  const { data: existing } = await supabase
    .from("opportunities")
    .select("id,stage")
    .eq("id", opportunityId)
    .eq("organisation_id", organisationId)
    .maybeSingle();
  if (!existing) fail("/dashboard/opportunities", "Opportunity not found or access denied.");

  const { error } = await supabase
    .from("opportunities")
    .update({
      customer_id: relationship.customerId,
      site_id: input.siteId,
      owner_id: input.ownerId,
      title: input.title,
      reference: input.reference,
      stage,
      lead_source: input.leadSource,
      estimated_pv_kwp: input.estimatedPv,
      estimated_battery_kwh: input.estimatedBattery,
      estimated_value_gbp: input.estimatedValue,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opportunityId)
    .eq("organisation_id", organisationId);

  if (error) fail(path, error.message);

  const event = existing.stage === stage ? "opportunity.updated" : "opportunity.stage_changed";
  const description = existing.stage === stage
    ? `Opportunity ${input.reference} updated`
    : `Opportunity ${input.reference} moved from ${existing.stage} to ${stage}`;
  const { error: auditError } = await supabase.from("activity_logs").insert({
    organisation_id: organisationId,
    actor_id: user.id,
    event_type: event,
    description,
  });
  if (auditError) fail(path, "The opportunity was updated, but its audit event could not be recorded. Please contact an administrator.");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/opportunities");
  revalidatePath(path);
  redirect(`${path}?updated=opportunity`);
}

export async function updateReadiness(fd: FormData) {
  const { supabase, user, organisationId } = await context();
  const opportunityId = text(fd, "opportunity_id");
  const itemType = text(fd, "item_type");
  const status = text(fd, "status");
  const path = `/dashboard/opportunities/${opportunityId}`;
  if (!readinessTypes.includes(itemType as (typeof readinessTypes)[number]) || !readinessStatuses.includes(status as (typeof readinessStatuses)[number])) fail(path, "Invalid readiness update.");

  const { error } = await supabase
    .from("opportunity_readiness_items")
    .update({ status, evidence_url: text(fd, "evidence_url") || null, review_note: text(fd, "review_note") || null, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("organisation_id", organisationId)
    .eq("opportunity_id", opportunityId)
    .eq("item_type", itemType);
  if (error) fail(path, error.message);

  const { error: auditError } = await supabase.from("activity_logs").insert({ organisation_id: organisationId, actor_id: user.id, event_type: "readiness.updated", description: `${itemType.replaceAll("_", " ")} marked ${status}` });
  if (auditError) fail(path, "Readiness was updated, but its audit event could not be recorded.");
  revalidatePath(path);
  redirect(`${path}?updated=readiness`);
}

export async function saveProposal(fd: FormData) {
  const { supabase, user, organisationId } = await context();
  const opportunityId = text(fd, "opportunity_id");
  const proposalNumber = text(fd, "proposal_number");
  const status = text(fd, "status") || "draft";
  const path = `/dashboard/opportunities/${opportunityId}`;
  if (!opportunityId || !proposalNumber || !proposalStatuses.includes(status as (typeof proposalStatuses)[number])) fail(path, "Invalid proposal.");

  const payload = {
    organisation_id: organisationId,
    opportunity_id: opportunityId,
    proposal_number: proposalNumber.toUpperCase(),
    status,
    pv_capacity_kwp: numberOrNull(fd, "pv_capacity_kwp"),
    battery_capacity_kwh: numberOrNull(fd, "battery_capacity_kwh"),
    estimated_generation_kwh: numberOrNull(fd, "estimated_generation_kwh"),
    estimated_annual_saving_gbp: numberOrNull(fd, "estimated_annual_saving_gbp"),
    indicative_price_gbp: numberOrNull(fd, "indicative_price_gbp"),
    assumptions: text(fd, "assumptions") || null,
    exclusions: text(fd, "exclusions") || null,
    valid_until: text(fd, "valid_until") || null,
    issued_at: status === "issued" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const numericValues = [payload.pv_capacity_kwp, payload.battery_capacity_kwh, payload.estimated_generation_kwh, payload.estimated_annual_saving_gbp, payload.indicative_price_gbp];
  if (numericValues.some((value) => Number.isNaN(value))) fail(path, "Proposal values must be valid non-negative numbers.");

  const { error } = await supabase.from("indicative_proposals").upsert(payload, { onConflict: "opportunity_id" });
  if (error) fail(path, error.message);

  await supabase
    .from("opportunities")
    .update({ stage: status === "accepted" ? "won" : "proposal", updated_at: new Date().toISOString() })
    .eq("id", opportunityId)
    .eq("organisation_id", organisationId);

  const { error: auditError } = await supabase.from("activity_logs").insert({ organisation_id: organisationId, actor_id: user.id, event_type: "proposal.saved", description: `Indicative proposal ${proposalNumber.toUpperCase()} saved as ${status}` });
  if (auditError) fail(path, "Proposal was saved, but its audit event could not be recorded.");
  revalidatePath("/dashboard/opportunities");
  revalidatePath(path);
  redirect(`${path}?updated=proposal`);
}
