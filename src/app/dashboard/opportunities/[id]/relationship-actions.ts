"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function updateOpportunityRelationships(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const opportunityId = text(fd, "opportunity_id");
  const customerId = text(fd, "customer_id") || null;
  const siteId = text(fd, "site_id") || null;
  const path = `/dashboard/opportunities/${opportunityId}`;

  if (!opportunityId) fail("/dashboard/opportunities", "Opportunity identifier is missing.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organisation_id) fail(path, "Organisation context is unavailable.");
  const organisationId = profile.organisation_id;

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id,reference,customer_id,site_id")
    .eq("id", opportunityId)
    .eq("organisation_id", organisationId)
    .maybeSingle();

  if (!opportunity) fail("/dashboard/opportunities", "Opportunity not found or access denied.");

  if (customerId) {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("id", customerId)
      .eq("organisation_id", organisationId)
      .maybeSingle();
    if (!customer) fail(path, "The selected customer is unavailable in this organisation.");
  }

  let resolvedCustomerId = customerId;
  if (siteId) {
    const { data: site } = await supabase
      .from("sites")
      .select("id,customer_id")
      .eq("id", siteId)
      .eq("organisation_id", organisationId)
      .maybeSingle();

    if (!site) fail(path, "The selected site is unavailable in this organisation.");
    if (customerId && site.customer_id && site.customer_id !== customerId) {
      fail(path, "The selected site belongs to a different customer.");
    }
    resolvedCustomerId = resolvedCustomerId ?? site.customer_id ?? null;
  }

  const customerChanged = opportunity.customer_id !== resolvedCustomerId;
  const siteChanged = opportunity.site_id !== siteId;

  if (!customerChanged && !siteChanged) redirect(`${path}?updated=relationships`);

  const { error } = await supabase
    .from("opportunities")
    .update({
      customer_id: resolvedCustomerId,
      site_id: siteId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", opportunityId)
    .eq("organisation_id", organisationId);

  if (error) fail(path, error.message);

  const changes = [
    customerChanged ? "customer assignment changed" : null,
    siteChanged ? "site assignment changed" : null,
  ].filter(Boolean).join(" and ");

  const { error: auditError } = await supabase.from("activity_logs").insert({
    organisation_id: organisationId,
    actor_id: user.id,
    event_type: "opportunity.relationships_changed",
    description: `Opportunity ${opportunity.reference} ${changes}`,
  });

  if (auditError) {
    fail(path, "Relationships were updated, but the audit event could not be recorded. Please contact an administrator.");
  }

  revalidatePath("/dashboard/opportunities");
  revalidatePath(path);
  redirect(`${path}?updated=relationships`);
}
