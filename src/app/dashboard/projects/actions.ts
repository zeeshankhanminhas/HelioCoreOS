"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedStages = [
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

export async function createProject(_formData: FormData) {
  redirect("/dashboard/projects/new");
}

export async function updateProjectControl(formData: FormData) {
  const supabase = await createClient();
  const projectId = text(formData, "project_id");
  const status = text(formData, "status");
  const riskStatus = text(formData, "risk_status");

  if (!projectId || !allowedStages.includes(status as (typeof allowedStages)[number]) || !allowedRisks.includes(riskStatus as (typeof allowedRisks)[number])) {
    redirect(`/dashboard/projects/${projectId}?error=Invalid%20delivery%20control%20update`);
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