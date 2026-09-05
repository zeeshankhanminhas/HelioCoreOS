import Link from "next/link";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-[900px]">
      <header className="border-b border-[var(--line)] pb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Post-contract delivery gate</p>
        <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Project creation is contract-gated</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">A HelioCoreOS Project is a delivery object. It must not be created manually during qualification, survey, Calculator or Detailed Design.</p>
      </header>

      <section className="mt-7 border border-[var(--line)]">
        <div className="border-b border-[var(--line)] p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Required upstream sequence</p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Complete pre-contract work first</h2>
        </div>
        <ol className="divide-y divide-[var(--line)]">
          {["Opportunity + Site", "System Type + Load Profile", "Calculator", "Equipment + Detailed Design", "PVWatts + SLD + BOM", "Engineering Review", "Proposal / Contract", "Signed contract → Project creation"].map((item, index) => (
            <li key={item} className="flex gap-4 px-6 py-4 text-sm"><span className="w-7 shrink-0 tabular-nums text-[var(--muted)]">{String(index + 1).padStart(2, "0")}</span><span className="font-medium">{item}</span></li>
          ))}
        </ol>
      </section>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/dashboard/opportunities" className="inline-flex min-h-11 items-center border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)]">Open Opportunities</Link>
        <Link href="/dashboard/engineering" className="inline-flex min-h-11 items-center border border-[var(--line)] px-5 text-xs font-semibold">Open Engineering</Link>
        <Link href="/dashboard/projects" className="inline-flex min-h-11 items-center border border-[var(--line)] px-5 text-xs font-semibold">Return to Projects</Link>
      </div>
    </div>
  );
}