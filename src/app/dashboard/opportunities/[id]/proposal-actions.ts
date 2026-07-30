"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const proposalStatuses = ["draft", "issued", "accepted", "declined", "expired"] as const;
type ProposalStatus = (typeof proposalStatuses)[number];

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

function isProposalStatus(value: string): value is ProposalStatus {
  return proposalStatuses.includes(value as ProposalStatus);
}

function transitionAllowed(current: ProposalStatus | null, next: ProposalStatus) {
  if (!current) return next === "draft" || next === "issued";
  if (current === "draft") return next === "draft" || next === "issued";
  if (current === "issued") return next === "accepted" || next === "declined" || next === "expired";
  return false;
}

export async function saveGovernedProposal(fd: FormData) {
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
  if (!profile?.organisation_id) throw new Error("Organisation context missing");

  const organisationId = profile.organisation_id;
  const opportunityId = text(fd, "opportunity_id");
  const path = `/dashboard/opportunities/${opportunityId}`;
  const requestedStatus = text(fd, "status");
  const proposalNumber = text(fd, "proposal_number").toUpperCase();

  if (!opportunityId) fail("/dashboard/opportunities", "Opportunity identifier is missing.");
  if (!isProposalStatus(requestedStatus)) fail(path, "Invalid proposal status.");
  if (!/^[A-Z0-9][A-Z0-9._/-]{2,49}$/.test(proposalNumber)) {
    fail(path, "Proposal number must be 3–50 characters using letters, numbers, dots, slashes, underscores or hyphens.");
  }

  const [{ data: opportunity }, { data: existing }, { data: readiness }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id,reference,customer_id,site_id,stage")
      .eq("id", opportunityId)
      .eq("organisation_id", organisationId)
      .maybeSingle(),
    supabase
      .from("indicative_proposals")
      .select("*")
      .eq("opportunity_id", opportunityId)
      .eq("organisation_id", organisationId)
      .maybeSingle(),
    supabase
      .from("opportunity_readiness_items")
      .select("item_type,status,is_required")
      .eq("opportunity_id", opportunityId)
      .eq("organisation_id", organisationId),
  ]);

  if (!opportunity) fail("/dashboard/opportunities", "Opportunity not found or access denied.");

  const currentStatus = (existing?.status as ProposalStatus | undefined) ?? null;
  if (!transitionAllowed(currentStatus, requestedStatus)) {
    fail(path, currentStatus ? `Proposal cannot move from ${currentStatus} to ${requestedStatus}.` : "Invalid initial proposal state.");
  }

  const { data: duplicate } = await supabase
    .from("indicative_proposals")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("proposal_number", proposalNumber)
    .neq("opportunity_id", opportunityId)
    .maybeSingle();
  if (duplicate) fail(path, "That proposal number is already in use.");

  const formPayload = {
    pv_capacity_kwp: numberOrNull(fd, "pv_capacity_kwp"),
    battery_capacity_kwh: numberOrNull(fd, "battery_capacity_kwh"),
    estimated_generation_kwh: numberOrNull(fd, "estimated_generation_kwh"),
    estimated_annual_saving_gbp: numberOrNull(fd, "estimated_annual_saving_gbp"),
    indicative_price_gbp: numberOrNull(fd, "indicative_price_gbp"),
    assumptions: text(fd, "assumptions") || null,
    exclusions: text(fd, "exclusions") || null,
    valid_until: text(fd, "valid_until") || null,
  };

  if (Object.values(formPayload).some((value) => typeof value === "number" && Number.isNaN(value))) {
    fail(path, "Proposal values must be valid non-negative numbers.");
  }

  const isDisposition = currentStatus === "issued";
  const commercial = isDisposition && existing
    ? {
        pv_capacity_kwp: existing.pv_capacity_kwp,
        battery_capacity_kwh: existing.battery_capacity_kwh,
        estimated_generation_kwh: existing.estimated_generation_kwh,
        estimated_annual_saving_gbp: existing.estimated_annual_saving_gbp,
        indicative_price_gbp: existing.indicative_price_gbp,
        assumptions: existing.assumptions,
        exclusions: existing.exclusions,
        valid_until: existing.valid_until,
      }
    : formPayload;

  if (requestedStatus === "issued") {
    if (!opportunity.customer_id || !opportunity.site_id) {
      fail(path, "Assign both a Customer and Site before issuing the proposal.");
    }

    const requiredItems = (readiness ?? []).filter((item) => item.is_required);
    const blockers = requiredItems.filter((item) => item.status !== "accepted" && item.status !== "waived");
    if (!requiredItems.length || blockers.length > 0) {
      fail(path, `Proposal issue is blocked by ${blockers.length || "missing"} required readiness item${blockers.length === 1 ? "" : "s"}.`);
    }

    if (!commercial.pv_capacity_kwp || !commercial.indicative_price_gbp) {
      fail(path, "PV capacity and indicative price are required before issue.");
    }
    if (!commercial.assumptions) fail(path, "Document the proposal assumptions before issue.");
    if (!commercial.valid_until) fail(path, "Set a validity date before issue.");

    const validUntil = new Date(`${commercial.valid_until}T23:59:59Z`);
    if (Number.isNaN(validUntil.getTime()) || validUntil <= new Date()) {
      fail(path, "The proposal validity date must be in the future.");
    }
  }

  const now = new Date().toISOString();
  const issuedAt = requestedStatus === "issued" ? now : existing?.issued_at ?? null;
  const opportunityStage = requestedStatus === "accepted"
    ? "won"
    : requestedStatus === "declined"
      ? "lost"
      : "proposal";
  const eventType = requestedStatus === "draft" ? "proposal.draft_saved" : `proposal.${requestedStatus}`;

  const { error: commitError } = await supabase.rpc("commit_governed_proposal", {
    p_organisation_id: organisationId,
    p_opportunity_id: opportunityId,
    p_proposal_number: proposalNumber,
    p_status: requestedStatus,
    p_commercial: commercial,
    p_issued_at: issuedAt,
    p_opportunity_stage: opportunityStage,
    p_event_type: eventType,
    p_description: `Indicative proposal ${proposalNumber} ${requestedStatus}`,
  });

  if (commitError) {
    fail(path, `Proposal was not committed. No partial workflow changes were retained. ${commitError.message}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/opportunities");
  revalidatePath(path);
  redirect(`${path}?updated=proposal-${requestedStatus}`);
}
