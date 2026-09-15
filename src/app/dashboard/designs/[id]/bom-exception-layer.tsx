import { createBomException, reviewBomException } from "./bom-actions";

type BomLine = Record<string, unknown>;

type BomException = {
  id: string;
  generated_line_index: number | null;
  exception_type: "quantity_override" | "project_item";
  description: string;
  category: string;
  original_quantity: number | null;
  requested_quantity: number;
  unit: string;
  reason: string;
  status: "pending_review" | "approved" | "rejected" | "withdrawn";
  review_reason?: string | null;
  created_at: string;
  reviewed_at?: string | null;
};

type BomExceptionEvent = {
  id: string;
  exception_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

const inputClass = "mt-2 min-h-10 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm";
const textareaClass = "mt-2 w-full border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm";
const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function BomExceptionLayer({
  designId,
  bom,
  exceptions,
  events,
}: {
  designId: string;
  bom: BomLine[];
  exceptions: BomException[];
  events: BomExceptionEvent[];
}) {
  const pending = exceptions.filter((item) => item.status === "pending_review");
  const approved = exceptions.filter((item) => item.status === "approved");
  const approvedOverrides = new Map(
    approved
      .filter((item) => item.exception_type === "quantity_override" && item.generated_line_index != null)
      .map((item) => [item.generated_line_index as number, item]),
  );
  const approvedProjectItems = approved.filter((item) => item.exception_type === "project_item");

  return (
    <section className="mt-7 border border-[var(--line)]" aria-label="BOM exception governance">
      <div className="border-b border-[var(--line)] p-5 md:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Controlled exception layer</p>
        <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="text-2xl font-medium">BOM exceptions</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">The generated BOM remains immutable. Engineers may request a quantity override or add a genuine project-specific item, but every change requires a reason, review decision and audit event before it affects procurement.</p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="border border-[var(--line)] px-3 py-2"><strong>{pending.length}</strong> pending</span>
            <span className="border border-[var(--line)] px-3 py-2"><strong>{approved.length}</strong> approved</span>
          </div>
        </div>
      </div>

      {pending.length ? <div className="border-b border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900"><span className="font-semibold">Procurement blocked:</span> {pending.length} BOM exception {pending.length === 1 ? "requires" : "require"} review.</div> : null}

      <div className="grid gap-px bg-[var(--line)] xl:grid-cols-2">
        <div className="bg-[var(--background)] p-5 md:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Project-specific material</p>
          <h3 className="mt-2 text-lg font-semibold">Add exception item</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">Use only where the item cannot be derived from the engineering model, such as unusual containment, custom fabrication, civil works or site-specific accessories.</p>
          <form action={createBomException} className="mt-5 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="design_id" value={designId} />
            <input type="hidden" name="exception_type" value="project_item" />
            <label className="text-xs font-semibold sm:col-span-2">Description<input required name="description" className={inputClass} placeholder="Project-specific item" /></label>
            <label className="text-xs font-semibold">Category<input required name="category" className={inputClass} placeholder="Containment, civil, mounting..." /></label>
            <label className="text-xs font-semibold">Unit<input required name="unit" className={inputClass} defaultValue="ea" /></label>
            <label className="text-xs font-semibold">Requested quantity<input required type="number" min="0.001" step="0.001" name="requested_quantity" className={inputClass} /></label>
            <label className="text-xs font-semibold sm:col-span-2">Mandatory reason<textarea required minLength={10} rows={3} name="reason" className={textareaClass} placeholder="Explain why this item is project-specific and cannot be generated from the design model." /></label>
            <div className="sm:col-span-2 flex justify-end"><button className="min-h-10 border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Submit for review</button></div>
          </form>
        </div>

        <div className="bg-[var(--background)] p-5 md:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Effective exception output</p>
          <h3 className="mt-2 text-lg font-semibold">Approved overlays</h3>
          <div className="mt-5 space-y-3">
            {approvedOverrides.size === 0 && approvedProjectItems.length === 0 ? <p className="text-sm text-[var(--muted)]">No approved exceptions. Procurement quantities currently follow the generated BOM exactly.</p> : null}
            {[...approvedOverrides.entries()].map(([index, item]) => <div key={item.id} className="border border-[var(--line)] p-4 text-sm"><p className="font-semibold">Line {index + 1}: {item.description}</p><p className="mt-1 text-[var(--muted)]">Quantity override · {item.original_quantity} → <span className="font-semibold text-[var(--foreground)]">{item.requested_quantity} {item.unit}</span></p><p className="mt-2 text-xs text-[var(--muted)]">{item.reason}</p></div>)}
            {approvedProjectItems.map((item) => <div key={item.id} className="border border-[var(--line)] p-4 text-sm"><p className="font-semibold">{item.description}</p><p className="mt-1 text-[var(--muted)]">Project-specific item · <span className="font-semibold text-[var(--foreground)]">{item.requested_quantity} {item.unit}</span> · {item.category}</p><p className="mt-2 text-xs text-[var(--muted)]">{item.reason}</p></div>)}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--line)]">
        <div className="border-b border-[var(--line)] px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Generated-line overrides</p><p className="mt-1 text-sm text-[var(--muted)]">Request an override directly against a generated line. The original quantity is preserved permanently.</p></div>
        <div className="divide-y divide-[var(--line)]">
          {bom.map((item, index) => {
            const existing = exceptions.find((exception) => exception.generated_line_index === index && ["pending_review", "approved"].includes(exception.status));
            const description = String(item.description ?? item.name ?? item.item ?? `BOM line ${index + 1}`);
            const category = String(item.category ?? item.type ?? "Other");
            const quantity = Number(item.quantity ?? item.qty ?? 0);
            const unit = String(item.unit ?? "ea");
            return <div key={index} className="grid gap-4 p-5 lg:grid-cols-[minmax(260px,1fr)_minmax(380px,1.3fr)] lg:items-start">
              <div><p className="text-sm font-semibold">{index + 1}. {description}</p><p className="mt-1 text-xs text-[var(--muted)]">Generated quantity: {quantity} {unit} · {category}</p>{existing ? <p className="mt-2 text-xs font-semibold text-[var(--accent)]">{titleCase(existing.status)} exception already exists for this line.</p> : null}</div>
              {existing ? <div className="border border-[var(--line)] p-3 text-xs text-[var(--muted)]">Requested {existing.requested_quantity} {existing.unit}. Reason: {existing.reason}</div> : <form action={createBomException} className="grid gap-3 sm:grid-cols-[140px_1fr_auto] sm:items-end">
                <input type="hidden" name="design_id" value={designId} /><input type="hidden" name="exception_type" value="quantity_override" /><input type="hidden" name="generated_line_index" value={index} /><input type="hidden" name="description" value={description} /><input type="hidden" name="category" value={category} /><input type="hidden" name="original_quantity" value={quantity} /><input type="hidden" name="unit" value={unit} />
                <label className="text-xs font-semibold">New quantity<input required type="number" min="0.001" step="0.001" name="requested_quantity" className={inputClass} /></label>
                <label className="text-xs font-semibold">Mandatory reason<input required minLength={10} name="reason" className={inputClass} placeholder="Reason for overriding calculated quantity" /></label>
                <button className="min-h-10 border border-[var(--line)] px-4 text-xs font-semibold">Request override</button>
              </form>}
            </div>;
          })}
        </div>
      </div>

      <div className="border-t border-[var(--line)]">
        <div className="border-b border-[var(--line)] px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Exception register</p><p className="mt-1 text-sm text-[var(--muted)]">Every exception remains visible even after rejection or withdrawal.</p></div>
        {exceptions.length ? <div className="overflow-x-auto"><table className="w-full min-w-[1050px] border-collapse text-left text-sm"><thead className="border-b border-[var(--line)] bg-black/[0.015] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]"><tr><th className="px-5 py-3">Exception</th><th className="px-5 py-3">Quantity</th><th className="px-5 py-3">Reason</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Review</th></tr></thead><tbody>{exceptions.map((item) => <tr key={item.id} className="border-b border-[var(--line)] align-top"><td className="px-5 py-4"><p className="font-semibold">{item.description}</p><p className="mt-1 text-xs text-[var(--muted)]">{titleCase(item.exception_type)}{item.generated_line_index != null ? ` · generated line ${item.generated_line_index + 1}` : ""}</p></td><td className="px-5 py-4 tabular-nums">{item.original_quantity != null ? `${item.original_quantity} → ` : ""}<strong>{item.requested_quantity} {item.unit}</strong></td><td className="max-w-sm px-5 py-4 text-[var(--muted)]">{item.reason}</td><td className="px-5 py-4"><span className="text-xs font-semibold">{titleCase(item.status)}</span>{item.review_reason ? <p className="mt-2 max-w-xs text-xs text-[var(--muted)]">{item.review_reason}</p> : null}</td><td className="px-5 py-4">{item.status === "pending_review" ? <form action={reviewBomException} className="grid min-w-[300px] gap-2"><input type="hidden" name="design_id" value={designId} /><input type="hidden" name="exception_id" value={item.id} /><input required minLength={10} name="review_reason" className="min-h-9 border border-[var(--line)] bg-transparent px-2 text-xs" placeholder="Mandatory review reason" /><div className="flex gap-2"><button name="decision" value="approved" className="min-h-9 border border-[var(--accent)] px-3 text-xs font-semibold text-[var(--accent)]">Approve</button><button name="decision" value="rejected" className="min-h-9 border border-[var(--line)] px-3 text-xs font-semibold">Reject</button><button name="decision" value="withdrawn" className="min-h-9 px-3 text-xs text-[var(--muted)]">Withdraw</button></div></form> : <span className="text-xs text-[var(--muted)]">Reviewed</span>}</td></tr>)}</tbody></table></div> : <p className="p-5 text-sm text-[var(--muted)]">No BOM exceptions have been raised for this design revision.</p>}
      </div>

      <div className="border-t border-[var(--line)]">
        <div className="border-b border-[var(--line)] px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Audit trail</p><p className="mt-1 text-sm text-[var(--muted)]">Append-only events preserve the exception request and every review decision without rewriting the generated BOM.</p></div>
        {events.length ? <div className="divide-y divide-[var(--line)]">{events.map((event) => <div key={event.id} className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[180px_130px_1fr]"><span className="text-xs tabular-nums text-[var(--muted)]">{date.format(new Date(event.created_at))}</span><span className="text-xs font-semibold">{titleCase(event.event_type)}</span><span className="text-xs text-[var(--muted)]">Exception {event.exception_id.slice(0, 8)} · {event.payload?.reason ? String(event.payload.reason) : event.payload?.requestedQuantity ? `Requested quantity ${String(event.payload.requestedQuantity)}` : "Governed BOM event"}</span></div>)}</div> : <p className="p-5 text-sm text-[var(--muted)]">No audit events yet.</p>}
      </div>
    </section>
  );
}
