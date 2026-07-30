import type { ReactNode } from "react";

export type RegisterColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
  className?: string;
};

export type RegisterRow = {
  id: string;
  cells: Record<string, ReactNode>;
  mobile: ReactNode;
};

type RecordRegisterProps = {
  columns: RegisterColumn[];
  rows: RegisterRow[];
  caption: string;
  emptyState: ReactNode;
  errorState?: ReactNode;
  hasError?: boolean;
};

export function RecordRegister({ columns, rows, caption, emptyState, errorState, hasError = false }: RecordRegisterProps) {
  return (
    <section className="mt-6" aria-label={caption}>
      {hasError ? (
        <div className="border border-[var(--line)] p-8">{errorState}</div>
      ) : rows.length ? (
        <>
          <div className="hidden overflow-x-auto border-y border-[var(--line)] md:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">{caption}</caption>
              <thead>
                <tr className="border-b border-[var(--line)]">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)] ${column.align === "right" ? "text-right" : ""} ${column.className ?? ""}`}
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-black/[0.018] focus-within:bg-black/[0.025]">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-4 align-middle text-sm ${column.align === "right" ? "text-right" : ""} ${column.className ?? ""}`}
                      >
                        {row.cells[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-[var(--line)] border-y border-[var(--line)] md:hidden">
            {rows.map((row) => <article key={row.id} className="py-5">{row.mobile}</article>)}
          </div>
        </>
      ) : (
        <div className="border-y border-[var(--line)] px-5 py-14 text-center">{emptyState}</div>
      )}
    </section>
  );
}
