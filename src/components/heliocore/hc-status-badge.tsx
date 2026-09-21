import { cn } from "@/lib/utils";

export type HCTone = "green" | "amber" | "red" | "blue" | "neutral";

export function HCStatusBadge({ label, tone = "neutral", className }: { label: string; tone?: HCTone; className?: string }) {
  const toneClass =
    tone === "green" ? "bg-[var(--status-success-soft)] text-[var(--status-success)]" :
    tone === "amber" ? "bg-[var(--status-warning-soft)] text-[var(--status-warning)]" :
    tone === "red" ? "bg-[var(--status-danger-soft)] text-[var(--status-danger)]" :
    tone === "blue" ? "bg-[var(--status-info-soft)] text-[var(--status-info)]" :
    "bg-[var(--surface-muted)] text-[var(--muted)]";

  return <span className={cn("inline-flex whitespace-nowrap rounded-[2px] px-1.5 py-0.5 text-[8px] font-semibold", toneClass, className)}>{label}</span>;
}
