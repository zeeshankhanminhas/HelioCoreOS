import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DetailSheet } from "@/components/heliocore/detail-sheet";
import { MetricStrip } from "@/components/heliocore/metric-strip";
import { PageHeader } from "@/components/heliocore/page-header";
import { RecordRegister, type RegisterColumn, type RegisterRow } from "@/components/heliocore/record-register";
import { WorkspaceToolbar } from "@/components/heliocore/workspace-toolbar";

const stages = ["lead", "qualified", "readiness", "proposal", "won", "lost"];

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function statusClass(stage: string) {
  if (stage === "won") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (stage === "lost") return "border-red-200 bg-red-50 text-red-800";
  if (stage === "proposal") return "border-amber-300 bg-amber-50 text-amber-900";
  return "border-[var(--line)] bg-transparent text-[var(--foreground)]";
}

function formatMoney(value: number | null, currencyCode: string) {
  if (value == null) return "Not estimated";
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "code",
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch {
    return `${currencyCode} ${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(Number(value))}`;
  }
}

type SearchParams = Promise<{ q?: string; stage?: string }>;

type CustomerRelation = { name: string; currency_code: string | null };
type SiteRelation = { name: string };
type OwnerRelation = { full_name: string | null };

export default async function OpportunitiesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const selectedStage = stages.includes(params.stage ?? "") ? params.stage ?? "" : "";
  const supabase = await createClient();

  let query = supabase
    .from("opportunities")
    .select("id,title,reference,stage,estimated_value_gbp,created_at,customers(name,currency_code),sites(name),profiles(full_name)")
    .order("created_at", { ascending: false });

  if (selectedStage) query = query.eq("stage", selectedStage);
  if (q) query = query.or(`title.ilike.%${q.replaceAll(",", "")}%,reference.ilike.%${q.replaceAll(",", "")}%`);

  const { data: opportunities, error } = await query;
  const records = opportunities ?? [];
  const openCount = records.filter((item) => item.stage !== "won" && item.stage !== "lost").length;
  const proposalCount = records.filter((item) => item.stage === "proposal").length;
  const wonCount = records.filter((item) => item.stage === "won").length;
  const currencies = new Set(records.map((item) => firstRelation(item.customers as CustomerRelation | CustomerRelation[] | null)?.currency_code ?? "GBP"));
  const singleCurrency = currencies.size === 1 ? Array.from(currencies)[0] : null;
  const pipelineValue = records.reduce((total, item) => total + Number(item.estimated_value_gbp ?? 0), 0);

  const columns: RegisterColumn[] = [
    { key: "opportunity", label: "Opportunity", className: "min-w-[300px]" },
    { key: "context", label: "Customer / site", className: "min-w-[220px]" },
    { key: "stage", label: "Stage" },
    { key: "owner", label: "Owner", className: "min-w-[150px]" },
    { key: "value", label: "Estimated value", align: "right", className: "min-w-[160px]" },
    { key: "action", label: "", align: "right" },
  ];

  const rows: RegisterRow[] = records.map((item) => {
    const customer = firstRelation(item.customers as CustomerRelation | CustomerRelation[] | null);
    const site = firstRelation(item.sites as SiteRelation | SiteRelation[] | null);
    const owner = firstRelation(item.profiles as OwnerRelation | OwnerRelation[] | null);
    const currencyCode = customer?.currency_code || "GBP";
    const value = formatMoney(item.estimated_value_gbp == null ? null : Number(item.estimated_value_gbp), currencyCode);
    const detailContent = (
      <div className="space-y-7">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div><dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Reference</dt><dd className="mt-2 text-sm font-semibold">{item.reference}</dd></div>
          <div><dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Stage</dt><dd className="mt-2"><span className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${statusClass(item.stage)}`}>{titleCase(item.stage)}</span></dd></div>
          <div><dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Customer</dt><dd className="mt-2 text-sm font-semibold">{customer?.name ?? "Unassigned"}</dd></div>
          <div><dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Site</dt><dd className="mt-2 text-sm font-semibold">{site?.name ?? "Unassigned"}</dd></div>
          <div><dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Owner</dt><dd className="mt-2 text-sm font-semibold">{owner?.full_name ?? "Unassigned"}</dd></div>
          <div><dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Estimated value</dt><dd className="mt-2 text-sm font-semibold">{value}</dd></div>
        </dl>
        <div className="border-t border-[var(--line)] pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Next action</p>
          <p className="mt-2 text-sm leading-6">Open the governed record to review readiness, proposal, survey, design and current blockers.</p>
        </div>
      </div>
    );

    return {
      id: item.id,
      cells: {
        opportunity: (
          <DetailSheet
            title={item.title}
            description="Commercial opportunity context"
            trigger={<div><p className="font-semibold text-[var(--foreground)]">{item.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.reference}</p></div>}
            footer={<Link href={`/dashboard/opportunities/${item.id}`} className="inline-flex min-h-10 w-full items-center justify-center border border-[var(--accent)] bg-[var(--accent)] px-4 text-xs font-semibold text-white">Open governed record</Link>}
          >
            {detailContent}
          </DetailSheet>
        ),
        context: <div><p className="text-sm font-medium">{customer?.name ?? "Customer unassigned"}</p><p className="mt-1 text-xs text-[var(--muted)]">{site?.name ?? "Site unassigned"}</p></div>,
        stage: <span className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${statusClass(item.stage)}`}>{titleCase(item.stage)}</span>,
        owner: <span className="text-xs text-[var(--muted)]">{owner?.full_name ?? "Unassigned"}</span>,
        value: <span className="font-semibold tabular-nums">{value}</span>,
        action: <Link href={`/dashboard/opportunities/${item.id}`} className="text-xs font-semibold text-[var(--accent)] hover:underline">Open</Link>,
      },
      mobile: (
        <DetailSheet
          title={item.title}
          description="Commercial opportunity context"
          trigger={<div><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{item.reference}</p></div><span className={`shrink-0 border px-2 py-1 text-[10px] font-semibold ${statusClass(item.stage)}`}>{titleCase(item.stage)}</span></div><p className="mt-4 text-xs text-[var(--muted)]">{customer?.name ?? "Customer unassigned"} · {site?.name ?? "Site unassigned"}</p><div className="mt-3 flex items-center justify-between gap-4"><span className="text-xs text-[var(--muted)]">{owner?.full_name ?? "Unassigned"}</span><span className="text-sm font-semibold tabular-nums">{value}</span></div></div>}
          footer={<Link href={`/dashboard/opportunities/${item.id}`} className="inline-flex min-h-10 w-full items-center justify-center border border-[var(--accent)] bg-[var(--accent)] px-4 text-xs font-semibold text-white">Open governed record</Link>}
        >
          {detailContent}
        </DetailSheet>
      ),
    };
  });

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        eyebrow="Commercial pipeline"
        title="Opportunities"
        description="A governed register of enquiries moving through qualification, readiness, proposal and conversion."
        primaryAction={<Link href="/dashboard/opportunities/new" className="inline-flex min-h-10 items-center border border-[var(--accent)] bg-[var(--accent)] px-4 text-xs font-semibold text-white">Create opportunity</Link>}
      />

      <MetricStrip
        items={[
          { label: "Pipeline value", value: singleCurrency ? formatMoney(pipelineValue, singleCurrency) : "Multiple currencies", detail: singleCurrency ? `${records.length} matching records` : "Review values by record currency" },
          { label: "Open opportunities", value: openCount, detail: "Excludes won and lost" },
          { label: "In proposal", value: proposalCount, detail: "Commercial decision stage", emphasis: proposalCount ? "warning" : "default" },
          { label: "Won", value: wonCount, detail: "Converted commercial records", emphasis: wonCount ? "positive" : "default" },
        ]}
      />

      <form>
        <WorkspaceToolbar summary={`${records.length} matching ${records.length === 1 ? "opportunity" : "opportunities"}`}>
          <label className="text-xs font-semibold">Search<input name="q" defaultValue={q} placeholder="Title or reference" className="mt-2 min-h-10 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal outline-none focus:border-[var(--accent)]" /></label>
          <label className="text-xs font-semibold">Stage<select name="stage" defaultValue={selectedStage} className="mt-2 min-h-10 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal outline-none focus:border-[var(--accent)]"><option value="">All stages</option>{stages.map((stage) => <option key={stage} value={stage}>{titleCase(stage)}</option>)}</select></label>
          <div className="flex items-end gap-2"><button className="min-h-10 border border-[var(--foreground)] px-4 text-xs font-semibold">Apply</button>{q || selectedStage ? <Link href="/dashboard/opportunities" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Clear</Link> : null}</div>
        </WorkspaceToolbar>
      </form>

      <RecordRegister
        caption="Opportunity register"
        columns={columns}
        rows={rows}
        hasError={Boolean(error)}
        errorState={<><p className="text-sm font-semibold">Register unavailable</p><p className="mt-2 text-sm text-[var(--muted)]">The opportunity register could not be loaded. Refresh the page or contact an administrator.</p></>}
        emptyState={<><p className="text-sm font-semibold">No matching opportunities</p><p className="mt-2 text-sm text-[var(--muted)]">{q || selectedStage ? "Adjust the filters or clear the search." : "Create the first commercial opportunity to begin the governed workflow."}</p></>}
      />
    </div>
  );
}
