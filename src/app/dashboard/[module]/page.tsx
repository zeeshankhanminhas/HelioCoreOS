import { notFound } from "next/navigation";

const modules = {
  projects: {
    title: "Projects",
    description: "Control Solar EPC work from qualification through commissioning and handover.",
  },
  customers: {
    title: "Customers",
    description: "Maintain governed commercial relationships and project ownership context.",
  },
  sites: {
    title: "Sites",
    description: "Connect each installation location to its customer, evidence and delivery records.",
  },
  tasks: {
    title: "Tasks",
    description: "Track accountable actions, blockers, due dates and completion evidence.",
  },
  documents: {
    title: "Documents",
    description: "Control engineering, commercial, QA, commissioning and handover records.",
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
    <>
      <header className="border-b border-[var(--line)] pb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Governed module</p>
        <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] md:text-5xl">{currentModule.title}</h1>
        <p className="mt-5 max-w-2xl leading-7 text-[var(--muted)]">{currentModule.description}</p>
      </header>

      <section className="mt-8 border border-dashed border-[var(--line)] px-6 py-16 text-center">
        <p className="text-sm font-semibold">Module foundation ready</p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
          Authentication and organisation boundaries are active. Functional records for this module will be introduced in the next governed sprint slice.
        </p>
      </section>
    </>
  );
}
