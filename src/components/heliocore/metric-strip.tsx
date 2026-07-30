import type { ReactNode } from "react";

export type MetricItem = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  emphasis?: "default" | "positive" | "warning" | "critical";
};

type MetricStripProps = {
  items: MetricItem[];
  ariaLabel?: string;
};

const emphasisClass: Record<NonNullable<MetricItem["emphasis"]>, string> = {
  default: "text-[var(--foreground)]",
  positive: "text-emerald-800",
  warning: "text-amber-800",
  critical: "text-red-800",
};

export function MetricStrip({ items, ariaLabel = "Operational metrics" }: MetricStripProps) {
  if (!items.length) return null;

  return (
    <section aria-label={ariaLabel} className="mt-7 border-y border-[var(--line)]">
      <dl className="grid sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item, index) => (
          <div
            key={item.label}
            className={`py-5 sm:px-5 ${index > 0 ? "border-t border-[var(--line)] sm:border-t-0 sm:border-l" : ""}`}
          >
            <dt className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[var(--muted)]">{item.label}</dt>
            <dd className={`mt-2 text-2xl font-medium tracking-[-0.035em] ${emphasisClass[item.emphasis ?? "default"]}`}>{item.value}</dd>
            {item.detail ? <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{item.detail}</p> : null}
          </div>
        ))}
      </dl>
    </section>
  );
}
