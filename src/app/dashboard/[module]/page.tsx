import Link from "next/link";
import { notFound } from "next/navigation";

const modules = {
  projects: {
    title: "Projects",
    eyebrow: "Portfolio control",
    description: "Control Solar EPC work from qualification through commissioning and handover.",
  },
  customers: {
    title: "Customers",
    eyebrow: "Commercial control",
    description: "Maintain governed commercial relationships and project ownership context.",
  },
  sites: {
    title: "Sites",
    eyebrow: "Delivery geography",
    description: "Connect each installation location to its customer, evidence and delivery records.",
  },
  tasks: {
    title: "Action register",
    eyebrow: "Accountability control",
    description: "Track accountable actions, blockers, due dates and completion evidence.",
  },
  documents: {
    title: "Documents",
    eyebrow: "Evidence control",
    description: "Control engineering, commercial, QA, commissioning and handover records.",
  },
  engineering: {
    title: "Engineering",
    eyebrow: "Technical delivery",
    description: "Govern surveys, design inputs, calculations, drawings, reviews and technical approvals.",
  },
  procurement: {
    title: "Procurement",
    eyebrow: "Supply control",
    description: "Coordinate suppliers, purchase commitments, equipment readiness and delivery dependencies.",
  },
  installation: {
    title: "Installation",
    eyebrow: "Site execution",
    description: "Control mobilisation, daily progress, site constraints, installation evidence and completion readiness.",
  },
  quality: {
    title: "Quality",
    eyebrow: "Assurance control",
    description: "Manage inspections, test evidence, non-conformances, snags and governed close-out decisions.",
  },
  commissioning: {
    title: "Commissioning",
    eyebrow: "System readiness",
    description: "Coordinate test plans, energisation dependencies, witness evidence and operational acceptance.",
  },
  handover: {
    title: "Handover",
    eyebrow: "Completion control",
    description: "Assemble final records, client approvals, training evidence and project completion packs.",
  },
  reports: {
    title: "Reports",
    eyebrow: "Decision intelligence",
    description: "Translate governed operational records into executive, commercial and delivery reporting.",
  },
} as const;

type ModuleKey = keyof typeof modules;

type ModulePageProps = {
  params: Promise<{ module: string }>;
};

export default async function ModulePage({ params }: ModulePageProps) {
  const { module } = await params;

  if (!(module in modules)) {
    notFound();
  }

  const currentModule = modules[module as ModuleKey];

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{currentModule.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">{currentModule.title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">{currentModule.description}</p>
        </div>
        <Link href="/dashboard" className="w-fit border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">
          Return to overview
        </Link>
      </header>

      <section className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="border border-dashed border-[var(--line)] px-6 py-16 text-center md:py-24">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Governed module foundation</p>
          <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em]">Workspace ready for its functional sprint</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Navigation, access control and executive context are active. Records, forms, decisions and evidence gates for this module will be introduced through the next governed build slice.
          </p>
        </article>

        <aside className="border border-[var(--line)] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Module state</p>
          <div className="mt-6 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <strong className="text-sm">Access governed</strong>
          </div>
          <dl className="mt-7 divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm">
            <div className="flex justify-between gap-4 py-4">
              <dt className="text-[var(--muted)]">Authentication</dt>
              <dd className="font-medium">Active</dd>
            </div>
            <div className="flex justify-between gap-4 py-4">
              <dt className="text-[var(--muted)]">Organisation scope</dt>
              <dd className="font-medium">Enforced</dd>
            </div>
            <div className="flex justify-between gap-4 py-4">
              <dt className="text-[var(--muted)]">Functional status</dt>
              <dd className="font-medium">Planned</dd>
            </div>
          </dl>
        </aside>
      </section>
    </div>
  );
}
