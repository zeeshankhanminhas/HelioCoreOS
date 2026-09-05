import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assessLoadProfile } from "@/lib/engineering/load-profile";
import { systemTypeLabels } from "@/lib/engineering/design-rules";
import type { LoadProfileSource, LoadProfileSummary, SystemType } from "@/lib/engineering/types";
import {
  addAppliance,
  addUtilityBill,
  deleteAppliance,
  deleteUtilityBill,
  importIntervalCsv,
  markLoadProfileReady,
  saveManualLoadSummary,
} from "../actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
};

const sourceLabels: Record<LoadProfileSource, string> = {
  interval_data: "Interval data",
  utility_bills: "Utility bills",
  appliance_schedule: "Appliance schedule",
  manual_summary: "Manual summary",
};

const assessmentClass = {
  pass: "border-emerald-300 bg-emerald-50 text-emerald-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  error: "border-red-300 bg-red-50 text-red-900",
};

function number(value: unknown) {
  return value == null ? 0 : Number(value);
}

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits }).format(value);
}

function intervalCurve(rows: { interval_start: string; demand_kw: number | string }[], timezone: string) {
  const totals = Array.from({ length: 24 }, () => 0);
  const counts = Array.from({ length: 24 }, () => 0);
  const hourFormatter = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", hourCycle: "h23" });
  for (const row of rows) {
    const hour = Number(hourFormatter.format(new Date(row.interval_start)));
    if (Number.isInteger(hour) && hour >= 0 && hour < 24) {
      totals[hour] += Number(row.demand_kw);
      counts[hour] += 1;
    }
  }
  return totals.map((total, index) => counts[index] ? total / counts[index] : 0);
}

function applianceCurve(rows: { rated_kw: number | string; quantity: number; hours_per_day: number | string; simultaneity_pct: number | string; start_hour: number | string }[]) {
  return Array.from({ length: 24 }, (_, hour) => rows.reduce((sum, row) => {
    const start = Number(row.start_hour);
    const duration = Number(row.hours_per_day);
    const elapsed = (hour - start + 24) % 24;
    if (elapsed >= duration) return sum;
    return sum + Number(row.rated_kw) * Number(row.quantity) * (Number(row.simultaneity_pct) / 100);
  }, 0));
}

function DailyCurve({ values }: { values: number[] }) {
  const max = Math.max(...values, 0);
  return (
    <div>
      <div className="flex h-44 items-end gap-1 border-b border-l border-[var(--line)] px-2 pt-4">
        {values.map((value, hour) => (
          <div key={hour} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full min-w-1 bg-[var(--accent)] opacity-70 transition-opacity group-hover:opacity-100"
              style={{ height: `${max > 0 ? Math.max(2, (value / max) * 100) : 2}%` }}
              title={`${String(hour).padStart(2, "0")}:00 · ${formatNumber(value, 2)} kW`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] tabular-nums text-[var(--muted)]"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span></div>
    </div>
  );
}

export default async function LoadProfilePage({ params, searchParams }: Props) {
  const { id } = await params;
  const messages = await searchParams;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("load_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  const [{ data: intake }, { data: opportunity }, { data: site }, { data: bills }, { data: appliances }, { data: intervals }] = await Promise.all([
    supabase.from("engineering_intakes").select("id,system_type,design_objective,status,autonomy_hours,export_limit_kw,reserve_soc_pct").eq("load_profile_id", id).maybeSingle(),
    supabase.from("opportunities").select("reference,title").eq("id", profile.opportunity_id).maybeSingle(),
    supabase.from("sites").select("name,postcode,address").eq("id", profile.site_id).maybeSingle(),
    profile.source === "utility_bills" ? supabase.from("load_profile_utility_bills").select("id,bill_month,energy_kwh,peak_demand_kw,cost_amount").eq("load_profile_id", id).order("bill_month", { ascending: false }) : Promise.resolve({ data: [] }),
    profile.source === "appliance_schedule" ? supabase.from("load_profile_appliances").select("id,name,category,rated_kw,quantity,hours_per_day,days_per_week,simultaneity_pct,start_hour,essential").eq("load_profile_id", id).order("created_at") : Promise.resolve({ data: [] }),
    profile.source === "interval_data" ? supabase.from("load_profile_intervals").select("interval_start,demand_kw,essential").eq("load_profile_id", id).order("interval_start").limit(10000) : Promise.resolve({ data: [] }),
  ]);

  const summary: LoadProfileSummary = {
    annualEnergyKwh: number(profile.annual_energy_kwh),
    averageDailyEnergyKwh: number(profile.average_daily_energy_kwh),
    peakDemandKw: number(profile.peak_demand_kw),
    essentialPeakDemandKw: number(profile.essential_peak_demand_kw),
    intervalCount: profile.source === "interval_data" ? (intervals?.length ?? 0) : profile.source === "utility_bills" ? (bills?.length ?? 0) : profile.source === "appliance_schedule" ? (appliances?.length ?? 0) : summaryRecordCount(profile),
    coveredHours: profile.source === "interval_data" ? (intervals?.length ?? 0) * (number(profile.interval_minutes) / 60) : undefined,
  };

  const recordCount = profile.source === "interval_data" ? (intervals?.length ?? 0) : profile.source === "utility_bills" ? (bills?.length ?? 0) : profile.source === "appliance_schedule" ? (appliances?.length ?? 0) : summary.intervalCount;
  const assessments = assessLoadProfile(profile.source as LoadProfileSource, summary, recordCount);
  const blocking = assessments.some((assessment) => assessment.severity === "error");
  const timezone = profile.timezone || "Asia/Karachi";
  const curve = profile.source === "interval_data" ? intervalCurve(intervals ?? [], timezone) : profile.source === "appliance_schedule" ? applianceCurve(appliances ?? []) : Array.from({ length: 24 }, () => 0);
  const hasCurve = curve.some((value) => value > 0);

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="border-b border-[var(--line)] pb-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em]">
              <span className="text-[var(--accent)]">Load Profile V1</span><span className="text-[var(--muted)]">/</span><span>{sourceLabels[profile.source as LoadProfileSource]}</span><span className="text-[var(--muted)]">/</span><span>{profile.status}</span>
            </div>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">{profile.name}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">{opportunity?.reference ?? "Opportunity"} · {opportunity?.title ?? "Engineering demand model"} · {site?.name ?? "Site"}{site?.postcode ? ` · ${site.postcode}` : ""}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/engineering" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Engineering register</Link>
            <span className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">{intake ? systemTypeLabels[intake.system_type as SystemType] : "System type"}</span>
          </div>
        </div>
      </header>

      {messages.error ? <div className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{messages.error}</div> : null}
      {messages.updated ? <div className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{messages.updated}</div> : null}

      <section className="mt-7 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Annual demand", `${formatNumber(summary.annualEnergyKwh)} kWh`],
          ["Average daily", `${formatNumber(summary.averageDailyEnergyKwh)} kWh`],
          ["Peak demand", `${formatNumber(summary.peakDemandKw)} kW`],
          ["Essential peak", `${formatNumber(summary.essentialPeakDemandKw)} kW`],
          ["Evidence records", formatNumber(recordCount, 0)],
        ].map(([label, value]) => (
          <article key={label} className="bg-[var(--background)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p><p className="mt-5 text-lg font-medium tracking-[-0.02em]">{value}</p></article>
        ))}
      </section>

      <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(330px,0.6fr)]">
        <div className="space-y-7">
          <article className="border border-[var(--line)]">
            <div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Demand shape</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Typical daily load curve</h2></div>
            <div className="p-5 md:p-6">
              {hasCurve ? <DailyCurve values={curve} /> : <div className="py-12 text-sm text-[var(--muted)]">A daily curve becomes available from interval data or a timed appliance schedule. Utility bills and manual summaries establish energy demand but do not invent an hourly shape.</div>}
            </div>
          </article>

          {profile.source === "interval_data" ? <IntervalEditor profileId={id} intervalMinutes={profile.interval_minutes} timezone={timezone} /> : null}
          {profile.source === "utility_bills" ? <UtilityBillEditor profileId={id} bills={bills ?? []} /> : null}
          {profile.source === "appliance_schedule" ? <ApplianceEditor profileId={id} appliances={appliances ?? []} /> : null}
          {profile.source === "manual_summary" ? <ManualEditor profileId={id} profile={profile} /> : null}
        </div>

        <aside className="space-y-7">
          <article className="border border-[var(--line)]">
            <div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Engineering gate</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Load-profile quality</h2></div>
            <div className="space-y-3 p-5">
              {assessments.map((assessment) => <div key={assessment.code} className={`border px-4 py-3 ${assessmentClass[assessment.severity]}`}><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold">{assessment.title}</p><span className="text-[10px] font-semibold uppercase tracking-[0.14em]">{assessment.severity}</span></div><p className="mt-2 text-xs leading-5 opacity-80">{assessment.detail}</p></div>)}
            </div>
            <div className="border-t border-[var(--line)] p-5">
              {profile.status === "ready" ? <div className="border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">Ready for engineering calculations</div> : <form action={markLoadProfileReady}><input type="hidden" name="profile_id" value={id} /><button disabled={blocking} className="min-h-11 w-full border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)] disabled:cursor-not-allowed disabled:border-[var(--line)] disabled:text-[var(--muted)]">Mark load profile ready</button></form>}
            </div>
          </article>

          <article className="border border-[var(--line)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Engineering context</p>
            <dl className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm">
              <div className="py-4"><dt className="text-xs text-[var(--muted)]">System type</dt><dd className="mt-1 font-medium">{intake ? systemTypeLabels[intake.system_type as SystemType] : "Not linked"}</dd></div>
              <div className="py-4"><dt className="text-xs text-[var(--muted)]">Design objective</dt><dd className="mt-1 font-medium">{intake?.design_objective?.replaceAll("_", " ") ?? "Not recorded"}</dd></div>
              <div className="py-4"><dt className="text-xs text-[var(--muted)]">Data quality</dt><dd className="mt-1 font-medium">{profile.data_quality}</dd></div>
              <div className="py-4"><dt className="text-xs text-[var(--muted)]">Site</dt><dd className="mt-1 font-medium">{site?.address || site?.name || "Not recorded"}</dd></div>
            </dl>
          </article>

          <article className="border border-[var(--line)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Next engine</p>
            <h3 className="mt-2 text-xl font-medium tracking-[-0.02em]">Equipment & sizing</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Once this profile is ready, its annual energy, peak demand and demand shape become inputs to PV sizing, BESS sizing, inverter selection and design guardrails.</p>
          </article>
        </aside>
      </section>
    </div>
  );
}

function summaryRecordCount(profile: { annual_energy_kwh?: number | string | null; peak_demand_kw?: number | string | null }) {
  return number(profile.annual_energy_kwh) > 0 || number(profile.peak_demand_kw) > 0 ? 1 : 0;
}

function IntervalEditor({ profileId, intervalMinutes, timezone }: { profileId: string; intervalMinutes: number | null; timezone: string }) {
  return <article className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Measured demand</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Import interval data</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Required columns: timestamp, demand_kw. Optional: energy_kwh, essential, category. Import replaces the previous interval dataset atomically.</p></div><form action={importIntervalCsv} className="grid gap-5 p-5 md:p-6"><input type="hidden" name="profile_id" value={profileId} /><div className="grid gap-5 sm:grid-cols-2"><label className="text-xs font-semibold">Interval<select name="interval_minutes" defaultValue={intervalMinutes ?? 30} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">60 minutes</option></select></label><label className="text-xs font-semibold">Timezone<input name="timezone" defaultValue={timezone} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label></div><label className="text-xs font-semibold">CSV data<textarea name="csv_data" rows={11} placeholder={'timestamp,demand_kw,essential,category\n2026-01-01T00:00:00+05:00,18.4,true,essential\n2026-01-01T00:30:00+05:00,17.8,true,essential'} className="mt-2 w-full border border-[var(--line)] bg-[var(--background)] p-3 font-mono text-xs leading-5" /></label><button className="min-h-11 border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Validate & replace interval data</button></form></article>;
}

function UtilityBillEditor({ profileId, bills }: { profileId: string; bills: { id: string; bill_month: string; energy_kwh: number | string; peak_demand_kw: number | string | null; cost_amount: number | string | null }[] }) {
  return <article className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Billing evidence</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Monthly utility history</h2></div><form action={addUtilityBill} className="grid gap-4 border-b border-[var(--line)] p-5 md:grid-cols-4 md:p-6"><input type="hidden" name="profile_id" value={profileId} /><label className="text-xs font-semibold">Month<input required type="month" name="bill_month" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label><label className="text-xs font-semibold">Energy (kWh)<input required type="number" min="0" step="0.1" name="energy_kwh" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label><label className="text-xs font-semibold">Peak demand (kW)<input type="number" min="0" step="0.1" name="peak_demand_kw" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label><label className="text-xs font-semibold">Bill cost<input type="number" min="0" step="0.01" name="cost_amount" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label><button className="min-h-11 border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)] md:col-span-4">Add / replace month</button></form>{bills.length ? <div className="divide-y divide-[var(--line)]">{bills.map((bill) => <div key={bill.id} className="grid gap-3 p-4 text-sm md:grid-cols-[130px_1fr_1fr_1fr_80px] md:items-center md:px-6"><span className="font-semibold">{new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(bill.bill_month))}</span><span>{formatNumber(number(bill.energy_kwh))} kWh</span><span className="text-[var(--muted)]">{bill.peak_demand_kw == null ? "Peak not recorded" : `${formatNumber(number(bill.peak_demand_kw))} kW`}</span><span className="text-[var(--muted)]">{bill.cost_amount == null ? "Cost not recorded" : formatNumber(number(bill.cost_amount), 2)}</span><form action={deleteUtilityBill}><input type="hidden" name="profile_id" value={profileId} /><input type="hidden" name="bill_id" value={bill.id} /><button className="text-xs font-semibold text-[var(--muted)]">Remove</button></form></div>)}</div> : <div className="p-6 text-sm text-[var(--muted)]">No bills recorded yet. Six months is the minimum useful evidence threshold; twelve months is preferred.</div>}</article>;
}

function ApplianceEditor({ profileId, appliances }: { profileId: string; appliances: { id: string; name: string; category: string | null; rated_kw: number | string; quantity: number; hours_per_day: number | string; days_per_week: number | string; simultaneity_pct: number | string; start_hour: number | string; essential: boolean }[] }) {
  return <article className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Bottom-up demand model</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Appliance & process schedule</h2></div><form action={addAppliance} className="grid gap-4 border-b border-[var(--line)] p-5 sm:grid-cols-2 xl:grid-cols-4 md:p-6"><input type="hidden" name="profile_id" value={profileId} /><label className="text-xs font-semibold">Load name<input required name="name" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label><label className="text-xs font-semibold">Category<input name="category" placeholder="HVAC, pumps, lighting" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label><label className="text-xs font-semibold">Rated kW<input required type="number" min="0" step="0.01" name="rated_kw" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label><label className="text-xs font-semibold">Quantity<input required type="number" min="1" step="1" name="quantity" defaultValue="1" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label><label className="text-xs font-semibold">Hours / day<input required type="number" min="0" max="24" step="0.25" name="hours_per_day" defaultValue="8" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label><label className="text-xs font-semibold">Days / week<input required type="number" min="0" max="7" step="0.5" name="days_per_week" defaultValue="7" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label><label className="text-xs font-semibold">Start hour<input required type="number" min="0" max="23.75" step="0.25" name="start_hour" defaultValue="8" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label><label className="text-xs font-semibold">Simultaneity %<input required type="number" min="0" max="100" step="1" name="simultaneity_pct" defaultValue="100" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label><label className="flex items-center gap-3 text-xs font-semibold xl:col-span-4"><input type="checkbox" name="essential" className="h-4 w-4" />Essential / backup load</label><button className="min-h-11 border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)] xl:col-span-4">Add load item</button></form>{appliances.length ? <div className="divide-y divide-[var(--line)]">{appliances.map((item) => <div key={item.id} className="grid gap-2 p-4 text-xs md:grid-cols-[minmax(0,1.4fr)_90px_80px_100px_110px_90px] md:items-center md:px-6"><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-[var(--muted)]">{item.category || "Uncategorised"}{item.essential ? " · Essential" : ""}</p></div><span>{formatNumber(number(item.rated_kw), 2)} kW</span><span>× {item.quantity}</span><span>{formatNumber(number(item.hours_per_day), 2)} h/day</span><span>{formatNumber(number(item.simultaneity_pct), 0)}% simultaneous</span><form action={deleteAppliance}><input type="hidden" name="profile_id" value={profileId} /><input type="hidden" name="appliance_id" value={item.id} /><button className="font-semibold text-[var(--muted)]">Remove</button></form></div>)}</div> : <div className="p-6 text-sm text-[var(--muted)]">No load items recorded yet.</div>}</article>;
}

function ManualEditor({ profileId, profile }: { profileId: string; profile: { average_daily_energy_kwh: number | string | null; peak_demand_kw: number | string | null; essential_peak_demand_kw: number | string | null; assumptions: string | null } }) {
  return <article className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Early-stage estimate</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Manual demand summary</h2></div><form action={saveManualLoadSummary} className="grid gap-5 p-5 sm:grid-cols-3 md:p-6"><input type="hidden" name="profile_id" value={profileId} /><label className="text-xs font-semibold">Average daily energy (kWh)<input required type="number" min="0" step="0.1" name="average_daily_energy_kwh" defaultValue={profile.average_daily_energy_kwh ?? ""} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label><label className="text-xs font-semibold">Peak demand (kW)<input required type="number" min="0" step="0.1" name="peak_demand_kw" defaultValue={profile.peak_demand_kw ?? ""} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label><label className="text-xs font-semibold">Essential peak (kW)<input type="number" min="0" step="0.1" name="essential_peak_demand_kw" defaultValue={profile.essential_peak_demand_kw ?? ""} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal" /></label><label className="text-xs font-semibold sm:col-span-3">Assumptions<textarea name="assumptions" rows={5} defaultValue={profile.assumptions ?? ""} className="mt-2 w-full border border-[var(--line)] bg-[var(--background)] p-3 text-sm leading-6" /></label><button className="min-h-11 border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)] sm:col-span-3">Save manual demand summary</button></form></article>;
}