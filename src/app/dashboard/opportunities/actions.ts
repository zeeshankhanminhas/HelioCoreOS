"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const readinessTypes = ["electricity_bill","customer_id","proof_of_address","ownership_evidence","meter_photo","survey_authorisation"] as const;
const readinessStatuses = ["requested","uploaded","accepted","rejected","waived"] as const;
const proposalStatuses = ["draft","issued","accepted","declined","expired"] as const;

function text(fd: FormData, key: string) { return String(fd.get(key) ?? "").trim(); }
function numberOrNull(fd: FormData, key: string) { const value = text(fd,key); return value && Number.isFinite(Number(value)) ? Number(value) : null; }

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organisation_id").eq("id", user.id).single();
  if (!profile?.organisation_id) throw new Error("Organisation context missing");
  return { supabase, user, organisationId: profile.organisation_id };
}

export async function createOpportunity(fd: FormData) {
  const { supabase, user, organisationId } = await context();
  const title = text(fd,"title"), reference = text(fd,"reference");
  const customerId = text(fd,"customer_id") || null;
  const siteId = text(fd,"site_id") || null;
  if (!title || !reference) redirect("/dashboard/opportunities/new?error=Opportunity%20title%20and%20reference%20are%20required");
  const { data, error } = await supabase.from("opportunities").insert({
    organisation_id: organisationId, customer_id: customerId, site_id: siteId, owner_id: text(fd,"owner_id") || null,
    title, reference: reference.toUpperCase(), stage: "lead", lead_source: text(fd,"lead_source") || null,
    estimated_pv_kwp: numberOrNull(fd,"estimated_pv_kwp"), estimated_battery_kwh: numberOrNull(fd,"estimated_battery_kwh"),
    estimated_value_gbp: numberOrNull(fd,"estimated_value_gbp"), notes: text(fd,"notes") || null
  }).select("id").single();
  if (error || !data) redirect(`/dashboard/opportunities/new?error=${encodeURIComponent(error?.message ?? "Opportunity could not be created")}`);
  await supabase.from("opportunity_readiness_items").insert(readinessTypes.map(item_type => ({ organisation_id: organisationId, opportunity_id: data.id, item_type })));
  await supabase.from("activity_logs").insert({ organisation_id: organisationId, actor_id: user.id, event_type: "opportunity.created", description: `Opportunity ${reference.toUpperCase()} created` });
  revalidatePath("/dashboard/opportunities"); redirect(`/dashboard/opportunities/${data.id}`);
}

export async function updateReadiness(fd: FormData) {
  const { supabase, user, organisationId } = await context();
  const opportunityId = text(fd,"opportunity_id"), itemType = text(fd,"item_type"), status = text(fd,"status");
  if (!readinessTypes.includes(itemType as never) || !readinessStatuses.includes(status as never)) redirect(`/dashboard/opportunities/${opportunityId}?error=Invalid%20readiness%20update`);
  const { error } = await supabase.from("opportunity_readiness_items").update({ status, evidence_url: text(fd,"evidence_url") || null, review_note: text(fd,"review_note") || null, updated_by: user.id, updated_at: new Date().toISOString() }).eq("opportunity_id", opportunityId).eq("item_type", itemType);
  if (error) redirect(`/dashboard/opportunities/${opportunityId}?error=${encodeURIComponent(error.message)}`);
  await supabase.from("activity_logs").insert({ organisation_id: organisationId, actor_id: user.id, event_type: "readiness.updated", description: `${itemType.replaceAll("_"," ")} marked ${status}` });
  revalidatePath(`/dashboard/opportunities/${opportunityId}`); redirect(`/dashboard/opportunities/${opportunityId}?updated=readiness`);
}

export async function saveProposal(fd: FormData) {
  const { supabase, user, organisationId } = await context();
  const opportunityId = text(fd,"opportunity_id"), proposalNumber = text(fd,"proposal_number"), status = text(fd,"status") || "draft";
  if (!opportunityId || !proposalNumber || !proposalStatuses.includes(status as never)) redirect(`/dashboard/opportunities/${opportunityId}?error=Invalid%20proposal`);
  const payload = { organisation_id: organisationId, opportunity_id: opportunityId, proposal_number: proposalNumber.toUpperCase(), status,
    pv_capacity_kwp: numberOrNull(fd,"pv_capacity_kwp"), battery_capacity_kwh: numberOrNull(fd,"battery_capacity_kwh"), estimated_generation_kwh: numberOrNull(fd,"estimated_generation_kwh"),
    estimated_annual_saving_gbp: numberOrNull(fd,"estimated_annual_saving_gbp"), indicative_price_gbp: numberOrNull(fd,"indicative_price_gbp"), assumptions: text(fd,"assumptions") || null,
    exclusions: text(fd,"exclusions") || null, valid_until: text(fd,"valid_until") || null, issued_at: status === "issued" ? new Date().toISOString() : null, updated_at: new Date().toISOString() };
  const { error } = await supabase.from("indicative_proposals").upsert(payload, { onConflict: "opportunity_id" });
  if (error) redirect(`/dashboard/opportunities/${opportunityId}?error=${encodeURIComponent(error.message)}`);
  await supabase.from("opportunities").update({ stage: status === "draft" ? "proposal" : status === "accepted" ? "won" : "proposal", updated_at: new Date().toISOString() }).eq("id", opportunityId);
  await supabase.from("activity_logs").insert({ organisation_id: organisationId, actor_id: user.id, event_type: "proposal.saved", description: `Indicative proposal ${proposalNumber.toUpperCase()} saved as ${status}` });
  revalidatePath("/dashboard/opportunities"); revalidatePath(`/dashboard/opportunities/${opportunityId}`); redirect(`/dashboard/opportunities/${opportunityId}?updated=proposal`);
}