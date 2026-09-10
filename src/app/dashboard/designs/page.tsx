import { createClient } from "@/lib/supabase/server";
import { DesignRegister, type DesignRegisterRow } from "./design-register";

function relationName(value: unknown, fallback: string) {
  if (!value) return fallback;
  if (Array.isArray(value)) return relationName(value[0], fallback);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.title ?? record.name ?? record.reference ?? fallback);
  }
  return fallback;
}

function relationField(value: unknown, key: string): string | null {
  const item = Array.isArray(value) ? value[0] : value;
  if (!item || typeof item !== "object") return null;
  const field = (item as Record<string, unknown>)[key];
  return field == null ? null : String(field);
}

export default async function DesignsPage() {
  const supabase = await createClient();
  const { data: designs, error } = await supabase
    .from("system_designs")
    .select("id,design_reference,revision,status,array_capacity_kwp,inverter_capacity_kw,battery_capacity_kwh,calculator_revision_id,updated_at,opportunities(title,reference),sites(name,postcode),engineering_calculations(revision)")
    .order("updated_at", { ascending: false });

  const rows: DesignRegisterRow[] = (designs ?? []).map((design) => {
    const calcRevision = relationField(design.engineering_calculations, "revision");
    const siteName = relationName(design.sites, "Site");
    const sitePostcode = relationField(design.sites, "postcode");
    return {
      id: design.id,
      reference: design.design_reference,
      revision: design.revision,
      status: design.status,
      opportunity: relationName(design.opportunities, "Opportunity"),
      site: `${siteName}${sitePostcode ? ` · ${sitePostcode}` : ""}`,
      arrayKwp: design.array_capacity_kwp == null ? null : Number(design.array_capacity_kwp),
      inverterKw: design.inverter_capacity_kw == null ? null : Number(design.inverter_capacity_kw),
      batteryKwh: design.battery_capacity_kwh == null ? null : Number(design.battery_capacity_kwh),
      calculatorRevision: calcRevision ? `Calculator R${calcRevision}` : design.calculator_revision_id ? "Calculator linked" : "Manual basis",
      updatedAt: design.updated_at,
    };
  });

  return <div className="mx-auto max-w-[1600px]">
    <header className="border-b border-[var(--line)] pb-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Engineering</p>
      <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Designs</h1>
    </header>
    {error ? <p className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">Designs could not be loaded.</p> : null}
    <DesignRegister rows={rows} />
  </div>;
}
