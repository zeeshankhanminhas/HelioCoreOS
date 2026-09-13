import type { ReactNode } from "react";

export function RecordHeader({
  eyebrow,
  title,
  meta,
  actions,
}: {
  eyebrow: string;
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">{title}</h1>
        {meta ? <div className="mt-4 text-sm text-[var(--muted)]">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </header>
  );
}

export function RecordWorkspace({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1500px]">{children}</div>;
}

export function RecordWorkspaceSection({
  eyebrow,
  title,
  description,
  action,
  children,
  className = "mt-7",
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${className} border border-[var(--line)]`}>
      <div className="flex flex-col gap-4 border-b border-[var(--line)] p-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">{title}</h2>
          {description ? <div className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</div> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
