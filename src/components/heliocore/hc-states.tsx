import { AlertTriangle, Inbox, LoaderCircle } from "lucide-react";

export function HCLoadingState({ label = "Loading..." }: { label?: string }) {
  return <div className="flex min-h-48 items-center justify-center gap-2 text-xs text-[var(--muted)]"><LoaderCircle className="h-4 w-4 animate-spin" />{label}</div>;
}

export function HCEmptyState({ title = "No records", body = "There is nothing to show for the current filters." }: { title?: string; body?: string }) {
  return <div className="flex min-h-48 flex-col items-center justify-center text-center"><Inbox className="h-5 w-5 text-[var(--muted)]"/><p className="mt-2 text-xs font-semibold">{title}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{body}</p></div>;
}

export function HCErrorState({ message = "Something went wrong while loading this data." }: { message?: string }) {
  return <div className="flex min-h-48 flex-col items-center justify-center text-center"><AlertTriangle className="h-5 w-5 text-[var(--status-danger)]"/><p className="mt-2 text-xs font-semibold">Unable to load</p><p className="mt-1 text-[10px] text-[var(--muted)]">{message}</p></div>;
}
