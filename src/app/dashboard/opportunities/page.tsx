import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const stages = ["lead", "qualified", "readiness", "proposal", "won", "lost"];

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

type SearchParams = Promise<{ q?: string; stage?: string }>;

export default async function OpportunitiesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const selectedStage = stages.includes(params.stage ?? "") ? params.stage ?? "" : "";
  const supabase = await createClient();

  let query = supabase
    .from("opportunities")
    .select("id,title,reference,stage,estimated_value_gbp,created_at,customers(name),sites(name),profiles(full_name)")
    .order("created_at", { ascending: false });

  if (selectedStage) query = query.eq("stage", selectedStage);
  if (q) query = query.or(`title.ilike.%${q.replaceAll(",", "")}%,reference.ilike.%${q.replaceAll(",", "")}%`);

  const { data: opportunities, error } = await query;
  const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Commercial pipeline</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Opportunities</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">A governed register of enquiries moving through qualification, readiness and proposal.</p>
        </div>
        <Link href="/dashboard/opportunities/new" className="inline-flex min-h-10 w-fit items-center border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Create opportunity</Link>
      </header>

      <form className="mt-7 grid gap-3 border border-[var(--line)] p-4 md:grid-cols-[1fr_220px_auto]">
        <label className="text-xs font-semibold">Search<input name="q" defaultValue={q} placeholder="Title or reference" className="mt-2 min-h-10 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
        <label className="text-xs font-semibold">Stage<select name="stage" defaultValue={selectedStage} className="mt-2 min-h-10 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"><option value="">All stages</option>{stages.map((stage) => <option key={stage} value={stage}>{titleCase(stage)}</option>)}</select></label>
        <div className="flex items-end gap-2"><button className="min-h-10 border border-[var(--foreground)] px-4 text-xs font-semibold">Apply</button>{q || selectedStage ? <Link href="/dashboard/opportunities" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Clear</Link> : null}</div>
      </form>

      <section className="mt-7 border border-[var(--line)]">
        <div className="border-b border-[var(--line)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Opportunity register</p>
          <h2 className="mt-2 text-2xl font-medium">{opportunities?.length ?? 0} matching opportunities</h2>
        </div>

        {error ? (
          <div className="p-8"><p className="text-sm font-semibold">Register unavailable</p><p className="mt-2 text-sm text-[var(--muted)]">The opportunity register could not be loaded. Refresh the page or contact an administrator.</p></div>
        ) : opportunities?.length ? (
          <div className="divide-y divide-[var(--line)]">
            {opportunities.map((item) => {
              const customer = firstRelation(item.customers);
              const site = firstRelation(item.sites);
              const owner = firstRelation(item.profiles);
              return (
                <Link key={item.id} href={`/dashboard/opportunities/${item.id}`} className="grid gap-3 p-5 hover:bg-black/[0.02] md:grid-cols-[1.4fr_1fr_130px_140px] md:items-center">
                  <div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.reference} · {customer?.name ?? "Customer unassigned"} · {site?.name ?? "Site unassigned"}</p></div>
                  <p className="text-xs text-[var(--muted)]">Owner: {owner?.full_name ?? "Unassigned"}</p>
                  <span className="text-xs font-medium">{titleCase(item.stage)}</span>
                  <p className="text-sm font-semibold md:text-right">{item.estimated_value_gbp == null ? "Not estimated" : money.format(Number(item.estimated_value_gbp))}</p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center"><p className="text-sm font-semibold">No matching opportunities</p><p className="mt-2 text-sm text-[var(--muted)]">{q || selectedStage ? "Adjust the filters or clear the search." : "Create the first commercial opportunity to begin the launch workflow."}</p></div>
        )}
      </section>
    </div>
  );
}
