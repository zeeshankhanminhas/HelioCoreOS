"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { RecordHeader, RecordWorkspace, RecordWorkspaceSection } from "@/components/heliocore/record-workspace";
import { createClient } from "@/lib/neon/client";

function titleCase(value: string | null) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()) : "Not set";
}

type Customer = {
  id: string;
  name: string;
  display_name: string | null;
  customer_kind: string | null;
  customer_category: string | null;
  country_code: string | null;
  contact_name: string | null;
  contact_email: string | null;
  phone: string | null;
  registration_identifier: string | null;
  tax_identifier: string | null;
  currency_code: string | null;
  payment_terms_days: number | null;
  status: string | null;
  notes: string | null;
};

type Site = { id: string; name: string; address: string | null; postcode: string | null };
type Project = {
  id: string;
  site_id: string;
  name: string;
  reference: string;
  status: string;
  risk_status: string | null;
  contract_value_gbp: number | string | null;
};

export default function CustomerPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params.id;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const client = createClient();
      const [{ data: customerData, error: customerError }, { data: siteData }, { data: projectData }] = await Promise.all([
        client.from("customers").select("id, name, display_name, customer_kind, customer_category, country_code, contact_name, contact_email, phone, registration_identifier, tax_identifier, currency_code, payment_terms_days, status, notes").eq("id", id).single(),
        client.from("sites").select("id, name, address, postcode").eq("customer_id", id).order("created_at", { ascending: false }),
        client.from("projects").select("id, site_id, name, reference, status, risk_status, contract_value_gbp").eq("customer_id", id).order("updated_at", { ascending: false }),
      ]);

      if (cancelled) return;
      if (customerError || !customerData) {
        setUnavailable(true);
        setLoading(false);
        return;
      }

      setCustomer(customerData as Customer);
      setSites((siteData ?? []) as Site[]);
      setProjects((projectData ?? []) as Project[]);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const siteMap = useMemo(() => new Map(sites.map((site) => [site.id, site])), [sites]);

  if (loading) {
    return <div className="mx-auto max-w-[1500px] p-8 text-sm text-[var(--muted)]">Loading customer record…</div>;
  }

  if (unavailable || !customer) {
    return (
      <div className="mx-auto max-w-[900px] border border-[var(--line)] p-8" data-testid="customer-record-unavailable">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Governed access</p>
        <h1 className="mt-3 text-2xl font-semibold">Customer record unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          This record does not exist in your organisation or your current identity is not permitted to access it.
        </p>
        <Link href="/dashboard/customers" className="mt-6 inline-flex border border-[var(--line)] px-4 py-2 text-xs font-semibold">Return to customer register</Link>
      </div>
    );
  }

  const totalValue = projects.reduce((sum, project) => sum + Number(project.contract_value_gbp ?? 0), 0);
  const activeProjects = projects.filter((project) => project.status !== "complete").length;
  const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: customer.currency_code || "GBP", maximumFractionDigits: 0 });
  const displayName = customer.display_name || customer.name;

  return (
    <RecordWorkspace>
      <div data-testid="customer-neon-record">
        <RecordHeader
          eyebrow="Customer command view"
          title={displayName}
          meta={<>{titleCase(customer.customer_kind)} · {titleCase(customer.customer_category)} · {titleCase(customer.status)}</>}
          actions={<><Link href={`/dashboard/customers/${id}/edit`} className="inline-flex min-h-10 items-center border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Edit customer</Link><Link href={`/dashboard/sites/new?customer=${customer.id}`} className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Add site</Link><Link href="/dashboard/customers" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Customer register</Link></>}
        />
      </div>

      {searchParams.get("updated") ? <p className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Customer updated and audit event recorded.</p> : null}

      <section className="mt-7 grid gap-px border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Sites</p><p className="mt-3 text-3xl font-medium">{sites.length}</p></div>
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Active projects</p><p className="mt-3 text-3xl font-medium">{activeProjects}</p></div>
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Portfolio value</p><p className="mt-3 text-3xl font-medium">{currency.format(totalValue)}</p></div>
      </section>

      <RecordWorkspaceSection eyebrow="Customer profile" title="Identity and commercial basics">
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
          <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Primary contact</p><p className="mt-2 text-sm font-medium">{customer.contact_name || displayName}</p><p className="mt-1 text-xs text-[var(--muted)]">{customer.contact_email || customer.phone || "No contact details"}</p></div>
          <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Country</p><p className="mt-2 text-sm font-medium">{customer.country_code || "Not set"}</p></div>
          <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Registration</p><p className="mt-2 text-sm font-medium">{customer.registration_identifier || "Not applicable"}</p><p className="mt-1 text-xs text-[var(--muted)]">Tax: {customer.tax_identifier || "Not set"}</p></div>
          <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Commercial terms</p><p className="mt-2 text-sm font-medium">{customer.currency_code || "GBP"}</p><p className="mt-1 text-xs text-[var(--muted)]">{customer.payment_terms_days == null ? "Payment terms not set" : `${customer.payment_terms_days} days`}</p></div>
        </div>
        {customer.notes ? <p className="border-t border-[var(--line)] p-5 text-sm leading-6 text-[var(--muted)]">{customer.notes}</p> : null}
      </RecordWorkspaceSection>

      <div className="mt-7 grid gap-7 xl:grid-cols-2">
        <RecordWorkspaceSection className="mt-0" eyebrow="Delivery locations" title="Linked sites" action={<Link href={`/dashboard/sites/new?customer=${customer.id}`} className="text-xs font-semibold text-[var(--accent)]">Add site</Link>}>
          {sites.length ? <div className="divide-y divide-[var(--line)]">{sites.map((site) => <div key={site.id} className="flex items-center justify-between gap-4 p-5"><div><Link href={`/dashboard/sites/${site.id}`} className="text-sm font-semibold hover:text-[var(--accent)]">{site.name}</Link><p className="mt-1 text-xs text-[var(--muted)]">{site.address || "No address"}{site.postcode ? ` · ${site.postcode}` : ""}</p></div><Link href={`/dashboard/projects/new?customer=${customer.id}&site=${site.id}`} className="shrink-0 border border-[var(--line)] px-3 py-2 text-xs font-semibold">New project</Link></div>)}</div> : <p className="p-6 text-sm text-[var(--muted)]">No sites are linked to this customer yet.</p>}
        </RecordWorkspaceSection>

        <RecordWorkspaceSection className="mt-0" eyebrow="Commercial portfolio" title="Projects">
          {projects.length ? <div className="divide-y divide-[var(--line)]">{projects.map((project) => { const site = siteMap.get(project.site_id); return <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="grid gap-3 p-5 hover:bg-black/[0.02] sm:grid-cols-[minmax(0,1fr)_110px]"><div><div className="flex items-center gap-3"><span className={`h-2 w-2 rounded-full ${project.risk_status === "red" ? "bg-red-600" : project.risk_status === "amber" ? "bg-amber-500" : "bg-emerald-600"}`} /><p className="text-sm font-semibold">{project.name}</p></div><p className="mt-1 pl-5 text-xs text-[var(--muted)]">{project.reference} · {site?.name || "Site"}</p></div><div className="text-xs sm:text-right"><p className="font-medium">{titleCase(project.status)}</p><p className="mt-1 text-[var(--muted)]">{project.contract_value_gbp ? currency.format(Number(project.contract_value_gbp)) : "No value"}</p></div></Link>; })}</div> : <p className="p-6 text-sm text-[var(--muted)]">No EPC projects are linked to this customer yet.</p>}
        </RecordWorkspaceSection>
      </div>
    </RecordWorkspace>
  );
}
