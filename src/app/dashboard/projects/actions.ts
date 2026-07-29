"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedStages = [
  "qualification",
  "survey",
  "design",
  "commercial",
  "procurement",
  "installation",
  "commissioning",
  "handover",
  "complete",
  "on_hold",
] as const;

const allowedRisks = ["green", "amber", "red"] as const;

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalNumber(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const name = text(formData, "name");
  const reference = text(formData, "reference");
  const customerId = text(formData, "customer_id");
  const siteId = text(formData, "site_id");
  const status = text(formData, "status");
  const riskStatus = text(formData, "risk_status");

  if (!name || !reference || !customerId || !siteId) {
    redirect("/dashboard/projects/new?error=Complete%20the%20required%20project%20fields");
  }

  if (!allowedStages.includes(status as (typeof allowedStages)[number]) || !allowedRisks.includes(riskStatus as (typeof allowedRisks)[number])) {
    redirect("/dashboard/projects/new?error=Invalid%20project%20control%20value");
  }

  const { data, error } = await supabase.rpc("create_epc_project", {
    p_customer_id: customerId,
    p_site_id: siteId,
    p_name: name,
    p_reference: reference,
    p_status: status,
    p_risk_status: riskStatus,
    p_project_type: text(formData, "project_type") || null,
    p_pv_capacity_kwp: optionalNumber(formData, "pv_capacity_kwp"),
    p_battery_capacity_kwh: optionalNumber(formData, "battery_capacity_kwh"),
    p_contract_value_gbp: optionalNumber(formData, "contract_value_gbp"),
    p_target_completion_date: text(formData, "target_completion_date") || null,
    p_project_owner_id: text(formData, "project_owner_id") || null,
    p_notes: text(formData, "notes") || null,
  });

  if (error || !data) {
    const message = encodeURIComponent(error?.message ?? "Project could not be created");
    redirect(`/dashboard/projects/new?error=${message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  redirect(`/dashboard/projects/${data}`);
}

export async function updateProjectControl(formData: FormData) {
  const supabase = await createClient();
  const projectId = text(formData, "project_id");
  const status = text(formData, "status");
  const riskStatus = text(formData, "risk_status");

  if (!projectId || !allowedStages.includes(status as (typeof allowedStages)[number]) || !allowedRisks.includes(riskStatus as (typeof allowedRisks)[number])) {
    redirect(`/dashboard/projects/${projectId}?error=Invalid%20control%20update`);
  }

  const { error } = await supabase.rpc("update_project_control", {
    p_project_id: projectId,
    p_status: status,
    p_risk_status: riskStatus,
  });

  if (error) {
    redirect(`/dashboard/projects/${projectId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
  redirect(`/dashboard/projects/${projectId}?updated=1`);
}
