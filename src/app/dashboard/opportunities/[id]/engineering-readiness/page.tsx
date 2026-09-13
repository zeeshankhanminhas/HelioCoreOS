"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadOpportunityEngineeringReadiness, startEngineeringFromOpportunity, updateOpportunityReadiness } from "@/lib/neon/opportunities";
import type { DesignObjective, LoadProfileSource, SystemType } from "@/lib/engineering/types";

type PageProps = { params: Promise<{ id: string }> };

type ReadinessRecord = {
  id: string;
  item_type: string;
  status: "requested" | "uploaded" | "accepted" | "rejected" | "waived";
  is_required: boolean;
  evidence_url?: string | null;
  review_note?: string | null;
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

const statusOptions: ReadinessRecord["status"][] = ["requested", "uploaded", "accepted", "rejected", "waived"];
const systemTypes: SystemType[] = ["on_grid", "off_grid", "hybrid"];
const loadSources: { value: LoadProfileSource; label: string }[] = [
  { value: "interval_data", label: "Interval data" },
  { value: "utility_bills", label: "Utility bills" },
  { value: "appliance_schedule", label: "Appliance schedule" },
  { value: "manual_summary", label: "Manual summary" },
];
const objectives: { value: DesignObjective; label: string }[] = [
  { value: "reduce_imports", label: "Reduce grid imports" },
  { value: "maximize_self_consumption", label: "Maximise self-consumption" },
  { value: "backup_resilience", label: "Backup resilience" },
  { value: "off_grid_autonomy", label: "Off-grid autonomy" },
  { value: "peak_shaving", label: "Peak shaving" },
  { value: "export_generation", label: "Export generation" },
];

export default function EngineeringReadinessPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [state, setState] = useState<Awaited<ReturnType<typeof loadOpportunityEngineeringReadiness>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [systemType, setSystemType] = useState<SystemType>("on_grid");
  const [loadProfileSource, setLoadProfileSource] = useState<LoadProfileSource>("interval_data");
  const [designObjective, setDesignObjective] = useState<DesignObjective>("maximize_self_consumption");
  const [autonomyHours, setAutonomyHours] = useState(24);
  const [exportLimitKw, setExportLimitKw] = useState(0);
  const [reserveSocPct, setReserveSocPct] = useState(20);

  async function refresh() {
    try {
      setError(null);
      setState(await loadOpportunityEngineeringReadiness(id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Readiness could not be loaded.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    loadOpportunityEngineeringReadiness(id)
      .then((nextState) => {
        if (!cancelled) setState(nextState);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Readiness could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const statusTone = useMemo(() => {
    if (!state) return "text-[var(--muted)]";
    if (state.assessment.state === "ready") return "text-emerald-700";
    if (state.assessment.state === "action_required") return "text-amber-700";
    return "text-red-700";
  }, [state]);

  async function setReadiness(item: ReadinessRecord, status: ReadinessRecord["status"]) {
    try {
      setSaving(item.item_type);
      setError(null);
      await updateOpportunityReadiness({
        opportunityId: id,
        itemType: item.item_type,
        status,
        evidenceUrl: item.evidence_url,
        reviewNote: item.review_note,
      });
      await refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Readiness could not be updated.");
    } finally {
      setSaving(null);
    }
  }

  async function startEngineering() {
    try {
      setStarting(true);
      setError(null);
      const loadProfileId = await startEngineeringFromOpportunity({
        opportunityId: id,
        systemType,
        loadProfileSource,
        designObjective,
        autonomyHours: systemType === "off_grid" ? autonomyHours : null,
        exportLimitKw: systemType === "on_grid" ? exportLimitKw : null,
        reserveSocPct: systemType === "hybrid" ? reserveSocPct : null,
      });
      if (loadProfileId) router.push(`/dashboard/engineering/load-profiles/${loadProfileId}`);
      else router.push(`/dashboard/engineering?opportunity=${id}`);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Engineering could not be started.");
    } finally {
      setStarting(false);
    }
  }

  if (!state && !error) return <div className="mx-auto max-w-[1200px] py-16 text-sm text-[var(--muted)]">Loading governed readiness…</div>;

  const opportunity = state?.opportunity;
  const assessment = state?.assessment;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <header className="flex flex-col gap-5 border-b border-[var(--line)] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Engineering entry gate</p>
          <h1 className="mt-2 text-4xl font-medium tracking-[-0.04em]">{opportunity?.title ?? "Opportunity readiness"}</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">{opportunity?.reference} · Customer → Site → Readiness → System Type → Load Profile</p>
        </div>
        <Link href={`/dashboard/opportunities/${id}`} className="w-fit border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Back to opportunity</Link>
      </header>

      {error ? <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

      {assessment ? (
        <section className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-4">
          <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Gate</p><p className={`mt-2 text-lg font-semibold ${statusTone}`}>{titleCase(assessment.state)}</p></div>
          <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Readiness</p><p className="mt-2 text-2xl font-medium">{assessment.score}%</p></div>
          <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Required evidence</p><p className="mt-2 text-2xl font-medium">{assessment.requiredComplete}/{assessment.requiredTotal}</p></div>
          <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Project</p><p className="mt-2 text-sm font-semibold text-[var(--muted)]">Still contract-gated</p></div>
        </section>
      ) : null}

      {assessment?.blockers.length ? (
        <section className="border border-amber-300 bg-amber-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-900">Blocking conditions</p>
          <ul className="mt-3 space-y-2 text-sm text-amber-950">{assessment.blockers.map((blocker) => <li key={blocker}>• {blocker}</li>)}</ul>
        </section>
      ) : null}

      <section className="border border-[var(--line)]">
        <div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Evidence</p><h2 className="mt-2 text-2xl font-medium">Opportunity engineering readiness</h2></div>
        <div className="divide-y divide-[var(--line)]">
          {(state?.readiness as ReadinessRecord[] | undefined)?.map((item) => (
            <div key={item.id} className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
              <div><p className="text-sm font-semibold">{titleCase(item.item_type)}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.is_required ? "Required for engineering entry" : "Optional evidence"}</p></div>
              <select disabled={saving === item.item_type} value={item.status} onChange={(event) => void setReadiness(item, event.target.value as ReadinessRecord["status"])} className="min-h-10 border border-[var(--line)] bg-[var(--background)] px-3 text-sm">
                {statusOptions.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
              </select>
            </div>
          ))}
        </div>
      </section>

      <section className={`border p-5 ${assessment?.readyForEngineering ? "border-emerald-300" : "border-[var(--line)] opacity-70"}`}>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Controlled handoff</p><h2 className="mt-2 text-2xl font-medium">Start preliminary engineering</h2><p className="mt-2 text-sm text-[var(--muted)]">Creates the governed Load Profile and Engineering Intake. It does not create a Project.</p></div>
          {state?.engineering ? <span className="text-xs font-semibold text-emerald-700">Engineering already started</span> : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="text-xs font-semibold">System type<select value={systemType} onChange={(event) => setSystemType(event.target.value as SystemType)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">{systemTypes.map((type) => <option key={type} value={type}>{titleCase(type)}</option>)}</select></label>
          <label className="text-xs font-semibold">Load evidence<select value={loadProfileSource} onChange={(event) => setLoadProfileSource(event.target.value as LoadProfileSource)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">{loadSources.map((source) => <option key={source.value} value={source.value}>{source.label}</option>)}</select></label>
          <label className="text-xs font-semibold">Design objective<select value={designObjective} onChange={(event) => setDesignObjective(event.target.value as DesignObjective)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">{objectives.map((objective) => <option key={objective.value} value={objective.value}>{objective.label}</option>)}</select></label>
          {systemType === "off_grid" ? <label className="text-xs font-semibold">Autonomy hours<input type="number" min={1} value={autonomyHours} onChange={(event) => setAutonomyHours(Number(event.target.value))} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label> : null}
          {systemType === "on_grid" ? <label className="text-xs font-semibold">Export limit kW<input type="number" min={0} value={exportLimitKw} onChange={(event) => setExportLimitKw(Number(event.target.value))} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label> : null}
          {systemType === "hybrid" ? <label className="text-xs font-semibold">Reserve SOC %<input type="number" min={0} max={100} value={reserveSocPct} onChange={(event) => setReserveSocPct(Number(event.target.value))} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label> : null}
        </div>

        <div className="mt-6 flex justify-end">
          {state?.engineering?.load_profile_id ? <Link href={`/dashboard/engineering/load-profiles/${state.engineering.load_profile_id}`} className="inline-flex min-h-11 items-center bg-[var(--foreground)] px-5 text-xs font-semibold text-white">Open Load Profile</Link> : <button disabled={!assessment?.readyForEngineering || starting} onClick={() => void startEngineering()} className="min-h-11 bg-[var(--foreground)] px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-[var(--line-strong)]">{starting ? "Starting engineering…" : "Create intake & open Load Profile"}</button>}
        </div>
      </section>
    </div>
  );
}
