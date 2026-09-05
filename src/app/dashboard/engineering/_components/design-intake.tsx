"use client";

import { useMemo, useState } from "react";
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
  { value: "interval_data", label: "Interval data", detail: "15, 30 or 60 minute demand data." },
  { value: "utility_bills", label: "Utility bills", detail: "Monthly energy history with governed assumptions." },
  { value: "appliance_schedule", label: "Appliance schedule", detail: "Bottom-up load schedule by appliance or process." },
  { value: "manual_summary", label: "Manual summary", detail: "Peak demand and energy estimate for early-stage sizing." },
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
  pass: "border-emerald-300 bg-emerald-50 text-emerald-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  error: "border-red-300 bg-red-50 text-red-900",
};

const lifecycle = [
  "Opportunity & Site",
  "System Type",
  "Load Profile",
  "Calculator",
  "Equipment Selection",
  "Detailed Design",
  "PVWatts Performance",
  "SLD + BOM",
  "Engineering Review",
  "Proposal / Contract",
  "Project / Delivery",
];

export function DesignIntake({ opportunities, initialOpportunityId }: Props) {
  const initialId = opportunities.some((item) => item.id === initialOpportunityId) ? initialOpportunityId! : opportunities[0]?.id ?? "";
  const [opportunityId, setOpportunityId] = useState(initialId);
  const [systemType, setSystemType] = useState<SystemType>("on_grid");
  const [loadProfileSource, setLoadProfileSource] = useState<LoadProfileSource>("interval_data");
  const [objective, setObjective] = useState<DesignObjective>("maximize_self_consumption");
  const [autonomyHours, setAutonomyHours] = useState<number | undefined>();
  const [exportLimitKw, setExportLimitKw] = useState<number | undefined>();
  const [reserveSocPct, setReserveSocPct] = useState<number | undefined>(20);

  const intake: EngineeringIntake = {
    systemType,
    loadProfileSource,
    objective,
    autonomyHours,
    exportLimitKw,
    reserveSocPct,
  };

  const validations = useMemo(
    () => validateEngineeringIntake(intake),
    [systemType, loadProfileSource, objective, autonomyHours, exportLimitKw, reserveSocPct],
  );
  const blocking = !opportunityId || validations.some((item) => item.severity === "error");

  return (
    <form action={createEngineeringIntake} className="grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <input type="hidden" name="system_type" value={systemType} />
      <input type="hidden" name="design_objective" value={objective} />

      <div className="space-y-7">
        <section className="border border-[var(--line)]">
          <div className="border-b border-[var(--line)] p-5 md:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">01 · Opportunity context</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Select the Opportunity and assigned Site</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Pre-contract engineering belongs to the Opportunity and Site. A Project is created only after the commercial contract is signed.</p>
            {opportunities.length ? (
              <label className="mt-5 block text-xs font-semibold">Opportunity
                <select name="opportunity_id" value={opportunityId} onChange={(event) => setOpportunityId(event.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">
                  {opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.reference} · {opportunity.title} · {opportunity.siteLabel}</option>)}
                </select>
              </label>
            ) : (
              <div className="mt-5 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">No Opportunity with an assigned Site is available yet.</div>
            )}
          </div>
        </section>

        <section className="border border-[var(--line)]">
          <div className="border-b border-[var(--line)] p-5 md:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">02 · System Type</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Choose the electrical architecture</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">On-grid, Off-grid and Hybrid share the same governed load foundation, then branch into different sizing rules.</p>
          </div>
          <div className="grid gap-px bg-[var(--line)] md:grid-cols-3">
            {systemTypes.map((type) => {
              const active = type === systemType;
              return (
                <button key={type} type="button" onClick={() => setSystemType(type)} className={`min-h-48 bg-[var(--background)] p-5 text-left transition-colors ${active ? "outline outline-2 outline-inset outline-[var(--accent)]" : "hover:bg-white/45"}`}>
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${active ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>{active ? "Selected" : "System Type"}</span>
                  <span className="mt-5 block text-xl font-medium">{systemTypeLabels[type]}</span>
                  <span className="mt-3 block text-sm leading-6 text-[var(--muted)]">{systemTypeDescriptions[type]}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="border border-[var(--line)]">
          <div className="border-b border-[var(--line)] p-5 md:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">03 · Load Profile</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Choose the demand evidence source</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Choose one source. The whole card is selectable and the selected evidence source is carried into the governed Load Profile workspace.</p>
          </div>
          <fieldset>
            <legend className="sr-only">Load Profile evidence source</legend>
            <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2">
              {loadSources.map((source, index) => {
                const active = source.value === loadProfileSource;
                return (
                  <label
                    key={source.value}
                    className={`relative min-h-32 cursor-pointer bg-[var(--background)] p-5 pr-14 text-left transition-colors focus-within:z-10 focus-within:outline focus-within:outline-2 focus-within:outline-[var(--accent)] ${active ? "z-10 outline outline-2 outline-inset outline-[var(--accent)]" : "hover:bg-white/45"}`}
                  >
                    <input
                      type="radio"
                      name="load_profile_source"
                      value={source.value}
                      checked={active}
                      onChange={() => setLoadProfileSource(source.value)}
                      className="absolute right-5 top-5 h-4 w-4 cursor-pointer accent-[var(--accent)]"
                    />
                    <span className={`block text-[10px] font-semibold uppercase tracking-[0.16em] ${active ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                      {String(index + 1).padStart(2, "0")} · {active ? "Selected" : "Evidence source"}
                    </span>
                    <span className="mt-4 block text-sm font-semibold">{source.label}</span>
                    <span className="mt-2 block max-w-sm text-xs leading-5 text-[var(--muted)]">{source.detail}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </section>

        <section className="border border-[var(--line)] p-5 md:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Sizing intent</p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Record the engineering objective</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">This is an intake parameter, not a separate lifecycle stage. It tells the Calculator what the proposed system is trying to achieve.</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="text-xs font-semibold md:col-span-2">Primary objective
              <select value={objective} onChange={(event) => setObjective(event.target.value as DesignObjective)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">
                {objectives.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>

            {systemType === "on_grid" ? (
              <label className="text-xs font-semibold">Export limit (kW)
                <input name="export_limit_kw" type="number" min="0" step="0.1" value={exportLimitKw ?? ""} onChange={(event) => setExportLimitKw(event.target.value === "" ? undefined : Number(event.target.value))} placeholder="Record if known" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" />
              </label>
            ) : null}

            {systemType === "off_grid" ? (
              <label className="text-xs font-semibold">Required autonomy (hours)
                <input name="autonomy_hours" type="number" min="0" step="1" value={autonomyHours ?? ""} onChange={(event) => setAutonomyHours(event.target.value === "" ? undefined : Number(event.target.value))} placeholder="e.g. 24" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" />
              </label>
            ) : null}

            {systemType === "hybrid" ? (
              <label className="text-xs font-semibold">Reserve SOC (%)
                <input name="reserve_soc_pct" type="number" min="0" max="100" step="1" value={reserveSocPct ?? ""} onChange={(event) => setReserveSocPct(event.target.value === "" ? undefined : Number(event.target.value))} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" />
              </label>
            ) : null}
          </div>
        </section>
      </div>

      <aside className="space-y-7">
        <section className="border border-[var(--line)]">
          <div className="border-b border-[var(--line)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Intake gate</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Ready to start Load Profile?</h2>
          </div>
          <div className="space-y-3 p-5">
            {!opportunityId ? <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"><p className="font-semibold">Opportunity required</p><p className="mt-2 text-xs leading-5 opacity-80">A Site-linked Opportunity is required before engineering data can be governed.</p></div> : null}
            {validations.map((validation) => (
              <div key={validation.code} className={`border px-4 py-3 ${statusClass[validation.severity]}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{validation.title}</p>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">{validation.severity}</span>
                </div>
                <p className="mt-2 text-xs leading-5 opacity-80">{validation.detail}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--line)] p-5">
            <button type="submit" disabled={blocking} className="min-h-11 w-full border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:border-[var(--line)] disabled:text-[var(--muted)] disabled:hover:bg-transparent">Create engineering intake</button>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Creates the governed Engineering Intake and linked draft Load Profile. Calculator comes only after the Load Profile passes its readiness gate.</p>
          </div>
        </section>

        <section className="border border-[var(--line)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Operating sequence</p>
          <ol className="mt-5 space-y-3 text-sm">
            {lifecycle.map((item, index) => (
              <li key={item} className="flex items-center gap-3 border-b border-[var(--line)] pb-3 last:border-0 last:pb-0">
                <span className="w-6 text-xs tabular-nums text-[var(--muted)]">{String(index + 1).padStart(2, "0")}</span>
                <span className={`font-medium ${item === "Project / Delivery" ? "text-[var(--muted)]" : ""}`}>{item}</span>
              </li>
            ))}
          </ol>
          <p className="mt-5 border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--muted)]">Project creation remains downstream of signed commercial contract. Engineering before that point stays attached to the Opportunity and Site.</p>
        </section>
      </aside>
    </form>
  );
}
