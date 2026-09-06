import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProjectControl } from "../actions";

const stages = ["procurement", "installation", "commissioning", "handover", "complete", "on_hold"];
const risks = ["green", "amber", "red"];
const tabs = ["Summary", "Contract", "Approved Design", "Procurement", "Installation", "Quality", "Commissioning", "Handover", "Documents", "Tasks", "Activity"];

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function riskClass(risk: string) {
  if (risk === "red") return "bg-red-600";
  if (risk === "amber") return "bg-amber-500";
  return "bg-emerald-600";
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
};

export default async function ProjectWorkspacePage({ params, searchParams }: Props) {
  const { id } = await params;
  const messages = await searchParams;
  const supabase = await createClient();

  const [{ data: project }, { data: tasks }, { data: documents }, { data: activities }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("tasks").select("id, title, status, due_date").eq("project_id", id).order("created_at", { ascending: false }).limit(6),
    supabase.from("documents").select("id, name, category, status, created_at").eq("project_id", id).order("created_at", { ascending: false }).limit(6),
    supabase.from("activity_logs").select("id, event_type, description, created_at").eq("project_id", id).order("created_at", { ascending: false }).limit(8),
  ]);

  if (!project) notFound();

  const [{ data: customer }, { data: site }, { data: owner }] = await Promise.all([
    supabase.from("customers").select("name, contact_name, contact_email").eq("id", project.customer_id).maybeSingle(),
    supabase.from("sites").select("name, address, postcode").eq("id", project.site_id).maybeSingle(),
    project.project_owner_id ? supabase.from("profiles").select("full_name, role").eq("id", project.project_owner_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const openTasks = (tasks ?? []).filter((task) => task.status !== "complete");
  const overdueTasks = openTasks.filter((task) => task.due_date && new Date(task.due_date) < new Date());
  const legacyStage = !stages.includes(project.status);
  const nextDecision = project.risk_status === "red"
    ? "Resolve the red-risk condition before advancing the delivery stage."
    : legacyStage
      ? "This record predates the contract-gated Project model. Move it into a valid post-contract delivery stage after confirming the signed commercial basis."
      : overdueTasks.length
        ? `Close or replan ${overdueTasks.length} overdue action${overdueTasks.length === 1 ? "" : "s"}.`
        : project.status === "complete"
          ? "Confirm final evidence retention and O&M ownership."
          : `Confirm readiness to progress beyond ${titleCase(project.status)}.`;

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="border-b border-[var(--line)] pb-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className={`h-2 w-2 rounded-full ${riskClass(project.risk_status)}`} />
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Post-contract Project · {project.reference}</p>
            </div>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">{project.name}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">{customer?.name ?? "Customer"} · {site?.name ?? "Site"}{site?.postcode ? ` · ${site.postcode}` : ""} · {titleCase(project.status)}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/projects" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Project register</Link>
            <Link href="/dashboard/tasks" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Action register</Link>
          </div>
        </div>
      </header>

      {messages.error ? <div className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{messages.error}</div> : null}
      {messages.updated ? <div className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Project delivery control updated and recorded in the activity trail.</div> : null}
      {legacyStage ? <div className="mt-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"><span className="font-semibold">Legacy lifecycle state:</span> {titleCase(project.status)} is a pre-contract stage and is no longer part of the Project delivery lifecycle.</div> : null}

      <nav className="mt-7 overflow-x-auto border-y border-[var(--line)]" aria-label="Project workspace">
        <div className="flex min-w-max">
          {tabs.map((tab, index) => <span key={tab} className={`border-r border-[var(--line)] px-4 py-3 text-xs font-semibold ${index === 0 ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>{tab}</span>)}
        </div>
      </nav>

      <div className="mt-4 border border-[var(--line)] px-4 py-3 text-xs leading-5 text-[var(--muted)]"><span className="font-semibold text-[var(--foreground)]">Inherited basis:</span> signed contract + approved engineering revision. Survey, Calculator and Detailed Design remain upstream records; this workspace governs execution.</div>

      <section className="mt-7 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Contract value", project.contract_value_gbp ? currency.format(Number(project.contract_value_gbp)) : "Not set"],
          ["Approved PV", project.pv_capacity_kwp ? `${Number(project.pv_capacity_kwp).toLocaleString("en-GB")} kWp` : "Not set"],
          ["Approved BESS", project.battery_capacity_kwh ? `${Number(project.battery_capacity_kwh).toLocaleString("en-GB")} kWh` : "Not set"],
          ["Target completion", project.target_completion_date ? date.format(new Date(project.target_completion_date)) : "Not set"],
          ["Project owner", owner?.full_name ?? "Unassigned"],
        ].map(([label, value]) => (
          <article key={label} className="bg-[var(--background)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
            <p className="mt-5 text-lg font-medium tracking-[-0.02em]">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
        <div className="space-y-7">
          <article className="border border-[var(--line)]">
            <div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Delivery control</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Next required decision</h2></div>
            <div className="p-5 md:p-6"><p className="max-w-3xl text-lg leading-8">{nextDecision}</p>{project.notes ? <p className="mt-5 border-l-2 border-[var(--accent)] pl-4 text-sm leading-6 text-[var(--muted)]">{project.notes}</p> : null}</div>
          </article>

          <article className="border border-[var(--line)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] p-5 md:px-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Accountability</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Open delivery actions</h2></div><span className="text-xs tabular-nums text-[var(--muted)]">{openTasks.length} open</span></div>
            {tasks?.length ? <div className="divide-y divide-[var(--line)]">{tasks.map((task) => <div key={task.id} className="grid gap-2 p-5 md:grid-cols-[minmax(0,1fr)_120px_120px] md:px-6"><p className="text-sm font-semibold">{task.title}</p><span className="text-xs text-[var(--muted)]">{titleCase(task.status)}</span><span className="text-xs tabular-nums text-[var(--muted)] md:text-right">{task.due_date ? date.format(new Date(task.due_date)) : "No due date"}</span></div>)}</div> : <div className="px-6 py-12 text-sm text-[var(--muted)]">No delivery actions have been recorded.</div>}
          </article>

          <article className="border border-[var(--line)]">
            <div className="flex items-center justify-between border-b border-[var(--line)] p-5 md:px-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Evidence</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Controlled documents</h2></div><span className="text-xs tabular-nums text-[var(--muted)]">{documents?.length ?? 0} recent</span></div>
            {documents?.length ? <div className="divide-y divide-[var(--line)]">{documents.map((document) => <div key={document.id} className="grid gap-2 p-5 md:grid-cols-[minmax(0,1fr)_140px_100px] md:px-6"><p className="text-sm font-semibold">{document.name}</p><span className="text-xs text-[var(--muted)]">{titleCase(document.category)}</span><span className="text-xs text-[var(--muted)] md:text-right">{titleCase(document.status)}</span></div>)}</div> : <div className="px-6 py-12 text-sm text-[var(--muted)]">No controlled documents have been linked.</div>}
          </article>
        </div>

        <aside className="space-y-7">
          <form action={updateProjectControl} className="border border-[var(--line)]">
            <div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Delivery authority</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Update delivery state</h2></div>
            <div className="space-y-5 p-5">
              <input type="hidden" name="project_id" value={project.id} />
              <label className="block text-xs font-semibold">Delivery stage<select name="status" defaultValue={legacyStage ? "procurement" : project.status} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">{stages.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
              <label className="block text-xs font-semibold">Risk status<select name="risk_status" defaultValue={project.risk_status} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">{risks.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
              <button className="min-h-11 w-full border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white">Record delivery update</button>
              <p className="text-xs leading-5 text-[var(--muted)]">Every delivery-stage or risk change is written to the governed activity trail.</p>
            </div>
          </form>

          <article className="border border-[var(--line)]">
            <div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Evidence trail</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Recent activity</h2></div>
            {activities?.length ? <div className="divide-y divide-[var(--line)]">{activities.map((activity) => <div key={activity.id} className="p-5"><div className="flex items-start justify-between gap-4"><p className="text-sm font-semibold">{titleCase(activity.event_type)}</p><span className="shrink-0 text-[10px] text-[var(--muted)]">{date.format(new Date(activity.created_at))}</span></div><p className="mt-2 text-xs leading-5 text-[var(--muted)]">{activity.description}</p></div>)}</div> : <div className="p-5 text-sm text-[var(--muted)]">No activity has been recorded.</div>}
          </article>

          <article className="border border-[var(--line)] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Delivery context</p>
            <dl className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm">
              <div className="py-4"><dt className="text-xs text-[var(--muted)]">Site address</dt><dd className="mt-1 font-medium">{site?.address || site?.postcode || "Not recorded"}</dd></div>
              <div className="py-4"><dt className="text-xs text-[var(--muted)]">Customer contact</dt><dd className="mt-1 font-medium">{customer?.contact_name || customer?.contact_email || "Not recorded"}</dd></div>
              <div className="py-4"><dt className="text-xs text-[var(--muted)]">Project type</dt><dd className="mt-1 font-medium">{project.project_type || "Not classified"}</dd></div>
            </dl>
          </article>
        </aside>
      </section>
    </div>
  );
}