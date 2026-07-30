import type { ReactNode } from "react";

type WorkspaceToolbarProps = {
  children: ReactNode;
  actions?: ReactNode;
  summary?: ReactNode;
};

export function WorkspaceToolbar({ children, actions, summary }: WorkspaceToolbarProps) {
  return (
    <section aria-label="Register controls" className="mt-6 border-b border-[var(--line)] pb-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-[minmax(260px,1fr)_220px_auto]">{children}</div>
        {(summary || actions) ? (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 xl:justify-end">
            {summary ? <div className="text-xs text-[var(--muted)]">{summary}</div> : null}
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
