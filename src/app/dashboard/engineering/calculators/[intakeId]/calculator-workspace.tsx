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

type Step = "assumptions" | "review";

const severityClass = {
  pass: "border-emerald-300 bg-emerald-50/60 text-emerald-900",
  warning: "border-amber-300 bg-amber-50/60 text-amber-900",
  error: "border-red-300 bg-red-50/60 text-red-900",
};

function numberValue(value: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function displayNumber(value: number | null, digits = 1) {
  return value == null ? "—" : value.toFixed(digits);
}

function BasisMetric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="min-w-0 bg-[var(--background)] px-4 py-4 md:px-5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="truncate text-xl font-medium tabular-nums tracking-[-0.03em]">{value}</span>
        <span className="text-[10px] text-[var(--muted)]">{unit}</span>
      </div>
    </div>
  );
}

function ResultMetric({ label, value, unit, primary = false }: { label: string; value: string; unit: string; primary?: boolean }) {
  return (
    <div className={`bg-[var(--background)] p-5 ${primary ? "min-h-32" : "min-h-28"}`}>
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <div className="mt-5 flex items-baseline gap-2">
        <span className={`${primary ? "text-4xl" : "text-2xl"} font-medium tabular-nums tracking-[-0.045em]`}>{value}</span>
        <span className="text-xs text-[var(--muted)]">{unit}</span>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, suffix, step = "0.1", min = "0", max, placeholder, required = true, hint }: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  suffix: string;
  step?: string;
  min?: string;
  max?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="block border-b border-[var(--line)] py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-5">
        <div>
          <span className="block text-sm font-semibold">{label}</span>
          {hint ? <span className="mt-1 block max-w-md text-xs leading-5 text-[var(--muted)]">{hint}</span> : null}
        </div>
        <div className="flex w-[190px] shrink-0 items-stretch border border-[var(--line)] bg-[var(--background)] focus-within:border-[var(--foreground)]">
          <input
            required={required}
            name={name}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            className="min-h-11 min-w-0 flex-1 bg-transparent px-3 text-right text-sm tabular-nums outline-none"
          />
          <span className="flex min-w-12 items-center justify-center border-l border-[var(--line)] px-2 text-[10px] font-semibold text-[var(--muted)]">{suffix}</span>
        </div>
      </div>
    </label>
  );
}

export function CalculatorWorkspace({ intakeId, opportunityId, systemType, autonomyHours, load }: Props) {
  const [step, setStep] = useState<Step>("assumptions");
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

  const errors = result.validations.filter((item) => item.severity === "error");
  const warnings = result.validations.filter((item) => item.severity === "warning");
  const blocked = errors.length > 0;
  const calculationState = blocked ? "Incomplete basis" : warnings.length ? "Review required" : "Sizing ready";

  return (
    <form action={saveCalculatorRevision} className="space-y-5">
      <input type="hidden" name="engineering_intake_id" value={intakeId} />
      <input type="hidden" name="opportunity_id" value={opportunityId} />

      <section className="border border-[var(--line)]">
        <div className="flex flex-col gap-4 border-b border-[var(--line)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Governed engineering basis</p>
            <p className="mt-1 text-sm font-semibold">Load Profile inputs are locked for this sizing run</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.14em]">
            <span className="text-[var(--muted)]">Browser preview</span>
            <span aria-hidden="true" className="text-[var(--line)]">→</span>
            <span className="text-[var(--accent)]">HelioCalc on save</span>
          </div>
        </div>
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
          <BasisMetric label="Annual demand" value={Math.round(load.annualEnergyKwh).toLocaleString()} unit="kWh/yr" />
          <BasisMetric label="Average daily" value={load.averageDailyEnergyKwh.toFixed(1)} unit="kWh/day" />
          <BasisMetric label="Site peak" value={load.peakDemandKw.toFixed(1)} unit="kW" />
          <BasisMetric label="Essential peak" value={load.essentialPeakDemandKw.toFixed(1)} unit="kW" />
        </div>
      </section>

      <div className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-3">
        <div className="bg-[var(--background)] px-5 py-4">
          <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-semibold text-[var(--accent)]">01</span><span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Locked</span></div>
          <p className="mt-2 text-sm font-semibold">Load basis</p>
        </div>
        <button type="button" onClick={() => setStep("assumptions")} className={`bg-[var(--background)] px-5 py-4 text-left ${step === "assumptions" ? "outline outline-2 outline-inset outline-[var(--accent)]" : "hover:bg-white/35"}`}>
          <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-semibold text-[var(--accent)]">02</span><span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{step === "assumptions" ? "Now" : "Complete"}</span></div>
          <p className="mt-2 text-sm font-semibold">Sizing assumptions</p>
        </button>
        <button type="button" disabled={blocked} onClick={() => setStep("review")} className={`bg-[var(--background)] px-5 py-4 text-left disabled:cursor-not-allowed disabled:opacity-45 ${step === "review" ? "outline outline-2 outline-inset outline-[var(--accent)]" : "hover:bg-white/35"}`}>
          <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-semibold text-[var(--accent)]">03</span><span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{blocked ? "Locked" : step === "review" ? "Now" : "Next"}</span></div>
          <p className="mt-2 text-sm font-semibold">Sizing recommendation</p>
        </button>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(390px,0.85fr)]">
        <div className="border border-[var(--line)]">
          {step === "assumptions" ? (
            <>
              <div className="border-b border-[var(--line)] px-5 py-5 md:px-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Sizing assumptions</p>
                <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-medium tracking-[-0.035em]">Set the engineering targets</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">These values define the required capacity. Exact modules, inverters, batteries, strings and protection are selected later in Detailed Design.</p>
                  </div>
                  <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Equipment agnostic</p>
                </div>
              </div>

              <div className="p-5 md:p-6">
                <div className="border-b border-[var(--line)] pb-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">PV & inverter basis</p>
                </div>
                <div className="pt-4">
                  {systemType !== "off_grid" ? (
                    <>
                      <Field label="Target annual solar contribution" name="target_solar_contribution_pct" value={targetSolarContribution} onChange={setTargetSolarContribution} suffix="%" step="1" min="1" max="100" hint="Share of annual site demand the preliminary PV system should target." />
                      <Field label="Specific yield" name="specific_yield_kwh_per_kwp_year" value={specificYield} onChange={setSpecificYield} suffix="kWh/kWp" step="1" min="1" placeholder="e.g. 1550" hint="Temporary site-resource input until PVWatts is the live performance source." />
                      <Field label="Target DC / AC ratio" name="target_dc_ac_ratio" value={targetDcAcRatio} onChange={setTargetDcAcRatio} suffix="ratio" step="0.01" min="0.1" hint="Preliminary relationship between PV array DC capacity and inverter AC capacity." />
                    </>
                  ) : (
                    <>
                      <Field label="Peak sun hours" name="peak_sun_hours_per_day" value={peakSunHours} onChange={setPeakSunHours} suffix="h/day" step="0.1" min="0.1" placeholder="e.g. 5.2" hint="Design resource assumption for the first off-grid sizing pass." />
                      <Field label="Overall system efficiency" name="system_efficiency_pct" value={systemEfficiency} onChange={setSystemEfficiency} suffix="%" step="1" min="1" max="100" hint="Combined preliminary allowance for conversion and system losses." />
                      <input type="hidden" name="autonomy_hours" value={autonomyHours ?? ""} />
                    </>
                  )}
                  <Field label="Inverter headroom" name="inverter_headroom_pct" value={inverterHeadroom} onChange={setInverterHeadroom} suffix="%" step="1" min="0" max="100" hint="Capacity margin applied above the governed peak or backup load." />
                </div>

                {systemType !== "on_grid" ? (
                  <div className="mt-7 border-t border-[var(--line)] pt-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Storage basis</p>
                    <div className="pt-4">
                      <Field label="Battery design DoD" name="battery_dod_pct" value={batteryDod} onChange={setBatteryDod} suffix="%" step="1" min="1" max="100" hint="Preliminary usable-depth assumption before a battery product is selected." />
                      {systemType === "hybrid" ? (
                        <>
                          <Field label="Required backup duration" name="backup_hours" value={backupHours} onChange={setBackupHours} suffix="hours" step="0.5" min="0.1" hint="How long the defined backup load should remain supported." />
                          <Field label="Backup load" name="backup_load_kw" value={backupLoad} onChange={setBackupLoad} suffix="kW" step="0.1" min="0.1" hint="Use the governed essential-load basis unless the engineering scope explicitly defines another value." />
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 border-t border-[var(--line)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                <p className="text-xs leading-5 text-[var(--muted)]">Complete the required inputs to unlock the recommendation.</p>
                <button type="button" disabled={blocked} onClick={() => setStep("review")} className="min-h-11 border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white disabled:cursor-not-allowed disabled:border-[var(--line)] disabled:text-[var(--muted)] disabled:hover:bg-transparent">Review recommendation</button>
              </div>
            </>
          ) : (
            <>
              <div className="border-b border-[var(--line)] px-5 py-5 md:px-6">
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Sizing recommendation</p>
                <h2 className="mt-2 text-2xl font-medium tracking-[-0.035em]">Preliminary system requirement</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">This becomes the governed capacity basis for equipment selection and Detailed Design. It is not yet a final electrical design.</p>
              </div>

              <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2">
                <ResultMetric primary label="PV array requirement" value={displayNumber(result.recommendedPvKwp, 2)} unit="kWp" />
                <ResultMetric primary label="Inverter AC requirement" value={displayNumber(result.recommendedInverterAcKw, 2)} unit="kW AC" />
                <ResultMetric label="Annual PV estimate" value={result.estimatedAnnualPvGenerationKwh == null ? "—" : Math.round(result.estimatedAnnualPvGenerationKwh).toLocaleString()} unit="kWh/yr" />
                <ResultMetric label="Annual demand" value={Math.round(load.annualEnergyKwh).toLocaleString()} unit="kWh/yr" />
                {systemType !== "on_grid" ? (
                  <>
                    <ResultMetric label="Battery usable" value={displayNumber(result.batteryUsableKwh, 1)} unit="kWh" />
                    <ResultMetric label="Battery nominal" value={displayNumber(result.batteryNominalKwh, 1)} unit="kWh" />
                    <ResultMetric label="Battery power" value={displayNumber(result.batteryPowerKw, 1)} unit="kW" />
                    <ResultMetric label={systemType === "off_grid" ? "Autonomy target" : "Backup duration"} value={systemType === "off_grid" ? displayNumber(autonomyHours, 0) : backupHours || "—"} unit="hours" />
                  </>
                ) : null}
              </div>

              <div className="border-t border-[var(--line)] p-5 md:p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">What happens next</p>
                <div className="mt-4 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
                  {["Approve sizing basis", "Select approved equipment", "Compile Detailed Design"].map((item, index) => (
                    <div key={item} className="bg-[var(--background)] p-4"><span className="text-[10px] font-semibold text-[var(--accent)]">0{index + 1}</span><p className="mt-2 text-xs font-semibold">{item}</p></div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-[var(--line)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                <button type="button" onClick={() => setStep("assumptions")} className="min-h-11 border border-[var(--line)] px-5 text-xs font-semibold hover:border-[var(--foreground)]">Edit assumptions</button>
                <button type="submit" disabled={blocked} className="min-h-11 border border-[var(--accent)] bg-[var(--accent)] px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:border-[var(--line)] disabled:bg-transparent disabled:text-[var(--muted)]">Save HelioCalc revision</button>
              </div>
            </>
          )}
        </div>

        <aside className="space-y-5 xl:sticky xl:top-20">
          <section className="border border-[var(--line)]">
            <div className="flex items-start justify-between gap-5 border-b border-[var(--line)] p-5">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Live sizing output</p>
                <h2 className="mt-2 text-xl font-medium tracking-[-0.03em]">{calculationState}</h2>
              </div>
              <div className={`mt-1 h-2.5 w-2.5 ${blocked ? "bg-red-600" : warnings.length ? "bg-amber-500" : "bg-emerald-600"}`} />
            </div>

            <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <ResultMetric label="PV requirement" value={displayNumber(result.recommendedPvKwp, 2)} unit="kWp" />
              <ResultMetric label="Inverter AC" value={displayNumber(result.recommendedInverterAcKw, 2)} unit="kW" />
              {systemType !== "on_grid" ? <ResultMetric label="Battery nominal" value={displayNumber(result.batteryNominalKwh, 1)} unit="kWh" /> : <ResultMetric label="Annual PV" value={result.estimatedAnnualPvGenerationKwh == null ? "—" : Math.round(result.estimatedAnnualPvGenerationKwh).toLocaleString()} unit="kWh" />}
              {systemType !== "on_grid" ? <ResultMetric label="Battery power" value={displayNumber(result.batteryPowerKw, 1)} unit="kW" /> : <ResultMetric label="Solar target" value={targetSolarContribution || "—"} unit="%" />}
            </div>
          </section>

          <section className="border border-[var(--line)]">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Engineering checks</p>
                <p className="mt-1 text-sm font-semibold">{errors.length} blockers · {warnings.length} warnings</p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Preview</span>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {result.validations.map((check) => (
                <div key={check.code} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 ${check.severity === "pass" ? "bg-emerald-600" : check.severity === "warning" ? "bg-amber-500" : "bg-red-600"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold">{check.title}</p><span className={`border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] ${severityClass[check.severity]}`}>{check.severity}</span></div>
                      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{check.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
