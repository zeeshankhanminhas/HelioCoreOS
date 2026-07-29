import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function OpportunitiesPage() {
  const supabase = await createClient();
  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id,title,reference,stage,estimated_value_gbp,created_at,customers(name),sites(name),profiles(full_name)")
    .order("created_at", { ascending: false });

  const money = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  });

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Commercial pipeline</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Opportunities</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Move qualified demand through readiness evidence and an indicative commercial proposal.</p>
        </div>
        <Link href="/dashboard/opportunities/new" className="inline-flex min-h-10 w-fit items-center border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Create opportunity</Link>
      </header>

      <section className="mt-7 border border-[var(--line)]">
        <div className="border-b border-[var(--line)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Active register</p>
          <h2 className="mt-2 text-2xl font-medium">{opportunities?.length ?? 0} opportunities</h2>
        </div>

        {opportunities?.length ? (
          <div className="divide-y divide-[var(--line)]">
            {opportunities.map((item) => {
              const customer = firstRelation(item.customers);
              const site = firstRelation(item.sites);
              const owner = firstRelation(item.profiles);

              return (
                <Link key={item.id} href={`/dashboard/opportunities/${item.id}`} className="grid gap-3 p-5 hover:bg-black/[0.02] md:grid-cols-[1.4fr_1fr_130px_140px] md:items-center">
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{item.reference} · {customer?.name ?? "Customer"} · {site?.name ?? "Site"}</p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">Owner: {owner?.full_name ?? "Unassigned"}</p>
                  <span className="text-xs font-medium">{titleCase(item.stage)}</span>
                  <p className="text-sm font-semibold md:text-right">{money.format(Number(item.estimated_value_gbp ?? 0))}</p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold">No opportunities yet</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Create the first commercial opportunity to begin the launch workflow.</p>
          </div>
        )}
      </section>
    </div>
  );
}
