"use client";

import { useState } from "react";
import {
  createBattery,
  createCompatibility,
  createInverter,
  createManufacturer,
  createPvModule,
  setEquipmentStatus,
  setManufacturerStatus,
} from "./actions";
import {
  updateBattery,
  updateCompatibility,
  updateInverter,
  updateManufacturer,
  updatePvModule,
} from "./update-actions";

export type Manufacturer = {
  id: string;
  name: string;
  country_of_origin: string | null;
  website_url: string | null;
  status: string;
};

export type PvModule = {
  id: string;
  manufacturer_id: string;
  model: string;
  technology: string;
  pmax_w: number | string;
  voc_v: number | string;
  vmp_v: number | string;
  isc_a: number | string;
  imp_a: number | string;
  temp_coeff_pmax_pct_c: number | string | null;
  temp_coeff_voc_pct_c: number | string | null;
  temp_coeff_isc_pct_c: number | string | null;
  max_system_voltage_v: number | string | null;
  efficiency_pct: number | string | null;
  width_mm: number | string | null;
  height_mm: number | string | null;
  weight_kg: number | string | null;
  bifacial: boolean;
  datasheet_url: string | null;
  status: string;
};

export type Inverter = {
  id: string;
  manufacturer_id: string;
  model: string;
  inverter_type: string;
  phase: string;
  rated_ac_power_kw: number | string;
  max_pv_input_power_kw: number | string | null;
  max_dc_voltage_v: number | string;
  mppt_min_v: number | string;
  mppt_max_v: number | string;
  mppt_count: number | string;
  max_input_current_per_mppt_a: number | string;
  max_short_circuit_current_per_mppt_a: number | string;
  max_charge_power_kw: number | string | null;
  max_discharge_power_kw: number | string | null;
  battery_voltage_min_v: number | string | null;
  battery_voltage_max_v: number | string | null;
  max_efficiency_pct: number | string | null;
  datasheet_url: string | null;
  status: string;
};

export type Battery = {
  id: string;
  manufacturer_id: string;
  model: string;
  chemistry: string;
  nominal_capacity_kwh: number | string;
  usable_capacity_kwh: number | string;
  nominal_voltage_v: number | string;
  operating_voltage_min_v: number | string | null;
  operating_voltage_max_v: number | string | null;
  max_charge_power_kw: number | string;
  max_discharge_power_kw: number | string;
  max_dod_pct: number | string | null;
  round_trip_efficiency_pct: number | string | null;
  cycle_life: number | string | null;
  datasheet_url: string | null;
  status: string;
};

export type Compatibility = {
  id: string;
  inverter_id: string;
  battery_id: string;
  status: string;
  min_battery_units: number | null;
  max_battery_units: number | null;
  notes: string | null;
};

type TabId = "manufacturers" | "modules" | "inverters" | "batteries" | "compatibility";
type Editing = { type: TabId; id: string } | null;

type Props = {
  initialTab: TabId;
  manufacturers: Manufacturer[];
  modules: PvModule[];
  inverters: Inverter[];
  batteries: Battery[];
  compatibility: Compatibility[];
};

const tabs: { id: TabId; label: string }[] = [
  { id: "manufacturers", label: "Manufacturers" },
  { id: "modules", label: "PV Modules" },
  { id: "inverters", label: "Inverters" },
  { id: "batteries", label: "Batteries / BESS" },
  { id: "compatibility", label: "Compatibility" },
];

const inputClass = "mt-2 min-h-10 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal outline-none focus:border-[var(--foreground)]";
const labelClass = "text-xs font-semibold";
const primaryButton = "min-h-10 border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white";
const secondaryButton = "min-h-9 border border-[var(--line)] px-3 text-[11px] font-semibold text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]";

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function Status({ value }: { value: string }) {
  const className = value === "approved" || value === "active"
    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
    : value === "conditional"
      ? "border-amber-300 bg-amber-50 text-amber-800"
      : value === "retired" || value === "inactive" || value === "not_compatible"
        ? "border-slate-300 bg-slate-50 text-slate-700"
        : "border-[var(--line)] text-[var(--muted)]";
  return <span className={`inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${className}`}>{titleCase(value)}</span>;
}

function ManufacturerSelect({ manufacturers, defaultValue = "" }: { manufacturers: Manufacturer[]; defaultValue?: string }) {
  return (
    <select name="manufacturer_id" required defaultValue={defaultValue} className={inputClass}>
      <option value="">Select manufacturer</option>
      {manufacturers.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
    </select>
  );
}

function EditDrawer({ editing, onClose, manufacturers, modules, inverters, batteries, compatibility }: Props & { editing: Editing; onClose: () => void }) {
  if (!editing) return null;
  const manufacturer = editing.type === "manufacturers" ? manufacturers.find((item) => item.id === editing.id) : null;
  const module = editing.type === "modules" ? modules.find((item) => item.id === editing.id) : null;
  const inverter = editing.type === "inverters" ? inverters.find((item) => item.id === editing.id) : null;
  const battery = editing.type === "batteries" ? batteries.find((item) => item.id === editing.id) : null;
  const pair = editing.type === "compatibility" ? compatibility.find((item) => item.id === editing.id) : null;
  const recordStatus = manufacturer?.status ?? module?.status ?? inverter?.status ?? battery?.status ?? pair?.status ?? "";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" role="presentation" onMouseDown={onClose}>
      <aside className="h-full w-full max-w-[620px] overflow-y-auto border-l border-[var(--line)] bg-[var(--background)] shadow-2xl" role="dialog" aria-modal="true" aria-label="Edit equipment profile" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--line)] bg-[var(--background)] p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Technical master data</p>
            <h2 className="mt-2 text-2xl font-medium">Edit profile</h2>
            {recordStatus ? <div className="mt-3"><Status value={recordStatus} /></div> : null}
          </div>
          <button type="button" onClick={onClose} className={secondaryButton}>Close</button>
        </div>
        <div className="p-5">
          {editing.type !== "manufacturers" && editing.type !== "compatibility" ? <p className="mb-5 border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">Changing technical values invalidates the previous engineering approval. Saving this profile returns it to <strong>Draft</strong> for review and re-approval.</p> : null}

          {manufacturer ? <form action={updateManufacturer} className="space-y-5"><input type="hidden" name="id" value={manufacturer.id} /><label className={labelClass}>Manufacturer name<input name="name" required defaultValue={manufacturer.name} className={inputClass} /></label><label className={labelClass}>Country of origin<input name="country_of_origin" defaultValue={manufacturer.country_of_origin ?? ""} className={inputClass} /></label><label className={labelClass}>Manufacturer website<input name="website_url" type="url" defaultValue={manufacturer.website_url ?? ""} className={inputClass} /></label><button className={`${primaryButton} w-full`}>Save manufacturer profile</button></form> : null}

          {module ? <form action={updatePvModule} className="grid gap-4 sm:grid-cols-2"><input type="hidden" name="id" value={module.id} /><label className={`${labelClass} sm:col-span-2`}>Manufacturer<ManufacturerSelect manufacturers={manufacturers} defaultValue={module.manufacturer_id} /></label><label className={`${labelClass} sm:col-span-2`}>Model<input name="model" required defaultValue={module.model} className={inputClass} /></label><label className={labelClass}>Technology<select name="technology" defaultValue={module.technology} className={inputClass}><option value="mono">Mono</option><option value="topcon">TOPCon</option><option value="hjt">HJT</option><option value="thin_film">Thin film</option><option value="other">Other</option></select></label><label className={labelClass}>Pmax (W)<input name="pmax_w" type="number" step="0.1" required defaultValue={module.pmax_w} className={inputClass} /></label><label className={labelClass}>Voc (V)<input name="voc_v" type="number" step="0.01" required defaultValue={module.voc_v} className={inputClass} /></label><label className={labelClass}>Vmp (V)<input name="vmp_v" type="number" step="0.01" required defaultValue={module.vmp_v} className={inputClass} /></label><label className={labelClass}>Isc (A)<input name="isc_a" type="number" step="0.01" required defaultValue={module.isc_a} className={inputClass} /></label><label className={labelClass}>Imp (A)<input name="imp_a" type="number" step="0.01" required defaultValue={module.imp_a} className={inputClass} /></label><label className={labelClass}>Voc temp coeff (%/°C)<input name="temp_coeff_voc_pct_c" type="number" step="0.001" defaultValue={module.temp_coeff_voc_pct_c ?? ""} className={inputClass} /></label><label className={labelClass}>Pmax temp coeff (%/°C)<input name="temp_coeff_pmax_pct_c" type="number" step="0.001" defaultValue={module.temp_coeff_pmax_pct_c ?? ""} className={inputClass} /></label><label className={labelClass}>Isc temp coeff (%/°C)<input name="temp_coeff_isc_pct_c" type="number" step="0.001" defaultValue={module.temp_coeff_isc_pct_c ?? ""} className={inputClass} /></label><label className={labelClass}>Max system voltage (V)<input name="max_system_voltage_v" type="number" step="1" defaultValue={module.max_system_voltage_v ?? ""} className={inputClass} /></label><label className={labelClass}>Efficiency (%)<input name="efficiency_pct" type="number" step="0.01" defaultValue={module.efficiency_pct ?? ""} className={inputClass} /></label><label className={labelClass}>Width (mm)<input name="width_mm" type="number" step="0.1" defaultValue={module.width_mm ?? ""} className={inputClass} /></label><label className={labelClass}>Height (mm)<input name="height_mm" type="number" step="0.1" defaultValue={module.height_mm ?? ""} className={inputClass} /></label><label className={labelClass}>Weight (kg)<input name="weight_kg" type="number" step="0.1" defaultValue={module.weight_kg ?? ""} className={inputClass} /></label><label className={`${labelClass} sm:col-span-2`}>Datasheet URL<input name="datasheet_url" type="url" defaultValue={module.datasheet_url ?? ""} className={inputClass} /></label><label className="flex items-center gap-2 text-xs font-semibold sm:col-span-2"><input name="bifacial" type="checkbox" defaultChecked={module.bifacial} /> Bifacial module</label><button className={`${primaryButton} sm:col-span-2`}>Save changes & return to draft</button></form> : null}

          {inverter ? <form action={updateInverter} className="grid gap-4 sm:grid-cols-2"><input type="hidden" name="id" value={inverter.id} /><label className={`${labelClass} sm:col-span-2`}>Manufacturer<ManufacturerSelect manufacturers={manufacturers} defaultValue={inverter.manufacturer_id} /></label><label className={`${labelClass} sm:col-span-2`}>Model<input name="model" required defaultValue={inverter.model} className={inputClass} /></label><label className={labelClass}>Type<select name="inverter_type" defaultValue={inverter.inverter_type} className={inputClass}><option value="grid_tied">Grid-tied</option><option value="hybrid">Hybrid</option><option value="off_grid">Off-grid</option><option value="pcs">PCS</option></select></label><label className={labelClass}>Phase<select name="phase" defaultValue={inverter.phase} className={inputClass}><option value="three">Three phase</option><option value="single">Single phase</option></select></label><label className={labelClass}>Rated AC power (kW)<input name="rated_ac_power_kw" type="number" step="0.01" required defaultValue={inverter.rated_ac_power_kw} className={inputClass} /></label><label className={labelClass}>Max PV input (kW)<input name="max_pv_input_power_kw" type="number" step="0.01" defaultValue={inverter.max_pv_input_power_kw ?? ""} className={inputClass} /></label><label className={labelClass}>Max DC voltage (V)<input name="max_dc_voltage_v" type="number" step="0.1" required defaultValue={inverter.max_dc_voltage_v} className={inputClass} /></label><label className={labelClass}>MPPT count<input name="mppt_count" type="number" step="1" min="1" required defaultValue={inverter.mppt_count} className={inputClass} /></label><label className={labelClass}>MPPT minimum (V)<input name="mppt_min_v" type="number" step="0.1" required defaultValue={inverter.mppt_min_v} className={inputClass} /></label><label className={labelClass}>MPPT maximum (V)<input name="mppt_max_v" type="number" step="0.1" required defaultValue={inverter.mppt_max_v} className={inputClass} /></label><label className={labelClass}>Max input / MPPT (A)<input name="max_input_current_per_mppt_a" type="number" step="0.01" required defaultValue={inverter.max_input_current_per_mppt_a} className={inputClass} /></label><label className={labelClass}>Max Isc / MPPT (A)<input name="max_short_circuit_current_per_mppt_a" type="number" step="0.01" required defaultValue={inverter.max_short_circuit_current_per_mppt_a} className={inputClass} /></label><label className={labelClass}>Battery voltage min (V)<input name="battery_voltage_min_v" type="number" step="0.1" defaultValue={inverter.battery_voltage_min_v ?? ""} className={inputClass} /></label><label className={labelClass}>Battery voltage max (V)<input name="battery_voltage_max_v" type="number" step="0.1" defaultValue={inverter.battery_voltage_max_v ?? ""} className={inputClass} /></label><label className={labelClass}>Max charge (kW)<input name="max_charge_power_kw" type="number" step="0.01" defaultValue={inverter.max_charge_power_kw ?? ""} className={inputClass} /></label><label className={labelClass}>Max discharge (kW)<input name="max_discharge_power_kw" type="number" step="0.01" defaultValue={inverter.max_discharge_power_kw ?? ""} className={inputClass} /></label><label className={labelClass}>Max efficiency (%)<input name="max_efficiency_pct" type="number" step="0.01" defaultValue={inverter.max_efficiency_pct ?? ""} className={inputClass} /></label><label className={`${labelClass} sm:col-span-2`}>Datasheet URL<input name="datasheet_url" type="url" defaultValue={inverter.datasheet_url ?? ""} className={inputClass} /></label><button className={`${primaryButton} sm:col-span-2`}>Save changes & return to draft</button></form> : null}

          {battery ? <form action={updateBattery} className="grid gap-4 sm:grid-cols-2"><input type="hidden" name="id" value={battery.id} /><label className={`${labelClass} sm:col-span-2`}>Manufacturer<ManufacturerSelect manufacturers={manufacturers} defaultValue={battery.manufacturer_id} /></label><label className={`${labelClass} sm:col-span-2`}>Model<input name="model" required defaultValue={battery.model} className={inputClass} /></label><label className={labelClass}>Chemistry<select name="chemistry" defaultValue={battery.chemistry} className={inputClass}><option value="lfp">LFP</option><option value="nmc">NMC</option><option value="lead_acid">Lead acid</option><option value="other">Other</option></select></label><label className={labelClass}>Nominal capacity (kWh)<input name="nominal_capacity_kwh" type="number" step="0.01" required defaultValue={battery.nominal_capacity_kwh} className={inputClass} /></label><label className={labelClass}>Usable capacity (kWh)<input name="usable_capacity_kwh" type="number" step="0.01" required defaultValue={battery.usable_capacity_kwh} className={inputClass} /></label><label className={labelClass}>Nominal voltage (V)<input name="nominal_voltage_v" type="number" step="0.1" required defaultValue={battery.nominal_voltage_v} className={inputClass} /></label><label className={labelClass}>Operating voltage min (V)<input name="operating_voltage_min_v" type="number" step="0.1" defaultValue={battery.operating_voltage_min_v ?? ""} className={inputClass} /></label><label className={labelClass}>Operating voltage max (V)<input name="operating_voltage_max_v" type="number" step="0.1" defaultValue={battery.operating_voltage_max_v ?? ""} className={inputClass} /></label><label className={labelClass}>Max charge power (kW)<input name="max_charge_power_kw" type="number" step="0.01" required defaultValue={battery.max_charge_power_kw} className={inputClass} /></label><label className={labelClass}>Max discharge power (kW)<input name="max_discharge_power_kw" type="number" step="0.01" required defaultValue={battery.max_discharge_power_kw} className={inputClass} /></label><label className={labelClass}>Maximum DoD (%)<input name="max_dod_pct" type="number" step="0.1" defaultValue={battery.max_dod_pct ?? ""} className={inputClass} /></label><label className={labelClass}>Round-trip efficiency (%)<input name="round_trip_efficiency_pct" type="number" step="0.1" defaultValue={battery.round_trip_efficiency_pct ?? ""} className={inputClass} /></label><label className={labelClass}>Cycle life<input name="cycle_life" type="number" step="1" defaultValue={battery.cycle_life ?? ""} className={inputClass} /></label><label className={`${labelClass} sm:col-span-2`}>Datasheet URL<input name="datasheet_url" type="url" defaultValue={battery.datasheet_url ?? ""} className={inputClass} /></label><button className={`${primaryButton} sm:col-span-2`}>Save changes & return to draft</button></form> : null}

          {pair ? <form action={updateCompatibility} className="space-y-5"><input type="hidden" name="id" value={pair.id} /><label className={labelClass}>Battery-capable inverter<select name="inverter_id" required defaultValue={pair.inverter_id} className={inputClass}>{inverters.filter((item) => item.inverter_type !== "grid_tied" && item.status !== "retired").map((item) => <option key={item.id} value={item.id}>{manufacturers.find((maker) => maker.id === item.manufacturer_id)?.name} · {item.model}</option>)}</select></label><label className={labelClass}>Battery<select name="battery_id" required defaultValue={pair.battery_id} className={inputClass}>{batteries.filter((item) => item.status !== "retired").map((item) => <option key={item.id} value={item.id}>{manufacturers.find((maker) => maker.id === item.manufacturer_id)?.name} · {item.model}</option>)}</select></label><label className={labelClass}>Compatibility state<select name="status" defaultValue={pair.status} className={inputClass}><option value="approved">Approved</option><option value="conditional">Conditional</option><option value="not_compatible">Not compatible</option></select></label><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Minimum units<input name="min_battery_units" type="number" min="1" step="1" defaultValue={pair.min_battery_units ?? ""} className={inputClass} /></label><label className={labelClass}>Maximum units<input name="max_battery_units" type="number" min="1" step="1" defaultValue={pair.max_battery_units ?? ""} className={inputClass} /></label></div><label className={labelClass}>Engineering notes<textarea name="notes" rows={4} defaultValue={pair.notes ?? ""} className={`${inputClass} py-3`} /></label><button className={`${primaryButton} w-full`}>Save compatibility profile</button></form> : null}
        </div>
      </aside>
    </div>
  );
}

export function EquipmentWorkspace({ initialTab, manufacturers, modules, inverters, batteries, compatibility }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const [editing, setEditing] = useState<Editing>(null);
  const manufacturerMap = new Map(manufacturers.map((item) => [item.id, item]));
  const inverterMap = new Map(inverters.map((item) => [item.id, item]));
  const batteryMap = new Map(batteries.map((item) => [item.id, item]));

  function selectTab(tab: TabId) {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    url.searchParams.delete("error");
    url.searchParams.delete("created");
    url.searchParams.delete("updated");
    window.history.replaceState({}, "", url);
  }

  return (
    <>
      <nav className="mt-7 overflow-x-auto border-y border-[var(--line)]" aria-label="Equipment library sections">
        <div className="flex min-w-max">
          {tabs.map((tab) => <button key={tab.id} type="button" onClick={() => selectTab(tab.id)} className={`border-r border-[var(--line)] px-5 py-3 text-xs font-semibold ${activeTab === tab.id ? "bg-[var(--foreground)] text-[var(--background)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>{tab.label}</button>)}
        </div>
      </nav>

      {activeTab === "manufacturers" ? <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]"><article className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Master register</p><h2 className="mt-2 text-2xl font-medium">Manufacturers</h2></div>{manufacturers.length ? <div className="divide-y divide-[var(--line)]">{manufacturers.map((item) => <div key={item.id} className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_150px_100px_200px] md:items-center md:px-6"><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.website_url ? <a href={item.website_url} target="_blank" rel="noreferrer" className="underline underline-offset-2">Website</a> : "No website recorded"}</p></div><p className="text-xs text-[var(--muted)]">{item.country_of_origin || "Country not set"}</p><Status value={item.status} /><div className="flex justify-end gap-2"><button type="button" onClick={() => setEditing({ type: "manufacturers", id: item.id })} className={secondaryButton}>Edit</button><form action={setManufacturerStatus}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value={item.status === "active" ? "inactive" : "active"} /><button className={secondaryButton}>{item.status === "active" ? "Deactivate" : "Reactivate"}</button></form></div></div>)}</div> : <div className="p-8 text-sm text-[var(--muted)]">No manufacturers recorded yet.</div>}</article><form action={createManufacturer} className="h-fit border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Add source</p><h2 className="mt-2 text-2xl font-medium">New manufacturer</h2></div><div className="space-y-5 p-5"><label className={labelClass}>Manufacturer name<input name="name" required className={inputClass} /></label><label className={labelClass}>Country of origin<input name="country_of_origin" className={inputClass} /></label><label className={labelClass}>Manufacturer website<input name="website_url" type="url" placeholder="https://" className={inputClass} /></label><button className={`${primaryButton} w-full`}>Add manufacturer</button></div></form></section> : null}

      {activeTab === "modules" ? <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(390px,0.6fr)]"><article className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">PV technical register</p><h2 className="mt-2 text-2xl font-medium">PV modules</h2></div>{modules.length ? <div className="divide-y divide-[var(--line)]">{modules.map((item) => <div key={item.id} className="p-5 md:px-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-sm font-semibold">{manufacturerMap.get(item.manufacturer_id)?.name ?? "Manufacturer"} · {item.model}</p><p className="mt-1 text-xs text-[var(--muted)]">{Number(item.pmax_w)} W · Voc {Number(item.voc_v)} V · Vmp {Number(item.vmp_v)} V · Isc {Number(item.isc_a)} A · Imp {Number(item.imp_a)} A</p></div><Status value={item.status} /></div><div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]"><span>{titleCase(item.technology)}</span><span>·</span><span>Voc temp coeff {item.temp_coeff_voc_pct_c ?? "—"}%/°C</span><span>·</span><span>Max system {item.max_system_voltage_v ?? "—"} V</span>{item.datasheet_url ? <><span>·</span><a href={item.datasheet_url} target="_blank" rel="noreferrer" className="underline underline-offset-2">Datasheet</a></> : null}</div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setEditing({ type: "modules", id: item.id })} className={secondaryButton}>Edit profile</button>{item.status !== "approved" ? <form action={setEquipmentStatus}><input type="hidden" name="entity" value="pv_module" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="approved" /><button className={secondaryButton}>Approve</button></form> : null}{item.status !== "retired" ? <form action={setEquipmentStatus}><input type="hidden" name="entity" value="pv_module" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="retired" /><button className={secondaryButton}>Retire</button></form> : null}</div></div>)}</div> : <div className="p-8 text-sm text-[var(--muted)]">No PV modules recorded yet.</div>}</article><form action={createPvModule} className="h-fit border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Technical intake</p><h2 className="mt-2 text-2xl font-medium">Add PV module</h2></div><div className="grid gap-4 p-5 sm:grid-cols-2"><label className={`${labelClass} sm:col-span-2`}>Manufacturer<ManufacturerSelect manufacturers={manufacturers} /></label><label className={`${labelClass} sm:col-span-2`}>Model<input name="model" required className={inputClass} /></label><label className={labelClass}>Technology<select name="technology" className={inputClass}><option value="mono">Mono</option><option value="topcon">TOPCon</option><option value="hjt">HJT</option><option value="thin_film">Thin film</option><option value="other">Other</option></select></label><label className={labelClass}>Pmax (W)<input name="pmax_w" type="number" step="0.1" required className={inputClass} /></label><label className={labelClass}>Voc (V)<input name="voc_v" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Vmp (V)<input name="vmp_v" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Isc (A)<input name="isc_a" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Imp (A)<input name="imp_a" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Voc temp coeff (%/°C)<input name="temp_coeff_voc_pct_c" type="number" step="0.001" className={inputClass} /></label><label className={labelClass}>Pmax temp coeff (%/°C)<input name="temp_coeff_pmax_pct_c" type="number" step="0.001" className={inputClass} /></label><label className={labelClass}>Isc temp coeff (%/°C)<input name="temp_coeff_isc_pct_c" type="number" step="0.001" className={inputClass} /></label><label className={labelClass}>Max system voltage (V)<input name="max_system_voltage_v" type="number" step="1" className={inputClass} /></label><label className={labelClass}>Efficiency (%)<input name="efficiency_pct" type="number" step="0.01" className={inputClass} /></label><label className={labelClass}>Width (mm)<input name="width_mm" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Height (mm)<input name="height_mm" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Weight (kg)<input name="weight_kg" type="number" step="0.1" className={inputClass} /></label><label className={`${labelClass} sm:col-span-2`}>Datasheet URL<input name="datasheet_url" type="url" placeholder="https://" className={inputClass} /></label><label className="flex items-center gap-2 text-xs font-semibold sm:col-span-2"><input name="bifacial" type="checkbox" /> Bifacial module</label><button className={`${primaryButton} sm:col-span-2`}>Save module as draft</button></div></form></section> : null}

      {activeTab === "inverters" ? <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(400px,0.6fr)]"><article className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Power conversion register</p><h2 className="mt-2 text-2xl font-medium">Inverters / PCS</h2></div>{inverters.length ? <div className="divide-y divide-[var(--line)]">{inverters.map((item) => <div key={item.id} className="p-5 md:px-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-sm font-semibold">{manufacturerMap.get(item.manufacturer_id)?.name ?? "Manufacturer"} · {item.model}</p><p className="mt-1 text-xs text-[var(--muted)]">{titleCase(item.inverter_type)} · {Number(item.rated_ac_power_kw)} kW AC · {item.mppt_count} MPPT · {Number(item.max_dc_voltage_v)} V max DC</p></div><Status value={item.status} /></div><div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted)]"><span>MPPT {Number(item.mppt_min_v)}–{Number(item.mppt_max_v)} V</span><span>Input {Number(item.max_input_current_per_mppt_a)} A/MPPT</span><span>Isc {Number(item.max_short_circuit_current_per_mppt_a)} A/MPPT</span><span>PV limit {item.max_pv_input_power_kw ?? "—"} kW</span>{item.datasheet_url ? <a href={item.datasheet_url} target="_blank" rel="noreferrer" className="underline underline-offset-2">Datasheet</a> : null}</div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setEditing({ type: "inverters", id: item.id })} className={secondaryButton}>Edit profile</button>{item.status !== "approved" ? <form action={setEquipmentStatus}><input type="hidden" name="entity" value="inverter" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="approved" /><button className={secondaryButton}>Approve</button></form> : null}{item.status !== "retired" ? <form action={setEquipmentStatus}><input type="hidden" name="entity" value="inverter" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="retired" /><button className={secondaryButton}>Retire</button></form> : null}</div></div>)}</div> : <div className="p-8 text-sm text-[var(--muted)]">No inverters recorded yet.</div>}</article><form action={createInverter} className="h-fit border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Technical intake</p><h2 className="mt-2 text-2xl font-medium">Add inverter</h2></div><div className="grid gap-4 p-5 sm:grid-cols-2"><label className={`${labelClass} sm:col-span-2`}>Manufacturer<ManufacturerSelect manufacturers={manufacturers} /></label><label className={`${labelClass} sm:col-span-2`}>Model<input name="model" required className={inputClass} /></label><label className={labelClass}>Type<select name="inverter_type" className={inputClass}><option value="grid_tied">Grid-tied</option><option value="hybrid">Hybrid</option><option value="off_grid">Off-grid</option><option value="pcs">PCS</option></select></label><label className={labelClass}>Phase<select name="phase" className={inputClass}><option value="three">Three phase</option><option value="single">Single phase</option></select></label><label className={labelClass}>Rated AC power (kW)<input name="rated_ac_power_kw" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Max PV input (kW)<input name="max_pv_input_power_kw" type="number" step="0.01" className={inputClass} /></label><label className={labelClass}>Max DC voltage (V)<input name="max_dc_voltage_v" type="number" step="0.1" required className={inputClass} /></label><label className={labelClass}>MPPT count<input name="mppt_count" type="number" step="1" min="1" required className={inputClass} /></label><label className={labelClass}>MPPT minimum (V)<input name="mppt_min_v" type="number" step="0.1" required className={inputClass} /></label><label className={labelClass}>MPPT maximum (V)<input name="mppt_max_v" type="number" step="0.1" required className={inputClass} /></label><label className={labelClass}>Max input / MPPT (A)<input name="max_input_current_per_mppt_a" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Max Isc / MPPT (A)<input name="max_short_circuit_current_per_mppt_a" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Battery voltage min (V)<input name="battery_voltage_min_v" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Battery voltage max (V)<input name="battery_voltage_max_v" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Max charge (kW)<input name="max_charge_power_kw" type="number" step="0.01" className={inputClass} /></label><label className={labelClass}>Max discharge (kW)<input name="max_discharge_power_kw" type="number" step="0.01" className={inputClass} /></label><label className={labelClass}>Max efficiency (%)<input name="max_efficiency_pct" type="number" step="0.01" className={inputClass} /></label><label className={`${labelClass} sm:col-span-2`}>Datasheet URL<input name="datasheet_url" type="url" placeholder="https://" className={inputClass} /></label><button className={`${primaryButton} sm:col-span-2`}>Save inverter as draft</button></div></form></section> : null}

      {activeTab === "batteries" ? <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(400px,0.6fr)]"><article className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Storage register</p><h2 className="mt-2 text-2xl font-medium">Batteries / BESS units</h2></div>{batteries.length ? <div className="divide-y divide-[var(--line)]">{batteries.map((item) => <div key={item.id} className="p-5 md:px-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-sm font-semibold">{manufacturerMap.get(item.manufacturer_id)?.name ?? "Manufacturer"} · {item.model}</p><p className="mt-1 text-xs text-[var(--muted)]">{titleCase(item.chemistry)} · {Number(item.nominal_capacity_kwh)} kWh nominal · {Number(item.usable_capacity_kwh)} kWh usable · {Number(item.nominal_voltage_v)} V</p></div><Status value={item.status} /></div><div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted)]"><span>Charge {Number(item.max_charge_power_kw)} kW</span><span>Discharge {Number(item.max_discharge_power_kw)} kW</span><span>DoD {item.max_dod_pct ?? "—"}%</span><span>RTE {item.round_trip_efficiency_pct ?? "—"}%</span>{item.datasheet_url ? <a href={item.datasheet_url} target="_blank" rel="noreferrer" className="underline underline-offset-2">Datasheet</a> : null}</div><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setEditing({ type: "batteries", id: item.id })} className={secondaryButton}>Edit profile</button>{item.status !== "approved" ? <form action={setEquipmentStatus}><input type="hidden" name="entity" value="battery" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="approved" /><button className={secondaryButton}>Approve</button></form> : null}{item.status !== "retired" ? <form action={setEquipmentStatus}><input type="hidden" name="entity" value="battery" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="retired" /><button className={secondaryButton}>Retire</button></form> : null}</div></div>)}</div> : <div className="p-8 text-sm text-[var(--muted)]">No batteries recorded yet.</div>}</article><form action={createBattery} className="h-fit border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Technical intake</p><h2 className="mt-2 text-2xl font-medium">Add battery</h2></div><div className="grid gap-4 p-5 sm:grid-cols-2"><label className={`${labelClass} sm:col-span-2`}>Manufacturer<ManufacturerSelect manufacturers={manufacturers} /></label><label className={`${labelClass} sm:col-span-2`}>Model<input name="model" required className={inputClass} /></label><label className={labelClass}>Chemistry<select name="chemistry" className={inputClass}><option value="lfp">LFP</option><option value="nmc">NMC</option><option value="lead_acid">Lead acid</option><option value="other">Other</option></select></label><label className={labelClass}>Nominal capacity (kWh)<input name="nominal_capacity_kwh" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Usable capacity (kWh)<input name="usable_capacity_kwh" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Nominal voltage (V)<input name="nominal_voltage_v" type="number" step="0.1" required className={inputClass} /></label><label className={labelClass}>Operating voltage min (V)<input name="operating_voltage_min_v" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Operating voltage max (V)<input name="operating_voltage_max_v" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Max charge power (kW)<input name="max_charge_power_kw" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Max discharge power (kW)<input name="max_discharge_power_kw" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Maximum DoD (%)<input name="max_dod_pct" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Round-trip efficiency (%)<input name="round_trip_efficiency_pct" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Cycle life<input name="cycle_life" type="number" step="1" className={inputClass} /></label><label className={`${labelClass} sm:col-span-2`}>Datasheet URL<input name="datasheet_url" type="url" placeholder="https://" className={inputClass} /></label><button className={`${primaryButton} sm:col-span-2`}>Save battery as draft</button></div></form></section> : null}

      {activeTab === "compatibility" ? <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.3fr)_minmax(380px,0.7fr)]"><article className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Approved pairing matrix</p><h2 className="mt-2 text-2xl font-medium">Inverter ↔ Battery compatibility</h2></div>{compatibility.length ? <div className="divide-y divide-[var(--line)]">{compatibility.map((item) => { const inverter = inverterMap.get(item.inverter_id); const battery = batteryMap.get(item.battery_id); return <div key={item.id} className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_150px_100px] md:items-center md:px-6"><div><p className="text-sm font-semibold">{inverter ? `${manufacturerMap.get(inverter.manufacturer_id)?.name ?? ""} ${inverter.model}` : "Inverter"} ↔ {battery ? `${manufacturerMap.get(battery.manufacturer_id)?.name ?? ""} ${battery.model}` : "Battery"}</p><p className="mt-1 text-xs text-[var(--muted)]">Units {item.min_battery_units ?? "—"} to {item.max_battery_units ?? "—"}{item.notes ? ` · ${item.notes}` : ""}</p></div><Status value={item.status} /><button type="button" onClick={() => setEditing({ type: "compatibility", id: item.id })} className={secondaryButton}>Edit</button></div>; })}</div> : <div className="p-8 text-sm text-[var(--muted)]">No compatibility records yet.</div>}</article><form action={createCompatibility} className="h-fit border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Compatibility governance</p><h2 className="mt-2 text-2xl font-medium">Record pairing</h2></div><div className="space-y-5 p-5"><label className={labelClass}>Battery-capable inverter<select name="inverter_id" required className={inputClass}><option value="">Select inverter / PCS</option>{inverters.filter((item) => item.inverter_type !== "grid_tied" && item.status !== "retired").map((item) => <option key={item.id} value={item.id}>{manufacturerMap.get(item.manufacturer_id)?.name} · {item.model}</option>)}</select></label><label className={labelClass}>Battery<select name="battery_id" required className={inputClass}><option value="">Select battery</option>{batteries.filter((item) => item.status !== "retired").map((item) => <option key={item.id} value={item.id}>{manufacturerMap.get(item.manufacturer_id)?.name} · {item.model}</option>)}</select></label><label className={labelClass}>Compatibility state<select name="status" className={inputClass}><option value="approved">Approved</option><option value="conditional">Conditional</option><option value="not_compatible">Not compatible</option></select></label><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Minimum units<input name="min_battery_units" type="number" step="1" min="1" className={inputClass} /></label><label className={labelClass}>Maximum units<input name="max_battery_units" type="number" step="1" min="1" className={inputClass} /></label></div><label className={labelClass}>Engineering notes<textarea name="notes" rows={4} className={`${inputClass} py-3`} /></label><button className={`${primaryButton} w-full`}>Save compatibility record</button></div></form></section> : null}

      <EditDrawer initialTab={initialTab} manufacturers={manufacturers} modules={modules} inverters={inverters} batteries={batteries} compatibility={compatibility} editing={editing} onClose={() => setEditing(null)} />
    </>
  );
}
