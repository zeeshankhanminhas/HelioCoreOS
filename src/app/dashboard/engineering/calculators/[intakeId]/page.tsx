import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCalculatorWorkspace } from "@/lib/neon/calculators";
import { systemTypeLabels } from "@/lib/engineering/design-rules";
import type { SystemType } from "@/lib/engineering/types";
import { CalculatorWorkspace } from "./calculator-workspace";

type Props = {
  params: Promise<{ intakeId: string }>;
  searchParams: Promise<{ error?: string; saved?: string; authority?: string }>;
};

const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function resultNumber(value: number | null | undefined, digits: number, unit: string) {
  return value == null ? "—" : `${Number(value).toFixed(digits)} ${unit}`;
}

export default async function CalculatorPage({ params, searchParams }: Props) {
  const { intakeId } = await params;
  const messages = await searchParams;

  let workspace: Awaited<ReturnType<typeof loadCalculatorWorkspace>>;
  try {
    workspace = await loadCalculatorWorkspace(intakeId);
  } catch {
    notFound();
  }

  const { intake, opportunity, site, load, revisions } = workspace;
  const ready = load.status === "ready" && intake.status === "ready";
  const systemLabel = systemTypeLabels[intake.system_type as SystemType] ?? titleCase(intake.system_type);
  const latest = revisions[0] ?? null;
  const latestErrors = latest?.validation_snapshot.filter((item) => item.severity === "error").length ?? 0;
  const latestWarnings = latest?.validation_snapshot.filter((item) => item.severity === "warning").length ?? 0;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <section className="app-panel">
        <div className="app-toolbar flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="app-kicker">Engineering calculator · {opportunity.reference}</p>
            <h1 className="app-title mt-1">System sizing</h1>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Browser calculations are previews. Saved revisions are always recomputed by Python HelioCalc against the governed Load Profile.</p>
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
            ["Engineering gate", ready ? "Ready for Calculator" : "Blocked"],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 bg-white px-4 py-3">
              <p className="app-kicker">{label}</p>
              <p className={`mt-1 truncate text-xs font-semibold ${label === "Engineering gate" && ready ? "text-emerald-700" : ""}`}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="app-panel grid gap-px bg-[var(--line)] sm:grid-cols-3">
        <div className="bg-white px-4 py-3">
          <p className="app-kicker">Preview authority</p>
          <p className="mt-1 text-xs font-semibold text-[var(--muted)]">TypeScript · non-authoritative</p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="app-kicker">Saved authority</p>
          <p className="mt-1 text-xs font-semibold text-[var(--accent)]">Python HelioCalc</p>
        </div>
        <div className="bg-white px-4 py-3">
          <p className="app-kicker">Latest governed revision</p>
          <p className="mt-1 text-xs font-semibold">{latest ? `${latest.calculation_reference} · ${latest.engine_version}` : "Not issued yet"}</p>
        </div>
      </section>

      {messages.error ? <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{messages.error}</div> : null}
      {messages.saved ? <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Authoritative sizing revision R{messages.saved} saved by {messages.authority ?? "HelioCalc"}.</div> : null}

      {!ready ? (
        <section className="app-panel border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h2 className="text-sm font-semibold">Engineering basis is not ready</h2>
          <p className="mt-1 text-xs leading-5">Both the Load Profile and Engineering Intake must be Ready before HelioCalc can issue a governed sizing revision.</p>
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

      {latest ? (
        <section className="app-panel">
          <div className="app-toolbar flex items-center justify-between gap-4 px-4">
            <div><p className="app-kicker">Authoritative result</p><p className="mt-0.5 text-sm font-semibold">Latest HelioCalc revision</p></div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">{latest.engine_version}</span>
          </div>
          <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5">
            <div className="bg-white p-4"><p className="app-kicker">PV</p><p className="mt-2 text-lg font-semibold tabular-nums">{resultNumber(latest.result_snapshot.recommendedPvKwp, 2, "kWp")}</p></div>
            <div className="bg-white p-4"><p className="app-kicker">Inverter</p><p className="mt-2 text-lg font-semibold tabular-nums">{resultNumber(latest.result_snapshot.recommendedInverterAcKw, 2, "kW")}</p></div>
            <div className="bg-white p-4"><p className="app-kicker">BESS</p><p className="mt-2 text-lg font-semibold tabular-nums">{resultNumber(latest.result_snapshot.batteryNominalKwh, 1, "kWh")}</p></div>
            <div className="bg-white p-4"><p className="app-kicker">Warnings</p><p className="mt-2 text-lg font-semibold tabular-nums">{latestWarnings}</p></div>
            <div className="bg-white p-4"><p className="app-kicker">Blocking errors</p><p className={`mt-2 text-lg font-semibold tabular-nums ${latestErrors ? "text-red-700" : "text-emerald-700"}`}>{latestErrors}</p></div>
          </div>
        </section>
      ) : null}

      <section className="app-panel">
        <div className="app-toolbar flex items-center justify-between gap-4 px-4">
          <div><p className="app-kicker">Revision control</p><p className="mt-0.5 text-sm font-semibold">Immutable sizing history</p></div>
          <span className="text-[10px] tabular-nums text-[var(--muted)]">{revisions.length} revisions</span>
        </div>
        {revisions.length ? (
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[minmax(200px,1.35fr)_60px_120px_120px_120px_100px_140px] border-b border-[var(--line)] bg-[var(--surface-subtle)] px-4 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                <span>Reference / Engine</span><span>Rev</span><span>PV</span><span>Inverter</span><span>BESS</span><span>Checks</span><span className="text-right">Saved</span>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {revisions.map((revision) => {
                  const errors = revision.validation_snapshot.filter((item) => item.severity === "error").length;
                  const warnings = revision.validation_snapshot.filter((item) => item.severity === "warning").length;
                  return (
                    <article key={revision.id} className="grid grid-cols-[minmax(200px,1.35fr)_60px_120px_120px_120px_100px_140px] items-center bg-white px-4 py-3 text-xs">
                      <div className="min-w-0"><p className="truncate font-semibold">{revision.calculation_reference}</p><p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">{revision.engine_version} · authoritative</p></div>
                      <p>R{revision.revision}</p>
                      <p className="tabular-nums">{resultNumber(revision.result_snapshot.recommendedPvKwp, 2, "kWp")}</p>
                      <p className="tabular-nums">{resultNumber(revision.result_snapshot.recommendedInverterAcKw, 2, "kW")}</p>
                      <p className="tabular-nums">{resultNumber(revision.result_snapshot.batteryNominalKwh, 1, "kWh")}</p>
                      <p className="tabular-nums">{errors ? `${errors} error` : warnings ? `${warnings} warn` : "Pass"}</p>
                      <p className="text-right tabular-nums text-[var(--muted)]">{date.format(new Date(revision.created_at))}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        ) : <div className="px-4 py-8 text-sm text-[var(--muted)]">No authoritative sizing revisions yet.</div>}
      </section>
    </div>
  );
}
