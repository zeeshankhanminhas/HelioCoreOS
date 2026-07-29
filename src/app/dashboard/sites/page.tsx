import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{ q?: string }>;

export default async function SitesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const supabase = await createClient();

  let query = supabase
    .from("sites")
    .select("id, customer_id, name, address, postcode, created_at")
    .order("created_at", { ascending: false });

  if (q) query = query.or(`name.ilike.%${q}%,address.ilike.%${q}%,postcode.ilike.%${q}%`);

  const [{ data: sites }, { data: customers }, { data: projects }] = await Promise.all([
    query,
    supabase.from("customers").select("id, name"),
    supabase.from("projects").select("id, site_id, status, risk_status"),
  ]);

  const customerMap = new Map((customers ?? []).map((customer) => [customer.id, customer.name]));
  const projectCounts = new Map<string, number>();
  const riskMap = new Map<string, string>();

  for (const project of projects ?? []) {
    projectCounts.set(project.site_id, (projectCounts.get(project.site_id) ?? 0) + 1);
    if (project.risk_status === "red" || (!riskMap.has(project.site_id) && project.risk_status === "amber")) riskMap.set(project.site_id, project.risk_status);
  }

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Delivery geography</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Site register</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Connect each physical installation location to its customer and project delivery records.</p>
        </div>
        <Link href="/dashboard/sites/new" className="inline-flex min-h-10 w-fit items-center justify-center border border-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white">Create site</Link>
      </header>

      <form className="mt-7 flex gap-3 border border-[var(--line)] p-4" action="/dashboard/sites">
        <input name="q" defaultValue={q} placeholder="Search site, address or postcode" className="min-h-11 min-w-0 flex-1 border border-[var(--line)] bg-transparent px-3 text-sm outline-none focus:border-[var(--foreground)]" />
        <button className="min-h-11 border border-[var(--line)] px-5 text-xs font-semibold hover:border-[var(--foreground)]">Search</button>
      </form>

      <section className="mt-7 border border-[var(--line)]">
        <div className="flex items-center justify-between border-b border-[var(--line)] p-5 md:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Controlled locations</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">{sites?.length ?? 0} sites</h2>
          </div>
          <Link href="/dashboard/customers" className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]">View customers</Link>
        </div>

        {sites?.length ? (
          <div className="divide-y divide-[var(--line)]">
            {sites.map((site) => {
              const risk = riskMap.get(site.id);
              return (
                <div key={site.id} className="grid gap-4 p-5 md:grid-cols-[minmax(220px,1.3fr)_minmax(180px,1fr)_100px_auto] md:items-center md:px-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${risk === "red" ? "bg-red-600" : risk === "amber" ? "bg-amber-500" : "bg-emerald-600"}`} />
                      <p className="text-sm font-semibold">{site.name}</p>
                    </div>
                    <p className="mt-1 pl-5 text-xs text-[var(--muted)]">{customerMap.get(site.customer_id) ?? "Customer"}</p>
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    <p>{site.address || "No address recorded"}</p>
                    <p className="mt-1 font-medium text-[var(--foreground)]">{site.postcode || "No postcode"}</p>
                  </div>
                  <p className="text-xs"><strong>{projectCounts.get(site.id) ?? 0}</strong><span className="ml-1 text-[var(--muted)]">projects</span></p>
                  <Link href={`/dashboard/projects/new?customer=${site.customer_id}&site=${site.id}`} className="inline-flex min-h-10 items-center justify-center border border-[var(--line)] px-4 text-xs font-semibold">Create project</Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-20 text-center">
            <p className="text-sm font-semibold">No sites found</p>
            <p className="mt-3 text-sm text-[var(--muted)]">Create a customer first, then establish its first delivery location.</p>
            <Link href="/dashboard/sites/new" className="mt-6 inline-flex border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Create site</Link>
          </div>
        )}
      </section>
    </div>
  );
}
