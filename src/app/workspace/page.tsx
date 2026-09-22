import Link from "next/link";
import { ArrowRight, Database, ShieldCheck, Workflow } from "lucide-react";
import { HCPanel, HCPanelHeader } from "@/components/heliocore/hc-panel";

export default function WorkspaceHome() {
  return (
    <div className="p-3.5 lg:p-4">
      <div className="mb-4">
        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-text)]">Production Integration</div>
        <h1 className="mt-1 text-[22px] font-semibold tracking-[-0.035em]">HelioCore Workspace</h1>
        <p className="mt-1 max-w-[760px] text-[10px] leading-4 text-[var(--muted)]">The approved HelioCore interface is now being connected to the existing Neon Auth, Data API and tenant-isolated EPC data model.</p>
      </div>
      <div className="grid gap-2.5 lg:grid-cols-3">
        <StateCard icon={<ShieldCheck size={17}/>} title="Identity & tenancy" body="Neon Auth and organisation RLS remain the authority boundary." />
        <StateCard icon={<Database size={17}/>} title="Projects" body="First production slice reads the live relational project model." />
        <StateCard icon={<Workflow size={17}/>} title="Engineering" body="Project detail route resolves survey, intake, design and controlled documents." />
      </div>
      <HCPanel className="mt-2.5">
        <HCPanelHeader title="First Vertical Slice" subtitle="Projects → Project Engineering → PV Layout context" />
        <div className="flex items-center justify-between gap-4 p-3">
          <p className="text-[10px] leading-4 text-[var(--muted)]">Open the live portfolio. Project names link into the authenticated engineering workspace when records exist in Neon.</p>
          <Link href="/workspace/projects" className="flex h-8 shrink-0 items-center gap-2 bg-[var(--accent)] px-3 text-[9px] font-semibold text-white">Open Projects <ArrowRight size={12}/></Link>
        </div>
      </HCPanel>
    </div>
  );
}

function StateCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <HCPanel className="p-3">
      <div className="flex items-center gap-2 text-[var(--accent-text)]">{icon}<h2 className="text-[11px] font-semibold text-[var(--foreground)]">{title}</h2></div>
      <p className="mt-2 text-[9px] leading-4 text-[var(--muted)]">{body}</p>
    </HCPanel>
  );
}
