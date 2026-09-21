"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/neon/client";

const deliveryStages = ["procurement", "installation", "commissioning", "handover"] as const;
const activityDate = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function deliveryStageLabel(value: string) {
  if (value === "installation") return "Construction & installation";
  return titleCase(value);
}

type Opportunity = { id: string; reference: string; title: string; stage: string; estimated_value_gbp: number | string | null; created_at: string };
type EngineeringIntake = { id: string; opportunity_id: string; status: string; system_type: string; load_profile_id: string | null; created_at: string };
type Calculation = { id: string; engineering_intake_id: string; revision: number; created_at: string };
type Project = { id: string; name: string; reference: string; status: string; risk_status: string; contract_value_gbp: number | string | null; target_completion_date: string | null; updated_at: string };
type Activity = { id: string | number; event_type: string; description: string; created_at: string };

export default function DashboardPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [engineering, setEngineering] = useState<EngineeringIntake[]>([]);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [openTasks, setOpenTasks] = useState(0);
  const [overdueTasks, setOverdueTasks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [engineeringLoading, setEngineeringLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [engineeringError, setEngineeringError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      const client = createClient();
      const today = new Date().toISOString().slice(0, 10);

      const [opportunitiesResult, projectsResult, openTasksResult, overdueTasksResult, activityResult] = await Promise.all([
        client.from("opportunities").select("id,reference,title,stage,estimated_value_gbp,created_at").order("updated_at", { ascending: false }).limit(50),
        client.from("projects").select("id,name,reference,status,risk_status,contract_value_gbp,target_completion_date,updated_at").order("updated_at", { ascending: false }).limit(50),
        client.from("tasks").select("id", { count: "exact", head: true }).neq("status", "complete"),
        client.from("tasks").select("id", { count: "exact", head: true }).neq("status", "complete").lt("due_date", today),
        client.from("activity_logs").select("id,event_type,description,created_at").order("created_at", { ascending: false }).limit(8),
      ]);

      if (cancelled) return;

      const coreError = opportunitiesResult.error || projectsResult.error || openTasksResult.error || overdueTasksResult.error || activityResult.error;
      if (coreError) setError(coreError.message || "The command centre could not be loaded.");

      setOpportunities((opportunitiesResult.data ?? []) as Opportunity[]);
      setProjects((projectsResult.data ?? []) as Project[]);
      setOpenTasks(openTasksResult.count ?? 0);
      setOverdueTasks(overdueTasksResult.count ?? 0);
      setActivities((activityResult.data ?? []) as Activity[]);
      setLoading(false);

      const [engineeringResult, calculationsResult] = await Promise.all([
        client.from("engineering_intakes").select("id,opportunity_id,status,system_type,load_profile_id,created_at").order("created_at", { ascending: false }).limit(50),
        client.from("engineering_calculations").select("id,engineering_intake_id,revision,created_at").order("created_at", { ascending: false }).limit(100),
      ]);

      if (cancelled) return;
      const technicalError = engineeringResult.error || calculationsResult.error;
      if (technicalError) setEngineeringError(technicalError.message || "Engineering status could not be loaded.");
      setEngineering((engineeringResult.data ?? []) as EngineeringIntake[]);
      setCalculations((calculationsResult.data ?? []) as Calculation[]);
      setEngineeringLoading(false);
    }

    void loadDashboard().catch((loadError: unknown) => {
      if (cancelled) return;
      const message = loadError instanceof Error ? loadError.message : "The command centre could not be loaded.";
      setError(message);
      setEngineeringError(message);
      setLoading(false);
      setEngineeringLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const computed = useMemo(() => {
    const openOpportunities = opportunities.filter((item) => item.stage !== "won" && item.stage !== "lost");
    const proposalStage = openOpportunities.filter((item) => item.stage === "proposal");
    const activeEngineering = engineering.filter((item) => item.status !== "superseded");
    const readyForCalculator = activeEngineering.filter((item) => item.status === "ready");
    const intakeIdsWithCalculation = new Set(calculations.map((item) => item.engineering_intake_id));
    const activeCalculations = activeEngineering.filter((item) => intakeIdsWithCalculation.has(item.id));
    const deliveryProjects = projects.filter((item) => deliveryStages.includes(item.status as (typeof deliveryStages)[number]));
    const legacyProjects = projects.filter((item) => !deliveryStages.includes(item.status as (typeof deliveryStages)[number]) && item.status !== "complete" && item.status !== "on_hold");
    const redRiskProjects = deliveryProjects.filter((item) => item.risk_status === "red");
    const deliveryValue = deliveryProjects.reduce((sum, item) => sum + Number(item.contract_value_gbp ?? 0), 0);

    return { openOpportunities, proposalStage, activeEngineering, readyForCalculator, activeCalculations, deliveryProjects, legacyProjects, redRiskProjects, deliveryValue };
  }, [opportunities, engineering, calculations, projects]);

  const stageCounts = deliveryStages.map((stage) => ({
    stage,
    count: computed.deliveryProjects.filter((project) => project.status === stage).length,
  }));

  const operatingSequence = [
    { label: "Opportunity + Site", area: "Commercial", href: "/dashboard/opportunities" },
    { label: "System Type + Load Profile", area: "Engineering", href: "/dashboard/engineering/load-profiles" },
    { label: "Calculator", area: "Engineering", href: "/dashboard/engineering/calculators" },
    { label: "Equipment + Detailed Design", area: "Engineering", href: "/dashboard/designs" },
    { label: "Engineering Package", area: "Engineering", href: "/dashboard/boms" },
    { label: "Proposal + Contract", area: "Commercial", href: "/dashboard/proposals" },
    { label: "Project + Delivery", area: "Post-contract", href: "/dashboard/projects" },
  ];

  const metrics = [
    { label: "Open opportunities", value: loading ? "—" : String(computed.openOpportunities.length), note: loading ? "Loading commercial pipeline" : `${computed.proposalStage.length} at proposal stage`, href: "/dashboard/opportunities" },
    { label: "Active engineering", value: engineeringLoading ? "—" : String(computed.activeEngineering.length), note: engineeringLoading ? "Loading technical work" : engineeringError ? "Engineering data unavailable" : `${computed.readyForCalculator.length} load profiles ready`, href: "/dashboard/engineering" },
    { label: "Active calculations", value: engineeringLoading ? "—" : String(computed.activeCalculations.length), note: engineeringLoading ? "Loading sizing work" : engineeringError ? "Calculation data unavailable" : `${calculations.length} saved sizing revisions`, href: "/dashboard/engineering/calculators" },
    { label: "Delivery projects", value: loading ? "—" : String(computed.deliveryProjects.length), note: loading ? "Loading delivery portfolio" : `${currency.format(computed.deliveryValue)} active contract value`, href: "/dashboard/projects" },
  ];

  return (
    <div className="mx-auto max-w-[1500px]" data-testid="dashboard-neon-runtime">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="app-kicker text-[var(--accent-text)]">Operating command centre</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Lifecycle overview</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">See what needs attention across commercial, engineering and delivery. Pre-contract work stays in Opportunity and Engineering; only a signed contract creates a Project.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/opportunities/new" className="inline-flex min-h-10 items-center border border-[var(--accent)] bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-white hover:opacity-90">Create opportunity</Link>
          <Link href="/dashboard/tasks" className="inline-flex min-h-10 items-center border border-[var(--line-strong)] bg-[var(--background)] px-4 py-2.5 text-xs font-semibold">Open my work</Link>
        </div>
      </header>

      {error ? <div className="mt-7 border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800">Some command-centre data could not be loaded. {error}</div> : null}
      {engineeringError ? <div className="mt-3 border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">Engineering metrics are temporarily unavailable. {engineeringError}</div> : null}

      <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
        <article className="border border-[var(--line)] bg-[var(--background)]">
          <div className="border-b border-[var(--line)] p-5 md:px-6">
            <p className="app-kicker">HelioCoreOS operating sequence</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">One direction through the OS</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Each stage opens the workspace where that work is actually performed.</p>
          </div>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
            {operatingSequence.map((item, index) => (
              <li key={item.label} className="border-b border-r border-[var(--line)] p-5 last:border-r-0 2xl:border-b-0">
                <div className="flex items-center justify-between gap-4"><span className="text-xs tabular-nums text-[var(--text-secondary)]">{String(index + 1).padStart(2, "0")}</span><span className="text-[10px] font-semibold text-[var(--text-tertiary)]">{item.area}</span></div>
                <Link href={item.href} className="mt-4 block text-sm font-semibold leading-5 hover:text-[var(--accent-text)]">{item.label}</Link>
              </li>
            ))}
          </ol>
        </article>

        <article className="border border-[var(--line)] bg-[var(--background)]">
          <div className="border-b border-[var(--line)] p-5">
            <p className="app-kicker">Attention</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Operating exceptions</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Items that require intervention before passive portfolio totals.</p>
          </div>
          <div className="divide-y divide-[var(--line)]">
            <Link href="/dashboard/tasks" className="flex items-center justify-between gap-4 p-5 hover:bg-[var(--surface-subtle)]"><div><p className="text-sm font-semibold">Overdue actions</p><p className="mt-1 text-xs text-[var(--text-secondary)]">Across commercial, engineering and delivery.</p></div><strong className={`text-2xl ${!loading && overdueTasks ? "text-[var(--accent-text)]" : ""}`}>{loading ? "—" : overdueTasks}</strong></Link>
            <Link href="/dashboard/projects" className="flex items-center justify-between gap-4 p-5 hover:bg-[var(--surface-subtle)]"><div><p className="text-sm font-semibold">Red-risk delivery projects</p><p className="mt-1 text-xs text-[var(--text-secondary)]">Post-contract execution requiring attention.</p></div><strong className={`text-2xl ${!loading && computed.redRiskProjects.length ? "text-[var(--accent-text)]" : ""}`}>{loading ? "—" : computed.redRiskProjects.length}</strong></Link>
            <Link href="/dashboard/tasks" className="flex items-center justify-between gap-4 p-5 hover:bg-[var(--surface-subtle)]"><div><p className="text-sm font-semibold">Open actions</p><p className="mt-1 text-xs text-[var(--text-secondary)]">Accountable work not yet complete.</p></div><strong className="text-2xl">{loading ? "—" : openTasks}</strong></Link>
          </div>
        </article>
      </section>

      <section className="mt-7 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Link key={metric.label} href={metric.href} className="bg-[var(--background)] p-5 transition hover:bg-[var(--surface-subtle)] md:p-6">
            <p className="text-[11px] font-semibold text-[var(--text-secondary)]">{metric.label}</p>
            <p className="mt-5 text-4xl font-medium tracking-[-0.05em]">{metric.value}</p>
            <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">{metric.note}</p>
          </Link>
        ))}
      </section>

      <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.25fr)_minmax(330px,0.75fr)]">
        <div className="space-y-7">
          <article className="border border-[var(--line)] bg-[var(--background)]">
            <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] p-5 md:px-6">
              <div><p className="app-kicker">Post-contract only</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Delivery pipeline</h2></div>
              <Link href="/dashboard/projects" className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--foreground)]">Open projects</Link>
            </div>
            <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
              {stageCounts.map((item) => (
                <div key={item.stage} className="bg-[var(--background)] p-5"><p className="text-[11px] font-semibold leading-5 text-[var(--text-secondary)]">{deliveryStageLabel(item.stage)}</p><p className="mt-5 text-3xl font-medium">{loading ? "—" : item.count}</p></div>
              ))}
            </div>
            {computed.legacyProjects.length ? <div className="border-t border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900"><span className="font-semibold">{computed.legacyProjects.length} legacy Project record{computed.legacyProjects.length === 1 ? " is" : "s are"} still using pre-contract stage values.</span></div> : null}
          </article>

          <article className="border border-[var(--line)] bg-[var(--background)]">
            <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] p-5 md:px-6">
              <div><p className="app-kicker">Recent activity</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Audit trail</h2></div>
              <span className="text-xs text-[var(--text-secondary)]">{loading ? "Loading" : `${activities.length} recent`}</span>
            </div>
            {loading ? (
              <div className="space-y-3 p-6" aria-label="Loading recent activity"><div className="h-4 w-3/4 bg-[var(--surface-subtle)]" /><div className="h-4 w-1/2 bg-[var(--surface-subtle)]" /><div className="h-4 w-2/3 bg-[var(--surface-subtle)]" /></div>
            ) : activities.length ? (
              <div className="divide-y divide-[var(--line)]">{activities.map((activity) => <div key={activity.id} className="grid gap-2 p-5 md:grid-cols-[150px_minmax(0,1fr)_130px] md:px-6"><p className="text-xs font-semibold">{titleCase(activity.event_type)}</p><p className="text-xs leading-5 text-[var(--text-secondary)]">{activity.description}</p><p className="text-xs tabular-nums text-[var(--text-secondary)] md:text-right">{activityDate.format(new Date(activity.created_at))}</p></div>)}</div>
            ) : (
              <div className="p-6"><p className="text-sm font-semibold">No activity recorded yet</p><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Operational events will appear here as opportunities, engineering work and projects move through the lifecycle.</p></div>
            )}
          </article>
        </div>

        <aside className="space-y-7">
          {!loading && computed.openOpportunities.length === 0 ? (
            <article className="border border-[var(--line)] bg-[var(--background)] p-5">
              <p className="app-kicker">Start the lifecycle</p>
              <h2 className="mt-3 text-xl font-medium tracking-[-0.025em]">No open opportunities yet</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Create an opportunity first. Site, load profile, calculation, proposal and contract work then remain governed in the pre-contract record until conversion to a Project.</p>
              <Link href="/dashboard/opportunities/new" className="mt-5 inline-flex min-h-10 items-center border border-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent-text)]">Create first opportunity</Link>
            </article>
          ) : null}

          <article className="border border-[var(--line)] bg-[var(--background)] p-5">
            <p className="app-kicker">Core rule</p>
            <p className="mt-4 text-lg font-medium leading-7">No Project before signed contract.</p>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">Opportunity and Engineering own all pre-contract work. The Project workspace starts only when the commercial commitment is formally converted into delivery.</p>
          </article>
        </aside>
      </section>
    </div>
  );
}
