"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { HCDataTable } from "./hc-data-table";
import { HCStatusBadge, type HCTone } from "./hc-status-badge";

export type OperationalRow = {
  primary: string;
  secondary?: string;
  values: string[];
  status?: string;
  tone?: HCTone;
};

export function HCOperationalTable({ columns, rows }: { columns: string[]; rows: OperationalRow[] }) {
  const tableColumns = React.useMemo<ColumnDef<OperationalRow>[]>(() => {
    const result: ColumnDef<OperationalRow>[] = [
      {
        accessorKey: "primary",
        header: columns[0] ?? "Item",
        cell: ({ row }) => (
          <div>
            <div className="text-[10px] font-semibold text-[#273139]">{row.original.primary}</div>
            {row.original.secondary ? <div className="mt-0.5 text-[8px] text-[#7b858e]">{row.original.secondary}</div> : null}
          </div>
        ),
      },
    ];

    columns.slice(1).forEach((label, index) => {
      result.push({
        id: `value-${index}`,
        accessorFn: (row) => row.values[index] ?? "",
        header: label,
        cell: ({ row }) => row.original.values[index] ?? "—",
      });
    });

    result.push({
      id: "control",
      accessorFn: (row) => row.status ?? "Open",
      header: "Control",
      cell: ({ row }) => <HCStatusBadge label={row.original.status ?? "Open"} tone={row.original.tone} />,
    });

    return result;
  }, [columns]);

  return <HCDataTable columns={tableColumns} data={rows} searchColumn="primary" searchPlaceholder="Search register..." />;
}
