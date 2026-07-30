import { saveSystemDesign } from "./design-actions";

type Design = Record<string, unknown> & {
  design_reference?: string | null;
  status?: string | null;
  revision?: number | null;
};

type Survey = {
  id: string;
  status: string;
  recommended_pv_kwp?: number | null;
  recommended_battery_kwh?: number | null;
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function value(design: Design | null, key: string) {
  const result = design?.[key];
  return result == null ? "" : String(result);
}

const inputClass = "mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal";
const textareaClass = "mt-2 w-full border border-[var(--line)] bg-transparent px-3 py-3 text-sm font-normal";

export function SystemDesignGovernance({
  opportunityId,
  siteId,
  opportunityReference,
  approvedSurvey,
  design,
}: {
  opportunityId: string;
  siteId: string | null;
  opportunityReference: string;
  approvedSurvey: Survey | null;
  design: Design | null;
}) {
  const locked = design?.status === "approved";
  const blocked = !siteId || !approvedSurvey;
  const designReference = design?.design_reference || `DES-${opportunityReference}`;
  const calculatedCapacity = design?.array_capacity_kwp ?? approvedSurvey?.recommended_pv_kwp ?? "";
  const batteryCapacity = design?.battery_capacity_kwh ?? approvedSurvey?.recommended_battery_kwh ?? "";

  return (
    <section className="mt-7 border border-[var(--line)]">
      <div className="border-b border-[var(--line)] p-5 md:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Engineering control</p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-medium">Governed System Design</h2>
            <p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Convert approved field intelligence into a controlled PV, inverter, battery, yield and drawing package.</p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Status</p>
            <p className="mt-1 text-sm font-semibold">{titleCase(design?.status || "not started")}</p>
          </div>
        </div>
      </div>

      {!siteId ? <p className="m-5 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Assign a governed Site before engineering begins.</p> : null}
      {siteId && !approvedSurvey ? <p className="m-5 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Approve the Structured Site Survey before creating a system design.</p> : null}
      {locked ? <p className="m-5 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Revision {design?.revision ?? 1} is approved and locked. A future amendment must create a new governed revision.</p> : null}

      <form action={saveSystemDesign} className="p-5 md:p-6">
        <input type="hidden" name="opportunity_id" value={opportunityId} />
        <input type="hidden" name="site_id" value={siteId ?? ""} />
        <input type="hidden" name="survey_id" value={approvedSurvey?.id ?? ""} />
        <fieldset disabled={blocked || locked} className="space-y-8 disabled:opacity-60">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-semibold">Design reference<input required name="design_reference" defaultValue={designReference} className={`${inputClass} uppercase`} /></label>
            <label className="text-xs font-semibold">Revision<input required min="1" step="1" type="number" name="revision" defaultValue={design?.revision ?? 1} className={inputClass} /></label>
            <label className="text-xs font-semibold md:col-span-2">Design basis<input name="design_basis" defaultValue={value(design, "design_basis")} placeholder="Approved survey, consumption profile, DNO requirements" className={inputClass} /></label>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">PV array and mounting</p>
            <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-xs font-semibold">Module manufacturer<input name="module_manufacturer" defaultValue={value(design, "module_manufacturer")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Module model<input name="module_model" defaultValue={value(design, "module_model")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Module rating (Wp)<input type="number" min="1" step="1" name="module_rating_wp" defaultValue={value(design, "module_rating_wp")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Module quantity<input type="number" min="1" step="1" name="module_quantity" defaultValue={value(design, "module_quantity")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Array capacity (kWp)<input type="number" min="0" step="0.001" name="array_capacity_kwp" defaultValue={String(calculatedCapacity)} className={inputClass} /></label>
              <label className="text-xs font-semibold">Mounting system<input name="mounting_system" defaultValue={value(design, "mounting_system")} className={inputClass} /></label>
              <label className="text-xs font-semibold md:col-span-2">String configuration<textarea rows={3} name="string_configuration" defaultValue={value(design, "string_configuration")} placeholder="Example: 2 strings × 12 modules; MPPT allocation" className={textareaClass} /></label>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Inverter and storage</p>
            <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-xs font-semibold">Inverter manufacturer<input name="inverter_manufacturer" defaultValue={value(design, "inverter_manufacturer")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Inverter model<input name="inverter_model" defaultValue={value(design, "inverter_model")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Inverter quantity<input type="number" min="1" step="1" name="inverter_quantity" defaultValue={value(design, "inverter_quantity")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Unit capacity (kW)<input type="number" min="0" step="0.01" name="inverter_capacity_kw" defaultValue={value(design, "inverter_capacity_kw")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Battery manufacturer<input name="battery_manufacturer" defaultValue={value(design, "battery_manufacturer")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Battery model<input name="battery_model" defaultValue={value(design, "battery_model")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Battery quantity<input type="number" min="0" step="1" name="battery_quantity" defaultValue={value(design, "battery_quantity")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Usable capacity (kWh)<input type="number" min="0" step="0.01" name="battery_capacity_kwh" defaultValue={String(batteryCapacity)} className={inputClass} /></label>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Performance and grid</p>
            <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-xs font-semibold">Annual generation (kWh)<input type="number" min="0" step="1" name="annual_generation_kwh" defaultValue={value(design, "annual_generation_kwh")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Specific yield (kWh/kWp)<input type="number" min="0" step="0.01" name="specific_yield_kwh_kwp" defaultValue={value(design, "specific_yield_kwh_kwp")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Performance ratio (%)<input type="number" min="0" max="100" step="0.01" name="performance_ratio_pct" defaultValue={value(design, "performance_ratio_pct")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Export limit (kW)<input type="number" min="0" step="0.01" name="export_limit_kw" defaultValue={value(design, "export_limit_kw")} className={inputClass} /></label>
              <label className="flex min-h-11 items-center gap-3 border border-[var(--line)] px-3 text-xs font-semibold"><input type="checkbox" name="grid_application_required" defaultChecked={Boolean(design?.grid_application_required)} />Grid application required</label>
              <label className="text-xs font-semibold md:col-span-2 xl:col-span-3">Grid application reference<input name="grid_application_reference" defaultValue={value(design, "grid_application_reference")} className={inputClass} /></label>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Controlled design outputs</p>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <label className="text-xs font-semibold">Single-line diagram URL<input type="url" name="single_line_diagram_url" defaultValue={value(design, "single_line_diagram_url")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Layout drawing URL<input type="url" name="layout_drawing_url" defaultValue={value(design, "layout_drawing_url")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Structural calculation URL<input type="url" name="structural_calculation_url" defaultValue={value(design, "structural_calculation_url")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Generation report URL<input type="url" name="generation_report_url" defaultValue={value(design, "generation_report_url")} className={inputClass} /></label>
              <label className="text-xs font-semibold">Design assumptions<textarea rows={4} name="design_assumptions" defaultValue={value(design, "design_assumptions")} className={textareaClass} /></label>
              <label className="text-xs font-semibold">Design constraints<textarea rows={4} name="design_constraints" defaultValue={value(design, "design_constraints")} className={textareaClass} /></label>
              <label className="text-xs font-semibold md:col-span-2">Review note<textarea rows={3} name="review_note" defaultValue={value(design, "review_note")} className={textareaClass} /></label>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-end">
            <label className="text-xs font-semibold">Workflow decision<select name="status" defaultValue={design?.status || "draft"} className="ml-3 min-h-11 border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"><option value="draft">Save draft</option><option value="in_progress">In progress</option><option value="under_review">Submit for review</option><option value="approved">Approve</option><option value="rejected">Reject</option></select></label>
            <button className="min-h-11 border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)]">Commit design</button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
