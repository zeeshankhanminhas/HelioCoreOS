"use client";

import { useState } from "react";
import { createEngineeringIntake } from "../actions";
import { systemTypeDescriptions, systemTypeLabels, validateEngineeringIntake } from "@/lib/engineering/design-rules";
import type { DesignObjective, EngineeringIntake, LoadProfileSource, SystemType } from "@/lib/engineering/types";

type OpportunityOption = {
  id: string;
  reference: string;
  title: string;
  siteLabel: string;
};

type Props = {
  opportunities: OpportunityOption[];
  initialOpportunityId?: string;
};

const systemTypes: SystemType[] = ["on_grid", "off_grid", "hybrid"];
const loadSources: { value: LoadProfileSource; label: string; detail: string }[] = [
  { value: "interval_data", label: "Interval data", detail: "15, 30 or 60 minute demand data" },
  { value: "utility_bills", label: "Utility bills", detail: "Monthly energy history" },
  { value: "appliance_schedule", label: "Appliance schedule", detail: "Bottom-up timed demand" },
  { value: "manual_summary", label: "Manual summary", detail: "Early-stage demand estimate" },
];

const objectives: { value: DesignObjective; label: string }[] = [
  { value: "reduce_imports", label: "Reduce grid imports" },
  { value: "maximize_self_consumption", label: "Maximise self-consumption" },
  { value: "backup_resilience", label: "Backup resilience" },
  { value: "off_grid_autonomy", label: "Off-grid autonomy" },
  { value: "peak_shaving", label: "Peak shaving" },
  { value: "export_generation", label: "Export generation" },
];

const statusClass = {
  pass: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

const fieldClass = "mt-1.5 min-h-10 w-full border border-[var(--line-strong)] bg-white px-3 text-sm outline-none focus:border-[var(--accent)]";

export function DesignIntake({ opportunities, initialOpportunityId }: Props) {
  const initialId = opportunities.some((item) => item.id === initialOpportunityId) ? initialOpportunityId! : opportunities[0]?.id ?? "";
  const [opportunityId, setOpportunityId] = useState(initialId);
  const [systemType, setSystemType] = useState<SystemType>("on_grid");
  const [loadProfileSource, setLoadProfileSource] = useState<LoadProfileSource>("interval_data");
  const [objective, setObjective] = useState<DesignObjective>("maximize_self_consumption");
  const [autonomyHours, setAutonomyHours] = useState<number | undefined>();
  const [exportLimitKw, setExportLimitKw] = useState<number | undefined>();
  const [reserveSocPct, setReserveSocPct] = useState<number | undefined>(20);

  const intake: EngineeringIntake = { systemType, loadProfileSource, objective, autonomyHours, exportLimitKw, reserveSocPct };
  const validations = validateEngineeringIntake(intake);
  const blocking = !opportunityId || validations.some((item) => item.severity === "error");

  return (
    <form action={createEngineeringIntake} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
      <input type="hidden" name="system_type" value={systemType} />
      <input type="hidden" name="design_objective" value={objective} />

      <section className="app-panel overflow-hidden">
        <div className="app-toolbar flex items-center justify-between gap-4 px-4">
          <div>
            <p className="app-kicker">New engineering intake</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Create the governed pre-contract engineering basis</p>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Opportunity → Load Profile</span>
        </div>

        <div className="divide-y divide-[var(--line)]">
          <div className="grid gap-4 p-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
            <div>
              <p className="text-xs font-semibold">01 · Context</p>
              <p className="mt-1 text-[11px] leading-4 text-[var(--muted)]">Engineering stays attached to the Opportunity and Site.</p>
            </div>
            {opportunities.length ? (
              <label className="text-[11px] font-semibold text-[var(--muted)]">Opportunity + assigned site
                <select name="opportunity_id" value={opportunityId} onChange={(event) => setOpportunityId(event.target.value)} className={fieldClass}>
                  {opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.reference} · {opportunity.title} · {opportunity.siteLabel}</option>)}
                </select>
              </label>
            ) : <div className="border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">No Site-linked Opportunity is available.</div>}
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
            <div>
              <p className="text-xs font-semibold">02 · System architecture</p>
              <p className="mt-1 text-[11px] leading-4 text-[var(--muted)]">Shared load basis, different sizing rules.</p>
            </div>
            <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
              {systemTypes.map((type) => {
                const active = systemType === type;
                return (
                  <button key={type} type="button" onClick={() => setSystemType(type)} className={`min-h-24 bg-white p-3 text-left transition-colors ${active ? "relative z-10 outline outline-2 outline-inset outline-[var(--accent)]" : "hover:bg-[var(--surface-subtle)]"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold">{systemTypeLabels[type]}</span>
                      <span className={`h-2 w-2 border ${active ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--line-strong)]"}`} />
                    </div>
                    <p className="mt-2 text-[10px] leading-4 text-[var(--muted)]">{systemTypeDescriptions[type]}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
            <div>
              <p className="text-xs font-semibold">03 · Load evidence</p>
              <p className="mt-1 text-[11px] leading-4 text-[var(--muted)]">Choose the source used to build the governed demand model.</p>
            </div>
            <fieldset>
              <legend className="sr-only">Load Profile evidence source</legend>
              <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2">
                {loadSources.map((source) => {
                  const active = source.value === loadProfileSource;
                  return (
                    <label key={source.value} className={`relative cursor-pointer bg-white px-3 py-3 pr-10 ${active ? "z-10 outline outline-2 outline-inset outline-[var(--accent)]" : "hover:bg-[var(--surface-subtle)]"}`}>
                      <input type="radio" name="load_profile_source" value={source.value} checked={active} onChange={() => setLoadProfileSource(source.value)} className="absolute right-3 top-3 h-3.5 w-3.5 accent-[var(--accent)]" />
                      <span className="block text-xs font-semibold">{source.label}</span>
                      <span className="mt-1 block text-[10px] text-[var(--muted)]">{source.detail}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
            <div>
              <p className="text-xs font-semibold">04 · Sizing intent</p>
              <p className="mt-1 text-[11px] leading-4 text-[var(--muted)]">Defines what the preliminary Calculator should optimise for.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-[11px] font-semibold text-[var(--muted)] sm:col-span-2">Primary objective
                <select value={objective} onChange={(event) => setObjective(event.target.value as DesignObjective)} className={fieldClass}>
                  {objectives.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              {systemType === "on_grid" ? <label className="text-[11px] font-semibold text-[var(--muted)]">Export limit · kW<input name="export_limit_kw" type="number" min="0" step="0.1" value={exportLimitKw ?? ""} onChange={(event) => setExportLimitKw(event.target.value === "" ? undefined : Number(event.target.value))} placeholder="If known" className={fieldClass} /></label> : null}
              {systemType === "off_grid" ? <label className="text-[11px] font-semibold text-[var(--muted)]">Required autonomy · hours<input name="autonomy_hours" type="number" min="0" step="1" value={autonomyHours ?? ""} onChange={(event) => setAutonomyHours(event.target.value === "" ? undefined : Number(event.target.value))} placeholder="e.g. 24" className={fieldClass} /></label> : null}
              {systemType === "hybrid" ? <label className="text-[11px] font-semibold text-[var(--muted)]">Reserve SOC · %<input name="reserve_soc_pct" type="number" min="0" max="100" step="1" value={reserveSocPct ?? ""} onChange={(event) => setReserveSocPct(event.target.value === "" ? undefined : Number(event.target.value))} className={fieldClass} /></label> : null}
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="app-panel">
          <div className="app-toolbar flex items-center justify-between px-4">
            <p className="app-kicker">Readiness gate</p>
            <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${blocking ? "text-amber-700" : "text-emerald-700"}`}>{blocking ? "Action required" : "Ready"}</span>
          </div>
          <div className="space-y-2 p-3">
            {!opportunityId ? <div className="border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-900">A Site-linked Opportunity is required.</div> : null}
            {validations.map((validation) => <div key={validation.code} className={`border px-3 py-2.5 ${statusClass[validation.severity]}`}><div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold">{validation.title}</p><span className="text-[9px] font-bold uppercase tracking-[0.12em]">{validation.severity}</span></div><p className="mt-1 text-[10px] leading-4 opacity-80">{validation.detail}</p></div>)}
          </div>
          <div className="border-t border-[var(--line)] p-3">
            <button type="submit" disabled={blocking} className="min-h-10 w-full bg-[var(--foreground)] px-4 text-xs font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-[var(--line-strong)]">Create intake & open Load Profile</button>
          </div>
        </section>

        <section className="app-panel p-4">
          <p className="app-kicker">Controlled handoff</p>
          <div className="mt-3 space-y-2 text-xs">
            {["Load Profile", "Calculator", "Equipment selection", "Detailed design", "SLD + BOM", "Engineering review"].map((item, index) => <div key={item} className="flex items-center gap-3 border-b border-[var(--line)] pb-2 last:border-0 last:pb-0"><span className="w-5 text-[10px] tabular-nums text-[var(--muted)]">{String(index + 1).padStart(2, "0")}</span><span className="font-medium">{item}</span></div>)}
          </div>
          <p className="mt-3 border-t border-[var(--line)] pt-3 text-[10px] leading-4 text-[var(--muted)]">Proposal and Contract remain downstream. Project creation stays locked until the contract is signed.</p>
        </section>
      </aside>
    </form>
  );
}
