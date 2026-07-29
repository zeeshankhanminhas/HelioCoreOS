"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
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
  const name = text(formData, "name");
  const contactName = text(formData, "contact_name");
  const contactEmail = text(formData, "contact_email");

  if (!name) {
    redirect("/dashboard/customers/new?error=Customer%20name%20is%20required");
  }

  if (contactEmail && !contactEmail.includes("@")) {
    redirect("/dashboard/customers/new?error=Enter%20a%20valid%20contact%20email");
  }

  const { supabase, organisationId } = await getOrganisationContext();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      organisation_id: organisationId,
      name,
      contact_name: contactName || null,
      contact_email: contactEmail || null,
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
