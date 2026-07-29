import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ q?: string; error?: string }>;

function titleCase(value: string | null) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()) : "Unclassified";
}

export default async function CustomersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("id, name, display_name, customer_kind, customer_category, status, country_code, contact_name, contact_email, phone, created_at")
    .order("created_at", { ascending: false });

  if (q) query = query.or(`display_name.ilike.%${q}%,name.ilike.%${q}%,contact_name.ilike.%${q}%,contact_email.ilike.%${q}%`);

  const [{ data: customers }, { data: sites }, { data: projects }] = await Promise.all([
    query,
    supabase.from("sites").select("id, customer_id"),
    supabase.from("projects").select("id, customer_id, status"),
  ]);

  const siteCounts = new Map<string, number>();
  const projectCounts = new Map<string, number>();
  const activeProjectCounts = new Map<string, number>();

  for (const site of sites ?? []) siteCounts.set(site.customer_id, (siteCounts.get(site.customer_id) ?? 0) + 1);
  for (const project of projects ?? []) {
    projectCounts.set(project.customer_id, (projectCounts.get(project.customer_id) ?? 0) + 1);
    if (project.status !== "complete") activeProjectCounts.set(project.customer_id, (activeProjectCounts.get(project.customer_id) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Commercial control</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Customer register</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Maintain the accountable individual or organisation behind every site and EPC project.</p>
        </div>
        <Link href="/dashboard/customers/new" className="inline-flex min-h-10 w-fit items-center justify-center border border-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white">Create customer</Link>
      </header>

      {params.error ? <p className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{params.error}</p> : null}

      <form className="mt-7 flex gap-3 border border-[var(--line)] p-4" action="/dashboard/customers">
        <input name="q" defaultValue={q} placeholder="Search customer or contact" className="min-h-11 min-w-0 flex-1 border border-[var(--line)] bg-transparent px-3 text-sm outline-none focus:border-[var(--foreground)]" />
        <button className="min-h-11 border border-[var(--line)] px-5 text-xs font-semibold hover:border-[var(--foreground)]">Search</button>
      </form>

      <section className="mt-7 border border-[var(--line)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] p-5 md:px-6">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Governed relationships</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">{customers?.length ?? 0} customers</h2></div>
          <Link href="/dashboard/sites" className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">View sites</Link>
        </div>

        {customers?.length ? (
          <div className="divide-y divide-[var(--line)]">
            {customers.map((customer) => (
              <Link key={customer.id} href={`/dashboard/customers/${customer.id}`} className="grid gap-4 p-5 hover:bg-black/[0.02] md:grid-cols-[minmax(220px,1.3fr)_minmax(180px,1fr)_120px_100px_120px] md:items-center md:px-6">
                <div>
                  <p className="text-sm font-semibold">{customer.display_name || customer.name}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{titleCase(customer.customer_kind)} · {titleCase(customer.customer_category)}</p>
                </div>
                <div className="text-xs text-[var(--muted)]"><p>{customer.contact_name || customer.contact_email || customer.phone || "No contact details"}</p><p className="mt-1">{customer.country_code || "No country"}</p></div>
                <span className="text-xs font-medium">{titleCase(customer.status)}</span>
                <div className="text-xs"><strong>{siteCounts.get(customer.id) ?? 0}</strong><span className="ml-1 text-[var(--muted)]">sites</span></div>
                <div className="text-xs md:text-right"><strong>{activeProjectCounts.get(customer.id) ?? 0}</strong><span className="ml-1 text-[var(--muted)]">active</span><p className="mt-1 text-[10px] text-[var(--muted)]">{projectCounts.get(customer.id) ?? 0} total projects</p></div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-20 text-center"><p className="text-sm font-semibold">No customers found</p><p className="mt-3 text-sm text-[var(--muted)]">Create the first customer to begin the EPC delivery chain.</p><Link href="/dashboard/customers/new" className="mt-6 inline-flex border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Create customer</Link></div>
        )}
      </section>
    </div>
  );
}
