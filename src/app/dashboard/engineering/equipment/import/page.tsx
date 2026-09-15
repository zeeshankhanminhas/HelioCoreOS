import Link from "next/link";
import { createClient } from "@/lib/neon/client";
import { BulkImportClient } from "./bulk-import-client";
import {
  ignoreDatasheetDiscovery,
  importCandidate,
  queueDiscoveredDatasheet,
  saveDatasheetSource,
  scanDatasheetSource,
} from "./actions";

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

const categoryLabels: Record<string, string> = {
  pv_module: "PV module",
  inverter: "Inverter / PCS",
  battery: "Battery / BESS",
};

const shortDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function EquipmentImportPage() {
  const supabase = await createClient();
  const [{ data: batches }, { data: candidates }, { data: manufacturers }, { data: files }, { data: sources }, { data: discoveries }] = await Promise.all([
    supabase.from("equipment_import_batches").select("id,status,file_count,candidate_count,error_count,created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("equipment_import_candidates").select("id,batch_id,file_id,category,manufacturer_name,manufacturer_id,model,specs,confidence,status,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("equipment_manufacturers").select("id,name,website_url,status").eq("status", "active").order("name"),
    supabase.from("equipment_import_files").select("id,file_name,extraction_status,extraction_note,page_count").order("created_at", { ascending: false }).limit(100),
    supabase.from("equipment_datasheet_sources").select("id,manufacturer_id,source_url,source_host,categories,status,last_scanned_at,last_scan_count,last_scan_note,created_at").order("updated_at", { ascending: false }).limit(50),
    supabase.from("equipment_datasheet_discoveries").select("id,source_id,manufacturer_id,document_url,file_name,category,status,discovered_at,processed_at,note").order("discovered_at", { ascending: false }).limit(200),
  ]);

  const fileMap = new Map((files ?? []).map((file) => [file.id, file]));
  const manufacturerMap = new Map((manufacturers ?? []).map((manufacturer) => [manufacturer.id, manufacturer]));
  const pending = (candidates ?? []).filter((item) => item.status === "review");
  const discovered = (discoveries ?? []).filter((item) => item.status === "discovered");
  const queued = (discoveries ?? []).filter((item) => item.status === "queued");

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Equipment</p>
          <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em]">Datasheet acquisition</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Tell HelioCoreOS where an official manufacturer publishes product documents. The OS discovers direct PDF datasheets, copies selected files into governed storage, extracts engineering values and sends them to human review.</p>
        </div>
        <Link href="/dashboard/engineering/equipment" className="inline-flex min-h-10 w-fit items-center border border-[var(--line)] px-4 text-xs font-semibold">Equipment library</Link>
      </header>

      <section className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Official sources" value={String((sources ?? []).filter((item) => item.status === "active").length)} />
        <Metric label="PDFs discovered" value={String(discovered.length)} />
        <Metric label="Sent to extraction" value={String(queued.length)} />
        <Metric label="Awaiting verification" value={String(pending.length)} />
        <Metric label="Imported records" value={String((candidates ?? []).filter((item) => item.status === "imported").length)} />
      </section>

      <section className="border border-[var(--line)]">
        <div className="border-b border-[var(--line)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Step 1 · Tell the OS where to look</p>
          <h2 className="mt-1 text-lg font-semibold">Manufacturer sources</h2>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-[var(--muted)]">Use an official product, downloads or technical-document page. For safety, the page must be on the same official domain already recorded against the manufacturer.</p>
        </div>
        <form action={saveDatasheetSource} className="grid gap-4 border-b border-[var(--line)] p-5 lg:grid-cols-[220px_minmax(340px,1fr)_minmax(280px,0.8fr)_auto] lg:items-end">
          <label className="grid gap-2 text-xs font-semibold">Manufacturer
            <select name="manufacturer_id" required className="min-h-11 border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">
              <option value="">Choose manufacturer</option>
              {(manufacturers ?? []).map((manufacturer) => <option key={manufacturer.id} value={manufacturer.id}>{manufacturer.name}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-xs font-semibold">Official product / download page
            <input name="source_url" type="url" required placeholder="https://manufacturer.com/downloads" className="min-h-11 border border-[var(--line)] bg-transparent px-3 text-sm font-normal" />
          </label>
          <fieldset>
            <legend className="text-xs font-semibold">Look for</legend>
            <div className="mt-2 flex min-h-11 flex-wrap items-center gap-x-5 gap-y-2 border border-[var(--line)] px-3 text-xs">
              <label className="flex items-center gap-2"><input type="checkbox" name="pv_module" defaultChecked />PV modules</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="inverter" defaultChecked />Inverters</label>
              <label className="flex items-center gap-2"><input type="checkbox" name="battery" defaultChecked />Batteries</label>
            </div>
          </fieldset>
          <button className="min-h-11 border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)]">Add source</button>
        </form>

        {(sources ?? []).length ? <div className="divide-y divide-[var(--line)]">{(sources ?? []).map((source) => {
          const manufacturer = manufacturerMap.get(source.manufacturer_id);
          return <div key={source.id} className="grid gap-4 p-5 xl:grid-cols-[minmax(180px,0.8fr)_minmax(300px,1.5fr)_minmax(220px,1fr)_150px_auto] xl:items-center">
            <div><p className="text-sm font-semibold">{manufacturer?.name ?? "Manufacturer"}</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">{source.status}</p></div>
            <div className="min-w-0"><p className="truncate text-xs font-medium">{source.source_url}</p><p className="mt-1 text-[10px] text-[var(--muted)]">Official host · {source.source_host}</p></div>
            <div><p className="text-xs">{(source.categories ?? []).map((item: string) => categoryLabels[item] ?? titleCase(item)).join(" · ")}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{source.last_scan_note ?? "Not scanned yet"}</p></div>
            <div className="text-xs text-[var(--muted)]">{source.last_scanned_at ? <>Last scan<br />{shortDate.format(new Date(source.last_scanned_at))}</> : "Never scanned"}</div>
            <form action={scanDatasheetSource}><input type="hidden" name="source_id" value={source.id} /><button className="min-h-10 border border-[var(--foreground)] px-4 text-xs font-semibold">Scan now</button></form>
          </div>;
        })}</div> : <div className="p-8 text-sm text-[var(--muted)]">No manufacturer sources configured yet. Add one official downloads page above.</div>}
      </section>

      <section className="border border-[var(--line)]">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] p-5">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Step 2 · Choose what matters</p><h2 className="mt-1 text-lg font-semibold">Discovered official PDFs</h2></div>
          <span className="text-xs tabular-nums text-[var(--muted)]">{discovered.length} waiting</span>
        </div>
        {discovered.length ? <div className="divide-y divide-[var(--line)]">{discovered.map((item) => {
          const manufacturer = manufacturerMap.get(item.manufacturer_id);
          return <div key={item.id} className="grid gap-4 p-5 xl:grid-cols-[minmax(260px,1.35fr)_170px_210px_auto] xl:items-center">
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{item.file_name}</p><p className="mt-1 truncate text-xs text-[var(--muted)]">{manufacturer?.name ?? "Manufacturer"} · {item.document_url}</p></div>
            <div className="text-xs text-[var(--muted)]">Found {shortDate.format(new Date(item.discovered_at))}</div>
            <form action={queueDiscoveredDatasheet} className="flex gap-2">
              <input type="hidden" name="discovery_id" value={item.id} />
              <select name="category" required defaultValue={item.category ?? ""} className="min-h-10 min-w-0 flex-1 border border-[var(--line)] bg-[var(--background)] px-2 text-xs">
                <option value="">Choose type</option>
                <option value="pv_module">PV module</option>
                <option value="inverter">Inverter / PCS</option>
                <option value="battery">Battery / BESS</option>
              </select>
              <button className="min-h-10 border border-[var(--accent)] px-3 text-xs font-semibold text-[var(--accent)]">Send to extraction</button>
            </form>
            <form action={ignoreDatasheetDiscovery}><input type="hidden" name="discovery_id" value={item.id} /><button className="min-h-10 px-3 text-xs font-semibold text-[var(--muted)]">Ignore</button></form>
          </div>;
        })}</div> : <div className="p-8 text-sm text-[var(--muted)]">Nothing waiting. Scan an official manufacturer source to discover direct PDF datasheets.</div>}
      </section>

      <section className="border border-[var(--line)] bg-[var(--surface-subtle)] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Manual fallback</p>
        <h2 className="mt-1 text-lg font-semibold">Already have the PDFs?</h2>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">You can still upload up to 50 manufacturer PDFs directly. Both routes feed the same extraction and verification queue below.</p>
      </section>

      <BulkImportClient />

      <section className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4">
        <Metric label="Recent batches" value={String(batches?.length ?? 0)} />
        <Metric label="Awaiting review" value={String(pending.length)} />
        <Metric label="Imported" value={String((candidates ?? []).filter((item) => item.status === "imported").length)} />
        <Metric label="Extraction errors" value={String((batches ?? []).reduce((sum, item) => sum + Number(item.error_count ?? 0), 0))} />
      </section>

      <section className="border border-[var(--line)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Step 3 · Human verification</p><h2 className="mt-1 text-lg font-semibold">Extracted equipment</h2></div>
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
