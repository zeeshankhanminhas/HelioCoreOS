import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/neon/client";
import { RecordHeader, RecordWorkspace, RecordWorkspaceSection } from "@/components/heliocore/record-workspace";
import { BomExceptionLayer } from "./bom-exception-layer";

type BomLine = Record<string, unknown>;
type BomException = {
  id: string;
  generated_line_index: number | null;
  exception_type: "quantity_override" | "project_item";
  description: string;
  category: string;
  original_quantity: number | null;
  requested_quantity: number;
  unit: string;
  reason: string;
  status: "pending_review" | "approved" | "rejected" | "withdrawn";
  review_reason?: string | null;
  created_at: string;
  reviewed_at?: string | null;
};
type BomExceptionEvent = {
  id: string;
  exception_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

function relationName(value: unknown, fallback: string) {
  if (!value) return fallback;
  if (Array.isArray(value)) return relationName(value[0], fallback);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.title ?? record.name ?? record.reference ?? fallback);
  }
  return fallback;
}

function field(value: unknown, key: string) {
  const item = Array.isArray(value) ? value[0] : value;
  return item && typeof item === "object" ? (item as Record<string, unknown>)[key] : null;
}

function bomSource(item: BomLine) {
  const status = String(item.status ?? "selected");
  const category = String(item.category ?? "").toLowerCase();
  if (status === "engineering_review") return "Design rule / review";
  if (item.equipmentId || item.equipment_id) return "Calculation + datasheet";
  if (category === "cable") return "Design route";
  if (category === "protection") return "Protection selection";
  return "Generated design";
}

const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: design }, { data: exceptionData }, { data: eventData }] = await Promise.all([
    supabase
      .from("system_designs")
      .select("*,opportunities(id,title,reference),sites(id,name,postcode),engineering_calculations(id,revision,engine_version)")
      .eq("id", id)
      .single(),
    supabase
      .from("bom_exceptions")
      .select("id,generated_line_index,exception_type,description,category,original_quantity,requested_quantity,unit,reason,status,review_reason,created_at,reviewed_at")
      .eq("system_design_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("bom_exception_events")
      .select("id,exception_id,event_type,payload,created_at")
      .eq("system_design_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!design) notFound();

  const exceptions = (exceptionData ?? []) as BomException[];
  const events = (eventData ?? []) as BomExceptionEvent[];
  const opportunityId = field(design.opportunities, "id");
  const opportunityReference = field(design.opportunities, "reference");
  const postcode = field(design.sites, "postcode");
  const calcRevision = field(design.engineering_calculations, "revision");
  const calcEngine = field(design.engineering_calculations, "engine_version");
  const bom: BomLine[] = Array.isArray(design.bom_snapshot)
    ? design.bom_snapshot.filter((line: unknown): line is BomLine => Boolean(line) && typeof line === "object" && !Array.isArray(line))
    : [];
  const performance = design.performance_snapshot && typeof design.performance_snapshot === "object" ? design.performance_snapshot as Record<string, unknown> : {};
  const reviewLines = bom.filter((item) => String(item.status ?? "selected") === "engineering_review");
  const pendingExceptions = exceptions.filter((item) => item.status === "pending_review");
  const approvedProjectItems = exceptions.filter((item) => item.status === "approved" && item.exception_type === "project_item");
  const effectiveLineCount = bom.length + approvedProjectItems.length;
  const procurementState = design.status !== "approved"
    ? "Design approval required"
    : !bom.length
      ? "BOM incomplete"
      : reviewLines.length
        ? "Engineering review required"
        : pendingExceptions.length
          ? "BOM exception review required"
          : "Ready for procurement";

  return <RecordWorkspace>
    <RecordHeader
      eyebrow="Design"
      title={design.design_reference}
      meta={<>{opportunityReference ? `${String(opportunityReference)} · ` : ""}{relationName(design.sites, "Site")}{postcode ? ` · ${String(postcode)}` : ""} · Rev {design.revision} · {titleCase(design.status)}</>}
      actions={<><Link href="/dashboard/designs" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Designs</Link><Link href="/dashboard/boms" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">BOM</Link>{opportunityId ? <Link href={`/dashboard/opportunities/${String(opportunityId)}`} className="inline-flex min-h-10 items-center border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Opportunity</Link> : null}</>}
    />

    <section className="mt-7 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-6">
      <Metric label="Status" value={titleCase(design.status)} />
      <Metric label="PV array" value={design.array_capacity_kwp == null ? "—" : `${design.array_capacity_kwp} kWp`} />
      <Metric label="Inverter" value={design.inverter_capacity_kw == null ? "—" : `${design.inverter_capacity_kw} kW`} />
      <Metric label="BESS" value={design.battery_capacity_kwh == null ? "—" : `${design.battery_capacity_kwh} kWh`} />
      <Metric label="Effective BOM" value={`${effectiveLineCount} lines`} />
      <Metric label="Procurement" value={procurementState} />
    </section>

    <RecordWorkspaceSection eyebrow="Revision" title="Design baseline">
      <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
        <Detail label="Calculator" value={calcRevision ? `R${String(calcRevision)}` : "Not linked"} />
        <Detail label="Engine" value={calcEngine ? String(calcEngine) : "Not recorded"} />
        <Detail label="SLD" value={design.sld_svg ? "Available" : "Not generated"} />
        <Detail label="Performance" value={Object.keys(performance).length ? "Available" : "Not available"} />
      </div>
    </RecordWorkspaceSection>

    <RecordWorkspaceSection eyebrow="Equipment" title="System equipment">
      <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
        <Detail label="PV module" value={[design.module_manufacturer, design.module_model].filter(Boolean).join(" ") || "Not selected"} />
        <Detail label="Modules" value={design.module_quantity == null ? "—" : `${design.module_quantity} × ${design.module_rating_wp ?? "?"} W`} />
        <Detail label="Inverter / PCS" value={[design.inverter_manufacturer, design.inverter_model].filter(Boolean).join(" ") || "Not selected"} />
        <Detail label="Battery" value={[design.battery_manufacturer, design.battery_model].filter(Boolean).join(" ") || "Not applicable / not selected"} />
      </div>
    </RecordWorkspaceSection>

    <RecordWorkspaceSection eyebrow="Materials" title="Generated BOM" description={procurementState}>
      <div className="border-b border-[var(--line)] bg-[var(--surface-subtle)] px-5 py-4 text-xs leading-5 text-[var(--muted)]">
        <span className="font-semibold text-[var(--foreground)]">Governed output:</span> HelioCalc generates this BOM from the same compiled electrical design model used for calculations and the SLD. Equipment quantities come from engineering logic and approved datasheets; cable quantities come from governed design routes; unresolved rule-based items remain <span className="font-semibold text-[var(--foreground)]">Engineering review</span> and block procurement release. Approved BOM exceptions are applied as a separate overlay; they never rewrite this generated baseline.
      </div>
      {reviewLines.length ? <div className="border-b border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900"><span className="font-semibold">Procurement blocked:</span> {reviewLines.length} BOM {reviewLines.length === 1 ? "line requires" : "lines require"} engineering resolution before material release.</div> : null}
      {pendingExceptions.length ? <div className="border-b border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900"><span className="font-semibold">Exception review required:</span> {pendingExceptions.length} controlled BOM {pendingExceptions.length === 1 ? "exception is" : "exceptions are"} awaiting a governed decision.</div> : null}
      {bom.length ? <div className="overflow-x-auto"><table className="w-full min-w-[920px] border-collapse text-left text-sm"><thead className="border-b border-[var(--line)] bg-black/[0.015] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]"><tr><th className="px-5 py-3">Item</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Source / basis</th><th className="px-5 py-3">Engineering state</th></tr></thead><tbody>{bom.map((item: BomLine, index: number) => {
        const status = String(item.status ?? "selected");
        const approvedOverride = exceptions.find((exception) => exception.status === "approved" && exception.exception_type === "quantity_override" && exception.generated_line_index === index);
        return <tr key={index} className="border-b border-[var(--line)]"><td className="px-5 py-4"><p className="font-medium">{String(item.description ?? item.name ?? item.item ?? `BOM line ${index + 1}`)}</p>{item.manufacturer || item.model ? <p className="mt-1 text-xs text-[var(--muted)]">{[item.manufacturer, item.model].filter(Boolean).map(String).join(" · ")}</p> : null}{approvedOverride ? <p className="mt-2 text-xs font-semibold text-[var(--accent)]">Approved exception applies · {approvedOverride.reason}</p> : null}</td><td className="px-5 py-4 text-[var(--muted)]">{String(item.category ?? item.type ?? "—")}</td><td className="px-5 py-4 tabular-nums">{approvedOverride ? <><span className="text-[var(--muted)] line-through">{String(item.quantity ?? item.qty ?? "—")}</span> <strong>{approvedOverride.requested_quantity} {approvedOverride.unit}</strong></> : <>{String(item.quantity ?? item.qty ?? "—")} {String(item.unit ?? "")}</>}</td><td className="px-5 py-4 text-[var(--muted)]">{approvedOverride ? "Approved exception overlay" : bomSource(item)}</td><td className={`px-5 py-4 text-xs font-semibold ${status === "engineering_review" ? "text-amber-800" : "text-[var(--foreground)]"}`}>{status === "engineering_review" ? "Engineering review" : approvedOverride ? "Generated + approved override" : "Generated / selected"}</td></tr>;
      })}{approvedProjectItems.map((item) => <tr key={item.id} className="border-b border-[var(--line)] bg-black/[0.01]"><td className="px-5 py-4"><p className="font-medium">{item.description}</p><p className="mt-2 text-xs font-semibold text-[var(--accent)]">Approved project-specific exception · {item.reason}</p></td><td className="px-5 py-4 text-[var(--muted)]">{item.category}</td><td className="px-5 py-4 tabular-nums"><strong>{item.requested_quantity} {item.unit}</strong></td><td className="px-5 py-4 text-[var(--muted)]">Approved exception overlay</td><td className="px-5 py-4 text-xs font-semibold">Project-specific / approved</td></tr>)}</tbody></table></div> : <p className="p-6 text-sm text-[var(--muted)]">No generated BOM is stored for this design revision yet. Compile the detailed engineering package before procurement.</p>}
    </RecordWorkspaceSection>

    {bom.length ? <BomExceptionLayer designId={id} bom={bom} exceptions={exceptions} events={events} /> : null}
  </RecordWorkspace>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p><p className="mt-2 text-lg font-semibold tabular-nums">{value}</p></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p><p className="mt-2 text-sm font-medium">{value}</p></div>; }
