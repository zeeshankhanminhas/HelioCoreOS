import { createClient } from "@/lib/supabase/server";

const activeProjectStatuses = [
  "qualification",
  "survey",
  "design",
  "commercial",
  "procurement",
  "installation",
  "commissioning",
  "handover",
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const [projectsResult, customersResult, tasksResult, documentsResult] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }).in("status", activeProjectStatuses),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("tasks").select("id", { count: "exact", head: true }).neq("status", "complete"),
    supabase.from("documents").select("id", { count: "exact", head: true }),
  ]);

  const metrics = [
    { label: "Active projects", value: projectsResult.count ?? 0, note: "Across the governed EPC lifecycle" },
    { label: "Customers", value: customersResult.count ?? 0, note: "Commercial relationships under control" },
    { label: "Open tasks", value: tasksResult.count ?? 0, note: "Outstanding operational actions" },
    { label: "Documents", value: documentsResult.count ?? 0, note: "Evidence and controlled records" },
  ];

  return (
    <>
      <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Sprint 1 foundation</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] md:text-5xl">Operational overview</h1>
        </div>
        <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">
          Authenticated, organisation-scoped and governed by the HelioCoreOS Constitution.
        </p>
      </header>

      <section className="grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="bg-[var(--background)] p-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{metric.label}</p>
            <p className="mt-8 text-5xl font-medium tracking-[-0.05em]">{metric.value}</p>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{metric.note}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <article className="border border-[var(--line)] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">System state</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Foundation authenticated</h2>
          <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">
            User identity, session renewal, protected routing, organisation tenancy and role ownership are now connected. The next build slice can safely introduce live Solar EPC records.
          </p>
        </article>

        <article className="border border-[var(--line)] p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Control status</p>
          <div className="mt-5 flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            <strong>Access governed</strong>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Database access remains constrained by authenticated identity and organisation-level RLS.
          </p>
        </article>
      </section>
    </>
  );
}
