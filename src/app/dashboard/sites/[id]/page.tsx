import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function titleCase(value: string | null) { return value ? value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Not set"; }

export default async function SitePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ updated?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: site }, { data: opportunities }, { data: projects }] = await Promise.all([
    supabase.from("sites").select("id,customer_id,name,address,postcode,created_at,customers(id,name,display_name)").eq("id", id).single(),
    supabase.from("opportunities").select("id,title,reference,stage").eq("site_id", id).order("updated_at", { ascending: false }),
    supabase.from("projects").select("id,name,reference,status,risk_status,contract_value_gbp").eq("site_id", id).order("updated_at", { ascending: false }),
  ]);
  if (!site) notFound();
  const customer = Array.isArray(site.customers) ? site.customers[0] : site.customers;
  const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

  return <div className="mx-auto max-w-[1500px]">
    <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Site command view</p><h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">{site.name}</h1><p className="mt-4 text-sm text-[var(--muted)]">{customer?.display_name || customer?.name || "Customer unavailable"} · {site.postcode || "No postcode"}</p></div>
      <div className="flex flex-wrap gap-3"><Link href={`/dashboard/sites/${id}/edit`} className="inline-flex min-h-10 items-center border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Edit site</Link><Link href="/dashboard/sites" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Site register</Link></div>
    </header>
    {query.updated ? <p className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Site updated and audit event recorded.</p> : null}
    <section className="mt-7 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
      <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Customer</p><p className="mt-2 text-sm font-semibold">{customer?.display_name || customer?.name}</p></div>
      <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Opportunities</p><p className="mt-2 text-2xl font-medium">{opportunities?.length ?? 0}</p></div>
      <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Projects</p><p className="mt-2 text-2xl font-medium">{projects?.length ?? 0}</p></div>
    </section>
    <section className="mt-7 border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Physical location</p><h2 className="mt-2 text-2xl font-medium">Address context</h2></div><div className="p-5 text-sm leading-6"><p>{site.address || "No address recorded"}</p><p className="mt-1 font-semibold">{site.postcode || "No postcode recorded"}</p></div></section>
    <div className="mt-7 grid gap-7 xl:grid-cols-2">
      <section className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5"><h2 className="text-2xl font-medium">Opportunities</h2></div>{opportunities?.length ? <div className="divide-y divide-[var(--line)]">{opportunities.map((item) => <Link key={item.id} href={`/dashboard/opportunities/${item.id}`} className="block p-5 hover:bg-black/[0.02]"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.reference} · {titleCase(item.stage)}</p></Link>)}</div> : <p className="p-6 text-sm text-[var(--muted)]">No opportunities are linked to this site.</p>}</section>
      <section className="border border-[var(--line)]"><div className="flex items-center justify-between border-b border-[var(--line)] p-5"><h2 className="text-2xl font-medium">Projects</h2><Link href={`/dashboard/projects/new?customer=${site.customer_id}&site=${id}`} className="text-xs font-semibold text-[var(--accent)]">New project</Link></div>{projects?.length ? <div className="divide-y divide-[var(--line)]">{projects.map((item) => <Link key={item.id} href={`/dashboard/projects/${item.id}`} className="grid gap-2 p-5 hover:bg-black/[0.02] sm:grid-cols-[1fr_auto]"><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.reference} · {titleCase(item.status)}</p></div><p className="text-xs font-medium">{item.contract_value_gbp == null ? "No value" : money.format(Number(item.contract_value_gbp))}</p></Link>)}</div> : <p className="p-6 text-sm text-[var(--muted)]">No projects are linked to this site.</p>}</section>
    </div>
  </div>;
}
