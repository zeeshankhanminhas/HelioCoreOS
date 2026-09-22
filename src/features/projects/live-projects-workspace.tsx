"use client";

import * as React from "react";
import { HCDataTable } from "@/components/heliocore/hc-data-table";
import { HCEmptyState, HCErrorState, HCLoadingState } from "@/components/heliocore/hc-states";
import { HCMetricCard } from "@/components/heliocore/hc-metric-card";
import { HCPanel, HCPanelHeader } from "@/components/heliocore/hc-panel";
import { HCStatusBadge } from "@/components/heliocore/hc-status-badge";
import { liveProjectColumns } from "./live-table-columns";
import { useLiveProjects } from "./live-queries";

export function LiveProjectsWorkspace({ filter = "all" }: { filter?: "all" | "active" | "completed" }) {
  const projectsQuery = useLiveProjects();

  const rows = React.useMemo(() => {
    const projects = projectsQuery.data ?? [];
    if (filter === "completed") return projects.filter((project) => project.status === "Completed");
    if (filter === "active") return projects.filter((project) => project.status !== "Completed");
    return projects;
  }, [projectsQuery.data, filter]);

  const metrics = React.useMemo(() => {
    const projects = projectsQuery.data ?? [];
    const active = projects.filter((project) => project.status !== "Completed");
    return {
      active: active.length,
      onTrack: active.filter((project) => project.status === "On Track").length,
      atRisk: active.filter((project) => project.status === "At Risk").length,
      critical: active.filter((project) => project.status === "Critical").length,
      capacityMwp: active.reduce((sum, project) => sum + (project.pvCapacityKwp ?? 0), 0) / 1000,
      batteryMwh: active.reduce((sum, project) => sum + (project.batteryCapacityKwh ?? 0), 0) / 1000,
    };
  }, [projectsQuery.data]);

  const title = filter === "active" ? "Active Projects" : filter === "completed" ? "Completed Projects" : "Projects";
  const subtitle =
    filter === "completed"
      ? "Closed projects retained with final delivery, handover and performance records."
      : "Live project portfolio from Neon, protected by organisation-level row security.";

  return (
    <div className="p-3.5 lg:p-4">
      <section className="mb-3 flex flex-col gap-2.5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-text)]">Portfolio Delivery</div>
          <h1 className="text-[22px] font-semibold tracking-[-0.035em]">{title}</h1>
          <p className="mt-1 max-w-[760px] text-[10px] leading-4 text-[var(--muted)]">{subtitle}</p>
        </div>
        <div className="border border-[var(--line)] bg-[var(--surface-subtle)] px-3 py-2 text-[9px] text-[var(--muted)]">
          Read integration active · writes intentionally not enabled in this slice
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <HCMetricCard label="Active Projects" value={String(metrics.active)} note={`${metrics.capacityMwp.toFixed(1)} MWp / ${metrics.batteryMwh.toFixed(1)} MWh`} tone="blue" />
        <HCMetricCard label="On Track" value={String(metrics.onTrack)} note="Green project controls" tone="green" />
        <HCMetricCard label="At Risk" value={String(metrics.atRisk)} note="Amber project controls" tone="amber" />
        <HCMetricCard label="Critical" value={String(metrics.critical)} note="Red project controls" tone="red" />
      </div>

      <div className="mt-2.5 grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_292px]">
        <HCPanel>
          <HCPanelHeader title="Project Portfolio" subtitle="Projects are mapped from the relational Neon model into the HelioCore workspace view." />
          {projectsQuery.isLoading ? (
            <HCLoadingState label="Loading Neon project portfolio..." />
          ) : projectsQuery.isError ? (
            <HCErrorState message={projectsQuery.error instanceof Error ? projectsQuery.error.message : "Project data could not be loaded."} />
          ) : rows.length ? (
            <HCDataTable columns={liveProjectColumns} data={rows} searchPlaceholder="Search projects..." />
          ) : (
            <HCEmptyState title="No projects yet" body="The production Neon project table is ready, but no organisation project records are visible to this signed-in user yet." />
          )}
        </HCPanel>

        <aside className="space-y-2.5">
          <HCPanel>
            <HCPanelHeader title="Integration State" />
            <div className="space-y-2 p-3 text-[9px]">
              <IntegrationRow label="Identity" value="Neon Auth" tone="green" />
              <IntegrationRow label="Tenant boundary" value="RLS active" tone="green" />
              <IntegrationRow label="Projects" value="Live reads" tone="green" />
              <IntegrationRow label="Project writes" value="Next gate" tone="amber" />
              <IntegrationRow label="Engineering" value="Live detail route" tone="blue" />
            </div>
          </HCPanel>
          <HCPanel>
            <HCPanelHeader title="Mapping Contract" />
            <div className="space-y-2 p-3 text-[9px] leading-4 text-[var(--muted)]">
              <p><strong className="text-[var(--foreground)]">Neon stays canonical.</strong> The UI maps relational customer, site, owner, stage and risk data into the workspace model.</p>
              <p>No database migration was required for this read slice.</p>
            </div>
          </HCPanel>
        </aside>
      </div>
    </div>
  );
}

function IntegrationRow({ label, value, tone }: { label: string; value: string; tone: "green" | "amber" | "blue" }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 last:border-b-0 last:pb-0">
      <span className="text-[var(--muted)]">{label}</span>
      <HCStatusBadge label={value} tone={tone} />
    </div>
  );
}
