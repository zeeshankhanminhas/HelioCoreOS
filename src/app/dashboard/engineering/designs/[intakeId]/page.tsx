import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SystemType } from "@/lib/engineering/types";
import { DesignWorkspace } from "./design-workspace";

type Props = {
  params: Promise<{ intakeId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function EngineeringDesignPage({ params, searchParams }: Props) {
  const { intakeId } = await params;
  const messages = await searchParams;
  const supabase = await createClient();

  const { data: intake } = await supabase
    .from("engineering_intakes")
    .select("id,opportunity_id,site_id,load_profile_id,system_type,design_objective,status,target_pv_capacity_kwp,autonomy_hours,export_limit_kw,reserve_soc_pct")
    .eq("id", intakeId)
    .maybeSingle();
  if (!intake?.load_profile_id) notFound();

  const [{ data: opportunity }, { data: site }, { data: load }, { data: modules }, { data: inverters }, { data: batteries }, { data: compatibility }, { data: manufacturers }, { data: revisions }] = await Promise.all([
    supabase.from("opportunities").select("id,reference,title,estimated_pv_kwp").eq("id", intake.opportunity_id).maybeSingle(),
    supabase.from("sites").select("id,name,postcode").eq("id", intake.site_id).maybeSingle(),
    supabase.from("load_profiles").select("id,status,data_quality,average_daily_energy_kwh,peak_demand_kw,essential_peak_demand_kw,annual_energy_kwh").eq("id", intake.load_profile_id).maybeSingle(),
    supabase.from("pv_modules").select("id,manufacturer_id,model,pmax_w,voc_v,vmp_v,isc_a,imp_a,temp_coeff_voc_pct_c,max_system_voltage_v").eq("status", "approved").order("model"),
    supabase.from("inverters").select("id,manufacturer_id,model,inverter_type,rated_ac_power_kw,max_pv_input_power_kw,max_dc_voltage_v,mppt_min_v,mppt_max_v,mppt_count,max_input_current_per_mppt_a,max_short_circuit_current_per_mppt_a,max_discharge_power_kw").eq("status", "approved").order("model"),
    supabase.from("batteries").select("id,manufacturer_id,model,usable_capacity_kwh,max_discharge_power_kw").eq("status", "approved").order("model"),
    supabase.from("inverter_battery_compatibility").select("inverter_id,battery_id,status,min_battery_units,max_battery_units"),
    supabase.from("equipment_manufacturers").select("id,name").eq("status", "active"),
    supabase.from("system_designs").select("id,design_reference,revision,status,array_capacity_kwp,inverter_capacity_kw,battery_capacity_kwh,created_at,engine_version").eq("engineering_intake_id", intakeId).order("revision", { ascending: false }),
  ]);

  if (!opportunity || !site || !load) notFound();
  const manufacturerMap = new Map((manufacturers ?? []).map((item) => [item.id, item.name]));

  const moduleOptions = (modules ?? [])
    .filter((item) => item.temp_coeff_voc_pct_c != null && item.max_system_voltage_v != null)
    .map((item) => ({
      id: item.id,
      label: `${manufacturerMap.get(item.manufacturer_id) ?? "Manufacturer"} · ${item.model} · ${Number(item.pmax_w)} W`,
      model: item.model,
      pmaxW: Number(item.pmax_w),
      vocV: Number(item.voc_v),
      vmpV: Number(item.vmp_v),
      iscA: Number(item.isc_a),
      impA: Number(item.imp_a),
      tempCoeffVocPctC: Number(item.temp_coeff_voc_pct_c),
      maxSystemVoltageV: Number(item.max_system_voltage_v),
    }));

  const inverterOptions = (inverters ?? [])
    .filter((item) => item.max_pv_input_power_kw != null)
    .map((item) => ({
      id: item.id,
      label: `${manufacturerMap.get(item.manufacturer_id) ?? "Manufacturer"} · ${item.model} · ${Number(item.rated_ac_power_kw)} kW`,
      model: item.model,
      inverterType: item.inverter_type as "grid_tied" | "off_grid" | "hybrid" | "pcs",
      ratedAcPowerKw: Number(item.rated_ac_power_kw),
      maxPvInputPowerKw: Number(item.max_pv_input_power_kw),
      maxDcVoltageV: Number(item.max_dc_voltage_v),
      mpptMinV: Number(item.mppt_min_v),
      mpptMaxV: Number(item.mppt_max_v),
      mpptCount: Number(item.mppt_count),
      maxInputCurrentPerMpptA: Number(item.max_input_current_per_mppt_a),
      maxShortCircuitCurrentPerMpptA: Number(item.max_short_circuit_current_per_mppt_a),
      maxDischargePowerKw: item.max_discharge_power_kw == null ? null : Number(item.max_discharge_power_kw),
    }));

  const batteryOptions = (batteries ?? []).map((item) => ({
    id: item.id,
    label: `${manufacturerMap.get(item.manufacturer_id) ?? "Manufacturer"} · ${item.model} · ${Number(item.usable_capacity_kwh)} kWh usable`,
    model: item.model,
    usableCapacityKwh: Number(item.usable_capacity_kwh),
    maxDischargePowerKw: Number(item.max_discharge_power_kw),
  }));

  const compatibilityOptions = (compatibility ?? []).map((item) => ({
    inverterId: item.inverter_id,
    batteryId: item.battery_id,
    status: item.status,
    minBatteryUnits: item.min_battery_units == null ? null : Number(item.min_battery_units),
    maxBatteryUnits: item.max_battery_units == null ? null : Number(item.max_battery_units),
  }));

  const initialTarget = intake.target_pv_capacity_kwp == null ? opportunity.estimated_pv_kwp == null ? null : Number(opportunity.estimated_pv_kwp) : Number(intake.target_pv_capacity_kwp);
  const ready = load.status === "ready";

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="border-b border-[var(--line)] pb-7">
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]">
          <Link href="/dashboard/engineering" className="hover:text-[var(--foreground)]">Engineering</Link><span>/</span><span>{opportunity.reference}</span>
        </div>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Design engine · V1</p>
            <h1 className="mt-2 text-4xl font-medium tracking-[-0.045em] md:text-5xl">{opportunity.reference} engineering design</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">{site.name}{site.postcode ? ` · ${site.postcode}` : ""} · {intake.system_type.replaceAll("_", " ")} · {intake.design_objective.replaceAll("_", " ")}</p>
          </div>
          <div className="grid grid-cols-3 border border-[var(--line)] text-center text-xs">
            <div className="border-r border-[var(--line)] px-4 py-3"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Load</p><p className="mt-1 font-semibold">{load.data_quality}</p></div>
            <div className="border-r border-[var(--line)] px-4 py-3"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Peak</p><p className="mt-1 font-semibold tabular-nums">{Number(load.peak_demand_kw ?? 0).toFixed(1)} kW</p></div>
            <div className="px-4 py-3"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Daily</p><p className="mt-1 font-semibold tabular-nums">{Number(load.average_daily_energy_kwh ?? 0).toFixed(1)} kWh</p></div>
          </div>
        </div>
      </header>

      {messages.error ? <div className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{messages.error}</div> : null}
      {messages.saved ? <div className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Design revision saved with its calculation and validation snapshots.</div> : null}

      {!ready ? (
        <section className="mt-7 border border-amber-300 bg-amber-50 p-6 text-amber-900">
          <h2 className="text-lg font-semibold">Load profile is not ready</h2>
          <p className="mt-2 text-sm leading-6">The design engine is intentionally locked until the shared load profile passes its engineering gate.</p>
          <Link href={`/dashboard/engineering/load-profiles/${load.id}`} className="mt-4 inline-block border border-amber-500 px-4 py-2 text-xs font-semibold">Open load profile</Link>
        </section>
      ) : moduleOptions.length === 0 || inverterOptions.length === 0 ? (
        <section className="mt-7 border border-amber-300 bg-amber-50 p-6 text-amber-900">
          <h2 className="text-lg font-semibold">Approved equipment is incomplete</h2>
          <p className="mt-2 text-sm leading-6">At least one approved module and one approved inverter with calculation-critical specifications are required.</p>
          <Link href="/dashboard/engineering/equipment" className="mt-4 inline-block border border-amber-500 px-4 py-2 text-xs font-semibold">Open Equipment Library</Link>
        </section>
      ) : (
        <div className="mt-7">
          <DesignWorkspace
            intakeId={intake.id}
            systemType={intake.system_type as SystemType}
            autonomyHours={intake.autonomy_hours == null ? null : Number(intake.autonomy_hours)}
            initialTargetPvKwp={initialTarget}
            load={{
              averageDailyEnergyKwh: Number(load.average_daily_energy_kwh ?? 0),
              peakDemandKw: Number(load.peak_demand_kw ?? 0),
              essentialPeakDemandKw: Number(load.essential_peak_demand_kw ?? 0),
            }}
            modules={moduleOptions}
            inverters={inverterOptions}
            batteries={batteryOptions}
            compatibility={compatibilityOptions}
          />
        </div>
      )}

      <section className="mt-8 border border-[var(--line)]">
        <div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Revision register</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Saved design history</h2></div>
        {revisions?.length ? <div className="divide-y divide-[var(--line)]">{revisions.map((revision) => <article key={revision.id} className="grid gap-3 p-5 md:grid-cols-[1fr_90px_120px_120px_140px_120px] md:items-center md:px-6"><div><p className="text-sm font-semibold">{revision.design_reference}</p><p className="mt-1 text-xs text-[var(--muted)]">Engine {revision.engine_version ?? "legacy"}</p></div><p className="text-xs">Rev {revision.revision}</p><p className="text-xs capitalize">{revision.status}</p><p className="text-xs tabular-nums">{revision.array_capacity_kwp == null ? "—" : `${Number(revision.array_capacity_kwp).toFixed(2)} kWp`}</p><p className="text-xs tabular-nums">{revision.battery_capacity_kwh == null ? "No BESS" : `${Number(revision.battery_capacity_kwh).toFixed(1)} kWh`}</p><p className="text-xs tabular-nums text-[var(--muted)] md:text-right">{date.format(new Date(revision.created_at))}</p></article>)}</div> : <div className="px-6 py-10 text-sm text-[var(--muted)]">No design revision has been saved for this intake yet.</div>}
      </section>
    </div>
  );
}
