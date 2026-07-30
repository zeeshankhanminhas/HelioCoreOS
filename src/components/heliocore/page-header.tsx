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
    <header className="border-b border-[var(--line)] pb-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">{eyebrow}</p>
          ) : null}
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] text-[var(--foreground)] md:text-5xl">{title}</h1>
          {description ? <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
          {meta ? <div className="mt-4 text-xs text-[var(--muted)]">{meta}</div> : null}
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
