import type { ColumnDef } from "@tanstack/react-table";
import { hcTableFeatures } from "@/components/heliocore/hc-data-table";
import type { Project } from "@/lib/schemas/project";
import { HCStatusBadge, type HCTone } from "@/components/heliocore/hc-status-badge";

function toneForStatus(status: Project["status"]): HCTone {
  return status === "On Track" || status === "Completed" ? "green" : status === "At Risk" ? "amber" : "red";
}

export const projectColumns: ColumnDef<typeof hcTableFeatures, Project>[] = [
  {
    accessorKey: "name",
    header: "Project",
    cell: ({ row }) => (
      <div>
        <div className="text-[10px] font-semibold text-[#273139]">{row.original.name}</div>
        <div className="mt-0.5 text-[8px] text-[#7b858e]">{row.original.id}</div>
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
