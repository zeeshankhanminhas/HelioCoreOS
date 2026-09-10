import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { systemTypeLabels } from "@/lib/engineering/design-rules";
import type { SystemType } from "@/lib/engineering/types";
import { DesignIntake } from "./_components/design-intake";

type Props = {
  searchParams: Promise<{ error?: string; created?: string; opportunity?: string }>;
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function EngineeringPage({ searchParams }: Props) {
  const messages = await searchParams;
  const supabase = await createClient();

  const [{ data: opportunities }, { data: sites }, { data: recentIntakes }, { data: calculations }] = await Promise.all([
    supabase.from("opportunities").select("id,reference,title,site_id,created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("sites").select("id,name,postcode"),
    supabase.from("engineering_intakes").select("id,opportunity_id,load_profile_id,system_type,design_objective,status,created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("engineering_calculations").select("engineering_intake_id,revision,created_at").order("revision", { ascending: false }),
  ]);

  const siteMap = new Map((sites ?? []).map((site) => [site.id, site]));
  const opportunityMap = new Map((opportunities ?? []).map((opportunity) => [opportunity.id, opportunity]));
  const latestCalculation = new Map<string, { revision: number; created_at: string }>();
  for (const calculation of calculations ?? []) {
    if (!latestCalculation.has(calculation.engineering_intake_id)) latestCalculation.set(calculation.engineering_intake_id, calculation);
  }

  const opportunityOptions = (opportunities ?? [])
    .filter((opportunity) => Boolean(opportunity.site_id))
    .map((opportunity) => {
      const site = opportunity.site_id ? siteMap.get(opportunity.site_id) : null;
      return {
        id: opportunity.id,
        reference: opportunity.reference,
        title: opportunity.title,
        siteLabel: site ? `${site.name}${site.postcode ? ` · ${site.postcode}` : ""}` : "Assigned site",
      };
    });

  const readyCount = (recentIntakes ?? []).filter((item) => item.status === "ready").length;
  const calculatorCount = new Set((calculations ?? []).map((item) => item.engineering_intake_id)).size;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <section className="app-panel">
        <div className="app-toolbar flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="app-kicker">Engineering</p>
            <h1 className="app-title mt-1">Engineering</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/engineering/equipment" className="inline-flex min-h-9 items-center border border-[var(--line-strong)] bg-white px-3 text-[11px] font-semibold hover:border-[var(--foreground)]">Equipment</Link>
            <Link href="/dashboard/designs" className="inline-flex min-h-9 items-center border border-[var(--line-strong)] bg-white px-3 text-[11px] font-semibold hover:border-[var(--foreground)]">Designs</Link>
            <Link href="/dashboard/boms" className="inline-flex min-h-9 items-center border border-[var(--line-strong)] bg-white px-3 text-[11px] font-semibold hover:border-[var(--foreground)]">BOM</Link>
          </div>
        </div>
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-3">
          <div className="bg-white px-4 py-3"><p className="app-kicker">Active</p><p className="mt-1 text-lg font-semibold tabular-nums">{recentIntakes?.length ?? 0}</p></div>
          <div className="bg-white px-4 py-3"><p className="app-kicker">Load ready</p><p className="mt-1 text-lg font-semibold tabular-nums">{readyCount}</p></div>
          <div className="bg-white px-4 py-3"><p className="app-kicker">Calculators</p><p className="mt-1 text-lg font-semibold tabular-nums">{calculatorCount}</p></div>
        </div>
      </section>

      <section className="app-panel overflow-x-auto">
        <div className="flex min-w-max divide-x divide-[var(--line)] text-[10px] font-semibold uppercase tracking-[0.1em]">
          {["Opportunity + Site", "Load Profile", "Calculator", "Equipment", "Design", "Performance", "SLD + BOM", "Review", "Contract", "Project"].map((item, index) => (
            <div key={item} className={`px-3 py-2.5 ${item === "Project" ? "text-[var(--muted)]" : ""}`}><span className="mr-2 text-[var(--muted)]">{String(index + 1).padStart(2, "0")}</span>{item}</div>
          ))}
        </div>
      </section>

      {messages.error ? <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{messages.error}</div> : null}
      {messages.created ? <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Engineering intake created.</div> : null}

      <DesignIntake opportunities={opportunityOptions} initialOpportunityId={messages.opportunity} />

      <section className="app-panel">
        <div className="app-toolbar flex items-center justify-between gap-4 px-4">
          <div><p className="app-kicker">Work queue</p><p className="mt-0.5 text-sm font-semibold">Active engineering</p></div>
          <span className="text-[10px] tabular-nums text-[var(--muted)]">{recentIntakes?.length ?? 0} records</span>
        </div>
        {recentIntakes?.length ? (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[minmax(220px,1.5fr)_130px_minmax(180px,1fr)_160px_110px] border-b border-[var(--line)] bg-[var(--surface-subtle)] px-4 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--muted)]">
                <span>Opportunity</span><span>System</span><span>Objective</span><span>Stage</span><span className="text-right">Created</span>
              </div>
              <div className="divide-y divide-[var(--line)]">
                {recentIntakes.map((intake) => {
                  const opportunity = opportunityMap.get(intake.opportunity_id);
                  const calculation = latestCalculation.get(intake.id);
                  const destination = intake.status === "ready" ? `/dashboard/engineering/calculators/${intake.id}` : intake.load_profile_id ? `/dashboard/engineering/load-profiles/${intake.load_profile_id}` : null;
                  const row = (
                    <div className="grid grid-cols-[minmax(220px,1.5fr)_130px_minmax(180px,1fr)_160px_110px] items-center px-4 py-3 text-xs">
                      <div className="min-w-0"><p className="truncate font-semibold">{opportunity?.reference ?? "Engineering intake"}</p><p className="mt-0.5 truncate text-[10px] text-[var(--muted)]">{opportunity?.title ?? intake.id}</p></div>
                      <span className="font-medium">{systemTypeLabels[intake.system_type as SystemType] ?? titleCase(intake.system_type)}</span>
                      <span className="truncate text-[var(--muted)]">{titleCase(intake.design_objective)}</span>
                      <span className={`font-semibold ${intake.status === "ready" ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>{intake.status !== "ready" ? "Load profile" : calculation ? `Calculator R${calculation.revision}` : "Calculator"}</span>
                      <span className="text-right tabular-nums text-[var(--muted)]">{date.format(new Date(intake.created_at))}</span>
                    </div>
                  );
                  return destination ? <Link key={intake.id} href={destination} className="block bg-white hover:bg-[var(--surface-subtle)]">{row}</Link> : <div key={intake.id} className="bg-white">{row}</div>;
                })}
              </div>
            </div>
          </div>
        ) : <div className="px-4 py-10 text-sm text-[var(--muted)]">No active engineering.</div>}
      </section>
    </div>
  );
}
