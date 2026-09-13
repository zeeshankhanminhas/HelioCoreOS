"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/neon/client";
import { assessOpportunityEngineeringReadiness } from "@/lib/application/opportunity-readiness";
import { systemTypeLabels } from "@/lib/engineering/design-rules";
import type { SystemType } from "@/lib/engineering/types";
import { DesignIntake } from "./_components/design-intake";

function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()); }
const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

type RegisterState = { opportunities: any[]; sites: any[]; intakes: any[]; calculations: any[]; readiness: any[] };

export default function EngineeringPage() {
  const [state, setState] = useState<RegisterState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const client = createClient();
    Promise.all([
      client.from("opportunities").select("id,reference,title,customer_id,site_id,created_at").order("created_at", { ascending: false }).limit(50),
      client.from("sites").select("id,name,postcode"),
      client.from("engineering_intakes").select("id,opportunity_id,load_profile_id,system_type,design_objective,status,created_at").order("created_at", { ascending: false }).limit(20),
      client.from("engineering_calculations").select("engineering_intake_id,revision,created_at").order("revision", { ascending: false }),
      client.from("opportunity_readiness_items").select("opportunity_id,item_type,status,is_required"),
    ]).then((results) => {
      if (cancelled) return;
      const failed = results.find((result) => result.error);
      if (failed?.error) { setError(failed.error.message); return; }
      setState({ opportunities: results[0].data ?? [], sites: results[1].data ?? [], intakes: results[2].data ?? [], calculations: results[3].data ?? [], readiness: results[4].data ?? [] });
    }).catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Engineering data could not be loaded."); });
    return () => { cancelled = true; };
  }, []);

  const model = useMemo(() => {
    const opportunities = state?.opportunities ?? [], sites = state?.sites ?? [], intakes = state?.intakes ?? [], calculations = state?.calculations ?? [], readiness = state?.readiness ?? [];
    const siteMap = new Map(sites.map((site) => [site.id, site]));
    const opportunityMap = new Map(opportunities.map((opportunity) => [opportunity.id, opportunity]));
    const latestCalculation = new Map<string, any>();
    for (const calculation of calculations) if (!latestCalculation.has(calculation.engineering_intake_id)) latestCalculation.set(calculation.engineering_intake_id, calculation);
    const readinessByOpportunity = new Map<string, any[]>();
    for (const item of readiness) { const group = readinessByOpportunity.get(item.opportunity_id) ?? []; group.push(item); readinessByOpportunity.set(item.opportunity_id, group); }
    const options = opportunities.filter((opportunity) => assessOpportunityEngineeringReadiness({ customerId: opportunity.customer_id, siteId: opportunity.site_id, items: readinessByOpportunity.get(opportunity.id) ?? [] }).readyForEngineering).map((opportunity) => {
      const site = opportunity.site_id ? siteMap.get(opportunity.site_id) : null;
      return { id: opportunity.id, reference: opportunity.reference, title: opportunity.title, siteLabel: site ? `${site.name}${site.postcode ? ` · ${site.postcode}` : ""}` : "Assigned site" };
    });
    return { intakes, opportunityMap, latestCalculation, options, readyCount: intakes.filter((item) => item.status === "ready").length, calculatorCount: new Set(calculations.map((item) => item.engineering_intake_id)).size };
  }, [state]);

  return <div className="mx-auto max-w-[1600px] space-y-5" data-testid="engineering-neon-register">
    <section className="app-panel">
      <div className="app-toolbar flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="app-kicker">Engineering · Neon</p><h1 className="app-title mt-1">Engineering</h1></div><div className="flex flex-wrap gap-2"><Link href="/dashboard/engineering/equipment" className="inline-flex min-h-9 items-center border border-[var(--line-strong)] bg-white px-3 text-[11px] font-semibold">Equipment</Link><Link href="/dashboard/designs" className="inline-flex min-h-9 items-center border border-[var(--line-strong)] bg-white px-3 text-[11px] font-semibold">Designs</Link></div></div>
      <div className="grid gap-px bg-[var(--line)] sm:grid-cols-4">{[["Eligible Opportunities", model.options.length],["Active", model.intakes.length],["Load ready", model.readyCount],["Calculators", model.calculatorCount]].map(([label,value]) => <div key={String(label)} className="bg-white px-4 py-3"><p className="app-kicker">{label}</p><p className="mt-1 text-lg font-semibold tabular-nums">{value}</p></div>)}</div>
    </section>

    <section className="app-panel overflow-x-auto"><div className="flex min-w-max divide-x divide-[var(--line)] text-[10px] font-semibold uppercase tracking-[0.1em]">{["Opportunity + Site","Readiness","Load Profile","Calculator","Equipment","Design","Performance","SLD + BOM","Review","Contract","Project"].map((item,index) => <div key={item} className={`px-3 py-2.5 ${item === "Project" ? "text-[var(--muted)]" : ""}`}><span className="mr-2 text-[var(--muted)]">{String(index+1).padStart(2,"0")}</span>{item}</div>)}</div></section>

    {error ? <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
    {!state && !error ? <section className="app-panel p-8 text-sm text-[var(--muted)]">Loading engineering data from Neon…</section> : null}
    {state && model.options.length ? <DesignIntake opportunities={model.options} /> : state ? <section className="app-panel p-5"><p className="app-kicker">Readiness gate</p><h2 className="mt-2 text-lg font-semibold">No Opportunity is ready for engineering.</h2><p className="mt-2 text-sm text-[var(--muted)]">Complete Customer, Site and required readiness evidence first.</p><Link href="/dashboard/opportunities" className="mt-4 inline-flex min-h-10 items-center border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Open Opportunities</Link></section> : null}

    <section className="app-panel">
      <div className="app-toolbar flex items-center justify-between gap-4 px-4"><div><p className="app-kicker">Work queue</p><p className="mt-0.5 text-sm font-semibold">Active engineering</p></div><span className="text-[10px] text-[var(--muted)]">{model.intakes.length} records</span></div>
      {model.intakes.length ? <div className="divide-y divide-[var(--line)]">{model.intakes.map((intake) => {
        const opportunity = model.opportunityMap.get(intake.opportunity_id); const calculation = model.latestCalculation.get(intake.id); const destination = intake.status === "ready" ? `/dashboard/engineering/calculators/${intake.id}` : intake.load_profile_id ? `/dashboard/engineering/load-profiles/${intake.load_profile_id}` : null;
        const row = <div className="grid gap-2 px-4 py-3 text-xs md:grid-cols-[minmax(220px,1.5fr)_130px_minmax(180px,1fr)_160px_110px]"><div><p className="font-semibold">{opportunity?.reference ?? "Engineering intake"}</p><p className="text-[10px] text-[var(--muted)]">{opportunity?.title ?? intake.id}</p></div><span>{systemTypeLabels[intake.system_type as SystemType] ?? titleCase(intake.system_type)}</span><span className="text-[var(--muted)]">{titleCase(intake.design_objective)}</span><span className="font-semibold">{intake.status !== "ready" ? "Load profile" : calculation ? `Calculator R${calculation.revision}` : "Calculator"}</span><span className="text-right text-[var(--muted)]">{date.format(new Date(intake.created_at))}</span></div>;
        return destination ? <Link key={intake.id} href={destination} className="block hover:bg-[var(--surface-subtle)]">{row}</Link> : <div key={intake.id}>{row}</div>;
      })}</div> : <div className="px-4 py-10 text-sm text-[var(--muted)]">No active engineering.</div>}
    </section>
  </div>;
}
