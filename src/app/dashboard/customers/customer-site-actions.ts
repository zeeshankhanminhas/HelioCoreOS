"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const customerStatuses = ["prospect", "active", "inactive", "blocked", "archived"] as const;

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organisation_id").eq("id", user.id).single();
  if (!profile?.organisation_id) fail("/dashboard", "Organisation context is not available.");
  return { supabase, user, organisationId: profile.organisation_id };
}

function validEmail(value: string) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validCode(value: string, length: number) {
  return new RegExp(`^[A-Z]{${length}}$`).test(value);
}

export async function updateCustomer(fd: FormData) {
  const id = text(fd, "customer_id");
  const path = `/dashboard/customers/${id}/edit`;
  if (!id) fail("/dashboard/customers", "Customer identifier is missing.");

  const displayName = text(fd, "display_name");
  const contactEmail = text(fd, "contact_email").toLowerCase();
  const countryCode = text(fd, "country_code").toUpperCase() || "GB";
  const currencyCode = text(fd, "currency_code").toUpperCase() || "GBP";
  const status = text(fd, "status") || "active";
  const paymentTerms = text(fd, "payment_terms_days");
  const paymentTermsDays = paymentTerms ? Number.parseInt(paymentTerms, 10) : null;

  if (!displayName || displayName.length > 160) fail(path, "Display name is required and must be 160 characters or fewer.");
  if (!validEmail(contactEmail)) fail(path, "Enter a valid contact email address.");
  if (!validCode(countryCode, 2)) fail(path, "Country code must contain two letters.");
  if (!validCode(currencyCode, 3)) fail(path, "Currency code must contain three letters.");
  if (!customerStatuses.includes(status as (typeof customerStatuses)[number])) fail(path, "Select a valid customer status.");
  if (paymentTermsDays !== null && (!Number.isFinite(paymentTermsDays) || paymentTermsDays < 0 || paymentTermsDays > 365)) fail(path, "Payment terms must be between 0 and 365 days.");

  const { supabase, user, organisationId } = await context();
  const { data: existing } = await supabase.from("customers").select("id,status").eq("id", id).eq("organisation_id", organisationId).maybeSingle();
  if (!existing) fail("/dashboard/customers", "Customer not found or access denied.");

  const { data: duplicate } = await supabase.from("customers").select("id").eq("organisation_id", organisationId).ilike("display_name", displayName).neq("id", id).maybeSingle();
  if (duplicate) fail(path, "Another customer already uses that display name.");

  const { error } = await supabase.from("customers").update({
    name: displayName,
    display_name: displayName,
    customer_category: text(fd, "customer_category") || null,
    country_code: countryCode,
    contact_name: text(fd, "contact_name") || null,
    contact_email: contactEmail || null,
    phone: text(fd, "phone") || null,
    registration_identifier: text(fd, "registration_identifier") || null,
    tax_identifier: text(fd, "tax_identifier") || null,
    currency_code: currencyCode,
    payment_terms_days: paymentTermsDays,
    status,
    notes: text(fd, "notes") || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("organisation_id", organisationId);
  if (error) fail(path, error.message);

  const eventType = existing.status === status ? "customer.updated" : "customer.status_changed";
  const description = existing.status === status ? `Customer ${displayName} updated` : `Customer ${displayName} moved from ${existing.status} to ${status}`;
  const { error: auditError } = await supabase.from("activity_logs").insert({ organisation_id: organisationId, actor_id: user.id, event_type: eventType, description });
  if (auditError) fail(path, "Customer updated, but its audit event could not be recorded.");

  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${id}`);
  revalidatePath("/dashboard/sites");
  redirect(`/dashboard/customers/${id}?updated=1`);
}

export async function updateSite(fd: FormData) {
  const id = text(fd, "site_id");
  const path = `/dashboard/sites/${id}/edit`;
  const customerId = text(fd, "customer_id");
  const name = text(fd, "name");
  const postcode = text(fd, "postcode").toUpperCase();
  if (!id || !customerId) fail("/dashboard/sites", "Site or customer identifier is missing.");
  if (!name || name.length > 160) fail(path, "Site name is required and must be 160 characters or fewer.");
  if (postcode && postcode.length > 12) fail(path, "Postcode is too long.");

  const { supabase, user, organisationId } = await context();
  const [{ data: site }, { data: customer }] = await Promise.all([
    supabase.from("sites").select("id,customer_id,name").eq("id", id).eq("organisation_id", organisationId).maybeSingle(),
    supabase.from("customers").select("id").eq("id", customerId).eq("organisation_id", organisationId).maybeSingle(),
  ]);
  if (!site) fail("/dashboard/sites", "Site not found or access denied.");
  if (!customer) fail(path, "Select a customer from the active organisation.");

  const { data: duplicate } = await supabase.from("sites").select("id").eq("organisation_id", organisationId).eq("customer_id", customerId).ilike("name", name).neq("id", id).maybeSingle();
  if (duplicate) fail(path, "That customer already has a site with this name.");

  const { error } = await supabase.from("sites").update({
    customer_id: customerId,
    name,
    address: text(fd, "address") || null,
    postcode: postcode || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("organisation_id", organisationId);
  if (error) fail(path, error.message);

  const relationshipChanged = site.customer_id !== customerId;
  const { error: auditError } = await supabase.from("activity_logs").insert({
    organisation_id: organisationId,
    actor_id: user.id,
    event_type: relationshipChanged ? "site.customer_changed" : "site.updated",
    description: relationshipChanged ? `Site ${name} reassigned to another customer` : `Site ${name} updated`,
  });
  if (auditError) fail(path, "Site updated, but its audit event could not be recorded.");

  revalidatePath("/dashboard/sites");
  revalidatePath(`/dashboard/sites/${id}`);
  revalidatePath(`/dashboard/customers/${site.customer_id}`);
  revalidatePath(`/dashboard/customers/${customerId}`);
  redirect(`/dashboard/sites/${id}?updated=1`);
}
