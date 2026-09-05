"use client";

import { useMemo, useState } from "react";
import { systemTypeDescriptions, systemTypeLabels, validateEngineeringIntake } from "@/lib/engineering/design-rules";
import type { DesignObjective, EngineeringIntake, LoadProfileSource, SystemType } from "@/lib/engineering/types";

const systemTypes: SystemType[] = ["on_grid", "off_grid", "hybrid"];

const loadSources: { value: LoadProfileSource; label: string; detail: string }[] = [
  { value: "interval_data", label: "Interval data", detail: "15, 30 or 60 minute demand data." },
  { value: "utility_bills", label: "Utility bills", detail: "Monthly energy history with governed assumptions." },
  { value: "appliance_schedule", label: "Appliance schedule", detail: "Bottom-up load schedule by appliance or process." },
  { value: "manual_summary", label: "Manual summary", detail: "Peak demand and energy estimate for early-stage design." },
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

export function DesignIntake() {
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

  const validations = useMemo(() => validateEngineeringIntake(intake), [systemType, loadProfileSource, objective, autonomyHours, exportLimitKw, reserveSocPct]);
  const blocking = validations.some((item) => item.severity === "error");

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <div className="space-y-7">
        <section className="border border-[var(--line)]">
          <div className="border-b border-[var(--line)] p-5 md:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">01 · System architecture</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Choose the electrical system type</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">This choice changes the engineering rules, but the project, site and load profile remain shared core inputs.</p>
          </div>
          <div className="grid gap-px bg-[var(--line)] md:grid-cols-3">
            {systemTypes.map((type) => {
              const active = type === systemType;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSystemType(type)}
                  className={`min-h-48 bg-[var(--background)] p-5 text-left transition-colors ${active ? "outline outline-2 outline-inset outline-[var(--accent)]" : "hover:bg-white/45"}`}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${active ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>{active ? "Selected" : "System type"}</span>
                  <span className="mt-5 block text-xl font-medium">{systemTypeLabels[type]}</span>
                  <span className="mt-3 block text-sm leading-6 text-[var(--muted)]">{systemTypeDescriptions[type]}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="border border-[var(--line)]">
          <div className="border-b border-[var(--line)] p-5 md:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">02 · Shared load profile</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Define how demand enters the model</h2>
          </div>
          <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2">
            {loadSources.map((source) => {
              const active = source.value === loadProfileSource;
              return (
                <button key={source.value} type="button" onClick={() => setLoadProfileSource(source.value)} className={`bg-[var(--background)] p-5 text-left ${active ? "outline outline-2 outline-inset outline-[var(--accent)]" : "hover:bg-white/45"}`}>
                  <span className="text-sm font-semibold">{source.label}</span>
                  <span className="mt-2 block text-xs leading-5 text-[var(--muted)]">{source.detail}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="border border-[var(--line)] p-5 md:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">03 · Design objective</p>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <label className="text-xs font-semibold md:col-span-2">Primary objective
              <select value={objective} onChange={(event) => setObjective(event.target.value as DesignObjective)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">
                {objectives.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>

            {systemType === "on_grid" ? (
              <label className="text-xs font-semibold">Export limit (kW)
                <input type="number" min="0" step="0.1" value={exportLimitKw ?? ""} onChange={(event) => setExportLimitKw(event.target.value === "" ? undefined : Number(event.target.value))} placeholder="Record permitted export" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" />
              </label>
            ) : null}

            {systemType === "off_grid" ? (
              <label className="text-xs font-semibold">Required autonomy (hours)
                <input type="number" min="0" step="1" value={autonomyHours ?? ""} onChange={(event) => setAutonomyHours(event.target.value === "" ? undefined : Number(event.target.value))} placeholder="e.g. 24" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" />
              </label>
            ) : null}

            {systemType === "hybrid" ? (
              <label className="text-xs font-semibold">Reserve SOC (%)
                <input type="number" min="0" max="100" step="1" value={reserveSocPct ?? ""} onChange={(event) => setReserveSocPct(event.target.value === "" ? undefined : Number(event.target.value))} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" />
              </label>
            ) : null}
          </div>
        </section>
      </div>

      <aside className="space-y-7">
        <section className="border border-[var(--line)]">
          <div className="border-b border-[var(--line)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Engineering gate</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Intake readiness</h2>
          </div>
          <div className="space-y-3 p-5">
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
            <button type="button" disabled={blocking} className="min-h-11 w-full border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)] disabled:cursor-not-allowed disabled:border-[var(--line)] disabled:text-[var(--muted)]">Continue to load model</button>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Persistence and the load-data editor are the next implementation step. This gate already uses the shared engineering rule layer rather than UI-only logic.</p>
          </div>
        </section>

        <section className="border border-[var(--line)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Shared design spine</p>
          <ol className="mt-5 space-y-3 text-sm">
            {["Project & site", "System type", "Load profile", "Design objective", "Equipment selection", "Engineering calculations", "Validation", "BOM & costing"].map((item, index) => (
              <li key={item} className="flex items-center gap-3 border-b border-[var(--line)] pb-3 last:border-0 last:pb-0"><span className="w-6 text-xs tabular-nums text-[var(--muted)]">{String(index + 1).padStart(2, "0")}</span><span className="font-medium">{item}</span></li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}
