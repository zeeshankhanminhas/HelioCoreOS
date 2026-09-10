import Link from "next/link";
import { notFound } from "next/navigation";

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

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{currentModule.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">{currentModule.title}</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">{currentModule.scope}</p>
        </div>
        <span className="w-fit border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--muted)]">Planned</span>
      </header>

      <section className="mt-7 border border-[var(--line)]">
        <div className="px-6 py-20 text-center">
          <p className="text-sm font-semibold">No records</p>
          <p className="mt-2 text-sm text-[var(--muted)]">Module not yet available.</p>
          <Link href="/dashboard" className="mt-5 inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Overview</Link>
        </div>
      </section>
    </div>
  );
}
