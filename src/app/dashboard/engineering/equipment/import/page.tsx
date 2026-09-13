import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BulkImportClient } from "./bulk-import-client";
import { importCandidate } from "./actions";

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function confidenceValue(value: unknown) {
  if (!value || typeof value !== "object") return 0;
  const raw = (value as Record<string, unknown>).completeness;
  return typeof raw === "number" ? raw : Number(raw ?? 0);
}

function specsList(value: unknown) {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== null && item !== "" && item !== undefined);
}

export default async function EquipmentImportPage() {
  const supabase = await createClient();
  const [{ data: batches }, { data: candidates }, { data: manufacturers }, { data: files }] = await Promise.all([
    supabase.from("equipment_import_batches").select("id,status,file_count,candidate_count,error_count,created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("equipment_import_candidates").select("id,batch_id,file_id,category,manufacturer_name,manufacturer_id,model,specs,confidence,status,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("equipment_manufacturers").select("id,name").eq("status", "active").order("name"),
    supabase.from("equipment_import_files").select("id,file_name,extraction_status,extraction_note,page_count").order("created_at", { ascending: false }).limit(100),
  ]);
  const fileMap = new Map((files ?? []).map((file) => [file.id, file]));
  const pending = (candidates ?? []).filter((item) => item.status === "review");

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Equipment</p>
          <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">Datasheet import</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Upload manufacturer PDFs, review extracted specifications, then create Draft equipment records.</p>
        </div>
        <Link href="/dashboard/engineering/equipment" className="inline-flex min-h-10 w-fit items-center border border-[var(--line)] px-4 text-xs font-semibold">Equipment library</Link>
      </header>

      <BulkImportClient />

      <section className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4">
        <Metric label="Recent batches" value={String(batches?.length ?? 0)} />
        <Metric label="Awaiting review" value={String(pending.length)} />
        <Metric label="Imported" value={String((candidates ?? []).filter((item) => item.status === "imported").length)} />
        <Metric label="Extraction errors" value={String((batches ?? []).reduce((sum, item) => sum + Number(item.error_count ?? 0), 0))} />
      </section>

      <section className="border border-[var(--line)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Review queue</p><h2 className="mt-1 text-lg font-semibold">Extracted equipment</h2></div>
          <span className="text-xs tabular-nums text-[var(--muted)]">{pending.length} pending</span>
        </div>
        {pending.length ? <div className="divide-y divide-[var(--line)]">{pending.map((candidate) => {
          const file = fileMap.get(candidate.file_id);
          const completeness = confidenceValue(candidate.confidence);
          const specs = specsList(candidate.specs);
          return <form key={candidate.id} action={importCandidate} className="grid gap-4 p-5 xl:grid-cols-[minmax(240px,1.2fr)_190px_220px_minmax(300px,1.5fr)_120px] xl:items-start">
            <input type="hidden" name="candidate_id" value={candidate.id} />
            <div>
              <p className="text-xs font-semibold">{file?.file_name ?? "Datasheet"}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">{titleCase(candidate.category)} · {file?.page_count ? `${file.page_count} pages` : "PDF"}</p>
              <p className={`mt-3 text-xs font-semibold ${completeness >= 80 ? "text-emerald-700" : completeness >= 50 ? "text-amber-700" : "text-red-700"}`}>{completeness}% required fields extracted</p>
            </div>
            <label className="grid gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Manufacturer
              <select name="manufacturer_id" defaultValue={candidate.manufacturer_id ?? ""} required className="min-h-10 border border-[var(--line)] bg-[var(--background)] px-2 text-xs font-normal normal-case tracking-normal text-[var(--foreground)]">
                <option value="">Select manufacturer</option>
                {(manufacturers ?? []).map((manufacturer) => <option key={manufacturer.id} value={manufacturer.id}>{manufacturer.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Model
              <input name="model" defaultValue={candidate.model ?? ""} required className="min-h-10 border border-[var(--line)] bg-transparent px-2 text-xs font-normal normal-case tracking-normal text-[var(--foreground)]" placeholder="Model number" />
            </label>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Extracted specifications</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">{specs.slice(0, 12).map(([key, value]) => <span key={key}><span className="text-[var(--muted)]">{titleCase(key)}:</span> {String(value)}</span>)}</div>
              {file?.extraction_note ? <p className="mt-2 text-xs text-red-700">{file.extraction_note}</p> : null}
            </div>
            <button className="min-h-10 border border-[var(--accent)] px-3 text-xs font-semibold text-[var(--accent)]">Create Draft</button>
          </form>;
        })}</div> : <div className="px-5 py-12 text-sm text-[var(--muted)]">No extracted equipment is waiting for review.</div>}
      </section>

      <section className="border border-[var(--line)]">
        <div className="border-b border-[var(--line)] px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Batch history</p></div>
        {(batches ?? []).length ? <div className="divide-y divide-[var(--line)]">{(batches ?? []).map((batch) => <div key={batch.id} className="grid gap-2 px-5 py-3 text-xs sm:grid-cols-[1fr_120px_110px_110px_110px]"><span className="font-medium tabular-nums">{batch.id.slice(0, 8)}</span><span>{titleCase(batch.status)}</span><span>{batch.file_count} files</span><span>{batch.candidate_count} extracted</span><span>{batch.error_count} errors</span></div>)}</div> : <div className="px-5 py-8 text-sm text-[var(--muted)]">No import batches yet.</div>}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-[var(--background)] px-4 py-3"><p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">{value}</p></div>;
}
