"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const surveyStatuses = ["draft", "in_progress", "under_review", "approved", "rejected"] as const;
type SurveyStatus = (typeof surveyStatuses)[number];

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function numberOrNull(fd: FormData, key: string) {
  const value = text(fd, key);
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

function links(fd: FormData, key: string) {
  return text(fd, key)
    .split(/\r?\n|,/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function isStatus(value: string): value is SurveyStatus {
  return surveyStatuses.includes(value as SurveyStatus);
}

function transitionAllowed(current: SurveyStatus | null, next: SurveyStatus) {
  if (!current) return next === "draft" || next === "in_progress";
  if (current === "draft") return ["draft", "in_progress", "under_review"].includes(next);
  if (current === "in_progress") return ["in_progress", "under_review"].includes(next);
  if (current === "under_review") return ["under_review", "approved", "rejected"].includes(next);
  if (current === "rejected") return ["rejected", "in_progress", "under_review"].includes(next);
  return current === "approved" && next === "approved";
}

export async function saveSiteSurvey(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organisation_id")
    .eq("id", user.id)
    .single();
  if (!profile?.organisation_id) throw new Error("Organisation context missing");

  const opportunityId = text(fd, "opportunity_id");
  const siteId = text(fd, "site_id");
  const path = `/dashboard/opportunities/${opportunityId}`;
  const requestedStatus = text(fd, "status");
  const surveyReference = text(fd, "survey_reference").toUpperCase();

  if (!opportunityId) fail("/dashboard/opportunities", "Opportunity identifier is missing.");
  if (!siteId) fail(path, "Assign a Site before creating a survey.");
  if (!isStatus(requestedStatus)) fail(path, "Invalid survey status.");
  if (!/^[A-Z0-9][A-Z0-9._/-]{2,49}$/.test(surveyReference)) {
    fail(path, "Survey reference must be 3–50 characters using letters, numbers, dots, slashes, underscores or hyphens.");
  }

  const [{ data: opportunity }, { data: existing }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id,site_id")
      .eq("id", opportunityId)
      .eq("organisation_id", profile.organisation_id)
      .maybeSingle(),
    supabase
      .from("site_surveys")
      .select("status")
      .eq("opportunity_id", opportunityId)
      .eq("organisation_id", profile.organisation_id)
      .maybeSingle(),
  ]);

  if (!opportunity) fail("/dashboard/opportunities", "Opportunity not found or access denied.");
  if (opportunity.site_id !== siteId) fail(path, "Survey Site does not match the Opportunity Site.");

  const currentStatus = (existing?.status as SurveyStatus | undefined) ?? null;
  if (!transitionAllowed(currentStatus, requestedStatus)) {
    fail(path, currentStatus ? `Survey cannot move from ${currentStatus} to ${requestedStatus}.` : "Invalid initial survey state.");
  }

  const payload = {
    survey_date: text(fd, "survey_date") || null,
    surveyor_name: text(fd, "surveyor_name") || null,
    weather_conditions: text(fd, "weather_conditions") || null,
    access_notes: text(fd, "access_notes") || null,
    roof_type: text(fd, "roof_type") || null,
    roof_covering: text(fd, "roof_covering") || null,
    roof_condition: text(fd, "roof_condition") || null,
    roof_orientation_deg: numberOrNull(fd, "roof_orientation_deg"),
    roof_pitch_deg: numberOrNull(fd, "roof_pitch_deg"),
    usable_roof_area_m2: numberOrNull(fd, "usable_roof_area_m2"),
    shading_summary: text(fd, "shading_summary") || null,
    structural_observations: text(fd, "structural_observations") || null,
    supply_phase: text(fd, "supply_phase") || null,
    main_fuse_rating_a: numberOrNull(fd, "main_fuse_rating_a"),
    meter_location: text(fd, "meter_location") || null,
    consumer_unit_location: text(fd, "consumer_unit_location") || null,
    earthing_arrangement: text(fd, "earthing_arrangement") || null,
    cable_route_notes: text(fd, "cable_route_notes") || null,
    inverter_location: text(fd, "inverter_location") || null,
    battery_location: text(fd, "battery_location") || null,
    fire_safety_notes: text(fd, "fire_safety_notes") || null,
    asbestos_risk: text(fd, "asbestos_risk") || null,
    working_at_height_risk: text(fd, "working_at_height_risk") || null,
    planning_constraints: text(fd, "planning_constraints") || null,
    grid_constraints: text(fd, "grid_constraints") || null,
    other_constraints: text(fd, "other_constraints") || null,
    recommended_pv_kwp: numberOrNull(fd, "recommended_pv_kwp"),
    recommended_battery_kwh: numberOrNull(fd, "recommended_battery_kwh"),
    photo_links: links(fd, "photo_links"),
    drawing_links: links(fd, "drawing_links"),
    review_note: text(fd, "review_note") || null,
  };

  if (Object.values(payload).some((value) => typeof value === "number" && Number.isNaN(value))) {
    fail(path, "Survey measurements must be valid non-negative numbers.");
  }
  if (payload.roof_orientation_deg != null && payload.roof_orientation_deg >= 360) fail(path, "Roof orientation must be below 360°.");
  if (payload.roof_pitch_deg != null && payload.roof_pitch_deg > 90) fail(path, "Roof pitch must be 90° or below.");

  if (requestedStatus === "under_review" || requestedStatus === "approved") {
    const missing = [
      ["survey date", payload.survey_date],
      ["surveyor", payload.surveyor_name],
      ["roof type", payload.roof_type],
      ["roof condition", payload.roof_condition],
      ["usable roof area", payload.usable_roof_area_m2],
      ["supply phase", payload.supply_phase],
      ["meter location", payload.meter_location],
      ["consumer unit location", payload.consumer_unit_location],
      ["asbestos risk", payload.asbestos_risk],
      ["recommended PV capacity", payload.recommended_pv_kwp],
    ].filter(([, value]) => value === null || value === "");
    if (missing.length) fail(path, `Survey review is blocked. Complete: ${missing.map(([label]) => label).join(", ")}.`);
    if (!payload.photo_links.length) fail(path, "Add at least one survey photo link before review.");
  }

  if (requestedStatus === "approved" && currentStatus !== "under_review") {
    fail(path, "Only a survey under review can be approved.");
  }

  const { error } = await supabase.rpc("commit_site_survey", {
    p_organisation_id: profile.organisation_id,
    p_opportunity_id: opportunityId,
    p_site_id: siteId,
    p_survey_reference: surveyReference,
    p_status: requestedStatus,
    p_payload: payload,
    p_event_type: `site_survey.${requestedStatus}`,
    p_description: `Site survey ${surveyReference} ${requestedStatus.replaceAll("_", " ")}`,
  });

  if (error) fail(path, `Survey was not committed. No partial changes were retained. ${error.message}`);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/opportunities");
  revalidatePath(path);
  redirect(`${path}?updated=site-survey-${requestedStatus}`);
}
