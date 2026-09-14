"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { extractText, getDocumentProxy } from "unpdf";
import { createClient } from "@/lib/neon/client";
import { extractEquipmentSpecs, type EquipmentImportCategory } from "@/lib/engineering/datasheet-extractor";

async function context() {
  const client = createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await client.from("profiles").select("organisation_id").eq("id", user.id).single();
  if (!profile?.organisation_id) throw new Error("Organisation context missing");
  return { client, user, organisationId: profile.organisation_id };
}

export async function createImportBatch(fileCount: number) {
  const { client, user, organisationId } = await context();
  if (!Number.isInteger(fileCount) || fileCount < 1 || fileCount > 50) throw new Error("Choose between 1 and 50 PDF datasheets.");
  const { data, error } = await client.from("equipment_import_batches").insert({
    organisation_id: organisationId,
    created_by: user.id,
    file_count: fileCount,
    status: "uploading",
  }).select("id").single();
  if (error || !data) throw new Error("Import batch could not be created.");
  return { batchId: data.id, organisationId };
}

function manufacturerFromText(text: string, names: { id: string; name: string }[]) {
  const normalized = text.toLowerCase();
  return names.find((item) => item.name.length >= 3 && normalized.includes(item.name.toLowerCase())) ?? null;
}

function assertBlobUrl(value: string, organisationId: string, batchId: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Invalid datasheet storage URL.");
  }
  if (url.protocol !== "https:" || !url.pathname.includes(`/${organisationId}/${batchId}/`)) {
    throw new Error("Invalid datasheet storage path.");
  }
  return url.toString();
}

export async function processUploadedDatasheet(input: {
  batchId: string;
  category: EquipmentImportCategory;
  fileName: string;
  storagePath: string;
  fileSizeBytes: number;
}) {
  const { client, user, organisationId } = await context();
  const { data: batch } = await client.from("equipment_import_batches").select("id").eq("id", input.batchId).eq("organisation_id", organisationId).single();
  if (!batch) throw new Error("Import batch not found.");
  const storageUrl = assertBlobUrl(input.storagePath, organisationId, input.batchId);

  const { data: fileRow, error: fileError } = await client.from("equipment_import_files").insert({
    batch_id: input.batchId,
    organisation_id: organisationId,
    category: input.category,
    file_name: input.fileName.slice(0, 240),
    storage_path: storageUrl,
    file_size_bytes: input.fileSizeBytes,
    extraction_status: "processing",
    created_by: user.id,
  }).select("id").single();
  if (fileError || !fileRow) throw new Error("Uploaded datasheet could not be registered.");

  try {
    await client.from("equipment_import_batches").update({ status: "processing", updated_at: new Date().toISOString() }).eq("id", input.batchId);
    const response = await fetch(storageUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Datasheet could not be read from Blob storage.");
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("pdf")) throw new Error("Stored datasheet is not a PDF.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    const pdf = await getDocumentProxy(bytes, { maxImageSize: 16_777_216 });
    if (pdf.numPages > 40) throw new Error("Datasheet exceeds the 40-page extraction limit.");
    const result = await Promise.race([
      extractText(pdf, { mergePages: true }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("PDF extraction timed out.")), 15000)),
    ]);
    const rawText = String(result.text);
    if (rawText.trim().length < 40) throw new Error("No usable text could be extracted. This may be a scanned PDF.");

    const extraction = extractEquipmentSpecs(input.category, rawText);
    const { data: manufacturers } = await client.from("equipment_manufacturers").select("id,name").eq("organisation_id", organisationId).eq("status", "active");
    const manufacturer = manufacturerFromText(rawText, manufacturers ?? []);
    const { error: candidateError } = await client.from("equipment_import_candidates").insert({
      batch_id: input.batchId,
      file_id: fileRow.id,
      organisation_id: organisationId,
      category: input.category,
      manufacturer_name: manufacturer?.name ?? null,
      manufacturer_id: manufacturer?.id ?? null,
      model: extraction.model,
      specs: extraction.specs,
      confidence: { ...extraction.confidence, completeness: extraction.completeness },
      evidence: { file_name: input.fileName, storage_url: storageUrl, storage_path: storageUrl, pages: result.totalPages, provider: "vercel_blob" },
      status: "review",
      created_by: user.id,
    });
    if (candidateError) throw new Error(candidateError.message);

    await client.from("equipment_import_files").update({ extraction_status: "review", page_count: result.totalPages, updated_at: new Date().toISOString() }).eq("id", fileRow.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Extraction failed.";
    await client.from("equipment_import_files").update({ extraction_status: "failed", extraction_note: message, updated_at: new Date().toISOString() }).eq("id", fileRow.id);
  }

  const [{ count: candidateCount }, { count: errorCount }, { count: processingCount }] = await Promise.all([
    client.from("equipment_import_candidates").select("id", { count: "exact", head: true }).eq("batch_id", input.batchId),
    client.from("equipment_import_files").select("id", { count: "exact", head: true }).eq("batch_id", input.batchId).eq("extraction_status", "failed"),
    client.from("equipment_import_files").select("id", { count: "exact", head: true }).eq("batch_id", input.batchId).in("extraction_status", ["uploaded","processing"]),
  ]);
  await client.from("equipment_import_batches").update({
    candidate_count: candidateCount ?? 0,
    error_count: errorCount ?? 0,
    status: (processingCount ?? 0) > 0 ? "processing" : "review",
    updated_at: new Date().toISOString(),
  }).eq("id", input.batchId);
  revalidatePath("/dashboard/engineering/equipment/import");
  revalidatePath("/dashboard/engineering/equipment");
}

const numeric = (value: unknown) => value === null || value === undefined || value === "" ? null : Number(value);

export async function importCandidate(fd: FormData) {
  const { client, user, organisationId } = await context();
  const candidateId = String(fd.get("candidate_id") ?? "");
  const manufacturerId = String(fd.get("manufacturer_id") ?? "");
  const model = String(fd.get("model") ?? "").trim();
  if (!candidateId || !manufacturerId || !model) throw new Error("Manufacturer and model are required.");
  const { data: candidate } = await client.from("equipment_import_candidates").select("*").eq("id", candidateId).eq("organisation_id", organisationId).eq("status", "review").single();
  if (!candidate) throw new Error("Import candidate not found.");
  const { data: manufacturer } = await client.from("equipment_manufacturers").select("id").eq("id", manufacturerId).eq("organisation_id", organisationId).eq("status", "active").single();
  if (!manufacturer) throw new Error("Choose an active manufacturer.");
  const specs = (candidate.specs ?? {}) as Record<string, unknown>;

  let table: "pv_modules" | "inverters" | "batteries";
  let payload: Record<string, unknown>;
  if (candidate.category === "pv_module") {
    table = "pv_modules";
    payload = { manufacturer_id: manufacturerId, model, technology: specs.technology ?? "mono", pmax_w: numeric(specs.pmax_w), voc_v: numeric(specs.voc_v), vmp_v: numeric(specs.vmp_v), isc_a: numeric(specs.isc_a), imp_a: numeric(specs.imp_a), temp_coeff_pmax_pct_c: numeric(specs.temp_coeff_pmax_pct_c), temp_coeff_voc_pct_c: numeric(specs.temp_coeff_voc_pct_c), temp_coeff_isc_pct_c: numeric(specs.temp_coeff_isc_pct_c), max_system_voltage_v: numeric(specs.max_system_voltage_v), efficiency_pct: numeric(specs.efficiency_pct), width_mm: numeric(specs.width_mm), height_mm: numeric(specs.height_mm), weight_kg: numeric(specs.weight_kg), bifacial: Boolean(specs.bifacial) };
  } else if (candidate.category === "inverter") {
    table = "inverters";
    payload = { manufacturer_id: manufacturerId, model, inverter_type: specs.inverter_type ?? "grid_tied", phase: specs.phase ?? "three", rated_ac_power_kw: numeric(specs.rated_ac_power_kw), max_pv_input_power_kw: numeric(specs.max_pv_input_power_kw), max_dc_voltage_v: numeric(specs.max_dc_voltage_v), mppt_min_v: numeric(specs.mppt_min_v), mppt_max_v: numeric(specs.mppt_max_v), mppt_count: numeric(specs.mppt_count), max_input_current_per_mppt_a: numeric(specs.max_input_current_per_mppt_a), max_short_circuit_current_per_mppt_a: numeric(specs.max_short_circuit_current_per_mppt_a), max_charge_power_kw: numeric(specs.max_charge_power_kw), max_discharge_power_kw: numeric(specs.max_discharge_power_kw), battery_voltage_min_v: numeric(specs.battery_voltage_min_v), battery_voltage_max_v: numeric(specs.battery_voltage_max_v), max_efficiency_pct: numeric(specs.max_efficiency_pct) };
  } else {
    table = "batteries";
    payload = { manufacturer_id: manufacturerId, model, chemistry: specs.chemistry ?? "lfp", nominal_capacity_kwh: numeric(specs.nominal_capacity_kwh), usable_capacity_kwh: numeric(specs.usable_capacity_kwh), nominal_voltage_v: numeric(specs.nominal_voltage_v), operating_voltage_min_v: numeric(specs.operating_voltage_min_v), operating_voltage_max_v: numeric(specs.operating_voltage_max_v), max_charge_power_kw: numeric(specs.max_charge_power_kw), max_discharge_power_kw: numeric(specs.max_discharge_power_kw), max_dod_pct: numeric(specs.max_dod_pct), round_trip_efficiency_pct: numeric(specs.round_trip_efficiency_pct), cycle_life: numeric(specs.cycle_life) };
  }
  const evidence = (candidate.evidence as Record<string, unknown> | null) ?? {};
  const datasheetUrl = String(evidence.storage_url ?? evidence.storage_path ?? "") || null;
  const { data: created, error } = await client.from(table).insert({ ...payload, organisation_id: organisationId, datasheet_url: datasheetUrl, status: "draft", created_by: user.id }).select("id").single();
  if (error || !created) throw new Error(error?.message ?? "Draft equipment record could not be created. Complete missing required specifications first.");
  await client.from("equipment_import_candidates").update({ manufacturer_id: manufacturerId, model, status: "imported", imported_equipment_id: created.id, reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", candidateId);
  revalidatePath("/dashboard/engineering/equipment/import");
  revalidatePath("/dashboard/engineering/equipment");
}
