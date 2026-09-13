"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { systemTypeLabels } from "@/lib/engineering/design-rules";
import type { LoadProfileSource, SystemType } from "@/lib/engineering/types";
import {
  importIntervalData,
  loadLoadProfileWorkspace,
  markProfileReady,
  removeAppliance,
  removeUtilityBill,
  saveAppliance,
  saveManualSummary,
  saveUtilityBill,
  type LoadProfileWorkspace,
} from "@/lib/neon/load-profiles";

type Props = { params: Promise<{ id: string }> };
const sourceLabels: Record<LoadProfileSource, string> = { interval_data: "Interval data", utility_bills: "Utility bills", appliance_schedule: "Appliance schedule", manual_summary: "Manual summary" };
function fmt(value: number, digits = 1) { return new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits }).format(value); }
function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()); }

export default function LoadProfilePage({ params }: Props) {
  const { id } = use(params);
  const [workspace, setWorkspace] = useState<LoadProfileWorkspace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try { setError(null); setWorkspace(await loadLoadProfileWorkspace(id)); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Load Profile could not be loaded."); }
  }, [id]);

  useEffect(() => { let cancelled = false; loadLoadProfileWorkspace(id).then((data) => { if (!cancelled) setWorkspace(data); }).catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Load Profile could not be loaded."); }); return () => { cancelled = true; }; }, [id]);

  async function run(action: () => Promise<unknown>, success: string) {
    try { setBusy(true); setError(null); setMessage(null); await action(); setMessage(success); await refresh(); }
    catch (actionError) { setError(actionError instanceof Error ? actionError.message : "The change could not be saved."); }
    finally { setBusy(false); }
  }

  if (!workspace && !error) return <div className="mx-auto max-w-[1400px] py-16 text-sm text-[var(--muted)]">Loading governed Load Profile from Neon…</div>;
  if (!workspace) return <div className="mx-auto max-w-[1000px] py-16"><div className="border border-red-300 bg-red-50 p-5 text-sm text-red-800">{error}</div></div>;

  const { profile, intake, opportunity, site, summary, assessments, bills, appliances, intervals } = workspace;
  const blocking = assessments.some((assessment) => assessment.severity === "error");
  const calculatorHref = intake?.id ? `/dashboard/engineering/calculators/${intake.id}` : "/dashboard/engineering";

  return <div className="mx-auto max-w-[1500px]" data-testid="load-profile-neon-workspace">
    <header className="border-b border-[var(--line)] pb-7"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Load Profile · Neon Data API</p><h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">{profile.name}</h1><p className="mt-4 text-sm text-[var(--muted)]">{opportunity?.reference ?? "Opportunity"} · {opportunity?.title ?? "Engineering demand model"} · {site?.name ?? "Site"}</p></div><div className="flex flex-wrap gap-3"><Link href="/dashboard/engineering" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Engineering register</Link><span className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">{intake ? systemTypeLabels[intake.system_type as SystemType] : "System type"}</span></div></div></header>

    {error ? <div className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
    {message ? <div className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div> : null}

    <section className="mt-7 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-6">
      {[ ["Source", sourceLabels[profile.source as LoadProfileSource]], ["Annual demand", `${fmt(summary.annualEnergyKwh)} kWh`], ["Average daily", `${fmt(summary.averageDailyEnergyKwh)} kWh`], ["Peak demand", `${fmt(summary.peakDemandKw)} kW`], ["Essential peak", `${fmt(summary.essentialPeakDemandKw)} kW`], ["Evidence records", fmt(summary.intervalCount ?? 0, 0)] ].map(([label,value]) => <article key={label} className="bg-[var(--background)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p><p className="mt-4 text-lg font-medium">{value}</p></article>)}
    </section>

    <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.55fr)]"><div className="space-y-7">
      {profile.source === "manual_summary" ? <ManualPanel disabled={busy} profile={profile} onSave={(values) => run(() => saveManualSummary(id, values), "Manual load summary saved and recalculated.")} /> : null}
      {profile.source === "utility_bills" ? <BillsPanel disabled={busy} bills={bills} onSave={(values) => run(() => saveUtilityBill(id, values), "Utility bill saved and annual demand recalculated.")} onDelete={(billId) => run(() => removeUtilityBill(id, billId), "Utility bill removed and demand recalculated.")} /> : null}
      {profile.source === "appliance_schedule" ? <AppliancePanel disabled={busy} appliances={appliances} onSave={(values) => run(() => saveAppliance(id, values), "Load item added and demand recalculated.")} onDelete={(applianceId) => run(() => removeAppliance(id, applianceId), "Load item removed and demand recalculated.")} /> : null}
      {profile.source === "interval_data" ? <IntervalPanel disabled={busy} profile={profile} rowCount={intervals.length} onImport={(values) => run(() => importIntervalData(id, values), "Interval evidence imported and demand recalculated.")} /> : null}
    </div>

    <aside className="space-y-7"><article className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Engineering gate</p><h2 className="mt-2 text-2xl font-medium">Load-profile quality</h2></div><div className="space-y-3 p-5">{assessments.map((assessment) => <div key={assessment.code} className={`border px-4 py-3 ${assessment.severity === "error" ? "border-red-300 bg-red-50" : assessment.severity === "warning" ? "border-amber-300 bg-amber-50" : "border-emerald-300 bg-emerald-50"}`}><div className="flex justify-between gap-3"><p className="text-sm font-semibold">{assessment.title}</p><span className="text-[10px] font-bold uppercase">{assessment.severity}</span></div><p className="mt-2 text-xs leading-5 opacity-80">{assessment.detail}</p></div>)}</div><div className="border-t border-[var(--line)] p-5">{profile.status === "ready" ? <div className="space-y-3"><div className="border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">Engineering-ready</div><Link href={calculatorHref} className="inline-flex min-h-11 w-full items-center justify-center bg-[var(--foreground)] px-4 text-xs font-semibold text-white">Open Calculator</Link></div> : <button disabled={blocking || busy} onClick={() => run(async () => { const intakeId = await markProfileReady(id); if (!intakeId) throw new Error("Engineering intake unavailable."); }, "Load Profile approved. Calculator is now available.")} className="min-h-11 w-full border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)] disabled:border-[var(--line)] disabled:text-[var(--muted)]">Mark Load Profile ready</button>}</div></article>

      <article className="border border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Engineering context</p><dl className="mt-4 divide-y divide-[var(--line)] text-sm"><div className="py-3"><dt className="text-xs text-[var(--muted)]">System type</dt><dd className="mt-1 font-medium">{intake ? systemTypeLabels[intake.system_type as SystemType] : "Not linked"}</dd></div><div className="py-3"><dt className="text-xs text-[var(--muted)]">Design objective</dt><dd className="mt-1 font-medium">{intake?.design_objective ? titleCase(intake.design_objective) : "Not recorded"}</dd></div><div className="py-3"><dt className="text-xs text-[var(--muted)]">Data quality</dt><dd className="mt-1 font-medium">{titleCase(profile.data_quality)}</dd></div><div className="py-3"><dt className="text-xs text-[var(--muted)]">Project boundary</dt><dd className="mt-1 font-medium text-[var(--muted)]">Contract required</dd></div></dl></article>
    </aside></section>
  </div>;
}

function ManualPanel({ profile, disabled, onSave }: { profile: any; disabled: boolean; onSave: (v: { daily:number; peak:number; essentialPeak:number; assumptions?:string }) => void }) {
  return <form onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); onSave({ daily:Number(f.get("daily")), peak:Number(f.get("peak")), essentialPeak:Number(f.get("essential")), assumptions:String(f.get("assumptions") ?? "") }); }} className="border border-[var(--line)] p-5"><h2 className="text-xl font-medium">Manual demand summary</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><Field name="daily" label="Average daily kWh" type="number" defaultValue={profile.average_daily_energy_kwh ?? ""} /><Field name="peak" label="Peak demand kW" type="number" defaultValue={profile.peak_demand_kw ?? ""} /><Field name="essential" label="Essential peak kW" type="number" defaultValue={profile.essential_peak_demand_kw ?? 0} /></div><label className="mt-4 block text-xs font-semibold">Assumptions<textarea name="assumptions" defaultValue={profile.assumptions ?? ""} className="mt-2 min-h-24 w-full border border-[var(--line)] bg-transparent p-3 text-sm font-normal" /></label><button disabled={disabled} className="mt-4 min-h-10 bg-[var(--foreground)] px-4 text-xs font-semibold text-white">Save summary</button></form>;
}

function BillsPanel({ bills, disabled, onSave, onDelete }: { bills:any[]; disabled:boolean; onSave:(v:{month:string;energyKwh:number;peakDemandKw:number|null;costAmount:number|null})=>void; onDelete:(id:string)=>void }) {
  return <section className="border border-[var(--line)]"><form onSubmit={(e)=>{e.preventDefault();const f=new FormData(e.currentTarget);onSave({month:String(f.get("month")),energyKwh:Number(f.get("energy")),peakDemandKw:f.get("peak")?Number(f.get("peak")):null,costAmount:f.get("cost")?Number(f.get("cost")):null});}} className="p-5"><h2 className="text-xl font-medium">Utility bill history</h2><div className="mt-4 grid gap-3 sm:grid-cols-4"><Field name="month" label="Month" type="month" /><Field name="energy" label="Energy kWh" type="number" /><Field name="peak" label="Peak kW" type="number" /><Field name="cost" label="Cost" type="number" /></div><button disabled={disabled} className="mt-4 min-h-10 bg-[var(--foreground)] px-4 text-xs font-semibold text-white">Add / update bill</button></form><div className="divide-y divide-[var(--line)] border-t border-[var(--line)]">{bills.map((bill)=><div key={bill.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm"><span>{String(bill.bill_month).slice(0,7)} · {fmt(Number(bill.energy_kwh))} kWh{bill.peak_demand_kw != null ? ` · ${fmt(Number(bill.peak_demand_kw))} kW` : ""}</span><button disabled={disabled} onClick={()=>onDelete(bill.id)} className="text-xs font-semibold text-red-700">Remove</button></div>)}</div></section>;
}

function AppliancePanel({ appliances, disabled, onSave, onDelete }: { appliances:any[]; disabled:boolean; onSave:(v:any)=>void; onDelete:(id:string)=>void }) {
  return <section className="border border-[var(--line)]"><form onSubmit={(e)=>{e.preventDefault();const f=new FormData(e.currentTarget);onSave({name:String(f.get("name")),category:String(f.get("category")??""),ratedKw:Number(f.get("rated")),quantity:Number(f.get("quantity")),hoursPerDay:Number(f.get("hours")),daysPerWeek:Number(f.get("days")),simultaneityPct:Number(f.get("simultaneity")),startHour:Number(f.get("start")),essential:f.get("essential")==="on"});}} className="p-5"><h2 className="text-xl font-medium">Appliance / process schedule</h2><div className="mt-4 grid gap-3 sm:grid-cols-4"><Field name="name" label="Load name" /><Field name="category" label="Category" /><Field name="rated" label="Rated kW" type="number" /><Field name="quantity" label="Quantity" type="number" defaultValue={1} /><Field name="hours" label="Hours/day" type="number" /><Field name="days" label="Days/week" type="number" defaultValue={7} /><Field name="simultaneity" label="Simultaneity %" type="number" defaultValue={100} /><Field name="start" label="Start hour" type="number" defaultValue={8} /></div><label className="mt-4 flex items-center gap-2 text-xs font-semibold"><input name="essential" type="checkbox" />Essential load</label><button disabled={disabled} className="mt-4 min-h-10 bg-[var(--foreground)] px-4 text-xs font-semibold text-white">Add load item</button></form><div className="divide-y divide-[var(--line)] border-t border-[var(--line)]">{appliances.map((item)=><div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3 text-sm"><span>{item.name} · {fmt(Number(item.rated_kw))} kW × {item.quantity}</span><button disabled={disabled} onClick={()=>onDelete(item.id)} className="text-xs font-semibold text-red-700">Remove</button></div>)}</div></section>;
}

function IntervalPanel({ profile, rowCount, disabled, onImport }: { profile:any; rowCount:number; disabled:boolean; onImport:(v:{csv:string;intervalMinutes:15|30|60;timezone:string})=>void }) {
  return <form onSubmit={(e)=>{e.preventDefault();const f=new FormData(e.currentTarget);onImport({csv:String(f.get("csv")),intervalMinutes:Number(f.get("minutes")) as 15|30|60,timezone:String(f.get("timezone")||"Asia/Karachi")});}} className="border border-[var(--line)] p-5"><h2 className="text-xl font-medium">Interval demand evidence</h2><p className="mt-2 text-sm text-[var(--muted)]">{rowCount} rows currently governed. CSV headers: timestamp, demand_kw; optional energy_kwh, essential, category.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Interval<select name="minutes" defaultValue={profile.interval_minutes ?? 30} className="mt-2 min-h-10 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">60 minutes</option></select></label><Field name="timezone" label="Timezone" defaultValue={profile.timezone ?? "Asia/Karachi"} /></div><label className="mt-4 block text-xs font-semibold">CSV data<textarea required name="csv" className="mt-2 min-h-56 w-full border border-[var(--line)] bg-transparent p-3 font-mono text-xs" placeholder="timestamp,demand_kw,energy_kwh,essential,category" /></label><button disabled={disabled} className="mt-4 min-h-10 bg-[var(--foreground)] px-4 text-xs font-semibold text-white">Replace interval dataset</button></form>;
}

function Field({ name, label, type="text", defaultValue }: { name:string; label:string; type?:string; defaultValue?:string|number }) { return <label className="text-xs font-semibold">{label}<input required={name !== "category" && name !== "peak" && name !== "cost"} name={name} type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "any" : undefined} defaultValue={defaultValue} className="mt-2 min-h-10 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>; }
