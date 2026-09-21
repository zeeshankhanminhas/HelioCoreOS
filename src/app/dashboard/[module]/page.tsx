import Link from "next/link";
import { notFound } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { EmptyState, LifecycleStatus, NextAction } from "@/components/heliocore/operational-state";
import { PageHeader } from "@/components/heliocore/page-header";

const modules = {
  tasks: { title: "Actions", eyebrow: "Command", scope: "Owners · due dates · blockers" },
  approvals: { title: "Approvals", eyebrow: "Command", scope: "Pending decisions" },
  proposals: { title: "Proposals", eyebrow: "Commercial", scope: "Revision · value · issue status" },
  contracts: { title: "Contracts", eyebrow: "Commercial", scope: "Revision · signature · project gate" },
  designs: { title: "Designs", eyebrow: "Engineering", scope: "Revision · purpose · approval" },
  drawings: { title: "Drawings", eyebrow: "Engineering", scope: "Revision · purpose · status" },
  boms: { title: "BOM", eyebrow: "Engineering", scope: "Revision · quantities · release status" },
  requisitions: { title: "Purchase requisitions", eyebrow: "Procurement", scope: "Material requirement · approval" },
  rfqs: { title: "RFQs", eyebrow: "Procurement", scope: "Suppliers · responses · due dates" },
  "vendor-comparisons": { title: "Vendor comparisons", eyebrow: "Procurement", scope: "Technical · commercial · delivery" },
  "purchase-orders": { title: "Purchase orders", eyebrow: "Procurement", scope: "Supplier · value · delivery status" },
  suppliers: { title: "Suppliers", eyebrow: "Procurement", scope: "Approval · capability · performance" },
  shipments: { title: "Shipments", eyebrow: "Logistics", scope: "Dispatch · ETA · destination" },
  grn: { title: "Goods receipts", eyebrow: "Logistics", scope: "PO · received · shortage · damage" },
  warehouses: { title: "Warehouses", eyebrow: "Inventory", scope: "On hand · reserved · available" },
  "site-stock": { title: "Site stock", eyebrow: "Inventory", scope: "Available · reserved · issued" },
  "material-movements": { title: "Material movements", eyebrow: "Inventory", scope: "Receipt · transfer · issue · return" },
  construction: { title: "Construction", eyebrow: "Execution", scope: "Progress · constraints · completion" },
  quality: { title: "HSE & Quality", eyebrow: "Execution", scope: "Inspections · NCRs · snags" },
  commissioning: { title: "Commissioning", eyebrow: "Execution", scope: "Tests · energisation · acceptance" },
  handover: { title: "Handover", eyebrow: "Execution", scope: "Documents · training · acceptance" },
  budgets: { title: "Project budgets", eyebrow: "Finance", scope: "Budget · committed · actual · forecast" },
  costing: { title: "Costing", eyebrow: "Commercial", scope: "Materials · labour · overhead · margin" },
  "supplier-invoices": { title: "Supplier invoices", eyebrow: "Accounts payable", scope: "PO match · approval · due · payment" },
  "customer-invoices": { title: "Customer invoices", eyebrow: "Accounts receivable", scope: "Milestone · invoice · due · receipt" },
  payments: { title: "Payments", eyebrow: "Finance", scope: "Payment · receipt · reconciliation" },
  assets: { title: "Assets", eyebrow: "Operations", scope: "Site · equipment · warranty" },
  om: { title: "O&M", eyebrow: "Operations", scope: "Performance · issues · service" },
  "service-maintenance": { title: "Service & maintenance", eyebrow: "Operations", scope: "Planned · corrective · completed" },
  documents: { title: "Documents", eyebrow: "Governance", scope: "Type · revision · status" },
  reports: { title: "Reports & analytics", eyebrow: "Reporting", scope: "Commercial · engineering · delivery" },
  settings: { title: "Settings", eyebrow: "Administration", scope: "Organisation · workflow · preferences" },
} as const;

type ModuleKey = keyof typeof modules;
type ModulePageProps = { params: Promise<{ module: string }> };

export default async function ModulePage({ params }: ModulePageProps) {
  const { module } = await params;
  if (!(module in modules)) notFound();
  const currentModule = modules[module as ModuleKey];
  const documentModule = module === "documents";
  const actionModule = module === "tasks" || module === "approvals";
  const columns = documentModule
    ? ["Document number", "Title / project", "Revision", "Workflow state", "Reviewer", "Updated", "Controlled"]
    : actionModule
      ? ["Record", "Context", "State", "Owner", "Due", "Blocker", "Next action"]
      : ["Record", "Context", "Current state", "Owner", "Operational value", "Updated", "Next action"];

  return (
    <div className="mx-auto max-w-[1680px]">
      <PageHeader eyebrow={currentModule.eyebrow} title={currentModule.title} description={currentModule.scope} meta={<span>Governed workspace · records and actions remain linked to the Solar EPC lifecycle</span>} secondaryActions={<LifecycleStatus label="Module staged" tone="neutral" />} />

      <section className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="app-panel overflow-hidden">
          <div className="app-toolbar flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="app-kicker">Controlled register</p><h2 className="mt-1 text-sm font-semibold">{currentModule.title} records</h2></div>
            <div className="flex items-center gap-2">
              <label className="relative block">
                <span className="sr-only">Search {currentModule.title}</span>
                <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={14} />
                <input disabled aria-describedby="module-search-note" placeholder="Search records…" className="h-10 w-full min-w-56 border border-[var(--line)] bg-[var(--background)] pl-9 pr-3 text-xs disabled:cursor-not-allowed disabled:opacity-65" />
              </label>
              <button disabled className="inline-flex h-10 items-center gap-2 border border-[var(--line)] bg-[var(--background)] px-3 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-65"><SlidersHorizontal aria-hidden="true" size={14} />Filter</button>
            </div>
          </div>
          <p id="module-search-note" className="sr-only">Search becomes available when this module is connected to its governed record source.</p>
          <div className="hidden overflow-x-auto border-b border-[var(--line)] md:block">
            <table className="w-full min-w-[960px] border-collapse text-left"><caption className="sr-only">{currentModule.title} controlled register</caption><thead className="bg-[var(--surface-subtle)]"><tr>{columns.map((column) => <th key={column} className="border-b border-[var(--line)] px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)]">{column}</th>)}</tr></thead></table>
          </div>
          <EmptyState title={`No ${currentModule.title.toLowerCase()} records`} description="This workspace route is present, but no governed data source or production workflow is connected yet. No sample records have been invented." action={<Link href="/dashboard" className="inline-flex min-h-10 items-center border border-[var(--line-strong)] bg-[var(--background)] px-4 text-xs font-semibold">Return to command centre</Link>} />
        </div>

        <aside className="space-y-3">
          <NextAction title="Connect the governed record source" detail="The register, filters, contextual inspection, and lifecycle actions should be enabled only when the existing backend workflow is available." owner="Workspace administrator" />
          <section className="app-panel p-4"><p className="app-kicker">Operating rule</p><p className="mt-2 text-xs font-semibold">No disconnected mock records</p><p className="mt-1.5 text-[11px] leading-5 text-[var(--text-secondary)]">Until this module has a real data contract, HelioCoreOS communicates the unavailable state explicitly and keeps the route aligned with the rest of the workspace.</p></section>
        </aside>
      </section>
    </div>
  );
}
