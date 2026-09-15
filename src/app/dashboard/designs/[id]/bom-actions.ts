"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/neon/client";

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

function numberValue(fd: FormData, key: string) {
  const raw = text(fd, key);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function fail(path: string, message: string): never {
  redirect(`${path}?bomError=${encodeURIComponent(message)}`);
}

export async function createBomException(fd: FormData) {
  const designId = text(fd, "design_id");
  const path = `/dashboard/designs/${designId}`;
  const exceptionType = text(fd, "exception_type");
  const generatedLineIndexRaw = text(fd, "generated_line_index");
  const generatedLineIndex = generatedLineIndexRaw === "" ? null : Number(generatedLineIndexRaw);
  const originalQuantity = numberValue(fd, "original_quantity");
  const requestedQuantity = numberValue(fd, "requested_quantity");
  const description = text(fd, "description");
  const category = text(fd, "category");
  const unit = text(fd, "unit") || "ea";
  const reason = text(fd, "reason");

  if (!designId) fail("/dashboard/designs", "Design identifier is missing.");
  if (!['quantity_override', 'project_item'].includes(exceptionType)) fail(path, "Invalid BOM exception type.");
  if (!description) fail(path, "Description is required.");
  if (!category) fail(path, "Category is required.");
  if (requestedQuantity == null || requestedQuantity <= 0) fail(path, "Requested quantity must be greater than zero.");
  if (reason.length < 10) fail(path, "Explain the engineering or project reason in at least 10 characters.");
  if (exceptionType === 'quantity_override' && (!Number.isInteger(generatedLineIndex) || generatedLineIndex == null || originalQuantity == null)) {
    fail(path, "A generated BOM line and original quantity are required for an override.");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("create_bom_exception", {
    p_system_design_id: designId,
    p_exception_type: exceptionType,
    p_generated_line_index: generatedLineIndex,
    p_description: description,
    p_category: category,
    p_original_quantity: originalQuantity,
    p_requested_quantity: requestedQuantity,
    p_unit: unit,
    p_reason: reason,
  });

  if (error) fail(path, error.message || "BOM exception could not be created.");

  revalidatePath(path);
  revalidatePath("/dashboard/boms");
  redirect(`${path}?bomUpdated=exception-created`);
}

export async function reviewBomException(fd: FormData) {
  const designId = text(fd, "design_id");
  const exceptionId = text(fd, "exception_id");
  const decision = text(fd, "decision");
  const reason = text(fd, "review_reason");
  const path = `/dashboard/designs/${designId}`;

  if (!designId || !exceptionId) fail("/dashboard/designs", "BOM exception context is missing.");
  if (!['approved', 'rejected', 'withdrawn'].includes(decision)) fail(path, "Invalid BOM exception decision.");
  if (reason.length < 10) fail(path, "A review reason of at least 10 characters is required.");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("review_bom_exception", {
    p_exception_id: exceptionId,
    p_decision: decision,
    p_reason: reason,
  });

  if (error) fail(path, error.message || "BOM exception review could not be saved.");

  revalidatePath(path);
  revalidatePath("/dashboard/boms");
  redirect(`${path}?bomUpdated=exception-${decision}`);
}
