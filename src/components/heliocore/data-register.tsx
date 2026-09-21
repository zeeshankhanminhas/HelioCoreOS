"use client";

import type { ReactNode } from "react";
import {
  type ColumnDef,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";

export const dataRegisterFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});

type RegisterRow = { id: string };

type Props = {
  registerKey: string;
  rows: RegisterRow[];
  columns: unknown[];
  caption: string;
  emptyState: ReactNode;
  errorState?: ReactNode;
  hasError?: boolean;
  minWidthClassName?: string;
};

export function DataRegister({
  registerKey,
  rows,
  columns,
  caption,
  emptyState,
  errorState,
  hasError = false,
  minWidthClassName = "min-w-[900px]",
}: Props) {
  const typedColumns = columns as ColumnDef<typeof dataRegisterFeatures, RegisterRow>[];
  const table = useTable({ key: registerKey, features: dataRegisterFeatures, data: rows, columns: typedColumns });

  if (hasError) {
    return <div className="rounded-[4px] border border-[var(--line)] px-6 py-16 text-center">{errorState}</div>;
  }

  if (!rows.length) {
    return <div className="rounded-[4px] border border-[var(--line)] px-6 py-16 text-center">{emptyState}</div>;
  }

  return (
    <div className="overflow-x-auto rounded-b-[4px] border-x border-b border-[var(--line)] bg-[var(--background)]">
      <table className={`w-full border-collapse text-left text-sm ${minWidthClassName}`}>
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-[var(--line)] bg-[var(--surface-subtle)] text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-2.5 font-semibold">
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-[var(--line)] last:border-b-0 hover:bg-[var(--surface-subtle)] focus-within:bg-[var(--surface-selected)]">
              {row.getAllCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 align-middle">
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
