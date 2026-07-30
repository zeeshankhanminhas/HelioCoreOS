"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useState } from "react";

type DetailSheetProps = {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function DetailSheet({ trigger, title, description, children, footer }: DetailSheetProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        aria-haspopup="dialog"
      >
        {trigger}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70]" role="presentation">
          <button type="button" aria-label="Close details" className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-[var(--line)] bg-[var(--background)] shadow-2xl"
          >
            <header className="flex items-start justify-between gap-5 border-b border-[var(--line)] px-5 py-5 md:px-7">
              <div className="min-w-0">
                <h2 id={titleId} className="text-2xl font-medium tracking-[-0.035em]">{title}</h2>
                {description ? <p id={descriptionId} className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 border border-[var(--line)] px-3 py-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                Close
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-6 md:px-7">{children}</div>
            {footer ? <footer className="border-t border-[var(--line)] px-5 py-4 md:px-7">{footer}</footer> : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
