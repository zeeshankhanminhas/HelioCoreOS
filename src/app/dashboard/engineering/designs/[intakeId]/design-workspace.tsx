"use client";

import { useMemo, useState } from "react";
import { buildPvDesign, sizeBatteryUnits, systemTypeSupportsInverter } from "@/lib/engineering/design-engine";
import type { SystemType } from "@/lib/engineering/types";
import { saveDesignRevision } from "../actions";

type ModuleOption = {
  id: string;
  label: string;
  model: string;
  pmaxW: number;
  vocV: number;
  vmpV: number;
  iscA: number;
  impA: number;
  tempCoeffVocPctC: number;
  maxSystemVoltageV: number;
};

type InverterOption = {
  id: string;
  label: string;
  model: string;
  inverterType: "grid_tied" | "off_grid" | "hybrid" | "pcs";
  ratedAcPowerKw: number;
  maxPvInputPowerKw: number;
  maxDcVoltageV: number;
  mpptMinV: number;
  mpptMaxV: number;
  mpptCount: number;
  maxInputCurrentPerMpptA: number;
  maxShortCircuitCurrentPerMpptA: number;
  maxDischargePowerKw?: number | null;
};

type BatteryOption = {
  id: string;
  label: string;
  model: string;
  usableCapacityKwh: number;
  maxDischargePowerKw: number;
};

type Compatibility = {
  inverterId: string;
  batteryId: string;
  status: string;
  minBatteryUnits: number | null;
  maxBatteryUnits: number | null;
};

type Props = {
  intakeId: string;
  systemType: SystemType;
  autonomyHours: number | null;
  initialTargetPvKwp: number | null;
  load: {
    averageDailyEnergyKwh: number;
    peakDemandKw: number;
    essentialPeakDemandKw: number;
  };
  modules: ModuleOption[];
  inverters: InverterOption[];
  batteries: BatteryOption[];
  compatibility: Compatibility[];
};

const severityClass = {
  pass: "border-emerald-300 bg-emerald-50 text-emerald-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  error: "border-red-300 bg-red-50 text-red-900",
};

function numeric(value: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function DesignWorkspace({ intakeId, systemType, autonomyHours, initialTargetPvKwp, load, modules, inverters, batteries, compatibility }: Props) {
  const eligibleInverters = useMemo(() => inverters.filter((item) => systemTypeSupportsInverter(systemType, item.inverterType)), [inverters, systemType]);
  const [moduleId, setModuleId] = useState(modules[0]?.id ?? "");
  const [inverterId, setInverterId] = useState(eligibleInverters[0]?.id ?? "");
  const [batteryId, setBatteryId] = useState("");
  const [targetPv, setTargetPv] = useState(initialTargetPvKwp ? String(initialTargetPvKwp) : "");
  const [targetRatio, setTargetRatio] = useState("1.20");
  const [minTemp, setMinTemp] = useState("0");
  const [maxTemp, setMaxTemp] = useState("70");
  const [modulesPerString, setModulesPerString] = useState("");
  const [inverterQuantity, setInverterQuantity] = useState("");
  const [backupHours, setBackupHours] = useState(systemType === "off_grid" ? String(autonomyHours ?? 24) : "4");
  const [backupLoadKw, setBackupLoadKw] = useState(systemType === "hybrid" && load.essentialPeakDemandKw > 0 ? String(load.essentialPeakDemandKw) : systemType === "hybrid" ? String(load.peakDemandKw || "") : "");

  const selectedModule = modules.find((item) => item.id === moduleId);
  const selectedInverter = eligibleInverters.find((item) => item.id === inverterId);
  const selectedBattery = batteries.find((item) => item.id === batteryId);
  const pair = compatibility.find((item) => item.inverterId === inverterId && item.batteryId === batteryId);

  const pvPreview = useMemo(() => {
    const target = numeric(targetPv);
    const ratio = numeric(targetRatio);
    const minimum = numeric(minTemp);
    const maximum = numeric(maxTemp);
    if (!selectedModule || !selectedInverter || !target || !ratio || minimum == null || maximum == null || minimum >= maximum) return null;
    return buildPvDesign({
      systemType,
      targetPvKwp: target,
      targetDcAcRatio: ratio,
      minimumCellTempC: minimum,
      maximumCellTempC: maximum,
      modulesPerString: numeric(modulesPerString),
      inverterQuantity: numeric(inverterQuantity),
      module: selectedModule,
      inverter: selectedInverter,
    });
  }, [systemType, targetPv, targetRatio, minTemp, maxTemp, modulesPerString, inverterQuantity, selectedModule, selectedInverter]);

  const batteryPreview = useMemo(() => {
    if (systemType === "on_grid" || !selectedBattery) return null;
    let requiredUsableEnergyKwh = 0;
    let requiredPowerKw = 0;
    if (systemType === "off_grid") {
      const hours = autonomyHours ?? numeric(backupHours) ?? 0;
      requiredUsableEnergyKwh = load.averageDailyEnergyKwh * (hours / 24);
      requiredPowerKw = load.peakDemandKw;
    } else {
      const hours = numeric(backupHours) ?? 0;
      const power = numeric(backupLoadKw) ?? 0;
      requiredUsableEnergyKwh = power * hours;
      requiredPowerKw = power;
    }
    const result = sizeBatteryUnits({ requiredUsableEnergyKwh, requiredPowerKw, battery: selectedBattery });
    const governedQuantity = pair?.minBatteryUnits != null ? Math.max(result.quantity, pair.minBatteryUnits) : result.quantity;
    return {
      ...result,
      quantity: governedQuantity,
      installedUsableEnergyKwh: governedQuantity * selectedBattery.usableCapacityKwh,
      installedDischargePowerKw: governedQuantity * selectedBattery.maxDischargePowerKw,
      requiredUsableEnergyKwh,
      requiredPowerKw,
    };
  }, [systemType, selectedBattery, autonomyHours, backupHours, backupLoadKw, load, pair]);

  const blocking = !pvPreview || pvPreview.validations.some((item) => item.severity === "error") || (systemType !== "on_grid" && (!selectedBattery || !pair || pair.status === "not_compatible" || !batteryPreview || (pair.maxBatteryUnits != null && batteryPreview.quantity > pair.maxBatteryUnits)));

  return (
    <form action={saveDesignRevision} className="grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
      <input type="hidden" name="engineering_intake_id" value={intakeId} />
      <div className="space-y-7">
        <section className="border border-[var(--line)]">
          <div className="border-b border-[var(--line)] p-5 md:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">01 · Approved equipment</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Select the technical basis</h2>
          </div>
          <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
            <label className="text-xs font-semibold">PV module
              <select name="pv_module_id" value={moduleId} onChange={(event) => setModuleId(event.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">
                {modules.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold">Inverter / PCS
              <select name="inverter_id" value={inverterId} onChange={(event) => { setInverterId(event.target.value); setBatteryId(""); }} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">
                {eligibleInverters.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            {systemType !== "on_grid" ? (
              <label className="text-xs font-semibold md:col-span-2">Battery / BESS unit
                <select name="battery_id" value={batteryId} onChange={(event) => setBatteryId(event.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">
                  <option value="">Select approved compatible battery</option>
                  {batteries.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
                {batteryId ? <span className={`mt-2 block text-xs ${pair && pair.status !== "not_compatible" ? "text-emerald-700" : "text-red-700"}`}>{pair ? `Compatibility: ${pair.status.replaceAll("_", " ")}` : "No compatibility record for this inverter/battery pair."}</span> : null}
              </label>
            ) : null}
          </div>
        </section>

        <section className="border border-[var(--line)] p-5 md:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">02 · PV sizing assumptions</p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <label className="text-xs font-semibold">Target PV (kWp)<input required name="target_pv_kwp" type="number" min="0.1" step="0.01" value={targetPv} onChange={(e) => setTargetPv(e.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label>
            <label className="text-xs font-semibold">Target DC/AC ratio<input required name="target_dc_ac_ratio" type="number" min="0.1" step="0.01" value={targetRatio} onChange={(e) => setTargetRatio(e.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label>
            <label className="text-xs font-semibold">Inverter quantity <span className="font-normal text-[var(--muted)]">(blank = recommend)</span><input name="inverter_quantity" type="number" min="1" step="1" value={inverterQuantity} onChange={(e) => setInverterQuantity(e.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label>
            <label className="text-xs font-semibold">Minimum cell temp °C<input required name="minimum_cell_temp_c" type="number" step="1" value={minTemp} onChange={(e) => setMinTemp(e.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label>
            <label className="text-xs font-semibold">Maximum cell temp °C<input required name="maximum_cell_temp_c" type="number" step="1" value={maxTemp} onChange={(e) => setMaxTemp(e.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label>
            <label className="text-xs font-semibold">Modules / string <span className="font-normal text-[var(--muted)]">(blank = recommend)</span><input name="modules_per_string" type="number" min="1" step="1" value={modulesPerString} onChange={(e) => setModulesPerString(e.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label>
          </div>
          {pvPreview ? (
            <div className="mt-6 grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Installed PV" value={`${pvPreview.arrayCapacityKwp.toFixed(2)} kWp`} />
              <Metric label="Modules" value={String(pvPreview.installedModuleCount)} />
              <Metric label="Inverters" value={`${pvPreview.inverterQuantity} × ${selectedInverter?.ratedAcPowerKw ?? 0} kW`} />
              <Metric label="DC/AC" value={pvPreview.dcAcRatio.toFixed(2)} />
              <Metric label="String window" value={`${pvPreview.minimumModulesPerString}–${pvPreview.maximumModulesPerString}`} />
              <Metric label="Selected string" value={String(pvPreview.modulesPerString)} />
              <Metric label="Total strings" value={String(pvPreview.totalStrings)} />
              <Metric label="Max strings / MPPT" value={String(pvPreview.maximumStringsPerMppt)} />
            </div>
          ) : <p className="mt-5 text-sm text-[var(--muted)]">Enter a target PV capacity to calculate the design.</p>}
        </section>

        {systemType !== "on_grid" ? (
          <section className="border border-[var(--line)] p-5 md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">03 · BESS sizing</p>
            {systemType === "off_grid" ? (
              <p className="mt-3 text-sm text-[var(--muted)]">Off-grid energy requirement uses the governed load profile and {autonomyHours ?? 0} hours of autonomy from Engineering Intake.</p>
            ) : (
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className="text-xs font-semibold">Backup duration (hours)<input required name="backup_hours" type="number" min="0.1" step="0.5" value={backupHours} onChange={(e) => setBackupHours(e.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label>
                <label className="text-xs font-semibold">Backup load (kW)<input required name="backup_load_kw" type="number" min="0.1" step="0.1" value={backupLoadKw} onChange={(e) => setBackupLoadKw(e.target.value)} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label>
              </div>
            )}
            {systemType === "off_grid" ? <input type="hidden" name="backup_hours" value={backupHours} /> : null}
            {batteryPreview && selectedBattery ? (
              <div className="mt-6 grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Required usable energy" value={`${batteryPreview.requiredUsableEnergyKwh.toFixed(1)} kWh`} />
                <Metric label="Required power" value={`${batteryPreview.requiredPowerKw.toFixed(1)} kW`} />
                <Metric label="Battery units" value={String(batteryPreview.quantity)} />
                <Metric label="Installed usable" value={`${batteryPreview.installedUsableEnergyKwh.toFixed(1)} kWh`} />
              </div>
            ) : <p className="mt-5 text-sm text-[var(--muted)]">Select a compatible battery to calculate BESS quantity.</p>}
          </section>
        ) : null}
      </div>

      <aside className="space-y-7">
        <section className="border border-[var(--line)]">
          <div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Engineering checks</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Live validation</h2></div>
          <div className="space-y-3 p-5">
            {pvPreview?.validations.map((check) => <div key={check.code} className={`border px-4 py-3 ${severityClass[check.severity]}`}><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold">{check.title}</p><span className="text-[10px] font-semibold uppercase tracking-[0.14em]">{check.severity}</span></div><p className="mt-2 text-xs leading-5 opacity-80">{check.detail}</p></div>)}
            {!pvPreview ? <p className="text-sm text-[var(--muted)]">Validation starts when the PV design inputs are complete.</p> : null}
            {systemType !== "on_grid" && batteryId ? <div className={`border px-4 py-3 ${pair && pair.status !== "not_compatible" ? severityClass.pass : severityClass.error}`}><p className="text-sm font-semibold">Battery compatibility</p><p className="mt-2 text-xs leading-5 opacity-80">{pair ? `${pair.status.replaceAll("_", " ")} pairing recorded in the approved equipment library.` : "No governed compatibility record exists for this pair."}</p></div> : null}
          </div>
          <div className="border-t border-[var(--line)] p-5">
            <button type="submit" disabled={blocking} className="min-h-11 w-full border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)] disabled:cursor-not-allowed disabled:border-[var(--line)] disabled:text-[var(--muted)]">Save design revision</button>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">The server recomputes every result before persistence. Client preview values are never treated as engineering authority.</p>
          </div>
        </section>

        {pvPreview ? (
          <section className="border border-[var(--line)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">MPPT allocation</p>
            <div className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {pvPreview.stringGroups.map((group) => <div key={`${group.inverterIndex}-${group.mpptIndex}`} className="flex items-center justify-between gap-4 py-3 text-xs"><span>INV {group.inverterIndex} · MPPT {group.mpptIndex}</span><span className="font-semibold tabular-nums">{group.stringsCount} × {group.modulesPerString}</span></div>)}
            </div>
          </section>
        ) : null}
      </aside>
    </form>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-[var(--background)] p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p><p className="mt-2 text-lg font-medium tabular-nums">{value}</p></div>;
}
