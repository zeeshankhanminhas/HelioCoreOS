"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HCDataTable } from "@/components/heliocore/hc-data-table";
import { HCErrorState, HCLoadingState } from "@/components/heliocore/hc-states";
import { HCMetricCard } from "@/components/heliocore/hc-metric-card";
import { HCPageHeader } from "@/components/heliocore/hc-page-header";
import { HCPanel, HCPanelHeader } from "@/components/heliocore/hc-panel";
import { HCStatusBadge } from "@/components/heliocore/hc-status-badge";
import { projectColumns } from "./table-columns";
import { ProjectForm } from "./project-form";
import { useCreateProject, useProjects } from "./queries";

export function ProjectsWorkspace({ filter = "all" }: { filter?: "all" | "active" | "completed" }) {
  const [open, setOpen] = React.useState(false);
  const projectsQuery = useProjects();
  const createProject = useCreateProject();

  const projects = React.useMemo(() => {
    const rows = projectsQuery.data ?? [];
    if (filter === "completed") return rows.filter((project) => project.status === "Completed");
    if (filter === "active") return rows.filter((project) => project.status !== "Completed");
    return rows;
  }, [projectsQuery.data, filter]);

  const title = filter === "active" ? "Active Projects" : filter === "completed" ? "Completed Projects" : "Projects";
  const subtitle = filter === "completed"
    ? "Closed projects retained with final delivery, handover and performance records."
    : "Control contracted projects from handover through engineering, procurement, construction and closeout.";

  return (
    <div className="p-3.5 lg:p-4">
      <HCPageHeader eyebrow="Portfolio Delivery" title={title} subtitle={subtitle} primary="New Project" secondary="Portfolio Report" onPrimary={() => setOpen(true)} />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <HCMetricCard label="Active Projects" value="12" note="38.7 MWp / 9 MWh" tone="blue"/>
        <HCMetricCard label="On Track" value="8" note="67% of active portfolio" tone="green"/>
        <HCMetricCard label="At Risk" value="3" note="Schedule or approval risk" tone="amber"/>
        <HCMetricCard label="Critical" value="1" note="Procurement hold" tone="red"/>
      </div>

      <div className="mt-2.5 grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_292px]">
        <div className="space-y-2.5">
          <HCPanel>
            <HCPanelHeader title="Project Portfolio" subtitle="Current delivery position, project stage and accountable next action." />
            {projectsQuery.isLoading ? <HCLoadingState label="Loading project portfolio..." /> :
             projectsQuery.isError ? <HCErrorState /> :
             <HCDataTable columns={projectColumns} data={projects} searchColumn="name" searchPlaceholder="Search projects..." />}
          </HCPanel>

          <HCPanel>
            <HCPanelHeader title="Milestones This Week" />
            <div className="divide-y divide-[var(--line)]">
              {[
                ["Riverside · PV Layout Review","Engineering gate","12 Sep","amber"],
                ["Falcon Textiles · PO Release","Procurement gate","13 Sep","green"],
                ["Apex Foods · Mechanical Completion","Construction gate","15 Sep","blue"],
              ].map(([name,meta,status,tone])=><div key={name} className="flex items-center gap-3 px-3 py-2.5"><div className="min-w-0 flex-1"><p className="text-[10px] font-medium">{name}</p><p className="mt-0.5 text-[8px] text-[var(--muted)]">{meta}</p></div><HCStatusBadge label={status} tone={tone as "amber"|"green"|"blue"}/></div>)}
            </div>
          </HCPanel>
        </div>

        <aside className="space-y-2.5">
          <HCPanel>
            <HCPanelHeader title="Current Action" />
            <div className="p-3">
              <h3 className="text-[12px] font-semibold">Portfolio Attention</h3>
              <p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">Orion Ceramics remains blocked by protection relay approval and cannot close commissioning.</p>
              <button className="mt-3 h-8 w-full bg-[var(--accent)] text-[9px] font-semibold text-white">Open Critical Project</button>
            </div>
          </HCPanel>
          <HCPanel>
            <HCPanelHeader title="Portfolio Gates" />
            <div className="divide-y divide-[var(--line)]">
              {[["Engineering approval","3","amber"],["Procurement release","2","green"],["Site mobilisation","2","blue"],["Client decisions","4","red"]].map(([label,value,tone])=><div key={label} className="flex items-center px-3 py-2.5"><span className="flex-1 text-[10px]">{label}</span><span className="mr-2 text-[13px] font-semibold">{value}</span><HCStatusBadge label={tone==="green"?"Ready":tone==="red"?"Open":"Review"} tone={tone as "amber"|"green"|"blue"|"red"}/></div>)}
            </div>
          </HCPanel>
        </aside>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Reference form using React Hook Form and Zod. This scaffold mutation is local to the TanStack Query cache.</DialogDescription>
          </DialogHeader>
          <ProjectForm
            submitting={createProject.isPending}
            onSubmit={async (values) => {
              await createProject.mutateAsync(values);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
