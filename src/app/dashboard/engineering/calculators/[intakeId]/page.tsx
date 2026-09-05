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

const flow = [
  ["01", "Opportunity", "complete"],
  ["02", "Site", "complete"],
  ["03", "System type", "complete"],
  ["04", "Load Profile", "complete"],
  ["05", "Calculator", "active"],
  ["06", "Design", "locked"],
  ["07", "Proposal", "future"],
  ["08", "Contract", "future"],
  ["09", "Project", "future"],
] as const;

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

  return (
    <div className="mx-auto max-w-[1600px]">
      <header className="border-b border-[var(--line)] pb-6">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]"><Link href="/dashboard/engineering" className="hover:text-[var(--foreground)]">Engineering</Link><span>/</span><span>{opportunity.reference}</span><span>/</span><span>Calculator</span></div>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Engineering calculator · V1</p>
            <h1 className="mt-2 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Size the system before designing it</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">{opportunity.reference} · {site.name}{site.postcode ? ` · ${site.postcode}` : ""} · {systemTypeLabels[intake.system_type as SystemType] ?? intake.system_type}</p>
          </div>
          <Link href={`/dashboard/engineering/load-profiles/${load.id}`} className="w-fit border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Open Load Profile</Link>
        </div>
      </header>

      <section className="mt-5 overflow-x-auto border border-[var(--line)]">
        <div className="flex min-w-[1050px]">
          {flow.map(([number, label, state], index) => <div key={label} className={`min-w-[116px] flex-1 border-r border-[var(--line)] px-4 py-3 last:border-r-0 ${state === "active" ? "bg-white/45" : ""}`}><div className="flex items-center justify-between gap-2"><span className={`text-[10px] font-semibold ${state === "complete" || state === "active" ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>{number}</span><span className="text-[9px] uppercase tracking-[0.12em] text-[var(--muted)]">{state === "complete" ? "Done" : state === "active" ? "Now" : state === "locked" ? "Next" : index === 8 ? "After contract" : "Later"}</span></div><p className={`mt-2 text-xs font-semibold ${state === "future" ? "text-[var(--muted)]" : ""}`}>{label}</p></div>)}
        </div>
      </section>

      {messages.error ? <div className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{messages.error}</div> : null}
      {messages.saved ? <div className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Sizing revision saved. Detailed Design remains a separate downstream engineering stage.</div> : null}

      {!ready ? <section className="mt-7 border border-amber-300 bg-amber-50 p-6 text-amber-900"><h2 className="text-lg font-semibold">Load Profile is not ready</h2><p className="mt-2 text-sm leading-6">Calculator access is gated until the shared Load Profile is complete and marked Ready.</p><Link href={`/dashboard/engineering/load-profiles/${load.id}`} className="mt-4 inline-block border border-amber-500 px-4 py-2 text-xs font-semibold">Complete Load Profile</Link></section> : <div className="mt-7"><CalculatorWorkspace intakeId={intake.id} opportunityId={opportunity.id} systemType={intake.system_type as SystemType} autonomyHours={intake.autonomy_hours == null ? null : Number(intake.autonomy_hours)} load={{ annualEnergyKwh: Number(load.annual_energy_kwh ?? 0), averageDailyEnergyKwh: Number(load.average_daily_energy_kwh ?? 0), peakDemandKw: Number(load.peak_demand_kw ?? 0), essentialPeakDemandKw: Number(load.essential_peak_demand_kw ?? 0) }} /></div>}

      <section className="mt-8 border border-[var(--line)]">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] p-5 md:px-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Calculator register</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Saved sizing history</h2></div><span className="text-xs tabular-nums text-[var(--muted)]">{revisions?.length ?? 0} revisions</span></div>
        {revisions?.length ? <div className="divide-y divide-[var(--line)]">{revisions.map((revision) => {
          const result = revision.result_snapshot as { recommendedPvKwp?: number | null; recommendedInverterAcKw?: number | null; batteryNominalKwh?: number | null } | null;
          return <article key={revision.id} className="grid gap-3 p-5 md:grid-cols-[1fr_80px_130px_130px_130px_120px] md:items-center md:px-6"><div><p className="text-sm font-semibold">{revision.calculation_reference}</p><p className="mt-1 text-xs text-[var(--muted)]">{revision.engine_version}</p></div><p className="text-xs">Rev {revision.revision}</p><p className="text-xs tabular-nums">{result?.recommendedPvKwp == null ? "—" : `${Number(result.recommendedPvKwp).toFixed(2)} kWp`}</p><p className="text-xs tabular-nums">{result?.recommendedInverterAcKw == null ? "—" : `${Number(result.recommendedInverterAcKw).toFixed(2)} kW AC`}</p><p className="text-xs tabular-nums">{result?.batteryNominalKwh == null ? "No BESS" : `${Number(result.batteryNominalKwh).toFixed(1)} kWh`}</p><p className="text-xs tabular-nums text-[var(--muted)] md:text-right">{date.format(new Date(revision.created_at))}</p></article>;
        })}</div> : <div className="px-6 py-10 text-sm text-[var(--muted)]">No sizing revisions yet. Complete the Calculator assumptions and save the first sizing basis.</div>}
      </section>
    </div>
  );
}
