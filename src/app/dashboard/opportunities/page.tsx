import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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

export default async function OpportunitiesPage() {
  const supabase = await createClient();
  const { data: opportunities, error } = await supabase
    .from("opportunities")
    .select("id,title,reference,stage,estimated_value_gbp,created_at,customers(name,currency_code),sites(name),profiles(full_name)")
    .order("created_at", { ascending: false });

  const records = opportunities ?? [];
  const openCount = records.filter((item) => item.stage !== "won" && item.stage !== "lost").length;
  const proposalCount = records.filter((item) => item.stage === "proposal").length;
  const wonCount = records.filter((item) => item.stage === "won").length;
  const currencies = new Set(records.map((item) => firstRelation(item.customers as CustomerRelation | CustomerRelation[] | null)?.currency_code ?? "GBP"));
  const singleCurrency = currencies.size === 1 ? Array.from(currencies)[0] : null;
  const pipelineValue = records.reduce((total, item) => total + Number(item.estimated_value_gbp ?? 0), 0);

  const rows: OpportunityRegisterRow[] = records.map((item) => {
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
  });

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        eyebrow="Commercial pipeline"
        title="Opportunities"
        description="A governed register of enquiries that can carry Site, Load, Engineering, Design, BOM, Costing and Proposal work before contract conversion."
        primaryAction={<Button asChild><Link href="/dashboard/opportunities/new">Create opportunity</Link></Button>}
      />

      <MetricStrip items={[
        { label: "Pipeline value", value: singleCurrency ? formatMoney(pipelineValue, singleCurrency) : "Multiple currencies", detail: `${records.length} total records` },
        { label: "Open opportunities", value: openCount, detail: "Excludes won and lost" },
        { label: "In proposal", value: proposalCount, detail: "Commercial decision stage", emphasis: proposalCount ? "warning" : "default" },
        { label: "Won", value: wonCount, detail: "Ready for contract-gated conversion", emphasis: wonCount ? "positive" : "default" },
      ]} />

      {error ? (
        <div className="mt-7 border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800">The opportunity register could not be loaded. Refresh the page before making commercial decisions.</div>
      ) : (
        <OpportunityRegister rows={rows} />
      )}
    </div>
  );
}
