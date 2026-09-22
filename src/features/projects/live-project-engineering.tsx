"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, FileText, MapPin, Wrench } from "lucide-react";
import { HCEmptyState, HCErrorState, HCLoadingState } from "@/components/heliocore/hc-states";
import { HCPanel, HCPanelHeader } from "@/components/heliocore/hc-panel";
import { HCStatusBadge } from "@/components/heliocore/hc-status-badge";
import { useLiveProjectEngineering } from "./live-queries";

const stages = ["Site Data", "Survey", "System Sizing", "PV Layout", "Electrical Design", "BESS Design", "BOM", "Design Review", "IFC"];

export function LiveProjectEngineering({ projectId }: { projectId: string }) {
  const query = useLiveProjectEngineering(projectId);

  if (query.isLoading) return <div className="p-4"><HCLoadingState label="Loading project engineering workspace..." /></div>;
  if (query.isError) return <div className="p-4"><HCErrorState message={query.error instanceof Error ? query.error.message : "Engineering workspace could not be loaded."} /></div>;
  if (!query.data) return <div className="p-4"><HCEmptyState title="Project unavailable" body="No project data was returned for this route." /></div>;

  const { project, opportunity, survey, intake, design, documents } = query.data;
  const systemType = design?.systemType ?? intake?.systemType ?? "Not defined";
  const designStatus = design?.status ?? intake?.status ?? "not_started";

  return (
    <div className="p-3.5 lg:p-4">
      <Link href="/workspace/projects" className="mb-2 inline-flex items-center gap-1 text-[9px] text-[var(--muted)] hover:text-[var(--accent-text)]"><ArrowLeft size={11}/> Projects</Link>

      <section className="mb-2.5 flex flex-col gap-2.5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="text-[9px] text-[var(--muted)]">{project.reference}</div>
          <h1 className="mt-0.5 text-[22px] font-semibold tracking-[-0.035em]">{project.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-[#58616b]">
            <span className="flex items-center gap-1.5"><MapPin size={13}/>{project.location}</span>
            <span className="text-[#b6bcc1]">|</span><span>{project.client}</span>
            <span className="text-[#b6bcc1]">|</span><span>{project.system}</span>
            <span className="text-[#b6bcc1]">|</span><span>{systemType.replaceAll("_", " ")}</span>
            <span className="text-[#b6bcc1]">|</span><HCStatusBadge label={project.status} tone={project.status === "Critical" ? "red" : project.status === "At Risk" ? "amber" : "green"} />
          </div>
        </div>
        <div className="border border-[var(--line)] bg-white px-3 py-2 text-right">
          <p className="text-[9px] text-[var(--muted)]">Latest design</p>
          <p className="mt-0.5 text-[11px] font-semibold">{design ? `${design.designReference} · Rev ${design.revision}` : "No controlled design yet"}</p>
          <p className="mt-0.5 text-[9px] text-[var(--muted)]">{designStatus.replaceAll("_", " ")}</p>
        </div>
      </section>

      <StageBar surveyReady={Boolean(survey)} sizingReady={Boolean(intake)} layoutReady={Boolean(design)} />

      <div className="mt-3 grid gap-2.5 xl:grid-cols-[244px_minmax(0,1fr)_292px]">
        <aside className="space-y-2.5">
          <HCPanel>
            <HCPanelHeader title="Project & Site" />
            <DataRows rows={[
              ["Client", project.client],
              ["Site", project.site],
              ["Location", project.location],
              ["Project type", project.projectType ?? "Not set"],
              ["Owner", project.owner],
              ["Lifecycle", project.rawStatus],
            ]} />
          </HCPanel>
          <HCPanel>
            <HCPanelHeader title="Survey Basis" />
            {survey ? <DataRows rows={[
              ["Reference", survey.reference],
              ["Status", survey.status],
              ["Roof type", survey.roofType ?? "—"],
              ["Roof pitch", survey.roofPitchDeg === null ? "—" : `${survey.roofPitchDeg}°`],
              ["Usable area", survey.usableRoofAreaM2 === null ? "—" : `${survey.usableRoofAreaM2} m²`],
              ["Recommended PV", survey.recommendedPvKwp === null ? "—" : `${survey.recommendedPvKwp} kWp`],
            ]} /> : <HCEmptyState title="No survey linked" body="The project opportunity does not yet have a site survey." />}
          </HCPanel>
        </aside>

        <main className="space-y-2.5">
          <HCPanel>
            <HCPanelHeader title="PV Layout & Design Context" subtitle="Live engineering data from the latest controlled system design." />
            {design ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4">
                  <Metric label="PV Capacity" value={design.arrayCapacityKwp === null ? "—" : `${design.arrayCapacityKwp} kWp`} />
                  <Metric label="Modules" value={design.moduleQuantity === null ? "—" : String(design.moduleQuantity)} />
                  <Metric label="DC/AC Ratio" value={design.dcAcRatio === null ? "—" : String(design.dcAcRatio)} />
                  <Metric label="Strings" value={design.totalStrings === null ? "—" : String(design.totalStrings)} />
                  <Metric label="Inverter Capacity" value={design.inverterCapacityKw === null ? "—" : `${design.inverterCapacityKw} kW`} />
                  <Metric label="Annual Generation" value={design.annualGenerationKwh === null ? "—" : `${Math.round(design.annualGenerationKwh / 1000).toLocaleString()} MWh`} />
                  <Metric label="BESS" value={design.batteryCapacityKwh === null ? "—" : `${design.batteryCapacityKwh} kWh`} />
                  <Metric label="Mounting" value={design.mountingSystem ?? "—"} />
                </div>
                <div className="border-t border-[var(--line)] p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <Equipment label="PV module" value={design.module} note={design.moduleRatingWp === null ? null : `${design.moduleRatingWp} Wp · ${design.moduleQuantity ?? "—"} units`} />
                    <Equipment label="Inverter" value={design.inverter} note={design.inverterCapacityKw === null ? null : `${design.inverterCapacityKw} kW · ${design.inverterQuantity ?? "—"} units`} />
                  </div>
                </div>
              </>
            ) : (
              <HCEmptyState title="No system design yet" body="The project is connected, but no controlled system_designs record exists for its originating opportunity." />
            )}
          </HCPanel>

          <HCPanel>
            <HCPanelHeader title="Controlled Documents" subtitle="Project documents visible through organisation RLS." />
            {documents.length ? (
              <div className="divide-y divide-[var(--line)]">
                {documents.map((document) => (
                  <div key={document.id} className="flex items-center gap-3 px-3 py-2.5">
                    <FileText size={13} className="text-[var(--muted)]" />
                    <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-medium">{document.name}</p><p className="mt-0.5 text-[8px] text-[var(--muted)]">{document.category ?? "General"} · {new Date(document.createdAt).toLocaleDateString("en-GB")}</p></div>
                    <HCStatusBadge label={document.status} tone={document.status === "approved" ? "green" : "blue"} />
                  </div>
                ))}
              </div>
            ) : <HCEmptyState title="No project documents" body="No controlled documents are linked to this project yet." />}
          </HCPanel>
        </main>

        <aside className="space-y-2.5">
          <HCPanel>
            <HCPanelHeader title="Current Engineering Gate" />
            <div className="p-3">
              <div className="flex items-start gap-2">
                <Wrench size={15} className="mt-0.5 text-[var(--accent-text)]" />
                <div>
                  <h3 className="text-[11px] font-semibold">{design ? "Design record active" : intake ? "System sizing in progress" : survey ? "Survey complete · engineering intake required" : "Survey required"}</h3>
                  <p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">This panel is driven by the linked opportunity, survey, engineering intake and latest system design.</p>
                </div>
              </div>
            </div>
          </HCPanel>
          <HCPanel>
            <HCPanelHeader title="Data Chain" />
            <div className="space-y-2 p-3">
              <Gate label="Project" ready />
              <Gate label="Originating opportunity" ready={Boolean(opportunity)} />
              <Gate label="Site survey" ready={Boolean(survey)} />
              <Gate label="Engineering intake" ready={Boolean(intake)} />
              <Gate label="System design" ready={Boolean(design)} />
            </div>
          </HCPanel>
        </aside>
      </div>
    </div>
  );
}

function StageBar({ surveyReady, sizingReady, layoutReady }: { surveyReady: boolean; sizingReady: boolean; layoutReady: boolean }) {
  return (
    <div className="grid overflow-hidden border border-[#e0e3e5] bg-[#f1f2f1] lg:grid-cols-9">
      {stages.map((stage, index) => {
        const done = index === 0 || (index === 1 && surveyReady) || (index === 2 && sizingReady);
        const current = index === 3 && layoutReady;
        return (
          <div key={stage} className={`flex min-h-8 items-center gap-1.5 border-r border-white/80 px-2.5 text-[9px] last:border-r-0 ${current ? "bg-[#ffc58f] font-semibold" : "bg-[#f1f2f1]"}`}>
            <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-semibold ${done ? "bg-[#14996d] text-white" : current ? "border-2 border-[#f97316] bg-white" : "bg-[#bfc5ca] text-white"}`}>
              {done ? <CheckCircle2 size={12}/> : index + 1}
            </span>
            <span>{stage}</span>
          </div>
        );
      })}
    </div>
  );
}

function DataRows({ rows }: { rows: Array<[string, string]> }) {
  return <dl className="space-y-1.5 p-3">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-3 text-[9px]"><dt className="text-[var(--muted)]">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-r border-[var(--line)] px-3 py-2"><p className="text-[9px] text-[var(--muted)]">{label}</p><p className="mt-1 text-[12px] font-semibold tabular-nums">{value}</p></div>;
}

function Equipment({ label, value, note }: { label: string; value: string; note: string | null }) {
  return <div className="border border-[var(--line)] p-2.5"><p className="text-[8px] uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p><p className="mt-1 text-[10px] font-semibold">{value}</p>{note ? <p className="mt-1 text-[9px] text-[var(--muted)]">{note}</p> : null}</div>;
}

function Gate({ label, ready }: { label: string; ready: boolean }) {
  return <div className="flex items-center justify-between"><span className="text-[9px]">{label}</span><HCStatusBadge label={ready ? "Connected" : "Missing"} tone={ready ? "green" : "amber"} /></div>;
}
