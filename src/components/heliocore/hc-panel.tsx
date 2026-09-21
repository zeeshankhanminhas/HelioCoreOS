import * as React from "react";
import { cn } from "@/lib/utils";

export function HCPanel({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("border border-[var(--line)] bg-[var(--background)]", className)} {...props} />;
}

export function HCPanelHeader({ title, subtitle, action, className }: { title: string; subtitle?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 border-b border-[var(--line)] px-3 py-2", className)}>
      <div>
        <h2 className="text-[12px] font-semibold">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[9px] text-[var(--muted)]">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
