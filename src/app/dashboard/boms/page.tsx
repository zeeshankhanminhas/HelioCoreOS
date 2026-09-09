import { createClient } from "@/lib/supabase/server";
import { BomRegister, type BomRegisterRow } from "./bom-register";

function relationName(value: unknown, fallback: string) {
  if (!value) return fallback;
  if (Array.isArray(value)) return relationName(value[0], fallback);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.title ?? record.name ?? record.reference ?? fallback);
  }
  return fallback;
}

function relationField(value: unknown, field: string) {
  if (!value) return null;
  const item = Array.isArray(value) ? value[0] : value;
  if (item && typeof item === "object") return (item as Record<string, unknown>)[field] ?? null;
  return null;
}

export default async function BomsPage() {
  const supabase = await createClient();
  const { data: designs, error } = await supabase
    .from("system_designs")
    .select("id,design_reference,revision,status,bom_snapshot,updated_at,opportunities(title,reference),sites(name,postcode)")
    .order("updated_at", { ascending: false });

  const rows: BomRegisterRow[] = (designs ?? []).map((design) => {
    const lines = Array.isArray(design.bom_snapshot) ? design.bom_snapshot : [];
    const totalQuantity = lines.reduce((sum, line) => {
      if (!line || typeof line !== "object") return sum;
      const record = line as Record<string, unknown>;
      const qty = Number(record.quantity ?? record.qty ?? 0);
      return sum + (Number.isFinite(qty) ? qty : 0);
    }, 0);
    const siteName = relationName(design.sites, "Site");
    const postcode = relationField(design.sites, "postcode");
    return {
      id: design.id,
      designReference: design.design_reference,
      revision: design.revision,
      designStatus: design.status,
      opportunity: relationName(design.opportunities, "Opportunity"),
      site: `${siteName}${postcode ? ` · ${String(postcode)}` : ""}`,
      lineCount: lines.length,
      itemQuantity: totalQuantity,
      releaseState: design.status === "approved" && lines.length ? "Ready for procurement release" : design.status === "approved" ? "Approved design · BOM incomplete" : "Not released",
      updatedAt: design.updated_at,
    };
  });

  return <div className="mx-auto max-w-[1600px]">
    <header className="border-b border-[var(--line)] pb-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Engineering materials control</p>
      <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">BOM register</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">Bill-of-material snapshots generated from governed design revisions. Procurement should consume an approved design/BOM baseline rather than independent quantities.</p>
    </header>
    {error ? <p className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">BOM baselines could not be loaded. Refresh before commercial or procurement use.</p> : null}
    <BomRegister rows={rows} />
  </div>;
}
