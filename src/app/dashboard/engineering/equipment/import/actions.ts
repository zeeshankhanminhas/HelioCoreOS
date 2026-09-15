"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
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

const allowedCategories = new Set<EquipmentImportCategory>(["pv_module", "inverter", "battery"]);

function normalizeHost(host: string) {
  return host.toLowerCase().replace(/^www\./, "");
}

function sameOfficialDomain(a: string, b: string) {
  const first = normalizeHost(a);
  const second = normalizeHost(b);
  return first === second || first.endsWith(`.${second}`) || second.endsWith(`.${first}`);
}

function httpsUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("Enter a valid HTTPS URL."); }
  if (url.protocol !== "https:") throw new Error("Only HTTPS manufacturer sources are allowed.");
  if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(url.hostname.toLowerCase())) throw new Error("Local addresses are not allowed.");
  return url;
}

function fileNameFromUrl(url: URL) {
  const raw = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "datasheet.pdf");
  return raw.toLowerCase().endsWith(".pdf") ? raw.slice(0, 240) : `${raw.slice(0, 230)}.pdf`;
}

function safeFileName(name: string) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-140);
}

function inferCategory(text: string, configured: EquipmentImportCategory[]): EquipmentImportCategory | null {
  if (configured.length === 1) return configured[0];
  const value = text.toLowerCase();
  if (/\b(battery|bess|energy[- ]?storage|storage[- ]?system)\b/.test(value) && configured.includes("battery")) return "battery";
  if (/\b(inverter|pcs|power[- ]?conversion|hybrid[- ]?inverter)\b/.test(value) && configured.includes("inverter")) return "inverter";
  if (/\b(module|solar[- ]?panel|pv[- ]?module|photovoltaic)\b/.test(value) && configured.includes("pv_module")) return "pv_module";
  return null;
}

function discoverPdfLinks(html: string, sourceUrl: URL, configured: EquipmentImportCategory[]) {
  const results = new Map<string, { url: string; fileName: string; category: EquipmentImportCategory | null }>();
  const linkPattern = /<a\b[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(html))) {
    const href = match[1].trim();
    const label = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    let resolved: URL;
    try { resolved = new URL(href, sourceUrl); } catch { continue; }
    if (resolved.protocol !== "https:" || !sameOfficialDomain(resolved.hostname, sourceUrl.hostname)) continue;
    const searchable = `${resolved.pathname} ${resolved.search} ${label}`;
    const isPdf = /\.pdf(?:$|[?#])/i.test(resolved.href) || /\b(pdf|datasheet|data sheet|technical specification|specification sheet)\b/i.test(searchable);
    if (!isPdf || !/\.pdf(?:$|[?#])/i.test(resolved.href)) continue;
    resolved.hash = "";
    const key = resolved.toString();
    if (!results.has(key)) results.set(key, { url: key, fileName: fileNameFromUrl(resolved), category: inferCategory(searchable, configured) });
  }
  return Array.from(results.values()).slice(0, 100);
}

export async function saveDatasheetSource(fd: FormData) {
  const { client, user, organisationId } = await context();
  const manufacturerId = String(fd.get("manufacturer_id") ?? "");
  const sourceUrl = httpsUrl(String(fd.get("source_url") ?? "").trim());
  const categories = ["pv_module", "inverter", "battery"].filter((item) => fd.get(item) === "on") as EquipmentImportCategory[];
  if (!manufacturerId || !categories.length) throw new Error("Manufacturer and at least one equipment category are required.");

  const { data: manufacturer } = await client.from("equipment_manufacturers").select("id,website_url,status").eq("id", manufacturerId).eq("organisation_id", organisationId).single();
  if (!manufacturer || manufacturer.status !== "active") throw new Error("Choose an active manufacturer.");
  if (manufacturer.website_url) {
    const website = httpsUrl(String(manufacturer.website_url));
    if (!sameOfficialDomain(sourceUrl.hostname, website.hostname)) throw new Error("The discovery page must be on the manufacturer's official website domain.");
  }

  const { error } = await client.from("equipment_datasheet_sources").upsert({
    organisation_id: organisationId,
    manufacturer_id: manufacturerId,
    source_url: sourceUrl.toString(),
    source_host: sourceUrl.hostname.toLowerCase(),
    categories,
    status: "active",
    created_by: user.id,
    updated_at: new Date().toISOString(),
  }, { onConflict: "organisation_id,manufacturer_id,source_url" });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/engineering/equipment/import");
}

export async function scanDatasheetSource(fd: FormData) {
  const { client, user, organisationId } = await context();
  const sourceId = String(fd.get("source_id") ?? "");
  const { data: source } = await client.from("equipment_datasheet_sources").select("id,manufacturer_id,source_url,source_host,categories,status").eq("id", sourceId).eq("organisation_id", organisationId).single();
  if (!source || source.status !== "active") throw new Error("Active manufacturer source not found.");
  const sourceUrl = httpsUrl(String(source.source_url));
  if (sourceUrl.hostname.toLowerCase() !== String(source.source_host).toLowerCase()) throw new Error("Manufacturer source host mismatch.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let discoveries: ReturnType<typeof discoverPdfLinks> = [];
  try {
    const response = await fetch(sourceUrl, { cache: "no-store", redirect: "follow", signal: controller.signal, headers: { "user-agent": "HelioCoreOS-Datasheet-Discovery/1.0" } });
    if (!response.ok) throw new Error(`Manufacturer page returned HTTP ${response.status}.`);
    const finalUrl = httpsUrl(response.url);
    if (!sameOfficialDomain(finalUrl.hostname, sourceUrl.hostname)) throw new Error("Manufacturer page redirected outside the approved official domain.");
    const type = response.headers.get("content-type") ?? "";
    if (!type.toLowerCase().includes("text/html")) throw new Error("The configured source must be an HTML product or download page.");
    const html = (await response.text()).slice(0, 3_000_000);
    discoveries = discoverPdfLinks(html, finalUrl, (source.categories ?? []) as EquipmentImportCategory[]);
  } finally { clearTimeout(timeout); }

  for (const item of discoveries) {
    const { error } = await client.from("equipment_datasheet_discoveries").upsert({
      organisation_id: organisationId,
      source_id: source.id,
      manufacturer_id: source.manufacturer_id,
      document_url: item.url,
      file_name: item.fileName,
      category: item.category,
      status: "discovered",
      created_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "organisation_id,document_url", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
  }

  await client.from("equipment_datasheet_sources").update({
    last_scanned_at: new Date().toISOString(),
    last_scan_count: discoveries.length,
    last_scan_note: discoveries.length ? `${discoveries.length} direct official PDF link${discoveries.length === 1 ? "" : "s"} found.` : "No direct PDF links found on this page.",
    updated_at: new Date().toISOString(),
  }).eq("id", source.id).eq("organisation_id", organisationId);
  revalidatePath("/dashboard/engineering/equipment/import");
}

export async function ignoreDatasheetDiscovery(fd: FormData) {
  const { client, organisationId } = await context();
  const id = String(fd.get("discovery_id") ?? "");
  await client.from("equipment_datasheet_discoveries").update({ status: "ignored", processed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id).eq("organisation_id", organisationId).eq("status", "discovered");
  revalidatePath("/dashboard/engineering/equipment/import");
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
  try { url = new URL(value); } catch { throw new Error("Invalid datasheet storage URL."); }
  if (url.protocol !== "https:" || !url.pathname.includes(`/${organisationId}/${batchId}/`)) throw new Error("Invalid datasheet storage path.");
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
    batch_id: input.batchId, organisation_id: organisationId, category: input.category,
    file_name: input.fileName.slice(0, 240), storage_path: storageUrl, file_size_bytes: input.fileSizeBytes,
    extraction_status: "processing", created_by: user.id,
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
      batch_id: input.batchId, file_id: fileRow.id, organisation_id: organisationId, category: input.category,
      manufacturer_name: manufacturer?.name ?? null, manufacturer_id: manufacturer?.id ?? null, model: extraction.model,
      specs: extraction.specs, confidence: { ...extraction.confidence, completeness: extraction.completeness },
      evidence: { file_name: input.fileName, storage_url: storageUrl, storage_path: storageUrl, pages: result.totalPages, provider: "vercel_blob" },
      status: "review", created_by: user.id,
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
  await client.from("equipment_import_batches").update({ candidate_count: candidateCount ?? 0, error_count: errorCount ?? 0, status: (processingCount ?? 0) > 0 ? "processing" : "review", updated_at: new Date().toISOString() }).eq("id", input.batchId);
  revalidatePath("/dashboard/engineering/equipment/import");
  revalidatePath("/dashboard/engineering/equipment");
}

export async function queueDiscoveredDatasheet(fd: FormData) {
  const { client, organisationId } = await context();
  const discoveryId = String(fd.get("discovery_id") ?? "");
  const chosenCategory = String(fd.get("category") ?? "") as EquipmentImportCategory;
  if (!allowedCategories.has(chosenCategory)) throw new Error("Choose the equipment category before importing.");
  const { data: discovery } = await client.from("equipment_datasheet_discoveries").select("id,source_id,document_url,file_name,status").eq("id", discoveryId).eq("organisation_id", organisationId).single();
  if (!discovery || discovery.status !== "discovered") throw new Error("Datasheet discovery is no longer available.");
  const { data: source } = await client.from("equipment_datasheet_sources").select("source_host,status").eq("id", discovery.source_id).eq("organisation_id", organisationId).single();
  if (!source || source.status !== "active") throw new Error("Manufacturer source is inactive.");
  const documentUrl = httpsUrl(String(discovery.document_url));
  if (!sameOfficialDomain(documentUrl.hostname, String(source.source_host))) throw new Error("Datasheet URL is outside the approved manufacturer domain.");

  await client.from("equipment_datasheet_discoveries").update({ status: "queued", updated_at: new Date().toISOString() }).eq("id", discovery.id);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let response: Response;
    try { response = await fetch(documentUrl, { cache: "no-store", redirect: "follow", signal: controller.signal, headers: { "user-agent": "HelioCoreOS-Datasheet-Importer/1.0" } }); }
    finally { clearTimeout(timeout); }
    if (!response.ok) throw new Error(`Datasheet returned HTTP ${response.status}.`);
    const finalUrl = httpsUrl(response.url);
    if (!sameOfficialDomain(finalUrl.hostname, String(source.source_host))) throw new Error("Datasheet redirected outside the approved manufacturer domain.");
    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > 20 * 1024 * 1024) throw new Error("Datasheet exceeds the 20 MB import limit.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > 20 * 1024 * 1024) throw new Error("Datasheet exceeds the 20 MB import limit.");
    if (String.fromCharCode(...bytes.slice(0, 4)) !== "%PDF") throw new Error("The discovered document is not a valid PDF.");

    const batch = await createImportBatch(1);
    const pathname = `${batch.organisationId}/${batch.batchId}/${crypto.randomUUID()}-${safeFileName(discovery.file_name)}`;
    const blob = await put(pathname, bytes, { access: "public", contentType: "application/pdf", addRandomSuffix: false });
    await processUploadedDatasheet({ batchId: batch.batchId, category: chosenCategory, fileName: discovery.file_name, storagePath: blob.url, fileSizeBytes: bytes.byteLength });
    await client.from("equipment_datasheet_discoveries").update({ status: "queued", category: chosenCategory, processed_at: new Date().toISOString(), note: "Copied to governed Blob storage and sent to extraction review.", updated_at: new Date().toISOString() }).eq("id", discovery.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Datasheet could not be queued.";
    await client.from("equipment_datasheet_discoveries").update({ status: "failed", note: message, processed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", discovery.id);
    throw error;
  }
  revalidatePath("/dashboard/engineering/equipment/import");
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
