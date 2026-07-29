"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const statuses = ["requested", "uploaded", "under_review", "accepted", "rejected", "waived"] as const;
type ReadinessStatus = (typeof statuses)[number];

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function isStatus(value: string): value is ReadinessStatus {
  return statuses.includes(value as ReadinessStatus);
}

function transitionAllowed(current: ReadinessStatus, next: ReadinessStatus) {
  if (current === next) return true;
  if (current === "requested") return next === "uploaded" || next === "waived";
  if (current === "uploaded") return next === "under_review" || next === "requested";
  if (current === "under_review") return next === "accepted" || next === "rejected" || next === "waived";
  if (current === "rejected") return next === "uploaded";
  return false;
}

export async function updateGovernedReadiness(fd: FormData) {
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
  const itemId = text(fd, "item_id");
  const nextStatus = text(fd, "status");
  const evidenceUrl = text(fd, "evidence_url") || null;
  const decisionNote = text(fd, "decision_note") || null;
  const path = `/dashboard/opportunities/${opportunityId}`;

  if (!opportunityId || !itemId || !isStatus(nextStatus)) fail(path, "Invalid readiness update.");

  const { data: item } = await supabase
    .from("opportunity_readiness_items")
    .select("id,item_type,status,is_required")
    .eq("id", itemId)
    .eq("opportunity_id", opportunityId)
    .eq("organisation_id", profile.organisation_id)
    .maybeSingle();

  if (!item) fail(path, "Readiness item not found or access denied.");
  const currentStatus = item.status as ReadinessStatus;
  if (!transitionAllowed(currentStatus, nextStatus)) {
    fail(path, `Readiness cannot move from ${currentStatus.replaceAll("_", " ")} to ${nextStatus.replaceAll("_", " ")}.`);
  }

  if (["uploaded", "under_review", "accepted"].includes(nextStatus) && !evidenceUrl) {
    fail(path, "An evidence link is required before this item can progress.");
  }
  if ((nextStatus === "rejected" || nextStatus === "waived") && !decisionNote) {
    fail(path, `A decision note is required when an item is ${nextStatus}.`);
  }

  const decided = ["accepted", "rejected", "waived"].includes(nextStatus);
  const { error } = await supabase
    .from("opportunity_readiness_items")
    .update({
      status: nextStatus,
      evidence_url: evidenceUrl,
      review_note: decisionNote,
      decision_note: decisionNote,
      reviewed_by: decided ? user.id : null,
      reviewed_at: decided ? new Date().toISOString() : null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("organisation_id", profile.organisation_id);

  if (error) fail(path, error.message);

  const eventType = nextStatus === "uploaded"
    ? "readiness.evidence_uploaded"
    : nextStatus === "under_review"
      ? "readiness.review_started"
      : `readiness.${nextStatus}`;
  const { error: auditError } = await supabase.from("activity_logs").insert({
    organisation_id: profile.organisation_id,
    actor_id: user.id,
    event_type: eventType,
    description: `${String(item.item_type).replaceAll("_", " ")} moved from ${currentStatus.replaceAll("_", " ")} to ${nextStatus.replaceAll("_", " ")}`,
  });
  if (auditError) fail(path, "Readiness changed, but its audit event could not be recorded. Contact an administrator.");

  revalidatePath(path);
  redirect(`${path}?updated=readiness`);
}