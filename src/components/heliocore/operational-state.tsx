import type { ReactNode } from "react";
import { AlertTriangle, Check, Circle, Clock3, LockKeyhole, ShieldCheck } from "lucide-react";

type StateTone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClass: Record<StateTone, string> = {
  neutral: "border-[var(--line-strong)] bg-[var(--surface-subtle)] text-[var(--text-secondary)]",
  success: "border-[color:color-mix(in_srgb,var(--status-success)_30%,transparent)] bg-[var(--status-success-soft)] text-[var(--status-success)]",
  warning: "border-[color:color-mix(in_srgb,var(--status-warning)_28%,transparent)] bg-[var(--status-warning-soft)] text-[var(--status-warning)]",
  danger: "border-[color:color-mix(in_srgb,var(--status-danger)_28%,transparent)] bg-[var(--status-danger-soft)] text-[var(--status-danger)]",
  info: "border-[color:color-mix(in_srgb,var(--status-info)_28%,transparent)] bg-[var(--status-info-soft)] text-[var(--status-info)]",
};

export function LifecycleStatus({ label, tone = "neutral" }: { label: string; tone?: StateTone }) {
  const Icon = tone === "success" ? Check : tone === "warning" || tone === "danger" ? AlertTriangle : tone === "info" ? Clock3 : Circle;
  return <span className={`inline-flex min-h-7 items-center gap-1.5 border px-2 text-[10px] font-bold uppercase tracking-[0.08em] ${toneClass[tone]}`}><Icon aria-hidden="true" size={12} strokeWidth={2.2} />{label}</span>;
}

export function ApprovalState({ label, approved = false }: { label: string; approved?: boolean }) {
  return <LifecycleStatus label={label} tone={approved ? "success" : "warning"} />;
}

export function RiskIndicator({ label, severity = "warning" }: { label: string; severity?: "warning" | "danger" }) {
  return <LifecycleStatus label={label} tone={severity} />;
}

export function NextAction({ title, detail, owner, action }: { title: string; detail?: ReactNode; owner?: string; action?: ReactNode }) {
  return (
    <section className="border-l-2 border-[var(--accent)] bg-[var(--accent-soft)] p-4" aria-label="Next action">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--accent-text)]">Next action</p>
      <h3 className="mt-2 text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      {detail ? <div className="mt-1.5 text-xs leading-5 text-[var(--text-secondary)]">{detail}</div> : null}
      {owner ? <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Owner · {owner}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}

export function BlockerPanel({ title, detail, clear = false }: { title: string; detail?: ReactNode; clear?: boolean }) {
  return (
    <section className={`border p-4 ${clear ? "border-[color:color-mix(in_srgb,var(--status-success)_25%,transparent)] bg-[var(--status-success-soft)]" : "border-[color:color-mix(in_srgb,var(--status-warning)_28%,transparent)] bg-[var(--status-warning-soft)]"}`} aria-label={clear ? "No blockers" : "Blocking condition"}>
      <div className="flex gap-2.5">
        {clear ? <ShieldCheck aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-[var(--status-success)]" /> : <LockKeyhole aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-[var(--status-warning)]" />}
        <div><p className="text-xs font-semibold">{title}</p>{detail ? <div className="mt-1 text-[11px] leading-5 text-[var(--text-secondary)]">{detail}</div> : null}</div>
      </div>
    </section>
  );
}

export function EngineeringMetric({ label, value, unit, detail }: { label: string; value: ReactNode; unit?: string; detail?: string }) {
  return <div className="bg-[var(--background)] p-3.5"><dt className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">{label}</dt><dd className="technical-number mt-1.5 text-lg font-semibold tracking-[-0.02em]">{value}{unit ? <span className="ml-1 text-[10px] font-semibold text-[var(--text-secondary)]">{unit}</span> : null}</dd>{detail ? <p className="mt-1 text-[10px] leading-4 text-[var(--text-secondary)]">{detail}</p> : null}</div>;
}

export function EngineeringCheck({ label, state, detail }: { label: string; state: "pass" | "warning" | "blocked" | "pending"; detail?: string }) {
  const pass = state === "pass";
  const blocked = state === "blocked";
  return <li className="flex gap-2.5 py-2.5"><span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${pass ? "border-[var(--status-success)] bg-[var(--status-success)] text-white" : blocked ? "border-[var(--status-danger)] text-[var(--status-danger)]" : "border-[var(--line-strong)] text-[var(--text-tertiary)]"}`}>{pass ? <Check aria-hidden="true" size={10} strokeWidth={3} /> : blocked ? <LockKeyhole aria-hidden="true" size={9} /> : <Circle aria-hidden="true" size={7} />}</span><span><span className="block text-xs font-medium">{label}</span>{detail ? <span className="mt-0.5 block text-[10px] leading-4 text-[var(--text-secondary)]">{detail}</span> : null}</span></li>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="px-5 py-14 text-center"><p className="text-sm font-semibold">{title}</p><p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-[var(--text-secondary)]">{description}</p>{action ? <div className="mt-5">{action}</div> : null}</div>;
}

export function LoadingState({ label = "Loading controlled records…" }: { label?: string }) {
  return <div className="flex min-h-32 items-center justify-center gap-2 text-xs text-[var(--text-secondary)]" role="status"><Clock3 aria-hidden="true" size={15} />{label}</div>;
}

export function ErrorState({ title = "Records could not be loaded", detail }: { title?: string; detail?: string }) {
  return <div className="border border-[color:color-mix(in_srgb,var(--status-danger)_28%,transparent)] bg-[var(--status-danger-soft)] p-4 text-sm text-[var(--status-danger)]" role="alert"><p className="font-semibold">{title}</p>{detail ? <p className="mt-1 text-xs leading-5">{detail}</p> : null}</div>;
}
