"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startEngineeringFromOpportunity } from "@/lib/neon/opportunities";
import { systemTypeDescriptions, systemTypeLabels, validateEngineeringIntake } from "@/lib/engineering/design-rules";
import type { DesignObjective, EngineeringIntake, LoadProfileSource, SystemType } from "@/lib/engineering/types";

type OpportunityOption = { id: string; reference: string; title: string; siteLabel: string };
type Props = { opportunities: OpportunityOption[]; initialOpportunityId?: string };
const systemTypes: SystemType[] = ["on_grid", "off_grid", "hybrid"];
const loadSources: { value: LoadProfileSource; label: string; detail: string }[] = [
  { value: "interval_data", label: "Interval data", detail: "15, 30 or 60 minute demand data" },
  { value: "utility_bills", label: "Utility bills", detail: "Monthly energy history" },
  { value: "appliance_schedule", label: "Appliance schedule", detail: "Bottom-up timed demand" },
  { value: "manual_summary", label: "Manual summary", detail: "Early-stage demand estimate" },
];
const objectives: { value: DesignObjective; label: string }[] = [
  { value: "reduce_imports", label: "Reduce grid imports" }, { value: "maximize_self_consumption", label: "Maximise self-consumption" }, { value: "backup_resilience", label: "Backup resilience" }, { value: "off_grid_autonomy", label: "Off-grid autonomy" }, { value: "peak_shaving", label: "Peak shaving" }, { value: "export_generation", label: "Export generation" },
];
const fieldClass = "mt-1.5 min-h-10 w-full border border-[var(--line-strong)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]";

export function DesignIntake({ opportunities, initialOpportunityId }: Props) {
  const router = useRouter();
  const initialId = opportunities.some((item) => item.id === initialOpportunityId) ? initialOpportunityId! : opportunities[0]?.id ?? "";
  const [opportunityId, setOpportunityId] = useState(initialId);
  const [systemType, setSystemType] = useState<SystemType>("on_grid");
  const [loadProfileSource, setLoadProfileSource] = useState<LoadProfileSource>("interval_data");
  const [objective, setObjective] = useState<DesignObjective>("maximize_self_consumption");
  const [autonomyHours, setAutonomyHours] = useState<number | undefined>();
  const [exportLimitKw, setExportLimitKw] = useState<number | undefined>();
  const [reserveSocPct, setReserveSocPct] = useState<number | undefined>(20);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intake: EngineeringIntake = { systemType, loadProfileSource, objective, autonomyHours, exportLimitKw, reserveSocPct };
  const validations = validateEngineeringIntake(intake);
  const blocking = !opportunityId || validations.some((item) => item.severity === "error") || submitting;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSubmitting(true); setError(null);
      const loadProfileId = await startEngineeringFromOpportunity({ opportunityId, systemType, loadProfileSource, designObjective: objective, autonomyHours: systemType === "off_grid" ? autonomyHours ?? null : null, exportLimitKw: systemType === "on_grid" ? exportLimitKw ?? null : null, reserveSocPct: systemType === "hybrid" ? reserveSocPct ?? null : null });
      if (!loadProfileId) throw new Error("Engineering intake was created without a Load Profile.");
      router.push(`/dashboard/engineering/load-profiles/${loadProfileId}`);
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Engineering intake could not be created."); }
    finally { setSubmitting(false); }
  }

  return <form onSubmit={submit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
    <section className="app-panel overflow-hidden">
      <div className="app-toolbar px-4"><p className="app-kicker">New engineering intake · Neon</p><p className="mt-0.5 text-xs text-[var(--muted)]">Opportunity readiness → governed Load Profile</p></div>
      <div className="divide-y divide-[var(--line)]">
        <div className="grid gap-4 p-4 lg:grid-cols-[180px_minmax(0,1fr)]"><div><p className="text-xs font-semibold">01 · Context</p><p className="mt-1 text-[11px] text-[var(--muted)]">Only readiness-approved Opportunities are available.</p></div><label className="text-[11px] font-semibold text-[var(--muted)]">Opportunity + Site<select value={opportunityId} onChange={(e) => setOpportunityId(e.target.value)} className={fieldClass}>{opportunities.map((o) => <option key={o.id} value={o.id}>{o.reference} · {o.title} · {o.siteLabel}</option>)}</select></label></div>
        <div className="grid gap-4 p-4 lg:grid-cols-[180px_minmax(0,1fr)]"><div><p className="text-xs font-semibold">02 · System type</p></div><div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">{systemTypes.map((type) => <button key={type} type="button" onClick={() => setSystemType(type)} className={`min-h-24 bg-white p-3 text-left ${systemType === type ? "outline outline-2 outline-inset outline-[var(--accent)]" : ""}`}><span className="text-xs font-semibold">{systemTypeLabels[type]}</span><p className="mt-2 text-[10px] text-[var(--muted)]">{systemTypeDescriptions[type]}</p></button>)}</div></div>
        <div className="grid gap-4 p-4 lg:grid-cols-[180px_minmax(0,1fr)]"><div><p className="text-xs font-semibold">03 · Load evidence</p></div><div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">{loadSources.map((source) => <label key={source.value} className={`cursor-pointer bg-white p-3 ${loadProfileSource === source.value ? "outline outline-2 outline-inset outline-[var(--accent)]" : ""}`}><input type="radio" className="mr-2" checked={loadProfileSource === source.value} onChange={() => setLoadProfileSource(source.value)} /><span className="text-xs font-semibold">{source.label}</span><p className="mt-1 text-[10px] text-[var(--muted)]">{source.detail}</p></label>)}</div></div>
        <div className="grid gap-4 p-4 lg:grid-cols-[180px_minmax(0,1fr)]"><div><p className="text-xs font-semibold">04 · Sizing intent</p></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-[11px] font-semibold text-[var(--muted)] sm:col-span-2">Primary objective<select value={objective} onChange={(e) => setObjective(e.target.value as DesignObjective)} className={fieldClass}>{objectives.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>{systemType === "on_grid" ? <label className="text-[11px] font-semibold">Export limit kW<input type="number" min="0" step="0.1" value={exportLimitKw ?? ""} onChange={(e) => setExportLimitKw(e.target.value ? Number(e.target.value) : undefined)} className={fieldClass} /></label> : null}{systemType === "off_grid" ? <label className="text-[11px] font-semibold">Autonomy hours<input type="number" min="1" value={autonomyHours ?? ""} onChange={(e) => setAutonomyHours(e.target.value ? Number(e.target.value) : undefined)} className={fieldClass} /></label> : null}{systemType === "hybrid" ? <label className="text-[11px] font-semibold">Reserve SOC %<input type="number" min="0" max="100" value={reserveSocPct ?? ""} onChange={(e) => setReserveSocPct(e.target.value ? Number(e.target.value) : undefined)} className={fieldClass} /></label> : null}</div></div>
      </div>
    </section>
    <aside className="space-y-4"><section className="app-panel"><div className="app-toolbar px-4"><p className="app-kicker">Engineering gate</p></div><div className="space-y-2 p-3">{validations.map((v) => <div key={v.code} className={`border px-3 py-2.5 ${v.severity === "error" ? "border-red-200 bg-red-50" : v.severity === "warning" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}><p className="text-xs font-semibold">{v.title}</p><p className="mt-1 text-[10px] opacity-80">{v.detail}</p></div>)}{error ? <div className="border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</div> : null}</div><div className="border-t border-[var(--line)] p-3"><button type="submit" disabled={blocking} className="min-h-10 w-full bg-[var(--foreground)] px-4 text-xs font-semibold text-white disabled:bg-[var(--line-strong)]">{submitting ? "Creating…" : "Create intake & open Load Profile"}</button></div></section><section className="app-panel p-4"><p className="app-kicker">Boundary</p><p className="mt-3 text-xs leading-5 text-[var(--muted)]">Load Profile → Calculator → Equipment → Detailed Design. Project creation remains locked until contract acceptance.</p></section></aside>
  </form>;
}
