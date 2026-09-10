import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const deliveryStages = ["procurement", "installation", "commissioning", "handover"] as const;
const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [opportunitiesResult, engineeringResult, calculationsResult, projectsResult, openTasksResult, overdueTasksResult, activityResult] = await Promise.all([
    supabase.from("opportunities").select("id,reference,title,stage,estimated_value_gbp,created_at").order("updated_at", { ascending: false }).limit(50),
    supabase.from("engineering_intakes").select("id,opportunity_id,status,system_type,load_profile_id,created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("engineering_calculations").select("id,engineering_intake_id,revision,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("projects").select("id,name,reference,status,risk_status,contract_value_gbp,target_completion_date,updated_at").order("updated_at", { ascending: false }).limit(50),
    supabase.from("tasks").select("id", { count: "exact", head: true }).neq("status", "complete"),
    supabase.from("tasks").select("id", { count: "exact", head: true }).neq("status", "complete").lt("due_date", today),
    supabase.from("activity_logs").select("id,event_type,description,created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const opportunities = opportunitiesResult.data ?? [];
  const engineering = engineeringResult.data ?? [];
  const calculations = calculationsResult.data ?? [];
  const projects = projectsResult.data ?? [];
  const activities = activityResult.data ?? [];

  const openOpportunities = opportunities.filter((item) => item.stage !== "won" && item.stage !== "lost");
  const proposalStage = openOpportunities.filter((item) => item.stage === "proposal");
  const activeEngineering = engineering.filter((item) => item.status !== "superseded");
  const readyForCalculator = activeEngineering.filter((item) => item.status === "ready");
  const intakeIdsWithCalculation = new Set(calculations.map((item) => item.engineering_intake_id));
  const calculatorStarted = activeEngineering.filter((item) => intakeIdsWithCalculation.has(item.id));
  const deliveryProjects = projects.filter((item) => deliveryStages.includes(item.status as (typeof deliveryStages)[number]));
  const legacyProjects = projects.filter((item) => !deliveryStages.includes(item.status as (typeof deliveryStages)[number]) && item.status !== "complete" && item.status !== "on_hold");
  const redRiskProjects = deliveryProjects.filter((item) => item.risk_status === "red");
  const overdueTasks = overdueTasksResult.count ?? 0;
  const openTasks = openTasksResult.count ?? 0;
  const deliveryValue = deliveryProjects.reduce((sum, item) => sum + Number(item.contract_value_gbp ?? 0), 0);

  const stageCounts = deliveryStages.map((stage) => ({
    stage,
    count: deliveryProjects.filter((project) => project.status === stage).length,
  }));

  const operatingSequence = [
    { label: "Opportunity + Site", area: "Pre-contract", href: "/dashboard/opportunities" },
    { label: "System Type + Load Profile", area: "Engineering", href: "/dashboard/engineering" },
    { label: "Calculator", area: "Engineering", href: "/dashboard/engineering" },
    { label: "Equipment + Detailed Design", area: "Engineering", href: "/dashboard/engineering" },
    { label: "PVWatts + SLD + BOM + Review", area: "Engineering", href: "/dashboard/engineering" },
    { label: "Proposal / Contract", area: "Pre-contract", href: "/dashboard/opportunities" },
    { label: "Project / Delivery", area: "Post-contract", href: "/dashboard/projects" },
  ];

  const metrics = [
    { label: "Open opportunities", value: String(openOpportunities.length), note: `${proposalStage.length} at proposal stage`, href: "/dashboard/opportunities" },
    { label: "Engineering intakes", value: String(activeEngineering.length), note: `${readyForCalculator.length} load profiles ready`, href: "/dashboard/engineering" },
    { label: "Calculator started", value: String(calculatorStarted.length), note: `${calculations.length} saved sizing revisions`, href: "/dashboard/engineering" },
    { label: "Delivery projects", value: String(deliveryProjects.length), note: currency.format(deliveryValue), href: "/dashboard/projects" },
  ];

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Operating command centre</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Lifecycle overview</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">Pre-contract commercial work feeds Engineering. Engineering produces the governed technical basis. Only a signed contract creates a Project and moves the job into Delivery.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/opportunities" className="inline-flex min-h-10 items-center border border-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent)]">Open Opportunities</Link>
          <Link href="/dashboard/engineering" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Open Engineering</Link>
        </div>
      </header>

      <section className="mt-7 border border-[var(--line)]">
        <div className="border-b border-[var(--line)] p-5 md:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">HelioCoreOS operating sequence</p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">One direction through the OS</h2>
        </div>
        <div className="overflow-x-auto">
          <ol className="flex min-w-max divide-x divide-[var(--line)]">
            {operatingSequence.map((item, index) => (
              <li key={item.label} className="min-w-[190px] p-5">
                <div className="flex items-center justify-between gap-4"><span className="text-xs tabular-nums text-[var(--muted)]">{String(index + 1).padStart(2, "0")}</span><span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">{item.area}</span></div>
                <Link href={item.href} className="mt-4 block text-sm font-semibold leading-5 hover:text-[var(--accent)]">{item.label}</Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mt-7 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Link key={metric.label} href={metric.href} className="bg-[var(--background)] p-5 transition hover:bg-white/45 md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{metric.label}</p>
            <p className="mt-6 text-4xl font-medium tracking-[-0.05em]">{metric.value}</p>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{metric.note}</p>
          </Link>
        ))}
      </section>

      <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.25fr)_minmax(330px,0.75fr)]">
        <div className="space-y-7">
          <article className="border border-[var(--line)]">
            <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] p-5 md:px-6">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Post-contract only</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Delivery pipeline</h2></div>
              <Link href="/dashboard/projects" className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">Open Projects</Link>
            </div>
            <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
              {stageCounts.map((item) => (
                <div key={item.stage} className="bg-[var(--background)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{titleCase(item.stage)}</p><p className="mt-5 text-3xl font-medium">{item.count}</p></div>
              ))}
            </div>
            {legacyProjects.length ? <div className="border-t border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900"><span className="font-semibold">{legacyProjects.length} legacy Project record{legacyProjects.length === 1 ? " is" : "s are"} still in pre-contract stage values.</span> Open the Project register and migrate them deliberately after confirming their commercial basis.</div> : null}
          </article>

          <article className="border border-[var(--line)]">
            <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] p-5 md:px-6">
              <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Recent activity</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Audit trail</h2></div>
              <span className="text-xs text-[var(--muted)]">{activities.length} recent</span>
            </div>
            {activities.length ? <div className="divide-y divide-[var(--line)]">{activities.map((activity) => <div key={activity.id} className="grid gap-2 p-5 md:grid-cols-[150px_minmax(0,1fr)_100px] md:px-6"><p className="text-xs font-semibold">{titleCase(activity.event_type)}</p><p className="text-xs leading-5 text-[var(--muted)]">{activity.description}</p><p className="text-xs text-[var(--muted)] md:text-right">{date.format(new Date(activity.created_at))}</p></div>)}</div> : <div className="p-6 text-sm text-[var(--muted)]">No recent activity.</div>}
          </article>
        </div>

        <aside className="space-y-7">
          <article className="border border-[var(--line)]">
            <div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Attention</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Operating exceptions</h2></div>
            <div className="divide-y divide-[var(--line)]">
              <Link href="/dashboard/tasks" className="flex items-center justify-between gap-4 p-5 hover:bg-white/40"><div><p className="text-sm font-semibold">Overdue actions</p><p className="mt-1 text-xs text-[var(--muted)]">Across commercial, engineering and delivery.</p></div><strong className={overdueTasks ? "text-2xl text-[var(--accent)]" : "text-2xl"}>{overdueTasks}</strong></Link>
              <Link href="/dashboard/projects" className="flex items-center justify-between gap-4 p-5 hover:bg-white/40"><div><p className="text-sm font-semibold">Red-risk delivery projects</p><p className="mt-1 text-xs text-[var(--muted)]">Post-contract execution requiring attention.</p></div><strong className={redRiskProjects.length ? "text-2xl text-[var(--accent)]" : "text-2xl"}>{redRiskProjects.length}</strong></Link>
              <Link href="/dashboard/tasks" className="flex items-center justify-between gap-4 p-5 hover:bg-white/40"><div><p className="text-sm font-semibold">Open actions</p><p className="mt-1 text-xs text-[var(--muted)]">Total accountable work not complete.</p></div><strong className="text-2xl">{openTasks}</strong></Link>
            </div>
          </article>

          <article className="border border-[var(--line)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Core rule</p>
            <p className="mt-4 text-lg font-medium leading-7">No Project before signed contract.</p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Opportunity and Engineering own all pre-contract work. The Project workspace starts only when the commercial commitment is formally converted into delivery.</p>
          </article>
        </aside>
      </section>
    </div>
  );
}