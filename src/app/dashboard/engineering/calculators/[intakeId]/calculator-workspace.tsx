"use client";

import { useMemo, useState } from "react";
import { calculateSystemSizing } from "@/lib/engineering/calculator";
import type { SystemType } from "@/lib/engineering/types";
import { saveCalculatorRevision } from "../actions";

type Props = {
  intakeId: string;
  opportunityId: string;
  systemType: SystemType;
  autonomyHours: number | null;
  load: {
    annualEnergyKwh: number;
    averageDailyEnergyKwh: number;
    peakDemandKw: number;
    essentialPeakDemandKw: number;
  };
};

const severityClass = {
  pass: "border-emerald-300 bg-emerald-50 text-emerald-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  error: "border-red-300 bg-red-50 text-red-900",
};

function numberValue(value: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-[var(--background)] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p><p className="mt-2 text-xl font-medium tabular-nums">{value}</p></div>;
}

export function CalculatorWorkspace({ intakeId, opportunityId, systemType, autonomyHours, load }: Props) {
  const [step, setStep] = useState<"assumptions" | "review">("assumptions");
  const [targetSolarContribution, setTargetSolarContribution] = useState("80");
  const [specificYield, setSpecificYield] = useState("");
  const [targetDcAcRatio, setTargetDcAcRatio] = useState("1.20");
  const [peakSunHours, setPeakSunHours] = useState("");
  const [systemEfficiency, setSystemEfficiency] = useState("80");
  const [batteryDod, setBatteryDod] = useState("90");
  const [inverterHeadroom, setInverterHeadroom] = useState("20");
  const [backupHours, setBackupHours] = useState("4");
  const [backupLoad, setBackupLoad] = useState(load.essentialPeakDemandKw > 0 ? String(load.essentialPeakDemandKw) : load.peakDemandKw > 0 ? String(load.peakDemandKw) : "");

  const result = useMemo(() => calculateSystemSizing({
    systemType,
    ...load,
    targetSolarContributionPct: numberValue(targetSolarContribution),
    specificYieldKwhPerKwpYear: numberValue(specificYield),
    targetDcAcRatio: numberValue(targetDcAcRatio),
    peakSunHoursPerDay: numberValue(peakSunHours),
    systemEfficiencyPct: numberValue(systemEfficiency),
    autonomyHours: autonomyHours ?? undefined,
    backupHours: numberValue(backupHours),
    backupLoadKw: numberValue(backupLoad),
    batteryDodPct: numberValue(batteryDod),
    inverterHeadroomPct: numberValue(inverterHeadroom),
  }), [systemType, load, targetSolarContribution, specificYield, targetDcAcRatio, peakSunHours, systemEfficiency, autonomyHours, backupHours, backupLoad, batteryDod, inverterHeadroom]);

  const blocked = result.validations.some((item) => item.severity === "error");

  return (
    <form action={saveCalculatorRevision} className="grid gap-7 xl:grid-cols-[220px_minmax(0,1fr)_340px]">
      <input type="hidden" name="engineering_intake_id" value={intakeId} />
      <input type="hidden" name="opportunity_id" value={opportunityId} />

      <nav className="h-fit border border-[var(--line)]">
        <div className="border-b border-[var(--line)] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Calculator flow</p></div>
        <button type="button" onClick={() => setStep("assumptions")} className={`flex w-full items-start gap-3 border-b border-[var(--line)] p-4 text-left ${step === "assumptions" ? "bg-white/40" : ""}`}>
          <span className="text-xs font-semibold text-[var(--accent)]">01</span><span><span className="block text-sm font-semibold">Sizing assumptions</span><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">Site resource and engineering targets.</span></span>
        </button>
        <button type="button" onClick={() => !blocked && setStep("review")} className={`flex w-full items-start gap-3 p-4 text-left ${step === "review" ? "bg-white/40" : ""} ${blocked ? "opacity-50" : ""}`}>
          <span className="text-xs font-semibold text-[var(--accent)]">02</span><span><span className="block text-sm font-semibold">Review sizing</span><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">PV, inverter and storage requirement.</span></span>
        </button>
      </nav>

      <div>
        {step === "assumptions" ? (
          <section className="border border-[var(--line)]">
            <div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Calculator · Assumptions</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Define the sizing basis</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">No equipment is selected here. These assumptions establish the capacity requirement that detailed Design will satisfy later.</p></div>
            <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
              {systemType !== "off_grid" ? <>
                <label className="text-xs font-semibold">Target annual solar contribution (%)<input required name="target_solar_contribution_pct" type="number" min="1" max="100" step="1" value={targetSolarContribution} onChange={(e) => setTargetSolarContribution(e.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
                <label className="text-xs font-semibold">Specific yield (kWh/kWp/year)<input required name="specific_yield_kwh_per_kwp_year" type="number" min="1" step="1" value={specificYield} onChange={(e) => setSpecificYield(e.target.value)} placeholder="Enter site-specific yield" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
                <label className="text-xs font-semibold">Preliminary DC/AC ratio<input required name="target_dc_ac_ratio" type="number" min="0.1" step="0.01" value={targetDcAcRatio} onChange={(e) => setTargetDcAcRatio(e.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
              </> : <>
                <label className="text-xs font-semibold">Peak sun hours / day<input required name="peak_sun_hours_per_day" type="number" min="0.1" step="0.1" value={peakSunHours} onChange={(e) => setPeakSunHours(e.target.value)} placeholder="Enter site design resource" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
                <label className="text-xs font-semibold">Overall system efficiency (%)<input required name="system_efficiency_pct" type="number" min="1" max="100" step="1" value={systemEfficiency} onChange={(e) => setSystemEfficiency(e.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
                <input type="hidden" name="autonomy_hours" value={autonomyHours ?? ""} />
              </>}

              <label className="text-xs font-semibold">Inverter headroom (%)<input required name="inverter_headroom_pct" type="number" min="0" max="100" step="1" value={inverterHeadroom} onChange={(e) => setInverterHeadroom(e.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>

              {systemType !== "on_grid" ? <label className="text-xs font-semibold">Battery design DoD (%)<input required name="battery_dod_pct" type="number" min="1" max="100" step="1" value={batteryDod} onChange={(e) => setBatteryDod(e.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label> : null}

              {systemType === "hybrid" ? <>
                <label className="text-xs font-semibold">Backup duration (hours)<input required name="backup_hours" type="number" min="0.1" step="0.5" value={backupHours} onChange={(e) => setBackupHours(e.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
                <label className="text-xs font-semibold">Backup load (kW)<input required name="backup_load_kw" type="number" min="0.1" step="0.1" value={backupLoad} onChange={(e) => setBackupLoad(e.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
              </> : null}
            </div>
            <div className="flex justify-end border-t border-[var(--line)] p-5 md:px-6"><button type="button" disabled={blocked} onClick={() => setStep("review")} className="min-h-11 border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)] disabled:border-[var(--line)] disabled:text-[var(--muted)]">Review sizing result</button></div>
          </section>
        ) : (
          <section className="border border-[var(--line)]">
            <div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Calculator · Review</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Preliminary system requirement</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">This is the sizing basis for Design. It is not an equipment schedule, string layout or final electrical design.</p></div>
            <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="Recommended PV" value={result.recommendedPvKwp == null ? "—" : `${result.recommendedPvKwp.toFixed(2)} kWp`} />
              <Metric label="Recommended inverter AC" value={result.recommendedInverterAcKw == null ? "—" : `${result.recommendedInverterAcKw.toFixed(2)} kW`} />
              <Metric label="Estimated annual PV" value={result.estimatedAnnualPvGenerationKwh == null ? "—" : `${Math.round(result.estimatedAnnualPvGenerationKwh).toLocaleString()} kWh`} />
              {systemType !== "on_grid" ? <>
                <Metric label="Battery usable" value={result.batteryUsableKwh == null ? "—" : `${result.batteryUsableKwh.toFixed(1)} kWh`} />
                <Metric label="Battery nominal" value={result.batteryNominalKwh == null ? "—" : `${result.batteryNominalKwh.toFixed(1)} kWh`} />
                <Metric label="Battery power" value={result.batteryPowerKw == null ? "—" : `${result.batteryPowerKw.toFixed(1)} kW`} />
              </> : null}
            </div>
            <div className="flex flex-col gap-3 border-t border-[var(--line)] p-5 sm:flex-row sm:justify-between md:px-6"><button type="button" onClick={() => setStep("assumptions")} className="min-h-11 border border-[var(--line)] px-5 text-xs font-semibold">Back to assumptions</button><button type="submit" disabled={blocked} className="min-h-11 border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)] disabled:border-[var(--line)] disabled:text-[var(--muted)]">Save sizing revision</button></div>
          </section>
        )}
      </div>

      <aside className="h-fit border border-[var(--line)]">
        <div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Governed load basis</p><h2 className="mt-2 text-xl font-medium">Load Profile</h2></div>
        <div className="grid grid-cols-2 gap-px bg-[var(--line)]"><Metric label="Annual" value={`${Math.round(load.annualEnergyKwh).toLocaleString()} kWh`} /><Metric label="Daily" value={`${load.averageDailyEnergyKwh.toFixed(1)} kWh`} /><Metric label="Peak" value={`${load.peakDemandKw.toFixed(1)} kW`} /><Metric label="Essential peak" value={`${load.essentialPeakDemandKw.toFixed(1)} kW`} /></div>
        <div className="space-y-3 border-t border-[var(--line)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Checks</p>
          {result.validations.map((check) => <div key={check.code} className={`border px-3 py-3 ${severityClass[check.severity]}`}><div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold">{check.title}</p><span className="text-[9px] font-semibold uppercase tracking-[0.14em]">{check.severity}</span></div><p className="mt-2 text-xs leading-5 opacity-80">{check.detail}</p></div>)}
        </div>
      </aside>
    </form>
  );
}
