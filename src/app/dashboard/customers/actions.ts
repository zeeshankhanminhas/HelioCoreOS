"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const customerKinds = ["individual", "organisation"] as const;
const customerStatuses = ["prospect", "active", "inactive", "blocked", "archived"] as const;
const titles = ["", "Mr", "Mrs", "Miss", "Ms", "Mx", "Dr", "Prof", "Other", "Prefer not to say"] as const;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalInteger(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

async function getOrganisationContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organisation_id) {
    redirect("/dashboard/customers?error=Organisation%20context%20is%20not%20available");
  }

  return { supabase, organisationId: profile.organisation_id };
}

export async function createCustomer(formData: FormData) {
  const customerKind = text(formData, "customer_kind");
  const title = text(formData, "title");
  const givenName = text(formData, "given_name");
  const middleName = text(formData, "middle_name");
  const familyName = text(formData, "family_name");
  const organisationName = text(formData, "organisation_name");
  const requestedDisplayName = text(formData, "display_name");
  const contactName = text(formData, "contact_name");
  const contactEmail = text(formData, "contact_email");
  const phone = text(formData, "phone");
  const status = text(formData, "status") || "active";
  const paymentTermsDays = optionalInteger(formData, "payment_terms_days");

  if (!customerKinds.includes(customerKind as (typeof customerKinds)[number])) {
    redirect("/dashboard/customers/new?error=Select%20a%20valid%20customer%20type");
  }

  if (title && !titles.includes(title as (typeof titles)[number])) {
    redirect("/dashboard/customers/new?error=Select%20a%20valid%20title");
  }

  if (!customerStatuses.includes(status as (typeof customerStatuses)[number])) {
    redirect("/dashboard/customers/new?error=Select%20a%20valid%20customer%20status");
  }

  if (customerKind === "individual" && !givenName && !familyName && !requestedDisplayName) {
    redirect("/dashboard/customers/new?error=Enter%20the%20individual%20customer%20name");
  }

  if (customerKind === "organisation" && !organisationName) {
    redirect("/dashboard/customers/new?error=Organisation%20name%20is%20required");
  }

  if (contactEmail && !contactEmail.includes("@")) {
    redirect("/dashboard/customers/new?error=Enter%20a%20valid%20contact%20email");
  }

  if (paymentTermsDays !== null && (paymentTermsDays < 0 || paymentTermsDays > 365)) {
    redirect("/dashboard/customers/new?error=Payment%20terms%20must%20be%20between%200%20and%20365%20days");
  }

  const generatedPersonalName = [title && title !== "Prefer not to say" ? title : "", givenName, middleName, familyName]
    .filter(Boolean)
    .join(" ");
  const displayName = requestedDisplayName || (customerKind === "individual" ? generatedPersonalName : organisationName);

  const { supabase, organisationId } = await getOrganisationContext();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      organisation_id: organisationId,
      name: displayName,
      customer_kind: customerKind,
      display_name: displayName,
      title: customerKind === "individual" && title ? title : null,
      given_name: customerKind === "individual" ? givenName || null : null,
      middle_name: customerKind === "individual" ? middleName || null : null,
      family_name: customerKind === "individual" ? familyName || null : null,
      organisation_name: customerKind === "organisation" ? organisationName : null,
      customer_category: text(formData, "customer_category") || null,
      country_code: text(formData, "country_code").toUpperCase() || null,
      contact_name: contactName || null,
      contact_email: contactEmail || null,
      phone: phone || null,
      registration_identifier: customerKind === "organisation" ? text(formData, "registration_identifier") || null : null,
      tax_identifier: text(formData, "tax_identifier") || null,
      currency_code: text(formData, "currency_code").toUpperCase() || "GBP",
      payment_terms_days: paymentTermsDays,
      status,
      notes: text(formData, "notes") || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/dashboard/customers/new?error=${encodeURIComponent(error?.message ?? "Customer could not be created")}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/sites");
  revalidatePath("/dashboard/projects/new");
  redirect(`/dashboard/sites/new?customer=${data.id}&created=customer`);
}

export async function createSite(formData: FormData) {
  const customerId = text(formData, "customer_id");
  const name = text(formData, "name");
  const address = text(formData, "address");
  const postcode = text(formData, "postcode").toUpperCase();

  if (!customerId || !name) {
    redirect("/dashboard/sites/new?error=Customer%20and%20site%20name%20are%20required");
  }

  const { supabase, organisationId } = await getOrganisationContext();
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .single();

  if (!customer) {
    redirect("/dashboard/sites/new?error=Select%20a%20valid%20customer");
  }

  const { data, error } = await supabase
    .from("sites")
    .insert({
      organisation_id: organisationId,
      customer_id: customerId,
      name,
      address: address || null,
      postcode: postcode || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/dashboard/sites/new?customer=${customerId}&error=${encodeURIComponent(error?.message ?? "Site could not be created")}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath("/dashboard/sites");
  revalidatePath("/dashboard/projects/new");
  redirect(`/dashboard/projects/new?customer=${customerId}&site=${data.id}&created=site`);
}
