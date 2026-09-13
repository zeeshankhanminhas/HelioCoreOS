"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createImportBatch, processUploadedDatasheet } from "./actions";
import type { EquipmentImportCategory } from "@/lib/engineering/datasheet-extractor";

const labels: Record<EquipmentImportCategory, string> = {
  pv_module: "PV modules",
  inverter: "Inverters / PCS",
  battery: "Batteries / BESS",
};

function safeFileName(name: string) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-140);
}

export function BulkImportClient() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<EquipmentImportCategory>("pv_module");
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function start() {
    setError("");
    if (!files.length) { setError("Choose at least one PDF datasheet."); return; }
    if (files.length > 50) { setError("A batch can contain up to 50 datasheets."); return; }
    const invalid = files.find((file) => file.type !== "application/pdf" || file.size > 20 * 1024 * 1024);
    if (invalid) { setError(`${invalid.name}: PDF files must be 20 MB or smaller.`); return; }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const batch = await createImportBatch(files.length);
        for (let index = 0; index < files.length; index += 1) {
          const file = files[index];
          setProgress(`Uploading ${index + 1} of ${files.length} · ${file.name}`);
          const path = `${batch.organisationId}/${batch.batchId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
          const { error: uploadError } = await supabase.storage.from("equipment-datasheets").upload(path, file, { contentType: "application/pdf", upsert: false });
          if (uploadError) throw new Error(`${file.name}: ${uploadError.message}`);
          setProgress(`Extracting ${index + 1} of ${files.length} · ${file.name}`);
          await processUploadedDatasheet({ batchId: batch.batchId, category, fileName: file.name, storagePath: path, fileSizeBytes: file.size });
        }
        setProgress("Batch ready for review");
        setFiles([]);
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Import failed.");
        setProgress("");
      }
    });
  }

  return (
    <section className="border border-[var(--line)] bg-[var(--background)]">
      <div className="border-b border-[var(--line)] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">New import</p>
        <h2 className="mt-1 text-lg font-semibold">Manufacturer datasheets</h2>
      </div>
      <div className="grid gap-5 p-5 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-end">
        <label className="grid gap-2 text-xs font-semibold">Equipment type
          <select value={category} onChange={(event) => setCategory(event.target.value as EquipmentImportCategory)} className="min-h-11 border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">
            {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-xs font-semibold">PDF datasheets
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} className="min-h-11 border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm font-normal file:mr-4 file:border-0 file:bg-transparent file:text-xs file:font-semibold" />
        </label>
        <button type="button" onClick={start} disabled={isPending || !files.length} className="min-h-11 border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-40">{isPending ? "Processing…" : `Upload & extract${files.length ? ` (${files.length})` : ""}`}</button>
      </div>
      {(progress || error) ? <div className={`border-t px-5 py-3 text-xs ${error ? "border-red-200 bg-red-50 text-red-800" : "border-[var(--line)] text-[var(--muted)]"}`}>{error || progress}</div> : null}
    </section>
  );
}
