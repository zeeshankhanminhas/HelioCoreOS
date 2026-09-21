import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
  meta?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, primaryAction, secondaryActions, meta }: PageHeaderProps) {
  return (
    <header className="border-b border-[var(--line)] pb-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--accent-text)]">{eyebrow}</p>
          ) : null}
          <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)] md:text-[28px]">{title}</h1>
          {description ? <p className="mt-2 max-w-3xl text-xs leading-5 text-[var(--muted)]">{description}</p> : null}
          {meta ? <div className="mt-2 text-[11px] text-[var(--muted)]">{meta}</div> : null}
        </div>
        {(primaryAction || secondaryActions) ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {secondaryActions}
            {primaryAction}
          </div>
        ) : null}
      </div>
    </header>
  );
}
