"use client";

import * as React from "react";
import {
  type ColumnDef,
  columnFilteringFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { HCButton } from "./hc-button";
import { HCEmptyState } from "./hc-states";

export const hcTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  columnFilteringFeature,
  globalFilteringFeature,
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
  },
  filterFns: {
    includesString: filterFn_includesString,
  },
});

export function HCDataTable<TData>({
  columns,
  data,
  searchPlaceholder = "Search...",
}: {
  columns: ColumnDef<typeof hcTableFeatures, TData>[];
  data: TData[];
  searchColumn?: string;
  searchPlaceholder?: string;
}) {
  const table = useTable(
    {
      features: hcTableFeatures,
      columns,
      data,
      globalFilterFn: "includesString",
      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: 6,
        },
      },
    },
    (state) => state,
  );

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface-subtle)] px-3 py-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
          <Input
            value={String(table.state.globalFilter ?? "")}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            placeholder={searchPlaceholder}
            className="min-h-8 h-8 bg-white pl-8 text-[10px]"
          />
        </div>
        <span className="ml-auto text-[9px] text-[var(--muted)]">
          {table.getPrePaginatedRowModel().rows.length} records
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] table-fixed text-left">
          <thead className="sticky top-0 z-10 bg-[#f4f5f5]">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => (
                  <th key={header.id} className="px-3 py-2 text-[9px] font-semibold text-[#58636c]">
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className={header.column.getCanSort() ? "inline-flex items-center gap-1 hover:text-[var(--foreground)]" : ""}
                        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <table.FlexRender header={header} />
                        {header.column.getCanSort()
                          ? header.column.getIsSorted() === "asc"
                            ? <ArrowUp size={11}/>
                            : header.column.getIsSorted() === "desc"
                              ? <ArrowDown size={11}/>
                              : <ChevronsUpDown size={11} className="text-[var(--text-tertiary)]"/>
                          : null}
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[#e7e9eb]">
            {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-[#fafaf8]">
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5 text-[9px] text-[#525d66]">
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            )) : (
              <tr><td colSpan={columns.length}><HCEmptyState /></td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--line)] px-3 py-2">
        <span className="text-[9px] text-[var(--muted)]">
          Page {table.state.pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}
        </span>
        <div className="flex gap-1.5">
          <HCButton variant="outline" className="h-7 min-h-7" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</HCButton>
          <HCButton variant="outline" className="h-7 min-h-7" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</HCButton>
        </div>
      </div>
    </div>
  );
}
