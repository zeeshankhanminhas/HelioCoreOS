"use client";

import * as React from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { HCButton } from "./hc-button";
import { HCEmptyState } from "./hc-states";

export function HCDataTable<TData>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = "Search...",
}: {
  columns: ColumnDef<TData>[];
  data: TData[];
  searchColumn?: string;
  searchPlaceholder?: string;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 6 } },
  });

  return (
    <div>
      {searchColumn ? (
        <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--surface-subtle)] px-3 py-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn(searchColumn)?.setFilterValue(event.target.value)}
              placeholder={searchPlaceholder}
              className="min-h-8 h-8 bg-white pl-8 text-[10px]"
            />
          </div>
          <span className="ml-auto text-[9px] text-[var(--muted)]">{table.getFilteredRowModel().rows.length} records</span>
        </div>
      ) : null}

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
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
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
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5 text-[9px] text-[#525d66]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
        <span className="text-[9px] text-[var(--muted)]">Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}</span>
        <div className="flex gap-1.5">
          <HCButton variant="outline" className="h-7 min-h-7" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</HCButton>
          <HCButton variant="outline" className="h-7 min-h-7" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</HCButton>
        </div>
      </div>
    </div>
  );
}
