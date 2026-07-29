import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const stages = ["all", "qualification", "survey", "design", "commercial", "procurement", "installation", "commissioning", "handover", "complete", "on_hold"];
const risks = ["all", "green", "amber", "red"];

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

type SearchParams = Promise<{ q?: string; stage?: string; risk?: string }>;

export default async function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const stage = stages.includes(params.stage ?? "") ? params.stage! : "all";
  const risk = risks.includes(params.risk ?? "") ? params.risk! : "all";
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select("id, customer_id, site_id, name, reference, status, risk_status, project_type, pv_capacity_kwp, battery_capacity_kwh, contract_value_gbp, target_completion_date, updated_at")
    .order("updated_at", { ascending: false });

  if (q) query = query.or(`name.ilike.%${q}%,reference.ilike.%${q}%`);
  if (stage !== "all") query = query.eq("status", stage);
  if (risk !== "all") query = query.eq("risk_status", risk);

  const [{ data: projects }, { data: customers }, { data: sites }] = await Promise.all([
    query,
    supabase.from("customers").select("id, name"),
    supabase.from("sites").select("id, name, postcode"),
  ]);

  const customerMap = new Map((customers ?? []).map((item) => [item.id, item.name]));
  const siteMap = new Map((sites ?? []).map((item) => [item.id, item]));

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Portfolio control</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Project register</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Govern every Solar EPC project from intake through handover, with accountable risk and lifecycle status.</p>
        </div>
        <Link href="/dashboard/projects/new" className="inline-flex min-h-10 w-fit items-center justify-center border border-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white">Create project</Link>
      </header>

      <form className="mt-7 grid gap-3 border border-[var(--line)] p-4 md:grid-cols-[minmax(220px,1fr)_190px_160px_auto]" action="/dashboard/projects">
        <input name="q" defaultValue={q} placeholder="Search name or reference" className="min-h-11 border border-[var(--line)] bg-transparent px-3 text-sm outline-none focus:border-[var(--foreground)]" />
        <select name="stage" defaultValue={stage} className="min-h-11 border border-[var(--line)] bg-[var(--background)] px-3 text-sm outline-none">
          {stages.map((item) => <option key={item} value={item}>{item === "all" ? "All stages" : titleCase(item)}</option>)}
        </select>
        <select name="risk" defaultValue={risk} className="min-h-11 border border-[var(--line)] bg-[var(--background)] px-3 text-sm outline-none">
          {risks.map((item) => <option key={item} value={item}>{item === "all" ? "All risk" : titleCase(item)}</option>)}
        </select>
        <button className="min-h-11 border border-[var(--line)] px-5 text-xs font-semibold hover:border-[var(--foreground)]">Apply filters</button>
      </form>

      <section className="mt-7 border border-[var(--line)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] p-5 md:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Controlled portfolio</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">{projects?.length ?? 0} projects</h2>
          </div>
          <Link href="/dashboard" className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">Executive overview</Link>
        </div>

        {projects?.length ? (
          <div className="divide-y divide-[var(--line)]">
            {projects.map((project) => {
              const site = siteMap.get(project.site_id);
              return (
                <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="grid gap-4 p-5 hover:bg-black/[0.02] md:grid-cols-[minmax(220px,1.4fr)_minmax(150px,0.8fr)_120px_110px_120px] md:items-center md:px-6">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${riskClass(project.risk_status)}`} />
                      <p className="truncate text-sm font-semibold">{project.name}</p>
                    </div>
                    <p className="mt-1 pl-5 text-xs text-[var(--muted)]">{project.reference} · {customerMap.get(project.customer_id) ?? "Customer"}</p>
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    <p>{site?.name ?? "Site"}</p>
                    <p className="mt-1">{site?.postcode ?? project.project_type ?? "—"}</p>
                  </div>
                  <span className="text-xs font-medium">{titleCase(project.status)}</span>
                  <span className="text-xs tabular-nums text-[var(--muted)]">{project.contract_value_gbp ? currency.format(Number(project.contract_value_gbp)) : "No value"}</span>
                  <span className="text-xs tabular-nums text-[var(--muted)] md:text-right">{project.target_completion_date ? date.format(new Date(project.target_completion_date)) : "No target"}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-20 text-center">
            <p className="text-sm font-semibold">No projects match this view</p>
            <p className="mt-3 text-sm text-[var(--muted)]">Create the first EPC project or clear the current filters.</p>
          </div>
        )}
      </section>
    </div>
  );
}
