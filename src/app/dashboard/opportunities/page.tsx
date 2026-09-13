"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/neon/client";
import { MetricStrip } from "@/components/heliocore/metric-strip";
import { PageHeader } from "@/components/heliocore/page-header";
import { Button } from "@/components/ui/button";
import { OpportunityRegister, type OpportunityRegisterRow } from "./opportunity-register";

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function formatMoney(value: number | null, currencyCode: string) {
  if (value == null) return "Not estimated";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currencyCode, currencyDisplay: "code", maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currencyCode} ${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value)}`;
  }
}

type CustomerRelation = { name: string; currency_code: string | null };
type SiteRelation = { name: string };
type OwnerRelation = { full_name: string | null };

export default function OpportunitiesPage() {
  const [rows, setRows] = useState<OpportunityRegisterRow[]>([]);
  const [metrics, setMetrics] = useState({ records: 0, open: 0, proposal: 0, won: 0, pipeline: "Not loaded" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const client = createClient();
      const { data: opportunities, error: loadError } = await client
        .from("opportunities")
        .select("id,title,reference,stage,estimated_value_gbp,created_at,customers(name,currency_code),sites(name),profiles(full_name)")
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (loadError) {
        setError(loadError.message || "Opportunities could not be loaded.");
        return;
      }

      const records = opportunities ?? [];
      const open = records.filter((item) => item.stage !== "won" && item.stage !== "lost").length;
      const proposal = records.filter((item) => item.stage === "proposal").length;
      const won = records.filter((item) => item.stage === "won").length;
      const currencies = new Set(records.map((item) => firstRelation(item.customers as CustomerRelation | CustomerRelation[] | null)?.currency_code ?? "GBP"));
      const singleCurrency = currencies.size === 1 ? Array.from(currencies)[0] : null;
      const pipelineValue = records.reduce((total, item) => total + Number(item.estimated_value_gbp ?? 0), 0);

      setRows(records.map((item) => {
        const customer = firstRelation(item.customers as CustomerRelation | CustomerRelation[] | null);
        const site = firstRelation(item.sites as SiteRelation | SiteRelation[] | null);
        const owner = firstRelation(item.profiles as OwnerRelation | OwnerRelation[] | null);
        const currencyCode = customer?.currency_code || "GBP";
        const valueNumber = item.estimated_value_gbp == null ? null : Number(item.estimated_value_gbp);
        return {
          id: item.id,
          title: item.title,
          reference: item.reference,
          stage: item.stage,
          customer: customer?.name ?? "Customer unassigned",
          site: site?.name ?? "Site unassigned",
          owner: owner?.full_name ?? "Unassigned",
          valueLabel: formatMoney(valueNumber, currencyCode),
          valueNumber,
        };
      }));

      setMetrics({
        records: records.length,
        open,
        proposal,
        won,
        pipeline: singleCurrency ? formatMoney(pipelineValue, singleCurrency) : "Multiple currencies",
      });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-[1500px]" data-testid="opportunities-neon-register">
      <PageHeader
        eyebrow="Sales"
        title="Opportunities"
        primaryAction={<Button asChild><Link href="/dashboard/opportunities/new">New opportunity</Link></Button>}
      />

      <MetricStrip items={[
        { label: "Pipeline value", value: metrics.pipeline, detail: `${metrics.records} records` },
        { label: "Open", value: metrics.open },
        { label: "Proposal", value: metrics.proposal, emphasis: metrics.proposal ? "warning" : "default" },
        { label: "Won", value: metrics.won, emphasis: metrics.won ? "positive" : "default" },
      ]} />

      {error ? (
        <div className="mt-7 border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800">{error}</div>
      ) : (
        <OpportunityRegister rows={rows} />
      )}
    </div>
  );
}
