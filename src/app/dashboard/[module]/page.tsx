import Link from "next/link";
import { notFound } from "next/navigation";

const modules = {
  tasks: { title: "Action register", eyebrow: "Command", description: "Track accountable actions, blockers, due dates and completion evidence." },
  approvals: { title: "Approvals", eyebrow: "Command", description: "Review governed commercial, engineering, procurement and delivery decisions awaiting authority." },
  proposals: { title: "Proposals", eyebrow: "Pre-contract", description: "Control commercial proposals against the approved engineering, BOM and cost basis for each opportunity." },
  contracts: { title: "Contracts", eyebrow: "Pre-contract", description: "Manage contract issue, revision, signature evidence and the gate that permits Project creation." },
  designs: { title: "Designs", eyebrow: "Engineering", description: "Control preliminary, proposal and post-contract design revisions with explicit purpose and approval state." },
  drawings: { title: "Drawings", eyebrow: "Engineering", description: "Manage proposal, review, construction and as-built drawing revisions without confusing purpose or status." },
  boms: { title: "Bills of materials", eyebrow: "Engineering", description: "Control Concept, Proposal, Approved Design and Procurement BOM revisions from one traceable design basis." },
  requisitions: { title: "Purchase requisitions", eyebrow: "Procurement", description: "Raise governed material requirements from released project BOMs before supplier engagement." },
  rfqs: { title: "RFQs", eyebrow: "Procurement", description: "Issue supplier enquiries against approved requisitions and preserve quotation scope and commercial evidence." },
  "vendor-comparisons": { title: "Vendor comparisons", eyebrow: "Procurement", description: "Compare technical compliance, commercial terms and delivery commitments before purchase approval." },
  "purchase-orders": { title: "Purchase orders", eyebrow: "Procurement", description: "Control approved supplier commitments, values, delivery terms and downstream receiving status." },
  suppliers: { title: "Suppliers", eyebrow: "Procurement", description: "Maintain supplier capability, approvals, commercial context and performance history." },
  shipments: { title: "Shipments", eyebrow: "Logistics & inventory", description: "Track supplier dispatch, transport, ETA, destination and delivery risk against purchase commitments." },
  grn: { title: "Delivery & GRN", eyebrow: "Logistics & inventory", description: "Record receipt, shortages, damage, acceptance and the inventory impact of delivered materials." },
  warehouses: { title: "Warehouses", eyebrow: "Logistics & inventory", description: "Control stock positions, reservations and governed material movement across storage locations." },
  "site-stock": { title: "Site stock", eyebrow: "Logistics & inventory", description: "Maintain project-site material availability, reservations, issues and shortages for delivery teams." },
  "material-movements": { title: "Material movements", eyebrow: "Logistics & inventory", description: "Trace receipts, transfers, site issues, returns and adjustments with project and item provenance." },
  construction: { title: "Construction", eyebrow: "Project execution", description: "Control mobilisation, installation progress, constraints, evidence and completion readiness." },
  quality: { title: "HSE & quality", eyebrow: "Project execution", description: "Manage inspections, NCRs, snags, site quality evidence and governed close-out decisions." },
  commissioning: { title: "Commissioning", eyebrow: "Project execution", description: "Coordinate testing, energisation dependencies, witness evidence and operational acceptance." },
  handover: { title: "Handover", eyebrow: "Project execution", description: "Assemble final records, client approvals, training evidence and project completion packs." },
  budgets: { title: "Project budgets", eyebrow: "Commercial & finance", description: "Control approved budget, commitments, actual cost, forecast and project margin variance." },
  costing: { title: "Costing", eyebrow: "Commercial & finance", description: "Build traceable commercial cost models from engineering quantities, supplier prices and delivery assumptions." },
  "supplier-invoices": { title: "Supplier invoices / AP", eyebrow: "Commercial & finance", description: "Control supplier invoice matching, approval, due dates, payables and payment status." },
  "customer-invoices": { title: "Customer invoices / AR", eyebrow: "Commercial & finance", description: "Manage billing milestones, customer invoices, receivables and payment collection status." },
  payments: { title: "Payments", eyebrow: "Commercial & finance", description: "Track supplier and customer payment events with reconciliation back to governed transactions." },
  assets: { title: "Assets", eyebrow: "Operations", description: "Maintain commissioned equipment and system assets with project, site and warranty provenance." },
  om: { title: "O&M", eyebrow: "Operations", description: "Operate handed-over systems through service plans, performance context, issues and maintenance records." },
  "service-maintenance": { title: "Service & maintenance", eyebrow: "Operations", description: "Plan and record preventive and corrective maintenance across operational assets and sites." },
  documents: { title: "Documents", eyebrow: "Governance", description: "Control engineering, commercial, procurement, QA, commissioning and handover records by revision and purpose." },
  reports: { title: "Reports & analytics", eyebrow: "Governance", description: "Translate governed operating records into portfolio, commercial, engineering and delivery intelligence." },
  settings: { title: "Settings", eyebrow: "Governance", description: "Configure organisation-level preferences and controlled application settings without exposing database concepts." },
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
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">{currentModule.description}</p>
        </div>
        <Link href="/dashboard" className="w-fit border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Return to overview</Link>
      </header>

      <section className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="border border-dashed border-[var(--line)] px-6 py-16 text-center md:py-24">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Scaffold active · function not yet implemented</p>
          <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em]">Domain workspace reserved in the EPC operating model</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--muted)]">This route is intentionally present so navigation and information architecture are stable before transactional forms, registers, approvals and evidence gates are implemented. Existing working modules remain untouched.</p>
        </article>

        <aside className="border border-[var(--line)] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Module state</p>
          <div className="mt-6 flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-amber-500" /><strong className="text-sm">Scaffolded</strong></div>
          <dl className="mt-7 divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm">
            <div className="flex justify-between gap-4 py-4"><dt className="text-[var(--muted)]">Authentication</dt><dd className="font-medium">Active</dd></div>
            <div className="flex justify-between gap-4 py-4"><dt className="text-[var(--muted)]">Organisation scope</dt><dd className="font-medium">Inherited</dd></div>
            <div className="flex justify-between gap-4 py-4"><dt className="text-[var(--muted)]">Functional status</dt><dd className="font-medium">Planned</dd></div>
          </dl>
        </aside>
      </section>
    </div>
  );
}
