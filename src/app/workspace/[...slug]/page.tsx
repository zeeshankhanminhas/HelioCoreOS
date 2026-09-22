import { HCPanel, HCPanelHeader } from "@/components/heliocore/hc-panel";

export default async function WorkspacePendingModule({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const label = slug.map((part) => part.replaceAll("-", " ")).join(" / ");
  return (
    <div className="p-3.5 lg:p-4">
      <div className="mb-3">
        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-text)]">Production Integration</div>
        <h1 className="mt-1 text-[22px] font-semibold capitalize tracking-[-0.035em]">{label}</h1>
      </div>
      <HCPanel>
        <HCPanelHeader title="Integration queued" subtitle="This authenticated route intentionally does not show scaffold mock data." />
        <div className="p-4 text-[10px] leading-5 text-[var(--muted)]">The module will be migrated onto the same Neon-backed pattern after the Projects → Engineering vertical slice is proven. The public UI scaffold remains available separately as the visual reference.</div>
      </HCPanel>
    </div>
  );
}
