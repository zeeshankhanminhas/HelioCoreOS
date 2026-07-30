type Props = {
  customerAssigned: boolean;
  siteAssigned: boolean;
  requiredReadinessTotal: number;
  requiredReadinessComplete: number;
  proposalStatus: string | null;
  opportunityStage: string;
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function WorkflowProof({
  customerAssigned,
  siteAssigned,
  requiredReadinessTotal,
  requiredReadinessComplete,
  proposalStatus,
  opportunityStage,
}: Props) {
  const readinessComplete = requiredReadinessTotal > 0 && requiredReadinessComplete === requiredReadinessTotal;
  const proposalCreated = Boolean(proposalStatus);
  const expectedStage = proposalStatus === "accepted"
    ? "won"
    : proposalStatus === "declined"
      ? "lost"
      : proposalCreated
        ? "proposal"
        : null;
  const stageAligned = expectedStage ? opportunityStage === expectedStage : true;

  const checks = [
    { label: "Customer relationship", complete: customerAssigned, detail: customerAssigned ? "Assigned" : "Missing" },
    { label: "Site relationship", complete: siteAssigned, detail: siteAssigned ? "Assigned" : "Missing" },
    {
      label: "Required readiness",
      complete: readinessComplete,
      detail: `${requiredReadinessComplete} of ${requiredReadinessTotal} complete`,
    },
    {
      label: "Proposal record",
      complete: proposalCreated,
      detail: proposalStatus ? titleCase(proposalStatus) : "Not created",
    },
    {
      label: "Lifecycle alignment",
      complete: stageAligned,
      detail: stageAligned ? titleCase(opportunityStage) : `Expected ${titleCase(expectedStage ?? opportunityStage)}`,
    },
  ];

  const passed = checks.filter((check) => check.complete).length;

  return (
    <section className="mt-7 border border-[var(--line)]">
      <div className="flex flex-col gap-3 border-b border-[var(--line)] p-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Runtime integrity</p>
          <h2 className="mt-2 text-2xl font-medium">Commercial workflow proof</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Live checks across Opportunity, relationships, readiness and proposal state.</p>
        </div>
        <p className="text-sm font-semibold">{passed} of {checks.length} checks passing</p>
      </div>

      <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-5">
        {checks.map((check) => (
          <div key={check.label} className="bg-[var(--background)] p-5">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${check.complete ? "bg-emerald-600" : "bg-amber-500"}`} />
              <p className="text-xs font-semibold">{check.label}</p>
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">{check.detail}</p>
          </div>
        ))}
      </div>

      {!stageAligned ? (
        <p className="border-t border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800">
          Proposal and Opportunity lifecycle states are inconsistent. Do not continue the workflow until the record is repaired.
        </p>
      ) : null}
    </section>
  );
}
