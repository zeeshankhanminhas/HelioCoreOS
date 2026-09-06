import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { systemTypeLabels } from "@/lib/engineering/design-rules";
import type { SystemType } from "@/lib/engineering/types";
import { CalculatorWorkspace } from "./calculator-workspace";

type Props = {
  params: Promise<{ intakeId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default async function CalculatorPage({ params, searchParams }: Props) {
  const { intakeId } = await params;
  const messages = await searchParams;
  const supabase = await createClient();

  const { data: intake } = await supabase
    .from("engineering_intakes")
    .select("id,opportunity_id,site_id,load_profile_id,system_type,design_objective,status,autonomy_hours")
    .eq("id", intakeId)
    .maybeSingle();
  if (!intake?.load_profile_id) notFound();

  const [{ data: opportunity }, { data: site }, { data: load }, { data: revisions }] = await Promise.all([
    supabase.from("opportunities").select("id,reference,title").eq("id", intake.opportunity_id).maybeSingle(),
    supabase.from("sites").select("id,name,postcode").eq("id", intake.site_id).maybeSingle(),
    supabase.from("load_profiles").select("id,status,data_quality,annual_energy_kwh,average_daily_energy_kwh,peak_demand_kw,essential_peak_demand_kw").eq("id", intake.load_profile_id).maybeSingle(),
    supabase.from("engineering_calculations").select("id,calculation_reference,revision,status,engine_version,result_snapshot,created_at").eq("engineering_intake_id", intakeId).order("revision", { ascending: false }),
  ]);

  if (!opportunity || !site || !load) notFound();
  const ready = load.status === "ready";
  const systemLabel = systemTypeLabels[intake.system_type as SystemType] ?? titleCase(intake.system_type);

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <section className="app-panel">
        <div className="app-toolbar flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="app-kicker">Engineering calculator · {opportunity.reference}</p>
            <h1 className="app-title mt-1">System sizing</h1>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Size the requirement from the governed Load Profile before equipment selection.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/engineering/load-profiles/${load.id}`} className="inline-flex min-h-9 items-center border border-[var(--line-strong)] bg-white px-3 text-[11px] font-semibold hover:border-[var(--foreground)]">Load Profile</Link>
            <Link href="/dashboard/engineering/equipment" className="inline-flex min-h-9 items-center border border-[var(--line-strong)] bg-white px-3 text-[11px] font-semibold hover:border-[var(--foreground)]">Equipment library</Link>
          </div>
        </div>
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Opportunity", opportunity.reference],
            ["Site", site.postcode ? `${site.name} · ${site.postcode}` : site.name],
            ["System", systemLabel],
            ["Objective", titleCase(intake.design_objective)],
            ["Load Profile", ready ? `Ready · ${titleCase(load.data_quality ?? "governed")}` : titleCase(load.status)],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 bg-white px-4 py-3">
              <p className="app-kicker">{label}</p>
              <p className={`mt-1 truncate text-xs font-semibold ${label === "Load Profile" && ready ? "text-emerald-700" : ""}`}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="app-panel flex flex-col gap-2 px-4 py-2.5 text-[10px] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"><span className="h-2 w-2 bg-[var(--accent)]" /><span className="font-semibold">Current gate · Calculator</span><span className="text-[var(--muted)]">No product selected at this stage.</span></div>
        <div className="font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Equipment → Detailed design → SLD + BOM</div>
      </section>

      {messages.error ? <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{messages.error}</div> : null}
      {messages.saved ? <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Sizing revision saved through the governed calculator path.</div> : null}

      {!ready ? (
        <section className="app-panel border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h2 className="text-sm font-semibold">Load Profile is not ready</h2>
          <p className="mt-1 text-xs leading-5">Calculator access stays locked until the shared Load Profile is complete and marked Ready.</p>
          <Link href={`/dashboard/engineering/load-profiles/${load.id}`} className="mt-3 inline-flex min-h-9 items-center border border-amber-500 px-3 text-[11px] font-semibold">Complete Load Profile</Link>
        </section>
      ) : (
        <CalculatorWorkspace
          intakeId={intake.id}
          opportunityId={opportunity.id}
          systemType={intake.system_type as SystemType}
          autonomyHours={intake.autonomy_hours == null ? null : Number(intake.autonomy_hours)}
          load={{
            annualEnergyKwh: Number(load.annual_energy_kwh ?? 0),
            averageDailyEnergyKwh: Number(load.average_daily_energy_kwh ?? 0),
            peakDemandKw: Number(load.peak_demand_kw ?? 0),
            essentialPeakDemandKw: Number(load.essential_peak_demand_kw ?? 0),
          }}
        />
      )}

      <section className="app-panel">
        <div className="app-toolbar flex items-center justify-between gap-4 px-4">
          <div><p className="app-kicker">Revision control</p><p className="mt-0.5 text-sm font-semibold">Saved sizing history</p></div>
          <span className="text-[10px] tabular-nums text-[var(--muted)]">{revisions?.length ?? 0} revisions</span>
        </div>
        {revisions?.length ? (
          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[minmax(190px,1.3fr)_70px_120px_120px_120px_120px] border-b border-[var(--line)] bg-[var(--surface-subtle)] px-4 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                <span>Reference / Engine</span><span>Rev</span><span>PV</span><span>Inverter</span><span>BESS</span><span className="text-right">Saved</span>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {revisions.map((revision) => {
                  const result = revision.result_snapshot as { recommendedPvKwp?: number | null; recommendedInverterAcKw?: number | null; batteryNominalKwh?: number | null } | null;
                  return (
                    <article key={revision.id} className="grid grid-cols-[minmax(190px,1.3fr)_70px_120px_120px_120px_120px] items-center bg-white px-4 py-3 text-xs">
                      <div className="min-w-0"><p className="truncate font-semibold">{revision.calculation_reference}</p><p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">{revision.engine_version}</p></div>
                      <p>R{revision.revision}</p>
                      <p className="tabular-nums">{result?.recommendedPvKwp == null ? "—" : `${Number(result.recommendedPvKwp).toFixed(2)} kWp`}</p>
                      <p className="tabular-nums">{result?.recommendedInverterAcKw == null ? "—" : `${Number(result.recommendedInverterAcKw).toFixed(2)} kW`}</p>
                      <p className="tabular-nums">{result?.batteryNominalKwh == null ? "—" : `${Number(result.batteryNominalKwh).toFixed(1)} kWh`}</p>
                      <p className="text-right tabular-nums text-[var(--muted)]">{date.format(new Date(revision.created_at))}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        ) : <div className="px-4 py-8 text-sm text-[var(--muted)]">No saved sizing revisions yet.</div>}
      </section>
    </div>
  );
}
