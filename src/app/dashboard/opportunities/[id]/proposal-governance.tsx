import { saveGovernedProposal } from "./proposal-actions";

const proposalStatuses = ["draft", "issued", "accepted", "declined", "expired"] as const;

type Proposal = {
  proposal_number?: string | null;
  status?: string | null;
  pv_capacity_kwp?: number | null;
  battery_capacity_kwh?: number | null;
  estimated_generation_kwh?: number | null;
  estimated_annual_saving_gbp?: number | null;
  indicative_price_gbp?: number | null;
  assumptions?: string | null;
  exclusions?: string | null;
  valid_until?: string | null;
  issued_at?: string | null;
};

type Props = {
  opportunityId: string;
  opportunityReference: string;
  customerAssigned: boolean;
  siteAssigned: boolean;
  readinessTotal: number;
  readinessComplete: number;
  proposal: Proposal | null;
  estimatedPv: number | null;
  estimatedBattery: number | null;
  estimatedValue: number | null;
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function ProposalGovernance({
  opportunityId,
  opportunityReference,
  customerAssigned,
  siteAssigned,
  readinessTotal,
  readinessComplete,
  proposal,
  estimatedPv,
  estimatedBattery,
  estimatedValue,
}: Props) {
  const status = proposal?.status ?? "draft";
  const terminal = status === "accepted" || status === "declined" || status === "expired";
  const issued = status === "issued";
  const readinessReady = readinessTotal > 0 && readinessComplete === readinessTotal;
  const issueBlockers = [
    !customerAssigned ? "Customer unassigned" : null,
    !siteAssigned ? "Site unassigned" : null,
    !readinessReady ? `${readinessTotal - readinessComplete || readinessTotal} readiness item(s) unresolved` : null,
  ].filter(Boolean) as string[];

  const allowedStatuses = terminal
    ? [status]
    : issued
      ? ["accepted", "declined", "expired"]
      : ["draft", "issued"];

  return (
    <section className="mt-7 border border-[var(--line)]">
      <div className="border-b border-[var(--line)] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Indicative proposal governance</p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-medium">Commercial position</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Draft deliberately, issue only after relationship and readiness gates pass, then record the customer disposition.</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Current state</p>
            <p className="mt-1 text-sm font-semibold">{titleCase(status)}</p>
          </div>
        </div>
      </div>

      {issueBlockers.length > 0 && !issued && !terminal ? (
        <div className="border-b border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-semibold">Issue gate is blocked</p>
          <p className="mt-1">{issueBlockers.join(" · ")}</p>
        </div>
      ) : null}

      {issued ? (
        <div className="border-b border-[var(--line)] px-5 py-4 text-sm">
          <span className="font-semibold">Issued record locked.</span> Commercial fields are preserved; record only Accepted, Declined or Expired.
        </div>
      ) : null}

      {terminal ? (
        <div className="border-b border-[var(--line)] px-5 py-4 text-sm">
          <span className="font-semibold">Terminal decision recorded.</span> This proposal can no longer be edited or moved backwards.
        </div>
      ) : null}

      <form action={saveGovernedProposal} className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
        <input type="hidden" name="opportunity_id" value={opportunityId} />

        <label className="text-xs font-semibold">
          Proposal number
          <input required disabled={issued || terminal} name="proposal_number" defaultValue={proposal?.proposal_number ?? `${opportunityReference}-P01`} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal uppercase disabled:opacity-60" />
          {(issued || terminal) ? <input type="hidden" name="proposal_number" value={proposal?.proposal_number ?? `${opportunityReference}-P01`} /> : null}
        </label>

        <label className="text-xs font-semibold">
          Next governed state
          <select name="status" defaultValue={allowedStatuses[0]} disabled={terminal} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal disabled:opacity-60">
            {allowedStatuses.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}
          </select>
          {terminal ? <input type="hidden" name="status" value={status} /> : null}
        </label>

        <label className="text-xs font-semibold">PV capacity (kWp)<input disabled={issued || terminal} name="pv_capacity_kwp" type="number" min="0" step="0.01" defaultValue={proposal?.pv_capacity_kwp ?? estimatedPv ?? ""} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal disabled:opacity-60" /></label>
        <label className="text-xs font-semibold">Battery capacity (kWh)<input disabled={issued || terminal} name="battery_capacity_kwh" type="number" min="0" step="0.01" defaultValue={proposal?.battery_capacity_kwh ?? estimatedBattery ?? ""} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal disabled:opacity-60" /></label>
        <label className="text-xs font-semibold">Estimated generation (kWh/year)<input disabled={issued || terminal} name="estimated_generation_kwh" type="number" min="0" step="0.01" defaultValue={proposal?.estimated_generation_kwh ?? ""} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal disabled:opacity-60" /></label>
        <label className="text-xs font-semibold">Estimated annual saving (£)<input disabled={issued || terminal} name="estimated_annual_saving_gbp" type="number" min="0" step="0.01" defaultValue={proposal?.estimated_annual_saving_gbp ?? ""} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal disabled:opacity-60" /></label>
        <label className="text-xs font-semibold">Indicative price (£)<input disabled={issued || terminal} name="indicative_price_gbp" type="number" min="0" step="0.01" defaultValue={proposal?.indicative_price_gbp ?? estimatedValue ?? ""} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal disabled:opacity-60" /></label>
        <label className="text-xs font-semibold">Valid until<input disabled={issued || terminal} name="valid_until" type="date" defaultValue={proposal?.valid_until ?? ""} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal disabled:opacity-60" /></label>
        <label className="text-xs font-semibold md:col-span-2">Assumptions<textarea disabled={issued || terminal} name="assumptions" rows={4} defaultValue={proposal?.assumptions ?? ""} className="mt-2 w-full border border-[var(--line)] bg-transparent px-3 py-3 text-sm font-normal disabled:opacity-60" /></label>
        <label className="text-xs font-semibold md:col-span-2">Exclusions<textarea disabled={issued || terminal} name="exclusions" rows={4} defaultValue={proposal?.exclusions ?? ""} className="mt-2 w-full border border-[var(--line)] bg-transparent px-3 py-3 text-sm font-normal disabled:opacity-60" /></label>

        <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-5 md:col-span-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[var(--muted)]">Issued proposals are immutable. Every state change is synchronised to the Opportunity and written to the activity audit.</p>
          {!terminal ? <button className="min-h-11 shrink-0 border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)]">Save governed proposal</button> : null}
        </div>
      </form>
    </section>
  );
}
