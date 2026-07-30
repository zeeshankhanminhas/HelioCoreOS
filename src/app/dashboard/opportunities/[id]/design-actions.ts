"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const statuses = ["draft", "in_progress", "under_review", "approved", "rejected"] as const;
type DesignStatus = (typeof statuses)[number];

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function numberOrNull(fd: FormData, key: string) {
  const raw = text(fd, key);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

function integerOrNull(fd: FormData, key: string) {
  const value = numberOrNull(fd, key);
  return value == null || Number.isNaN(value) ? value : Number.isInteger(value) ? value : Number.NaN;
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function isStatus(value: string): value is DesignStatus {
  return statuses.includes(value as DesignStatus);
}

function transitionAllowed(current: DesignStatus | null, next: DesignStatus) {
  if (!current) return next === "draft" || next === "in_progress";
  if (current === "draft") return ["draft", "in_progress", "under_review"].includes(next);
  if (current === "in_progress") return ["in_progress", "under_review"].includes(next);
  if (current === "under_review") return ["under_review", "approved", "rejected"].includes(next);
  if (current === "rejected") return ["rejected", "in_progress", "under_review"].includes(next);
  return current === "approved" && next === "approved";
}

export async function saveSystemDesign(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("organisation_id").eq("id", user.id).single();
  if (!profile?.organisation_id) throw new Error("Organisation context missing");

  const opportunityId = text(fd, "opportunity_id");
  const siteId = text(fd, "site_id");
  const surveyId = text(fd, "survey_id");
  const path = `/dashboard/opportunities/${opportunityId}`;
  const status = text(fd, "status");
  const designReference = text(fd, "design_reference").toUpperCase();
  const revision = Number(text(fd, "revision") || "1");

  if (!opportunityId) fail("/dashboard/opportunities", "Opportunity identifier is missing.");
  if (!siteId) fail(path, "Assign a Site before creating a system design.");
  if (!surveyId) fail(path, "An approved Site Survey is required before design can begin.");
  if (!isStatus(status)) fail(path, "Invalid design status.");
  if (!/^[A-Z0-9][A-Z0-9._/-]{2,49}$/.test(designReference)) fail(path, "Design reference must be 3–50 controlled characters.");
  if (!Number.isInteger(revision) || revision < 1) fail(path, "Revision must be a positive whole number.");

  const [{ data: opportunity }, { data: survey }, { data: existing }] = await Promise.all([
    supabase.from("opportunities").select("id,site_id").eq("id", opportunityId).eq("organisation_id", profile.organisation_id).maybeSingle(),
    supabase.from("site_surveys").select("id,status,site_id,opportunity_id").eq("id", surveyId).eq("organisation_id", profile.organisation_id).maybeSingle(),
    supabase.from("system_designs").select("status").eq("opportunity_id", opportunityId).eq("revision", revision).eq("organisation_id", profile.organisation_id).maybeSingle(),
  ]);

  if (!opportunity) fail("/dashboard/opportunities", "Opportunity not found or access denied.");
  if (opportunity.site_id !== siteId) fail(path, "Design Site does not match the Opportunity Site.");
  if (!survey || survey.status !== "approved" || survey.site_id !== siteId || survey.opportunity_id !== opportunityId) {
    fail(path, "System Design requires the approved survey for this exact Opportunity and Site.");
  }

  const currentStatus = (existing?.status as DesignStatus | undefined) ?? null;
  if (!transitionAllowed(currentStatus, status)) fail(path, `Design cannot move from ${currentStatus ?? "not started"} to ${status}.`);

  const moduleRatingWp = numberOrNull(fd, "module_rating_wp");
  const moduleQuantity = integerOrNull(fd, "module_quantity");
  const inverterCapacityKw = numberOrNull(fd, "inverter_capacity_kw");
  const inverterQuantity = integerOrNull(fd, "inverter_quantity");
  const batteryQuantity = integerOrNull(fd, "battery_quantity");
  const explicitArrayCapacity = numberOrNull(fd, "array_capacity_kwp");
  const calculatedArrayCapacity = moduleRatingWp && moduleQuantity ? Number(((moduleRatingWp * moduleQuantity) / 1000).toFixed(3)) : null;
  const arrayCapacityKwp = explicitArrayCapacity ?? calculatedArrayCapacity;
  const dcAcRatio = arrayCapacityKwp && inverterCapacityKw && inverterQuantity ? Number((arrayCapacityKwp / (inverterCapacityKw * inverterQuantity)).toFixed(3)) : null;

  const payload = {
    design_basis: text(fd, "design_basis") || null,
    module_manufacturer: text(fd, "module_manufacturer") || null,
    module_model: text(fd, "module_model") || null,
    module_rating_wp: moduleRatingWp,
    module_quantity: moduleQuantity,
    array_capacity_kwp: arrayCapacityKwp,
    inverter_manufacturer: text(fd, "inverter_manufacturer") || null,
    inverter_model: text(fd, "inverter_model") || null,
    inverter_quantity: inverterQuantity,
    inverter_capacity_kw: inverterCapacityKw,
    dc_ac_ratio: dcAcRatio,
    string_configuration: text(fd, "string_configuration") || null,
    mounting_system: text(fd, "mounting_system") || null,
    battery_manufacturer: text(fd, "battery_manufacturer") || null,
    battery_model: text(fd, "battery_model") || null,
    battery_quantity: batteryQuantity,
    battery_capacity_kwh: numberOrNull(fd, "battery_capacity_kwh"),
    annual_generation_kwh: numberOrNull(fd, "annual_generation_kwh"),
    specific_yield_kwh_kwp: numberOrNull(fd, "specific_yield_kwh_kwp"),
    performance_ratio_pct: numberOrNull(fd, "performance_ratio_pct"),
    export_limit_kw: numberOrNull(fd, "export_limit_kw"),
    grid_application_required: fd.get("grid_application_required") === "on",
    grid_application_reference: text(fd, "grid_application_reference") || null,
    single_line_diagram_url: text(fd, "single_line_diagram_url") || null,
    layout_drawing_url: text(fd, "layout_drawing_url") || null,
    structural_calculation_url: text(fd, "structural_calculation_url") || null,
    generation_report_url: text(fd, "generation_report_url") || null,
    design_assumptions: text(fd, "design_assumptions") || null,
    design_constraints: text(fd, "design_constraints") || null,
    review_note: text(fd, "review_note") || null,
  };

  if (Object.values(payload).some((value) => typeof value === "number" && Number.isNaN(value))) fail(path, "Design quantities and capacities must be valid non-negative numbers.");
  if (payload.performance_ratio_pct != null && payload.performance_ratio_pct > 100) fail(path, "Performance ratio cannot exceed 100%.");

  if (status === "under_review" || status === "approved") {
    const missing = [
      ["design basis", payload.design_basis], ["module manufacturer", payload.module_manufacturer], ["module model", payload.module_model],
      ["module rating", payload.module_rating_wp], ["module quantity", payload.module_quantity], ["array capacity", payload.array_capacity_kwp],
      ["inverter manufacturer", payload.inverter_manufacturer], ["inverter model", payload.inverter_model], ["inverter quantity", payload.inverter_quantity],
      ["inverter capacity", payload.inverter_capacity_kw], ["string configuration", payload.string_configuration], ["mounting system", payload.mounting_system],
      ["annual generation", payload.annual_generation_kwh], ["design assumptions", payload.design_assumptions],
      ["single-line diagram", payload.single_line_diagram_url], ["layout drawing", payload.layout_drawing_url],
    ].filter(([, value]) => value === null || value === "");
    if (missing.length) fail(path, `Design review is blocked. Complete: ${missing.map(([label]) => label).join(", ")}.`);
    if (payload.grid_application_required && !payload.grid_application_reference) fail(path, "Add the grid application reference before design review.");
  }

  if (status === "approved" && currentStatus !== "under_review") fail(path, "Only a design under review can be approved.");

  const { error } = await supabase.rpc("commit_system_design", {
    p_organisation_id: profile.organisation_id,
    p_opportunity_id: opportunityId,
    p_site_id: siteId,
    p_survey_id: surveyId,
    p_design_reference: designReference,
    p_revision: revision,
    p_status: status,
    p_payload: payload,
    p_event_type: `system_design.${status}`,
    p_description: `System design ${designReference} revision ${revision} ${status.replaceAll("_", " ")}`,
  });

  if (error) fail(path, `System design was not committed. No partial changes were retained. ${error.message}`);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/opportunities");
  revalidatePath(path);
  redirect(`${path}?updated=system-design-${status}`);
}
