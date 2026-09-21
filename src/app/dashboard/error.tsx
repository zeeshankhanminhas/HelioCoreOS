"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[55vh] max-w-2xl items-center justify-center px-4 py-12" data-testid="workspace-error-state">
      <section className="app-panel w-full overflow-hidden">
        <div className="border-b border-[var(--line)] bg-[var(--status-danger-soft)] p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--status-danger)]" size={19} />
            <div>
              <p className="app-kicker text-[var(--status-danger)]">Workspace unavailable</p>
              <h1 className="mt-1.5 text-xl font-semibold tracking-[-0.025em]">This module could not be opened</h1>
              <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">The route exists, but its authenticated data could not be loaded. Retry the request or return to the command centre; no entered data has been changed.</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 p-5">
          <button type="button" onClick={reset} className="inline-flex min-h-10 items-center gap-2 border border-[var(--accent)] bg-[var(--accent)] px-4 text-xs font-semibold text-white"><RotateCcw aria-hidden="true" size={14} />Retry module</button>
          <Link href="/dashboard" className="inline-flex min-h-10 items-center border border-[var(--line-strong)] bg-[var(--background)] px-4 text-xs font-semibold">Command centre</Link>
        </div>
      </section>
    </main>
  );
}
