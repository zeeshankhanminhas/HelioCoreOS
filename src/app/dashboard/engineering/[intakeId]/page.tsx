import Link from "next/link";
import { notFound } from "next/navigation";
import {
  RecordHeader,
  RecordWorkspace,
  RecordWorkspaceNav,
  RecordWorkspaceSection,
} from "@/components/heliocore/record-workspace";
import { createClient } from "@/lib/neon/client";
import { systemTypeLabels } from "@/lib/engineering/design-rules";
import type { SystemType } from "@/lib/engineering/types";

type Props = { params: Promise<{ intakeId: string }> };
type JsonRecord = Record<string, unknown>;

function relation(value: unknown) {
  if (Array.isArray(value)) return relation(value[0]);
  return value && typeof value === "object" ? (value as JsonRecord) : null;
}

function titleCase(value: unknown) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function number(value: unknown, digits = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(digits) : "—";
}

function object(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function list(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is JsonRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    : [];
}

export default async function Engineering360Page({ params }: Props) {
  const { intakeId } = await params;
  const db = await createClient();

  const { data: intake } = await db
    .from("engineering_intakes")
    .select("id,opportunity_id,load_profile_id,system_type,design_objective,status,autonomy_hours,created_at,opportunities(id,reference,title,customer_id),sites(id,name,postcode),load_profiles(id,name,status,source,annual_energy_kwh,average_daily_energy_kwh,peak_demand_kw,essential_peak_demand_kw)")
    .eq("id", intakeId)
    .single();

  if (!intake) notFound();

  const [{ data: calculations }, { data: designs }] = await Promise.all([
    db
      .from("engineering_calculations")
      .select("id,revision,status,calculation_reference,engine_version,result_snapshot,validation_snapshot,created_at")
      .eq("engineering_intake_id", intakeId)
      .order("revision", { ascending: false }),
    db
      .from("system_designs")
      .select("id,design_reference,revision,status,array_capacity_kwp,inverter_capacity_kw,battery_capacity_kwh,module_manufacturer,module_model,module_quantity,module_rating_wp,inverter_manufacturer,inverter_model,battery_manufacturer,battery_model,sld_svg,bom_snapshot,performance_snapshot,engineering_calculation_id,created_at")
      .eq("opportunity_id", intake.opportunity_id)
      .order("created_at", { ascending: false }),
  ]);

  const opportunity = relation(intake.opportunities);
  const site = relation(intake.sites);
  const load = relation(intake.load_profiles);
  const latestCalculation = calculations?.[0] ?? null;
  const latestDesign = designs?.[0] ?? null;
  const result = object(latestCalculation?.result_snapshot);
  const validation = list(latestCalculation?.validation_snapshot);
  const bom = list(latestDesign?.bom_snapshot);
  const performance = object(latestDesign?.performance_snapshot);
  const blockingChecks = validation.filter((item) => String(item.severity) === "error").length;
  const warningChecks = validation.filter((item) => String(item.severity) === "warning").length;
  const bomReview = bom.filter((item) => String(item.status ?? "selected") === "engineering_review").length;
  const calculatorApproved = latestCalculation?.status === "reviewed";
  const designApproved = latestDesign?.status === "approved";
  const loadReady = load?.status === "ready";
  const systemLabel = systemTypeLabels[intake.system_type as SystemType] ?? titleCase(intake.system_type);

  const nav = [
    { label: "Overview", href: "#overview" },
    { label: "Load Profile", href: "#load-profile" },
    { label: "Calculator", href: "#calculator" },
    { label: "Equipment", href: "#equipment" },
    { label: "Design", href: "#design" },
    { label: "Performance", href: "#performance" },
    { label: "SLD", href: "#sld" },
    { label: "BOM", href: "#bom" },
    { label: "Engineering Review", href: "#engineering-review" },
  ];

  const reviewState = !loadReady
    ? "Load Profile required"
    : !latestCalculation
      ? "Calculator revision required"
      : !calculatorApproved
        ? "Calculator review required"
        : !latestDesign
          ? "Detailed Design required"
          : !designApproved
            ? "Design approval required"
            : bomReview
              ? "BOM engineering review required"
              : "Engineering package approved";

  return (
    <RecordWorkspace>
      <RecordHeader
        eyebrow="Engineering 360"
        title={String(opportunity?.reference ?? "Engineering record")}
        meta={<>{String(opportunity?.title ?? "Engineering case")} · {String(site?.name ?? "Site")}{site?.postcode ? ` · ${String(site.postcode)}` : ""} · {systemLabel} · {titleCase(intake.design_objective)}</>}
        actions={<><Link href="/dashboard/engineering" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Engineering workspace</Link>{opportunity?.id ? <Link href={`/dashboard/opportunities/${String(opportunity.id)}`} className="inline-flex min-h-10 items-center border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Opportunity</Link> : null}</>}
      />
      <RecordWorkspaceNav items={nav} ariaLabel="Engineering record navigation" />

      <RecordWorkspaceSection id="overview" eyebrow="Overview" title="Engineering basis and progression" description="One governed record for demand, sizing, equipment, detailed design, performance, SLD, BOM and final engineering review.">
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-6">
          <Metric label="System" value={systemLabel} />
          <Metric label="Intake" value={titleCase(intake.status)} />
          <Metric label="Load Profile" value={loadReady ? "Ready" : "Not ready"} tone={loadReady ? "good" : "warn"} />
          <Metric label="Calculator" value={calculatorApproved ? "Approved" : latestCalculation ? "Review required" : "Not issued"} tone={calculatorApproved ? "good" : "warn"} />
          <Metric label="Design" value={designApproved ? "Approved" : latestDesign ? titleCase(latestDesign.status) : "Not compiled"} tone={designApproved ? "good" : "warn"} />
          <Metric label="Engineering gate" value={reviewState} tone={reviewState === "Engineering package approved" ? "good" : "warn"} />
        </div>
      </RecordWorkspaceSection>

      <RecordWorkspaceSection id="load-profile" eyebrow="01 · Load Profile" title={String(load?.name ?? "Demand model")} description="Demand, operating schedule and consumption evidence define the sizing basis for every system type." action={load?.id ? <Link href={`/dashboard/engineering/load-profiles/${String(load.id)}`} className="inline-flex min-h-10 items-center border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Open Load Profile</Link> : null}>
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5">
          <Detail label="Status" value={loadReady ? "Engineering-ready" : "Requires completion"} />
          <Detail label="Annual demand" value={load?.annual_energy_kwh == null ? "—" : `${number(load.annual_energy_kwh, 0)} kWh`} />
          <Detail label="Average daily" value={load?.average_daily_energy_kwh == null ? "—" : `${number(load.average_daily_energy_kwh)} kWh`} />
          <Detail label="Peak demand" value={load?.peak_demand_kw == null ? "—" : `${number(load.peak_demand_kw)} kW`} />
          <Detail label="Essential peak" value={load?.essential_peak_demand_kw == null ? "—" : `${number(load.essential_peak_demand_kw)} kW`} />
        </div>
      </RecordWorkspaceSection>

      <RecordWorkspaceSection id="calculator" eyebrow="02 · Calculator" title="Authoritative system sizing" description="Saved revisions are recomputed by Python HelioCalc. Browser calculations remain previews only." action={<Link href={`/dashboard/engineering/calculators/${intakeId}`} className="inline-flex min-h-10 items-center border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Open Calculator</Link>}>
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-6">
          <Detail label="Revision" value={latestCalculation ? `R${latestCalculation.revision}` : "Not issued"} />
          <Detail label="Authority" value={latestCalculation?.engine_version ?? "Python HelioCalc"} />
          <Detail label="PV sizing" value={result.recommendedPvKwp == null ? "—" : `${number(result.recommendedPvKwp, 2)} kWp`} />
          <Detail label="Inverter" value={result.recommendedInverterAcKw == null ? "—" : `${number(result.recommendedInverterAcKw, 2)} kW`} />
          <Detail label="BESS" value={result.batteryNominalKwh == null ? "—" : `${number(result.batteryNominalKwh)} kWh`} />
          <Detail label="Validation" value={blockingChecks ? `${blockingChecks} blocking errors` : warningChecks ? `${warningChecks} warnings` : latestCalculation ? "Pass" : "Awaiting revision"} />
        </div>
      </RecordWorkspaceSection>

      <RecordWorkspaceSection id="equipment" eyebrow="03 · Equipment" title="Datasheet-governed equipment" description="Approved equipment must remain compatible with the sizing basis and becomes an input to detailed electrical design." action={<Link href="/dashboard/engineering/equipment" className="inline-flex min-h-10 items-center border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Equipment Library</Link>}>
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
          <Detail label="PV module" value={latestDesign ? [latestDesign.module_manufacturer, latestDesign.module_model].filter(Boolean).join(" ") || "Not selected" : "Awaiting Detailed Design"} />
          <Detail label="Module quantity" value={latestDesign?.module_quantity == null ? "—" : `${latestDesign.module_quantity} × ${latestDesign.module_rating_wp ?? "?"} W`} />
          <Detail label="Inverter / PCS" value={latestDesign ? [latestDesign.inverter_manufacturer, latestDesign.inverter_model].filter(Boolean).join(" ") || "Not selected" : "Awaiting Detailed Design"} />
          <Detail label="Battery" value={latestDesign ? [latestDesign.battery_manufacturer, latestDesign.battery_model].filter(Boolean).join(" ") || "Not applicable / not selected" : "Awaiting Detailed Design"} />
        </div>
      </RecordWorkspaceSection>

      <RecordWorkspaceSection id="design" eyebrow="04 · Design" title="Detailed engineering package" description="The design freezes selected equipment, array/inverter/BESS capacities and the compiled electrical basis." action={latestDesign ? <Link href={`/dashboard/designs/${latestDesign.id}`} className="inline-flex min-h-10 items-center border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Open Design {latestDesign.design_reference}</Link> : <Link href="/dashboard/designs" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Design register</Link>}>
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5">
          <Detail label="Design revision" value={latestDesign ? `${latestDesign.design_reference} · R${latestDesign.revision}` : "Not compiled"} />
          <Detail label="Status" value={latestDesign ? titleCase(latestDesign.status) : "Not started"} />
          <Detail label="PV array" value={latestDesign?.array_capacity_kwp == null ? "—" : `${number(latestDesign.array_capacity_kwp, 2)} kWp`} />
          <Detail label="Inverter" value={latestDesign?.inverter_capacity_kw == null ? "—" : `${number(latestDesign.inverter_capacity_kw, 2)} kW`} />
          <Detail label="BESS" value={latestDesign?.battery_capacity_kwh == null ? "—" : `${number(latestDesign.battery_capacity_kwh)} kWh`} />
        </div>
      </RecordWorkspaceSection>

      <RecordWorkspaceSection id="performance" eyebrow="05 · Performance" title="Yield and performance basis" description="Performance evidence is stored with the detailed design so proposal and review use the same governed engineering revision.">
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
          <Detail label="Performance model" value={Object.keys(performance).length ? "Available" : "Not generated"} />
          <Detail label="Annual energy" value={performance.annualEnergyKwh == null && performance.annual_energy_kwh == null ? "—" : `${number(performance.annualEnergyKwh ?? performance.annual_energy_kwh, 0)} kWh`} />
          <Detail label="Specific yield" value={performance.specificYieldKwhPerKwp == null && performance.specific_yield_kwh_per_kwp == null ? "—" : `${number(performance.specificYieldKwhPerKwp ?? performance.specific_yield_kwh_per_kwp, 0)} kWh/kWp`} />
          <Detail label="Basis" value={Object.keys(performance).length ? "Stored design performance snapshot" : "Run performance after Detailed Design"} />
        </div>
      </RecordWorkspaceSection>

      <RecordWorkspaceSection id="sld" eyebrow="06 · SLD" title="Single-line diagram" description="The SLD is generated from the same compiled electrical model as the BOM, reducing divergence between drawings and materials.">
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-3">
          <Detail label="SLD state" value={latestDesign?.sld_svg ? "Generated" : "Not generated"} />
          <Detail label="Design source" value={latestDesign ? latestDesign.design_reference : "No Detailed Design"} />
          <Detail label="Governance" value={latestDesign?.sld_svg ? "Bound to this design revision" : "Detailed Design required"} />
        </div>
      </RecordWorkspaceSection>

      <RecordWorkspaceSection id="bom" eyebrow="07 · BOM" title="Generated bill of materials" description="The baseline BOM is calculated from engineering logic, equipment selections and design routes. Controlled exceptions remain a separate audited overlay." action={latestDesign ? <Link href={`/dashboard/designs/${latestDesign.id}#bom`} className="inline-flex min-h-10 items-center border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Open governed BOM</Link> : <Link href="/dashboard/boms" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">BOM register</Link>}>
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
          <Detail label="Generated lines" value={String(bom.length)} />
          <Detail label="Engineering review lines" value={String(bomReview)} />
          <Detail label="Baseline" value={bom.length ? "HelioCalc / compiled design" : "Not generated"} />
          <Detail label="Procurement state" value={!designApproved ? "Design approval required" : !bom.length ? "BOM incomplete" : bomReview ? "Engineering review required" : "Ready for procurement"} />
        </div>
      </RecordWorkspaceSection>

      <RecordWorkspaceSection id="engineering-review" eyebrow="08 · Engineering Review" title="Final engineering gate" description="The package can move toward proposal and contract only when the demand basis, authoritative sizing, detailed design and generated BOM are governed and reviewable.">
        <div className="grid gap-px bg-[var(--line)] md:grid-cols-2 xl:grid-cols-5">
          <ReviewGate label="Load Profile" pass={Boolean(loadReady)} value={loadReady ? "Ready" : "Required"} />
          <ReviewGate label="Calculator" pass={Boolean(calculatorApproved)} value={calculatorApproved ? "Approved" : latestCalculation ? "Review required" : "Required"} />
          <ReviewGate label="Design" pass={Boolean(designApproved)} value={designApproved ? "Approved" : latestDesign ? titleCase(latestDesign.status) : "Required"} />
          <ReviewGate label="SLD + BOM" pass={Boolean(latestDesign?.sld_svg && bom.length && !bomReview)} value={latestDesign?.sld_svg && bom.length && !bomReview ? "Complete" : "Incomplete / review"} />
          <ReviewGate label="Engineering release" pass={reviewState === "Engineering package approved"} value={reviewState} />
        </div>
      </RecordWorkspaceSection>
    </RecordWorkspace>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  return <div className="bg-[var(--background)] p-5"><p className="app-kicker">{label}</p><p className={`mt-2 text-sm font-semibold ${tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-amber-800" : ""}`}>{value}</p></div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="bg-[var(--background)] p-5"><p className="app-kicker">{label}</p><p className="mt-2 text-sm font-medium">{value}</p></div>;
}

function ReviewGate({ label, pass, value }: { label: string; pass: boolean; value: string }) {
  return <div className="bg-[var(--background)] p-5"><p className="app-kicker">{label}</p><p className={`mt-2 text-sm font-semibold ${pass ? "text-emerald-700" : "text-amber-800"}`}>{value}</p></div>;
}
