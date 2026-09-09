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
    return <div className="border border-[var(--line)] px-6 py-20 text-center">{errorState}</div>;
  }

  if (!rows.length) {
    return <div className="border border-[var(--line)] px-6 py-20 text-center">{emptyState}</div>;
  }

  return (
    <div className="overflow-x-auto border-x border-b border-[var(--line)] bg-[var(--background)]">
      <table className={`w-full border-collapse text-left text-sm ${minWidthClassName}`}>
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-[var(--line)] bg-black/[0.015] text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-5 py-3 font-semibold">
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-[var(--line)] last:border-b-0 hover:bg-black/[0.018]">
              {row.getAllCells().map((cell) => (
                <td key={cell.id} className="px-5 py-4 align-middle">
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
