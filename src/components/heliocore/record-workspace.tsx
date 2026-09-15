import Link from "next/link";
import type { ReactNode } from "react";

export type RecordWorkspaceNavItem = {
  label: string;
  href: string;
  muted?: boolean;
};

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

export function RecordWorkspaceNav({ items, ariaLabel }: { items: RecordWorkspaceNavItem[]; ariaLabel: string }) {
  return (
    <nav className="mt-6 border-y border-[var(--line)] bg-[var(--background)]" aria-label={ariaLabel}>
      <div className="hide-scrollbar flex overflow-x-auto">
        {items.map((item, index) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={`shrink-0 border-r border-[var(--line)] px-4 py-3 text-xs font-semibold transition-colors hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)] ${index === 0 ? "text-[var(--accent-strong)]" : item.muted ? "text-[var(--text-tertiary)]" : "text-[var(--muted)]"}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
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
  id,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`${className} scroll-mt-28 border border-[var(--line)]`}>
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
