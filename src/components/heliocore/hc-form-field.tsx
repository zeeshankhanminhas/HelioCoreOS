import * as React from "react";
import { cn } from "@/lib/utils";

export function HCFormField({ label, htmlFor, error, helper, children, className }: { label: string; htmlFor: string; error?: string; helper?: string; children: React.ReactNode; className?: string }) {
  const messageId = `${htmlFor}-message`;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-[10px] font-semibold text-[var(--foreground)]">{label}</label>
      {children}
      {error ? <p id={messageId} role="alert" className="text-[9px] text-[var(--status-danger)]">{error}</p> : helper ? <p id={messageId} className="text-[9px] text-[var(--muted)]">{helper}</p> : null}
    </div>
  );
}
