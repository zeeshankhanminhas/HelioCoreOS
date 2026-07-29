import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: customer }, { data: sites }, { data: projects }] = await Promise.all([
    supabase.from("customers").select("id, name, contact_name, contact_email, created_at").eq("id", id).single(),
    supabase.from("sites").select("id, name, address, postcode").eq("customer_id", id).order("created_at", { ascending: false }),
    supabase.from("projects").select("id, site_id, name, reference, status, risk_status, contract_value_gbp").eq("customer_id", id).order("updated_at", { ascending: false }),
  ]);

  if (!customer) notFound();

  const siteMap = new Map((sites ?? []).map((site) => [site.id, site]));
  const totalValue = (projects ?? []).reduce((sum, project) => sum + Number(project.contract_value_gbp ?? 0), 0);
  const activeProjects = (projects ?? []).filter((project) => project.status !== "complete").length;

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Customer command view</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">{customer.name}</h1>
          <p className="mt-4 text-sm text-[var(--muted)]">{customer.contact_name || "No named contact"}{customer.contact_email ? ` · ${customer.contact_email}` : ""}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/dashboard/sites/new?customer=${customer.id}`} className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Add site</Link>
          <Link href="/dashboard/customers" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Customer register</Link>
        </div>
      </header>

      <section className="mt-7 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Sites</p><p className="mt-3 text-3xl font-medium">{sites?.length ?? 0}</p></div>
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Active projects</p><p className="mt-3 text-3xl font-medium">{activeProjects}</p></div>
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Portfolio value</p><p className="mt-3 text-3xl font-medium">{currency.format(totalValue)}</p></div>
      </section>

      <div className="mt-7 grid gap-7 xl:grid-cols-2">
        <section className="border border-[var(--line)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] p-5">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Delivery locations</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Linked sites</h2></div>
            <Link href={`/dashboard/sites/new?customer=${customer.id}`} className="text-xs font-semibold text-[var(--accent)]">Add site</Link>
          </div>
          {sites?.length ? <div className="divide-y divide-[var(--line)]">{sites.map((site) => <div key={site.id} className="flex items-center justify-between gap-4 p-5"><div><p className="text-sm font-semibold">{site.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{site.address || "No address"}{site.postcode ? ` · ${site.postcode}` : ""}</p></div><Link href={`/dashboard/projects/new?customer=${customer.id}&site=${site.id}`} className="shrink-0 border border-[var(--line)] px-3 py-2 text-xs font-semibold">New project</Link></div>)}</div> : <p className="p-6 text-sm text-[var(--muted)]">No sites are linked to this customer yet.</p>}
        </section>

        <section className="border border-[var(--line)]">
          <div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Commercial portfolio</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Projects</h2></div>
          {projects?.length ? <div className="divide-y divide-[var(--line)]">{projects.map((project) => { const site = siteMap.get(project.site_id); return <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="grid gap-3 p-5 hover:bg-black/[0.02] sm:grid-cols-[minmax(0,1fr)_110px]"><div><div className="flex items-center gap-3"><span className={`h-2 w-2 rounded-full ${project.risk_status === "red" ? "bg-red-600" : project.risk_status === "amber" ? "bg-amber-500" : "bg-emerald-600"}`} /><p className="text-sm font-semibold">{project.name}</p></div><p className="mt-1 pl-5 text-xs text-[var(--muted)]">{project.reference} · {site?.name || "Site"}</p></div><div className="text-xs sm:text-right"><p className="font-medium">{titleCase(project.status)}</p><p className="mt-1 text-[var(--muted)]">{project.contract_value_gbp ? currency.format(Number(project.contract_value_gbp)) : "No value"}</p></div></Link>; })}</div> : <p className="p-6 text-sm text-[var(--muted)]">No EPC projects are linked to this customer yet.</p>}
        </section>
      </div>
    </div>
  );
}
