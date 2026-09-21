import { Clock3 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1680px]" role="status" aria-label="Loading workspace module">
      <div className="app-panel overflow-hidden">
        <div className="app-toolbar flex items-center gap-2 px-4 py-3 text-xs text-[var(--text-secondary)]"><Clock3 aria-hidden="true" size={15} />Loading workspace module…</div>
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <span key={index} aria-hidden="true" className="h-24 bg-[var(--background)]" />)}
        </div>
      </div>
    </div>
  );
}
