import { updateGovernedReadiness } from "./readiness-actions";

const labels: Record<string, string> = {
  electricity_bill: "Electricity bill",
  customer_id: "Customer ID",
  proof_of_address: "Proof of address",
  ownership_evidence: "Ownership evidence",
  meter_photo: "Meter photo",
  survey_authorisation: "Survey authorisation",
};

const statusOptions = ["requested", "uploaded", "under_review", "accepted", "rejected", "waived"];

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

type Item = {
  id: string;
  item_type: string;
  status: string;
  evidence_url: string | null;
  decision_note: string | null;
  review_note: string | null;
  is_required: boolean;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

type Props = {
  opportunityId: string;
  items: Item[];
  reviewerNames: Record<string, string>;
};

export function ReadinessGovernance({ opportunityId, items, reviewerNames }: Props) {
  const required = items.filter((item) => item.is_required);
  const complete = required.filter((item) => item.status === "accepted" || item.status === "waived");
  const blockers = required.filter((item) => item.status !== "accepted" && item.status !== "waived");
  const score = required.length ? Math.round((complete.length / required.length) * 100) : 100;

  return (
    <section className="mt-7 border border-[var(--line)]">
      <div className="grid gap-5 border-b border-[var(--line)] p-5 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Customer readiness</p>
          <h2 className="mt-2 text-2xl font-medium">Governed evidence review</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">Required evidence must move through upload and review before proposal issue. Waivers require an explicit rationale.</p>
        </div>
        <div className="min-w-40 border border-[var(--line)] p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Required readiness</p>
          <p className="mt-2 text-3xl font-medium">{score}%</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{complete.length} of {required.length} cleared</p>
        </div>
      </div>

      {blockers.length ? (
        <div className="border-b border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <span className="font-semibold">Proposal issue blocked:</span> {blockers.map((item) => labels[item.item_type] ?? titleCase(item.item_type)).join(", ")}.
        </div>
      ) : (
        <div className="border-b border-emerald-300 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">All required readiness items are accepted or formally waived.</div>
      )}

      <div className="divide-y divide-[var(--line)]">
        {items.map((item) => {
          const decision = item.decision_note ?? item.review_note;
          return (
            <form key={item.id} action={updateGovernedReadiness} className="grid gap-4 p-5 xl:grid-cols-[220px_170px_1fr_1fr_auto] xl:items-end">
              <input type="hidden" name="opportunity_id" value={opportunityId} />
              <input type="hidden" name="item_id" value={item.id} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{labels[item.item_type] ?? titleCase(item.item_type)}</p>
                  <span className="border border-[var(--line)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">{item.is_required ? "Required" : "Optional"}</span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">Current: {titleCase(item.status)}</p>
                {item.reviewed_at ? <p className="mt-1 text-xs text-[var(--muted)]">Reviewed by {reviewerNames[item.reviewed_by ?? ""] ?? "Organisation member"} · {new Date(item.reviewed_at).toLocaleString("en-GB")}</p> : null}
              </div>

              <label className="text-xs font-semibold">Next state
                <select name="status" defaultValue={item.status} className="mt-2 min-h-10 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">
                  {statusOptions.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
                </select>
              </label>

              <label className="text-xs font-semibold">Evidence link
                <input name="evidence_url" type="url" defaultValue={item.evidence_url ?? ""} placeholder="Drive or approved storage URL" className="mt-2 min-h-10 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" />
              </label>

              <label className="text-xs font-semibold">Decision note
                <input name="decision_note" defaultValue={decision ?? ""} placeholder="Required for rejection or waiver" className="mt-2 min-h-10 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" />
              </label>

              <button className="min-h-10 border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Apply transition</button>
            </form>
          );
        })}
      </div>
    </section>
  );
}