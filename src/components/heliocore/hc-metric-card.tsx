import { HCPanel } from "./hc-panel";
import type { HCTone } from "./hc-status-badge";

export function HCMetricCard({ label, value, note, tone = "neutral" }: { label: string; value: string; note?: string; tone?: HCTone }) {
  const dot =
    tone === "green" ? "bg-[var(--status-success)]" :
    tone === "amber" ? "bg-[var(--status-warning)]" :
    tone === "red" ? "bg-[var(--status-danger)]" :
    tone === "blue" ? "bg-[var(--status-info)]" :
    "bg-[var(--text-tertiary)]";

  return (
    <HCPanel className="px-3 py-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-medium text-[var(--muted)]">{label}</p>
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      </div>
      <p className="mt-1.5 text-[18px] font-semibold tracking-[-0.03em] tabular-nums">{value}</p>
      {note ? <p className="mt-1 text-[9px] text-[var(--text-tertiary)]">{note}</p> : null}
    </HCPanel>
  );
}
