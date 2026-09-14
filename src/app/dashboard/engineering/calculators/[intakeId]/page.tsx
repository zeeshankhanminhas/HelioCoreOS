import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCalculatorWorkspace } from "@/lib/neon/calculators";
import { systemTypeLabels } from "@/lib/engineering/design-rules";
import type { SystemType } from "@/lib/engineering/types";
import { approveCalculatorRevision, returnCalculatorRevision } from "../actions";
import { CalculatorWorkspace } from "./calculator-workspace";

type Props = {
  params: Promise<{ intakeId: string }>;
  searchParams: Promise<{ error?: string; saved?: string; authority?: string; approved?: string; returned?: string }>;
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

  const { intake, opportunity, site, load, revisions, reviewer } = workspace;
  const ready = load.status === "ready" && intake.status === "ready";
  const systemLabel = systemTypeLabels[intake.system_type as SystemType] ?? titleCase(intake.system_type);
  const latest = revisions[0] ?? null;
  const approved = latest?.status === "reviewed";
  const latestErrors = latest?.validation_snapshot.filter((item) => item.severity === "error").length ?? 0;
  const latestWarnings = latest?.validation_snapshot.filter((item) => item.severity === "warning").length ?? 0;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <section className="app-panel">
        <div className="app-toolbar flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="app-kicker">Engineering calculator · {opportunity.reference}</p>
            <h1 className="app-title mt-1">System sizing</h1>
            <p className="mt-1 text-[11px] text-[var(--muted)]">Browser calculations are previews. Saved revisions are recomputed by Python HelioCalc and require engineering review before downstream design.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/engineering/load-profiles/${load.id}`} className="inline-flex min-h-9 items-center border border-[var(--line-strong)] bg-white px-3 text-[11px] font-semibold hover:border-[var(--foreground)]">Load Profile</Link>
            <Link href="/dashboard/engineering/equipment" className={`inline-flex min-h-9 items-center border px-3 text-[11px] font-semibold ${approved ? "border-[var(--accent)] text-[var(--accent)]" : "pointer-events-none border-[var(--line)] text-[var(--muted)]"}`}>Equipment library</Link>
          </div>
        </div>
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["Opportunity", opportunity.reference],
            ["Site", site.postcode ? `${site.name} · ${site.postcode}` : site.name],
            ["System", systemLabel],
            ["Objective", titleCase(intake.design_objective)],
            ["Calculator gate", approved ? "Approved basis" : ready ? "Review required" : "Blocked"],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 bg-white px-4 py-3">
              <p className="app-kicker">{label}</p>
              <p className={`mt-1 truncate text-xs font-semibold ${label === "Calculator gate" && approved ? "text-emerald-700" : ""}`}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="app-panel grid gap-px bg-[var(--line)] sm:grid-cols-4">
        <div className="bg-white px-4 py-3"><p className="app-kicker">Preview authority</p><p className="mt-1 text-xs font-semibold text-[var(--muted)]">TypeScript · non-authoritative</p></div>
        <div className="bg-white px-4 py-3"><p className="app-kicker">Saved authority</p><p className="mt-1 text-xs font-semibold text-[var(--accent)]">Python HelioCalc</p></div>
        <div className="bg-white px-4 py-3"><p className="app-kicker">Engineering review</p><p className={`mt-1 text-xs font-semibold ${approved ? "text-emerald-700" : "text-amber-700"}`}>{approved ? "Approved" : latest ? "Pending" : "Awaiting revision"}</p></div>
        <div className="bg-white px-4 py-3"><p className="app-kicker">Latest governed revision</p><p className="mt-1 text-xs font-semibold">{latest ? `${latest.calculation_reference} · ${latest.engine_version}` : "Not issued yet"}</p></div>
      </section>

      {messages.error ? <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{messages.error}</div> : null}
      {messages.saved ? <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Authoritative sizing revision R{messages.saved} saved by {messages.authority ?? "HelioCalc"}. Engineering review is now required.</div> : null}
      {messages.approved ? <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Sizing basis approved. Equipment selection is now the next governed engineering stage.</div> : null}
      {messages.returned ? <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Revision returned. Record a new authoritative HelioCalc revision after addressing the review note.</div> : null}

      {!ready ? (
        <section className="app-panel border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h2 className="text-sm font-semibold">Engineering basis is not ready</h2>
          <p className="mt-1 text-xs leading-5">Both the Load Profile and Engineering Intake must be Ready before HelioCalc can issue a governed sizing revision.</p>
          <Link href={`/dashboard/engineering/load-profiles/${load.id}`} className="mt-3 inline-flex min-h-9 items-center border border-amber-500 px-3 text-[11px] font-semibold">Complete Load Profile</Link>
        </section>
      ) : approved ? (
        <section className="app-panel border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <p className="app-kicker">Approved sizing basis</p>
          <h2 className="mt-2 text-lg font-semibold">Calculator stage complete</h2>
          <p className="mt-2 max-w-3xl text-xs leading-5">{latest?.calculation_reference} is frozen as the approved preliminary sizing basis. A new calculation cannot silently supersede it; a governed amendment/reactivation is required before recalculation.</p>
          <Link href="/dashboard/engineering/equipment" className="mt-4 inline-flex min-h-10 items-center border border-emerald-600 px-4 text-xs font-semibold">Continue to Equipment selection</Link>
        </section>
      ) : (
        <CalculatorWorkspace
          intakeId={intake.id}
          opportunityId={opportunity.id}
          systemType={intake.system_type as SystemType}
          autonomyHours={intake.autonomy_hours == null ? null : Number(intake.autonomy_hours)}
          load={{ annualEnergyKwh: Number(load.annual_energy_kwh ?? 0), averageDailyEnergyKwh: Number(load.average_daily_energy_kwh ?? 0), peakDemandKw: Number(load.peak_demand_kw ?? 0), essentialPeakDemandKw: Number(load.essential_peak_demand_kw ?? 0) }}
        />
      )}

      {latest ? (
        <section className="app-panel">
          <div className="app-toolbar flex items-center justify-between gap-4 px-4">
            <div><p className="app-kicker">Authoritative result</p><p className="mt-0.5 text-sm font-semibold">Latest HelioCalc revision</p></div>
            <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${approved ? "text-emerald-700" : "text-[var(--accent)]"}`}>{approved ? "Approved" : latest.engine_version}</span>
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

      {latest && !approved ? (
        <section className="app-panel">
          <div className="app-toolbar flex items-center justify-between gap-4 px-4">
            <div><p className="app-kicker">Engineering review</p><p className="mt-0.5 text-sm font-semibold">Approve the latest authoritative sizing basis</p></div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{titleCase(reviewer.role)}</span>
          </div>
          {reviewer.canReview ? (
            <div className="grid gap-px bg-[var(--line)] lg:grid-cols-2">
              <form action={approveCalculatorRevision} className="bg-white p-5">
                <input type="hidden" name="engineering_intake_id" value={intake.id} />
                <input type="hidden" name="calculation_id" value={latest.id} />
                <p className="text-sm font-semibold">Approve sizing basis</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Confirms this HelioCalc revision as the governed preliminary basis for equipment selection and Detailed Design.</p>
                <textarea name="review_note" rows={3} placeholder="Optional approval note" className="mt-4 w-full border border-[var(--line-strong)] bg-white p-3 text-xs outline-none focus:border-[var(--accent)]" />
                <button disabled={latestErrors > 0} className="mt-3 min-h-10 border border-emerald-700 bg-emerald-700 px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Approve revision</button>
              </form>
              <form action={returnCalculatorRevision} className="bg-white p-5">
                <input type="hidden" name="engineering_intake_id" value={intake.id} />
                <input type="hidden" name="calculation_id" value={latest.id} />
                <p className="text-sm font-semibold">Return for revision</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">The revision remains immutable. The engineer must address the review note and issue a new authoritative HelioCalc revision.</p>
                <textarea required minLength={8} name="review_note" rows={3} placeholder="Required review note" className="mt-4 w-full border border-[var(--line-strong)] bg-white p-3 text-xs outline-none focus:border-[var(--accent)]" />
                <button className="mt-3 min-h-10 border border-[var(--foreground)] px-4 text-xs font-semibold">Return for new revision</button>
              </form>
            </div>
          ) : <div className="px-5 py-6 text-sm text-[var(--muted)]">Owner, Admin or Manager approval is required before this sizing basis can progress to Equipment selection.</div>}
        </section>
      ) : null}

      <section className="app-panel">
        <div className="app-toolbar flex items-center justify-between gap-4 px-4">
          <div><p className="app-kicker">Revision control</p><p className="mt-0.5 text-sm font-semibold">Immutable sizing history</p></div>
          <span className="text-[10px] tabular-nums text-[var(--muted)]">{revisions.length} revisions</span>
        </div>
        {revisions.length ? (
          <div className="overflow-x-auto"><div className="min-w-[1060px]">
            <div className="grid grid-cols-[minmax(200px,1.35fr)_60px_110px_120px_120px_120px_100px_140px] border-b border-[var(--line)] bg-[var(--surface-subtle)] px-4 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]"><span>Reference / Engine</span><span>Rev</span><span>Status</span><span>PV</span><span>Inverter</span><span>BESS</span><span>Checks</span><span className="text-right">Saved</span></div>
            <div className="divide-y divide-[var(--line)]">
              {revisions.map((revision) => {
                const errors = revision.validation_snapshot.filter((item) => item.severity === "error").length;
                const warnings = revision.validation_snapshot.filter((item) => item.severity === "warning").length;
                return <article key={revision.id} className="grid grid-cols-[minmax(200px,1.35fr)_60px_110px_120px_120px_120px_100px_140px] items-center bg-white px-4 py-3 text-xs">
                  <div className="min-w-0"><p className="truncate font-semibold">{revision.calculation_reference}</p><p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">{revision.engine_version} · authoritative</p></div>
                  <p>R{revision.revision}</p><p className={revision.status === "reviewed" ? "font-semibold text-emerald-700" : "text-amber-700"}>{revision.status === "reviewed" ? "Approved" : "Draft"}</p>
                  <p className="tabular-nums">{resultNumber(revision.result_snapshot.recommendedPvKwp, 2, "kWp")}</p><p className="tabular-nums">{resultNumber(revision.result_snapshot.recommendedInverterAcKw, 2, "kW")}</p><p className="tabular-nums">{resultNumber(revision.result_snapshot.batteryNominalKwh, 1, "kWh")}</p><p className="tabular-nums">{errors ? `${errors} error` : warnings ? `${warnings} warn` : "Pass"}</p><p className="text-right tabular-nums text-[var(--muted)]">{date.format(new Date(revision.created_at))}</p>
                </article>;
              })}
            </div>
          </div></div>
        ) : <div className="px-4 py-8 text-sm text-[var(--muted)]">No authoritative sizing revisions yet.</div>}
      </section>
    </div>
  );
}
