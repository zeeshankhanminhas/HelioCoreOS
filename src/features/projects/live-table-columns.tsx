"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { hcTableFeatures } from "@/components/heliocore/hc-data-table";
import { HCStatusBadge, type HCTone } from "@/components/heliocore/hc-status-badge";
import type { ProjectListItem } from "@/lib/neon/projects";

function toneForStatus(status: ProjectListItem["status"]): HCTone {
  return status === "On Track" || status === "Completed" ? "green" : status === "At Risk" ? "amber" : "red";
}

export const liveProjectColumns: ColumnDef<typeof hcTableFeatures, ProjectListItem>[] = [
  {
    accessorKey: "name",
    header: "Project",
    cell: ({ row }) => (
      <div>
        <Link
          className="text-[10px] font-semibold text-[#273139] hover:text-[var(--accent-text)]"
          href={`/workspace/projects/${row.original.databaseId}/engineering/pv-layout`}
        >
          {row.original.name}
        </Link>
        <div className="mt-0.5 text-[8px] text-[#7b858e]">{row.original.reference}</div>
      </div>
    ),
  },
  { accessorKey: "client", header: "Client" },
  { accessorKey: "system", header: "System" },
  { accessorKey: "stage", header: "Stage" },
  { accessorKey: "owner", header: "Owner" },
  {
    accessorKey: "status",
    header: "Control",
    cell: ({ row }) => <HCStatusBadge label={row.original.status} tone={toneForStatus(row.original.status)} />,
  },
];
