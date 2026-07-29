import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const pipelineStages = [
  { key: "qualification", label: "Qualification" },
  { key: "survey", label: "Survey" },
  { key: "design", label: "Design" },
  { key: "commercial", label: "Commercial" },
  { key: "procurement", label: "Procurement" },
  { key: "installation", label: "Installation" },
  { key: "commissioning", label: "Commissioning" },
  { key: "handover", label: "Handover" },
] as const;

const activeProjectStatuses = pipelineStages.map((stage) => stage.key);

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const compactNumber = new Intl.NumberFormat("en-GB", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type Project = {
  id: string;
  name: string;
  reference: string;
  status: string;
  risk_status: "green" | "amber" | "red";
  pv_capacity_kwp: number | null;
  contract_value_gbp: number | null;
  target_completion_date: string | null;
};

type Activity = {
  id: number;
  event_type: string;
  description: string;
  created_at: string;
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function riskClasses(risk: Project["risk_status"]) {
  if (risk === "red") return "bg-red-600";
  if (risk === "amber") return "bg-amber-500";
  return "bg-emerald-600";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [projectsResult, customersResult, tasksResult, overdueResult, documentsResult, activityResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, reference, status, risk_status, pv_capacity_kwp, contract_value_gbp, target_completion_date")
      .order("updated_at", { ascending: false }),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("tasks").select("id", { count: "exact", head: true }).neq("status", "complete"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .neq("status", "complete")
      .lt("due_date", today),
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase
      .from("activity_logs")
      .select("id, event_type, description, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const projects = (projectsResult.data ?? []) as Project[];
  const activities = (activityResult.data ?? []) as Activity[];
  const activeProjects = projects.filter((project) => activeProjectStatuses.includes(project.status as (typeof activeProjectStatuses)[number]));
  const totalCapacity = activeProjects.reduce((sum, project) => sum + Number(project.pv_capacity_kwp ?? 0), 0);
  const contractValue = activeProjects.reduce((sum, project) => sum + Number(project.contract_value_gbp ?? 0), 0);
  const redRiskCount = activeProjects.filter((project) => project.risk_status === "red").length;

  const pipeline = pipelineStages.map((stage) => ({
    ...stage,
    count: activeProjects.filter((project) => project.status === stage.key).length,
  }));
  const pipelineMax = Math.max(...pipeline.map((stage) => stage.count), 1);

  const metrics = [
    {
      label: "Active projects",
      value: String(activeProjects.length),
      note: redRiskCount ? `${redRiskCount} require executive attention` : "No red-risk projects",
      accent: redRiskCount > 0,
    },
    {
      label: "Installed pipeline",
      value: `${compactNumber.format(totalCapacity)} kWp`,
      note: "Combined active project capacity",
      accent: false,
    },
    {
      label: "Contract value",
      value: currency.format(contractValue),
      note: "Current active EPC portfolio",
      accent: false,
    },
    {
      label: "Open actions",
      value: String(tasksResult.count ?? 0),
      note: overdueResult.count ? `${overdueResult.count} overdue` : "No overdue actions",
      accent: Boolean(overdueResult.count),
    },
  ];

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Executive command</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Operational overview</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            One governed view across commercial commitments, engineering flow, delivery risk and completion evidence.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/tasks" className="border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">
            Review actions
          </Link>
          <Link href="/dashboard/projects" className="bg-[var(--foreground)] px-4 py-2.5 text-xs font-semibold text-[var(--background)]">
            Open portfolio
          </Link>
        </div>
      </header>

      <section className="mt-7 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4" aria-label="Executive metrics">
        {metrics.map((metric) => (
          <article key={metric.label} className="bg-[var(--background)] p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{metric.label}</p>
              <span className={`h-1.5 w-1.5 rounded-full ${metric.accent ? "bg-[var(--accent)]" : "bg-emerald-600"}`} />
            </div>
            <p className="mt-7 text-3xl font-medium tracking-[-0.045em] md:text-4xl">{metric.value}</p>
            <p className={`mt-3 text-xs leading-5 ${metric.accent ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>{metric.note}</p>
          </article>
        ))}
      </section>

      <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.65fr)]">
        <article className="border border-[var(--line)]">
          <div className="flex items-start justify-between gap-5 border-b border-[var(--line)] p-5 md:p-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Project pipeline</p>
              <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">EPC stage distribution</h2>
            </div>
            <span className="text-xs tabular-nums text-[var(--muted)]">{activeProjects.length} active</span>
          </div>

          <div className="p-5 md:p-6">
            {activeProjects.length ? (
              <div className="space-y-4">
                {pipeline.map((stage) => (
                  <div key={stage.key} className="grid grid-cols-[105px_minmax(0,1fr)_28px] items-center gap-3 sm:grid-cols-[125px_minmax(0,1fr)_32px]">
                    <span className="text-xs text-[var(--muted)]">{stage.label}</span>
                    <div className="h-7 bg-black/[0.035]">
                      <div
                        className="flex h-full min-w-0 items-center bg-[var(--foreground)] transition-all"
                        style={{ width: stage.count ? `${Math.max((stage.count / pipelineMax) * 100, 8)}%` : "0%" }}
                      />
                    </div>
                    <span className="text-right text-xs font-semibold tabular-nums">{stage.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-[var(--line)] px-6 py-14 text-center">
                <p className="text-sm font-semibold">Your EPC pipeline is ready</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
                  Projects will appear here as they move from qualification through survey, design, delivery and handover.
                </p>
                <Link href="/dashboard/projects" className="mt-6 inline-block border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">
                  Enter project workspace
                </Link>
              </div>
            )}
          </div>
        </article>

        <article className="border border-[var(--line)]">
          <div className="border-b border-[var(--line)] p-5 md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Control pulse</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Portfolio state</h2>
          </div>
          <div className="divide-y divide-[var(--line)]">
            <div className="flex items-center justify-between p-5 md:px-6">
              <span className="text-sm text-[var(--muted)]">Customers</span>
              <strong className="text-lg tabular-nums">{customersResult.count ?? 0}</strong>
            </div>
            <div className="flex items-center justify-between p-5 md:px-6">
              <span className="text-sm text-[var(--muted)]">Controlled documents</span>
              <strong className="text-lg tabular-nums">{documentsResult.count ?? 0}</strong>
            </div>
            <div className="flex items-center justify-between p-5 md:px-6">
              <span className="text-sm text-[var(--muted)]">Red-risk projects</span>
              <strong className={redRiskCount ? "text-lg tabular-nums text-[var(--accent)]" : "text-lg tabular-nums"}>{redRiskCount}</strong>
            </div>
            <div className="p-5 md:px-6">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <strong className="text-sm">Organisation controls active</strong>
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Identity, tenancy and row-level access remain enforced across this workspace.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <article className="border border-[var(--line)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] p-5 md:p-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Portfolio watch</p>
              <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Recent projects</h2>
            </div>
            <Link href="/dashboard/projects" className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">View all</Link>
          </div>

          {projects.length ? (
            <div className="divide-y divide-[var(--line)]">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_120px_105px] md:items-center md:px-6">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${riskClasses(project.risk_status)}`} />
                      <p className="truncate text-sm font-semibold">{project.name}</p>
                    </div>
                    <p className="mt-1 pl-5 text-xs text-[var(--muted)]">{project.reference}</p>
                  </div>
                  <span className="text-xs text-[var(--muted)]">{titleCase(project.status)}</span>
                  <span className="text-xs tabular-nums text-[var(--muted)] md:text-right">
                    {project.target_completion_date ? dateFormatter.format(new Date(project.target_completion_date)) : "No target"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-sm text-[var(--muted)]">No project records have been created yet.</div>
          )}
        </article>

        <article className="border border-[var(--line)]">
          <div className="border-b border-[var(--line)] p-5 md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Evidence trail</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Recent activity</h2>
          </div>

          {activities.length ? (
            <ol className="divide-y divide-[var(--line)]">
              {activities.map((activity) => (
                <li key={activity.id} className="p-5 md:px-6">
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                    <div>
                      <p className="text-sm leading-6">{activity.description}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                        {titleCase(activity.event_type)} · {dateFormatter.format(new Date(activity.created_at))}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold">No recorded events yet</p>
              <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Governed changes will build the operational evidence trail here.</p>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
