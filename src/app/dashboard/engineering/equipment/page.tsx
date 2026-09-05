import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  createBattery,
  createCompatibility,
  createInverter,
  createManufacturer,
  createPvModule,
  setEquipmentStatus,
  setManufacturerStatus,
} from "./actions";

type Props = {
  searchParams: Promise<{ tab?: string; error?: string; created?: string; updated?: string }>;
};

const tabs = [
  { id: "manufacturers", label: "Manufacturers" },
  { id: "modules", label: "PV Modules" },
  { id: "inverters", label: "Inverters" },
  { id: "batteries", label: "Batteries / BESS" },
  { id: "compatibility", label: "Compatibility" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusClass(status: string) {
  if (status === "approved" || status === "active") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (status === "retired" || status === "inactive" || status === "not_compatible") return "border-slate-300 bg-slate-50 text-slate-700";
  if (status === "conditional") return "border-amber-300 bg-amber-50 text-amber-800";
  return "border-[var(--line)] bg-[var(--background)] text-[var(--muted)]";
}

function Status({ value }: { value: string }) {
  return <span className={`inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusClass(value)}`}>{titleCase(value)}</span>;
}

const inputClass = "mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal";
const labelClass = "text-xs font-semibold";
const buttonClass = "min-h-10 border border-[var(--accent)] px-3 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white";
const secondaryButtonClass = "min-h-9 border border-[var(--line)] px-3 text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--foreground)]";

export default async function EquipmentLibraryPage({ searchParams }: Props) {
  const messages = await searchParams;
  const activeTab = tabs.some((tab) => tab.id === messages.tab) ? messages.tab as TabId : "manufacturers";
  const supabase = await createClient();

  const [{ data: manufacturers }, { data: modules }, { data: inverters }, { data: batteries }, { data: compatibility }] = await Promise.all([
    supabase.from("equipment_manufacturers").select("*").order("name"),
    supabase.from("pv_modules").select("*").order("created_at", { ascending: false }),
    supabase.from("inverters").select("*").order("created_at", { ascending: false }),
    supabase.from("batteries").select("*").order("created_at", { ascending: false }),
    supabase.from("inverter_battery_compatibility").select("*").order("updated_at", { ascending: false }),
  ]);

  const manufacturerMap = new Map((manufacturers ?? []).map((item) => [item.id, item]));
  const inverterMap = new Map((inverters ?? []).map((item) => [item.id, item]));
  const batteryMap = new Map((batteries ?? []).map((item) => [item.id, item]));
  const activeManufacturers = (manufacturers ?? []).filter((item) => item.status === "active");
  const batteryCapableInverters = (inverters ?? []).filter((item) => item.inverter_type !== "grid_tied" && item.status !== "retired");
  const availableBatteries = (batteries ?? []).filter((item) => item.status !== "retired");
  const approvedCount = [...(modules ?? []), ...(inverters ?? []), ...(batteries ?? [])].filter((item) => item.status === "approved").length;
  const draftCount = [...(modules ?? []), ...(inverters ?? []), ...(batteries ?? [])].filter((item) => item.status === "draft").length;

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="border-b border-[var(--line)] pb-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Engineering · Technical master data</p>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Equipment Library</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">Governed manufacturer specifications used by PV, inverter and BESS sizing. Draft technical data cannot silently become approved design equipment.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/engineering" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Engineering intake</Link>
          </div>
        </div>
      </header>

      {messages.error ? <div className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{messages.error}</div> : null}
      {messages.created ? <div className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Technical library record saved.</div> : null}
      {messages.updated ? <div className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Equipment governance status updated and recorded.</div> : null}

      <section className="mt-7 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Manufacturers", manufacturers?.length ?? 0],
          ["PV modules", modules?.length ?? 0],
          ["Inverters", inverters?.length ?? 0],
          ["Batteries", batteries?.length ?? 0],
          ["Approved / Draft", `${approvedCount} / ${draftCount}`],
        ].map(([label, value]) => (
          <article key={label} className="bg-[var(--background)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
            <p className="mt-4 text-2xl font-medium tabular-nums">{value}</p>
          </article>
        ))}
      </section>

      <nav className="mt-7 overflow-x-auto border-y border-[var(--line)]" aria-label="Equipment library sections">
        <div className="flex min-w-max">
          {tabs.map((tab) => (
            <Link key={tab.id} href={`/dashboard/engineering/equipment?tab=${tab.id}`} className={`border-r border-[var(--line)] px-5 py-3 text-xs font-semibold ${activeTab === tab.id ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}>{tab.label}</Link>
          ))}
        </div>
      </nav>

      {activeTab === "manufacturers" ? (
        <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <article className="border border-[var(--line)]">
            <div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Master register</p><h2 className="mt-2 text-2xl font-medium">Manufacturers</h2></div>
            {manufacturers?.length ? <div className="divide-y divide-[var(--line)]">{manufacturers.map((item) => (
              <div key={item.id} className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_150px_110px_140px] md:items-center md:px-6">
                <div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.website_url ? <a href={item.website_url} target="_blank" rel="noreferrer" className="underline underline-offset-2">Website</a> : "No website recorded"}</p></div>
                <p className="text-xs text-[var(--muted)]">{item.country_of_origin || "Country not set"}</p>
                <Status value={item.status} />
                <form action={setManufacturerStatus} className="md:text-right"><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value={item.status === "active" ? "inactive" : "active"} /><button className={secondaryButtonClass}>{item.status === "active" ? "Deactivate" : "Reactivate"}</button></form>
              </div>
            ))}</div> : <div className="p-8 text-sm text-[var(--muted)]">No manufacturers recorded yet.</div>}
          </article>
          <form action={createManufacturer} className="h-fit border border-[var(--line)]">
            <div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Add source</p><h2 className="mt-2 text-2xl font-medium">New manufacturer</h2></div>
            <div className="space-y-5 p-5"><label className={labelClass}>Manufacturer name<input name="name" required className={inputClass} /></label><label className={labelClass}>Country of origin<input name="country_of_origin" className={inputClass} /></label><label className={labelClass}>Manufacturer website<input name="website_url" type="url" placeholder="https://" className={inputClass} /></label><button className={`${buttonClass} w-full`}>Add manufacturer</button></div>
          </form>
        </section>
      ) : null}

      {activeTab === "modules" ? (
        <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(390px,0.6fr)]">
          <article className="border border-[var(--line)]">
            <div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">PV technical register</p><h2 className="mt-2 text-2xl font-medium">PV modules</h2></div>
            {modules?.length ? <div className="divide-y divide-[var(--line)]">{modules.map((item) => (
              <div key={item.id} className="p-5 md:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-sm font-semibold">{manufacturerMap.get(item.manufacturer_id)?.name ?? "Manufacturer"} · {item.model}</p><p className="mt-1 text-xs text-[var(--muted)]">{Number(item.pmax_w)} W · Voc {Number(item.voc_v)} V · Vmp {Number(item.vmp_v)} V · Isc {Number(item.isc_a)} A · Imp {Number(item.imp_a)} A</p></div><Status value={item.status} /></div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]"><span>{titleCase(item.technology)}</span><span>·</span><span>Voc temp coeff {item.temp_coeff_voc_pct_c ?? "—"}%/°C</span><span>·</span><span>Max system {item.max_system_voltage_v ?? "—"} V</span>{item.datasheet_url ? <><span>·</span><a href={item.datasheet_url} target="_blank" rel="noreferrer" className="underline underline-offset-2">Datasheet</a></> : null}</div>
                <div className="mt-4 flex flex-wrap gap-2">{item.status !== "approved" ? <form action={setEquipmentStatus}><input type="hidden" name="entity" value="pv_module" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="approved" /><button className={secondaryButtonClass}>Approve</button></form> : null}{item.status !== "retired" ? <form action={setEquipmentStatus}><input type="hidden" name="entity" value="pv_module" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="retired" /><button className={secondaryButtonClass}>Retire</button></form> : <form action={setEquipmentStatus}><input type="hidden" name="entity" value="pv_module" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="draft" /><button className={secondaryButtonClass}>Restore draft</button></form>}</div>
              </div>
            ))}</div> : <div className="p-8 text-sm text-[var(--muted)]">No PV modules recorded yet.</div>}
          </article>
          <form action={createPvModule} className="h-fit border border-[var(--line)]">
            <div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Technical intake</p><h2 className="mt-2 text-2xl font-medium">Add PV module</h2></div>
            <div className="grid gap-4 p-5 sm:grid-cols-2"><label className={`${labelClass} sm:col-span-2`}>Manufacturer<select name="manufacturer_id" required className={inputClass}><option value="">Select manufacturer</option>{activeManufacturers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className={`${labelClass} sm:col-span-2`}>Model<input name="model" required className={inputClass} /></label><label className={labelClass}>Technology<select name="technology" className={inputClass}><option value="mono">Mono</option><option value="topcon">TOPCon</option><option value="hjt">HJT</option><option value="thin_film">Thin film</option><option value="other">Other</option></select></label><label className={labelClass}>Pmax (W)<input name="pmax_w" type="number" step="0.1" required className={inputClass} /></label><label className={labelClass}>Voc (V)<input name="voc_v" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Vmp (V)<input name="vmp_v" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Isc (A)<input name="isc_a" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Imp (A)<input name="imp_a" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Voc temp coeff (%/°C)<input name="temp_coeff_voc_pct_c" type="number" step="0.001" className={inputClass} /></label><label className={labelClass}>Pmax temp coeff (%/°C)<input name="temp_coeff_pmax_pct_c" type="number" step="0.001" className={inputClass} /></label><label className={labelClass}>Isc temp coeff (%/°C)<input name="temp_coeff_isc_pct_c" type="number" step="0.001" className={inputClass} /></label><label className={labelClass}>Max system voltage (V)<input name="max_system_voltage_v" type="number" step="1" className={inputClass} /></label><label className={labelClass}>Efficiency (%)<input name="efficiency_pct" type="number" step="0.01" className={inputClass} /></label><label className={labelClass}>Width (mm)<input name="width_mm" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Height (mm)<input name="height_mm" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Weight (kg)<input name="weight_kg" type="number" step="0.1" className={inputClass} /></label><label className={`${labelClass} sm:col-span-2`}>Datasheet URL<input name="datasheet_url" type="url" placeholder="https://" className={inputClass} /></label><label className="flex items-center gap-2 text-xs font-semibold sm:col-span-2"><input name="bifacial" type="checkbox" /> Bifacial module</label><button className={`${buttonClass} sm:col-span-2`}>Save module as draft</button></div>
          </form>
        </section>
      ) : null}

      {activeTab === "inverters" ? (
        <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(400px,0.6fr)]">
          <article className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Power conversion register</p><h2 className="mt-2 text-2xl font-medium">Inverters / PCS</h2></div>{inverters?.length ? <div className="divide-y divide-[var(--line)]">{inverters.map((item) => <div key={item.id} className="p-5 md:px-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-sm font-semibold">{manufacturerMap.get(item.manufacturer_id)?.name ?? "Manufacturer"} · {item.model}</p><p className="mt-1 text-xs text-[var(--muted)]">{titleCase(item.inverter_type)} · {Number(item.rated_ac_power_kw)} kW AC · {item.mppt_count} MPPT · {Number(item.max_dc_voltage_v)} V max DC</p></div><Status value={item.status} /></div><div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted)]"><span>MPPT {Number(item.mppt_min_v)}–{Number(item.mppt_max_v)} V</span><span>Input {Number(item.max_input_current_per_mppt_a)} A/MPPT</span><span>Isc {Number(item.max_short_circuit_current_per_mppt_a)} A/MPPT</span><span>PV limit {item.max_pv_input_power_kw ?? "—"} kW</span>{item.datasheet_url ? <a href={item.datasheet_url} target="_blank" rel="noreferrer" className="underline underline-offset-2">Datasheet</a> : null}</div><div className="mt-4 flex gap-2">{item.status !== "approved" ? <form action={setEquipmentStatus}><input type="hidden" name="entity" value="inverter" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="approved" /><button className={secondaryButtonClass}>Approve</button></form> : null}{item.status !== "retired" ? <form action={setEquipmentStatus}><input type="hidden" name="entity" value="inverter" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="retired" /><button className={secondaryButtonClass}>Retire</button></form> : <form action={setEquipmentStatus}><input type="hidden" name="entity" value="inverter" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="draft" /><button className={secondaryButtonClass}>Restore draft</button></form>}</div></div>)}</div> : <div className="p-8 text-sm text-[var(--muted)]">No inverters recorded yet.</div>}</article>
          <form action={createInverter} className="h-fit border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Technical intake</p><h2 className="mt-2 text-2xl font-medium">Add inverter</h2></div><div className="grid gap-4 p-5 sm:grid-cols-2"><label className={`${labelClass} sm:col-span-2`}>Manufacturer<select name="manufacturer_id" required className={inputClass}><option value="">Select manufacturer</option>{activeManufacturers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className={`${labelClass} sm:col-span-2`}>Model<input name="model" required className={inputClass} /></label><label className={labelClass}>Type<select name="inverter_type" className={inputClass}><option value="grid_tied">Grid-tied</option><option value="hybrid">Hybrid</option><option value="off_grid">Off-grid</option><option value="pcs">PCS</option></select></label><label className={labelClass}>Phase<select name="phase" className={inputClass}><option value="three">Three phase</option><option value="single">Single phase</option></select></label><label className={labelClass}>Rated AC power (kW)<input name="rated_ac_power_kw" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Max PV input (kW)<input name="max_pv_input_power_kw" type="number" step="0.01" className={inputClass} /></label><label className={labelClass}>Max DC voltage (V)<input name="max_dc_voltage_v" type="number" step="0.1" required className={inputClass} /></label><label className={labelClass}>MPPT count<input name="mppt_count" type="number" step="1" min="1" required className={inputClass} /></label><label className={labelClass}>MPPT minimum (V)<input name="mppt_min_v" type="number" step="0.1" required className={inputClass} /></label><label className={labelClass}>MPPT maximum (V)<input name="mppt_max_v" type="number" step="0.1" required className={inputClass} /></label><label className={labelClass}>Max input / MPPT (A)<input name="max_input_current_per_mppt_a" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Max Isc / MPPT (A)<input name="max_short_circuit_current_per_mppt_a" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Battery voltage min (V)<input name="battery_voltage_min_v" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Battery voltage max (V)<input name="battery_voltage_max_v" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Max charge (kW)<input name="max_charge_power_kw" type="number" step="0.01" className={inputClass} /></label><label className={labelClass}>Max discharge (kW)<input name="max_discharge_power_kw" type="number" step="0.01" className={inputClass} /></label><label className={labelClass}>Max efficiency (%)<input name="max_efficiency_pct" type="number" step="0.01" className={inputClass} /></label><label className={`${labelClass} sm:col-span-2`}>Datasheet URL<input name="datasheet_url" type="url" placeholder="https://" className={inputClass} /></label><button className={`${buttonClass} sm:col-span-2`}>Save inverter as draft</button></div></form>
        </section>
      ) : null}

      {activeTab === "batteries" ? (
        <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(400px,0.6fr)]">
          <article className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Storage register</p><h2 className="mt-2 text-2xl font-medium">Batteries / BESS units</h2></div>{batteries?.length ? <div className="divide-y divide-[var(--line)]">{batteries.map((item) => <div key={item.id} className="p-5 md:px-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-sm font-semibold">{manufacturerMap.get(item.manufacturer_id)?.name ?? "Manufacturer"} · {item.model}</p><p className="mt-1 text-xs text-[var(--muted)]">{titleCase(item.chemistry)} · {Number(item.nominal_capacity_kwh)} kWh nominal · {Number(item.usable_capacity_kwh)} kWh usable · {Number(item.nominal_voltage_v)} V</p></div><Status value={item.status} /></div><div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted)]"><span>Charge {Number(item.max_charge_power_kw)} kW</span><span>Discharge {Number(item.max_discharge_power_kw)} kW</span><span>DoD {item.max_dod_pct ?? "—"}%</span><span>RTE {item.round_trip_efficiency_pct ?? "—"}%</span>{item.datasheet_url ? <a href={item.datasheet_url} target="_blank" rel="noreferrer" className="underline underline-offset-2">Datasheet</a> : null}</div><div className="mt-4 flex gap-2">{item.status !== "approved" ? <form action={setEquipmentStatus}><input type="hidden" name="entity" value="battery" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="approved" /><button className={secondaryButtonClass}>Approve</button></form> : null}{item.status !== "retired" ? <form action={setEquipmentStatus}><input type="hidden" name="entity" value="battery" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="retired" /><button className={secondaryButtonClass}>Retire</button></form> : <form action={setEquipmentStatus}><input type="hidden" name="entity" value="battery" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="status" value="draft" /><button className={secondaryButtonClass}>Restore draft</button></form>}</div></div>)}</div> : <div className="p-8 text-sm text-[var(--muted)]">No batteries recorded yet.</div>}</article>
          <form action={createBattery} className="h-fit border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Technical intake</p><h2 className="mt-2 text-2xl font-medium">Add battery</h2></div><div className="grid gap-4 p-5 sm:grid-cols-2"><label className={`${labelClass} sm:col-span-2`}>Manufacturer<select name="manufacturer_id" required className={inputClass}><option value="">Select manufacturer</option>{activeManufacturers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className={`${labelClass} sm:col-span-2`}>Model<input name="model" required className={inputClass} /></label><label className={labelClass}>Chemistry<select name="chemistry" className={inputClass}><option value="lfp">LFP</option><option value="nmc">NMC</option><option value="lead_acid">Lead acid</option><option value="other">Other</option></select></label><label className={labelClass}>Nominal capacity (kWh)<input name="nominal_capacity_kwh" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Usable capacity (kWh)<input name="usable_capacity_kwh" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Nominal voltage (V)<input name="nominal_voltage_v" type="number" step="0.1" required className={inputClass} /></label><label className={labelClass}>Operating voltage min (V)<input name="operating_voltage_min_v" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Operating voltage max (V)<input name="operating_voltage_max_v" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Max charge power (kW)<input name="max_charge_power_kw" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Max discharge power (kW)<input name="max_discharge_power_kw" type="number" step="0.01" required className={inputClass} /></label><label className={labelClass}>Maximum DoD (%)<input name="max_dod_pct" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Round-trip efficiency (%)<input name="round_trip_efficiency_pct" type="number" step="0.1" className={inputClass} /></label><label className={labelClass}>Cycle life<input name="cycle_life" type="number" step="1" className={inputClass} /></label><label className={`${labelClass} sm:col-span-2`}>Datasheet URL<input name="datasheet_url" type="url" placeholder="https://" className={inputClass} /></label><button className={`${buttonClass} sm:col-span-2`}>Save battery as draft</button></div></form>
        </section>
      ) : null}

      {activeTab === "compatibility" ? (
        <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.3fr)_minmax(380px,0.7fr)]">
          <article className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Approved pairing matrix</p><h2 className="mt-2 text-2xl font-medium">Inverter ↔ Battery compatibility</h2></div>{compatibility?.length ? <div className="divide-y divide-[var(--line)]">{compatibility.map((item) => { const inverter = inverterMap.get(item.inverter_id); const battery = batteryMap.get(item.battery_id); return <div key={item.id} className="grid gap-3 p-5 md:grid-cols-[minmax(0,1fr)_150px_130px] md:items-center md:px-6"><div><p className="text-sm font-semibold">{inverter ? `${manufacturerMap.get(inverter.manufacturer_id)?.name ?? ""} ${inverter.model}` : "Inverter"} ↔ {battery ? `${manufacturerMap.get(battery.manufacturer_id)?.name ?? ""} ${battery.model}` : "Battery"}</p><p className="mt-1 text-xs text-[var(--muted)]">Units {item.min_battery_units ?? "—"} to {item.max_battery_units ?? "—"}{item.notes ? ` · ${item.notes}` : ""}</p></div><Status value={item.status} /><p className="text-xs text-[var(--muted)] md:text-right">{inverter?.inverter_type ? titleCase(inverter.inverter_type) : ""}</p></div>; })}</div> : <div className="p-8 text-sm text-[var(--muted)]">No inverter/battery compatibility records yet.</div>}</article>
          <form action={createCompatibility} className="h-fit border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Compatibility governance</p><h2 className="mt-2 text-2xl font-medium">Record pairing</h2></div><div className="space-y-5 p-5"><label className={labelClass}>Battery-capable inverter<select name="inverter_id" required className={inputClass}><option value="">Select inverter / PCS</option>{batteryCapableInverters.map((item) => <option key={item.id} value={item.id}>{manufacturerMap.get(item.manufacturer_id)?.name} · {item.model}</option>)}</select></label><label className={labelClass}>Battery<select name="battery_id" required className={inputClass}><option value="">Select battery</option>{availableBatteries.map((item) => <option key={item.id} value={item.id}>{manufacturerMap.get(item.manufacturer_id)?.name} · {item.model}</option>)}</select></label><label className={labelClass}>Compatibility state<select name="status" className={inputClass}><option value="approved">Approved</option><option value="conditional">Conditional</option><option value="not_compatible">Not compatible</option></select></label><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Minimum units<input name="min_battery_units" type="number" step="1" min="1" className={inputClass} /></label><label className={labelClass}>Maximum units<input name="max_battery_units" type="number" step="1" min="1" className={inputClass} /></label></div><label className={labelClass}>Engineering notes<textarea name="notes" rows={4} className="mt-2 w-full border border-[var(--line)] bg-[var(--background)] p-3 text-sm font-normal" /></label><button className={`${buttonClass} w-full`}>Save compatibility record</button><p className="text-xs leading-5 text-[var(--muted)]">Where both voltage windows are known, HelioCoreOS blocks an approved pairing if the ranges do not overlap.</p></div></form>
        </section>
      ) : null}
    </div>
  );
}
