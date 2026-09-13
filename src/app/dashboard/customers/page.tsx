import Link from "next/link";
import { CustomerRegister, type CustomerRegisterRow } from "./customer-register";
import { PageHeader } from "@/components/heliocore/page-header";
import { createClient } from "@/lib/supabase/server";

function titleCase(value: string | null) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()) : "Unclassified";
}

export default async function CustomersPage() {
  const supabase = await createClient();
  const [{ data: customers, error }, { data: sites }, { data: projects }] = await Promise.all([
    supabase.from("customers").select("id, name, display_name, customer_kind, customer_category, status, country_code, contact_name, contact_email, phone, created_at").order("created_at", { ascending: false }),
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

  const rows: CustomerRegisterRow[] = (customers ?? []).map((customer) => ({
    id: customer.id,
    name: customer.display_name || customer.name,
    classification: `${titleCase(customer.customer_kind)} · ${titleCase(customer.customer_category)}`,
    contact: customer.contact_name || customer.contact_email || customer.phone || "No contact details",
    country: customer.country_code || "No country",
    status: customer.status || "unclassified",
    siteCount: siteCounts.get(customer.id) ?? 0,
    activeProjectCount: activeProjectCounts.get(customer.id) ?? 0,
    projectCount: projectCounts.get(customer.id) ?? 0,
  }));

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        eyebrow="Commercial control"
        title="Customer register"
        description="Maintain the accountable individual or organisation behind every site and EPC project."
        primaryAction={<Link href="/dashboard/customers/new" className="inline-flex min-h-10 items-center border border-[var(--accent)] bg-[var(--accent)] px-4 text-xs font-semibold text-white">Create customer</Link>}
      />
      {error ? <div className="mt-7 border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800">The customer register could not be loaded. Refresh before making commercial decisions.</div> : null}
      <CustomerRegister rows={rows} />
    </div>
  );
}
