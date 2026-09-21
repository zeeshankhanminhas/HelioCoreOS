"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteRegister, type SiteRegisterRow } from "./site-register";
import { PageHeader } from "@/components/heliocore/page-header";
import { createClient } from "@/lib/neon/client";

export default function SitesPage() {
  const [rows, setRows] = useState<SiteRegisterRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const client = createClient();
      const [{ data: sites, error: siteError }, { data: customers }, { data: projects }] = await Promise.all([
        client.from("sites").select("id, customer_id, name, address, postcode, created_at").order("created_at", { ascending: false }),
        client.from("customers").select("id, name, display_name"),
        client.from("projects").select("id, site_id, status, risk_status"),
      ]);

      if (cancelled) return;
      if (siteError) {
        setError(siteError.message || "The site register could not be loaded.");
        return;
      }

      const customerMap = new Map((customers ?? []).map((customer) => [customer.id, customer.display_name || customer.name]));
      const projectCounts = new Map<string, number>();
      const riskMap = new Map<string, "red" | "amber" | "green">();

      for (const project of projects ?? []) {
        projectCounts.set(project.site_id, (projectCounts.get(project.site_id) ?? 0) + 1);
        if (project.risk_status === "red") riskMap.set(project.site_id, "red");
        else if (project.risk_status === "amber" && riskMap.get(project.site_id) !== "red") riskMap.set(project.site_id, "amber");
        else if (!riskMap.has(project.site_id)) riskMap.set(project.site_id, "green");
      }

      setRows((sites ?? []).map((site) => ({
        id: site.id,
        customerId: site.customer_id,
        name: site.name,
        customer: customerMap.get(site.customer_id) ?? "Customer unassigned",
        address: site.address || "No address recorded",
        postcode: site.postcode || "No postcode",
        projectCount: projectCounts.get(site.id) ?? 0,
        risk: riskMap.get(site.id) ?? "green",
      })));
    }

    void load().catch((loadError: unknown) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : "The site register could not be loaded.");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-[1500px]" data-testid="sites-neon-register">
      <PageHeader
        eyebrow="Delivery geography"
        title="Site register"
        description="Connect each physical installation location to its customer and governed project delivery records."
        primaryAction={<Link href="/dashboard/sites/new" className="inline-flex min-h-10 items-center border border-[var(--accent)] bg-[var(--accent)] px-4 text-xs font-semibold text-white">Create site</Link>}
      />
      {error ? <div className="mt-7 border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800">{error}</div> : null}
      <SiteRegister rows={rows} />
    </div>
  );
}
