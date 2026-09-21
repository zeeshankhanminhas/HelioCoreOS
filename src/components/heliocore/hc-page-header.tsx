import { ArrowRight } from "lucide-react";
import { HCButton } from "./hc-button";

export function HCPageHeader({ eyebrow, title, subtitle, primary, secondary, onPrimary }: { eyebrow: string; title: string; subtitle: string; primary: string; secondary: string; onPrimary?: () => void }) {
  return (
    <section className="mb-3 flex flex-col gap-2.5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-text)]">{eyebrow}</div>
        <h1 className="text-[22px] font-semibold tracking-[-0.035em]">{title}</h1>
        <p className="mt-1 max-w-[760px] text-[10px] leading-4 text-[var(--muted)]">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <HCButton variant="outline">{secondary}</HCButton>
        <HCButton onClick={onPrimary}>{primary}<ArrowRight size={12}/></HCButton>
      </div>
    </section>
  );
}
