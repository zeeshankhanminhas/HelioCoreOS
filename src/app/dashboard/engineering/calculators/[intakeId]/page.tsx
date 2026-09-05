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
    <div className="mx-auto max-w-[1600px]">
      <header className="border-b border-[var(--line)] pb-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              <Link href="/dashboard/engineering" className="hover:text-[var(--foreground)]">Engineering</Link>
              <span>/</span>
              <span>{opportunity.reference}</span>
              <span>/</span>
              <span className="text-[var(--accent)]">Calculator</span>
            </div>
            <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] md:text-4xl">System sizing</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Establish the capacity requirement from the governed Load Profile before selecting equipment or compiling the detailed electrical design.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/engineering/load-profiles/${load.id}`} className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold hover:border-[var(--foreground)]">Open Load Profile</Link>
            <Link href="/dashboard/engineering/equipment" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]">Equipment Library</Link>
          </div>
        </div>
      </header>

      <section className="mt-5 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Opportunity", opportunity.reference],
          ["Site", site.postcode ? `${site.name} · ${site.postcode}` : site.name],
          ["System", systemLabel],
          ["Objective", titleCase(intake.design_objective)],
          ["Load Profile", ready ? `Ready · ${titleCase(load.data_quality ?? "governed")}` : titleCase(load.status)],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 bg-[var(--background)] px-4 py-4">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
            <p className={`mt-2 truncate text-xs font-semibold ${label === "Load Profile" && ready ? "text-emerald-700" : ""}`}>{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-3 flex flex-col gap-3 border-l-2 border-[var(--accent)] px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Current stage · Calculator</span>
          <span className="text-[var(--muted)]">Sizing only. No product is selected here.</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--muted)]">
          <span>Next</span><span aria-hidden="true">→</span><span>Equipment</span><span aria-hidden="true">→</span><span>Detailed Design</span><span aria-hidden="true">→</span><span>SLD + BOM</span>
        </div>
      </section>

      {messages.error ? <div className="mt-5 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{messages.error}</div> : null}
      {messages.saved ? <div className="mt-5 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Sizing revision saved through the governed calculator path. Equipment selection and Detailed Design remain downstream.</div> : null}

      {!ready ? (
        <section className="mt-6 border border-amber-300 bg-amber-50 p-6 text-amber-900">
          <h2 className="text-lg font-semibold">Load Profile is not ready</h2>
          <p className="mt-2 text-sm leading-6">Calculator access is gated until the shared Load Profile is complete and marked Ready.</p>
          <Link href={`/dashboard/engineering/load-profiles/${load.id}`} className="mt-4 inline-block border border-amber-500 px-4 py-2 text-xs font-semibold">Complete Load Profile</Link>
        </section>
      ) : (
        <div className="mt-6">
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
        </div>
      )}

      <section className="mt-7 border border-[var(--line)]">
        <div className="flex flex-col gap-3 border-b border-[var(--line)] p-5 sm:flex-row sm:items-end sm:justify-between md:px-6">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Revision control</p>
            <h2 className="mt-2 text-xl font-medium tracking-[-0.03em]">Saved sizing history</h2>
          </div>
          <span className="text-xs tabular-nums text-[var(--muted)]">{revisions?.length ?? 0} revisions</span>
        </div>
        {revisions?.length ? (
          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              <div className="grid grid-cols-[minmax(190px,1.3fr)_70px_120px_120px_120px_120px] border-b border-[var(--line)] px-5 py-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)] md:px-6">
                <span>Reference / Engine</span><span>Rev</span><span>PV</span><span>Inverter</span><span>BESS</span><span className="text-right">Saved</span>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {revisions.map((revision) => {
                  const result = revision.result_snapshot as { recommendedPvKwp?: number | null; recommendedInverterAcKw?: number | null; batteryNominalKwh?: number | null } | null;
                  return (
                    <article key={revision.id} className="grid grid-cols-[minmax(190px,1.3fr)_70px_120px_120px_120px_120px] items-center px-5 py-4 text-xs md:px-6">
                      <div className="min-w-0"><p className="truncate font-semibold">{revision.calculation_reference}</p><p className="mt-1 truncate text-[10px] text-[var(--muted)]">{revision.engine_version}</p></div>
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
        ) : (
          <div className="px-6 py-9 text-sm text-[var(--muted)]">No saved sizing revisions yet. Complete the assumptions and save the first governed sizing basis.</div>
        )}
      </section>
    </div>
  );
}
