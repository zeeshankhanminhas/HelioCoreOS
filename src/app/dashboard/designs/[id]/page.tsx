import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RecordHeader, RecordWorkspace, RecordWorkspaceSection } from "@/components/heliocore/record-workspace";

type BomLine = Record<string, unknown>;

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

const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: design } = await supabase
    .from("system_designs")
    .select("*,opportunities(id,title,reference),sites(id,name,postcode),engineering_calculations(id,revision,engine_version)")
    .eq("id", id)
    .single();
  if (!design) notFound();

  const opportunityId = field(design.opportunities, "id");
  const opportunityReference = field(design.opportunities, "reference");
  const postcode = field(design.sites, "postcode");
  const calcRevision = field(design.engineering_calculations, "revision");
  const calcEngine = field(design.engineering_calculations, "engine_version");
  const bom: BomLine[] = Array.isArray(design.bom_snapshot)
    ? design.bom_snapshot.filter((line: unknown): line is BomLine => Boolean(line) && typeof line === "object" && !Array.isArray(line))
    : [];
  const performance = design.performance_snapshot && typeof design.performance_snapshot === "object" ? design.performance_snapshot as Record<string, unknown> : {};
  const procurementState = design.status === "approved" && bom.length ? "Ready for procurement" : design.status === "approved" ? "BOM incomplete" : "Design approval required";

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
      <Metric label="BOM" value={`${bom.length} lines`} />
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

    <RecordWorkspaceSection eyebrow="Materials" title="BOM" description={procurementState}>
      {bom.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-collapse text-left text-sm"><thead className="border-b border-[var(--line)] bg-black/[0.015] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]"><tr><th className="px-5 py-3">Item</th><th className="px-5 py-3">Category</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Status / note</th></tr></thead><tbody>{bom.map((item: BomLine, index: number) => <tr key={index} className="border-b border-[var(--line)]"><td className="px-5 py-4 font-medium">{String(item.description ?? item.name ?? item.item ?? `BOM line ${index + 1}`)}</td><td className="px-5 py-4 text-[var(--muted)]">{String(item.category ?? item.type ?? "—")}</td><td className="px-5 py-4 tabular-nums">{String(item.quantity ?? item.qty ?? "—")}</td><td className="px-5 py-4 text-[var(--muted)]">{String(item.status ?? item.note ?? "—")}</td></tr>)}</tbody></table></div> : <p className="p-6 text-sm text-[var(--muted)]">No BOM generated.</p>}
    </RecordWorkspaceSection>
  </RecordWorkspace>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p><p className="mt-2 text-lg font-semibold tabular-nums">{value}</p></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p><p className="mt-2 text-sm font-medium">{value}</p></div>; }
