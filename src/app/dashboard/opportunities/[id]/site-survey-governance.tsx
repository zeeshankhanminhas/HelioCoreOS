import { saveSiteSurvey } from "./survey-actions";

type Survey = Record<string, unknown> & {
  survey_reference?: string | null;
  status?: string | null;
  photo_links?: string[] | null;
  drawing_links?: string[] | null;
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function value(survey: Survey | null, key: string) {
  const result = survey?.[key];
  return result == null ? "" : String(result);
}

const inputClass = "mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal";
const textareaClass = "mt-2 w-full border border-[var(--line)] bg-transparent px-3 py-3 text-sm font-normal";

export function SiteSurveyGovernance({ opportunityId, siteId, opportunityReference, survey }: { opportunityId: string; siteId: string | null; opportunityReference: string; survey: Survey | null }) {
  const locked = survey?.status === "approved";
  const initialReference = survey?.survey_reference || `SUR-${opportunityReference}`;

  return (
    <section className="mt-7 border border-[var(--line)]">
      <div className="border-b border-[var(--line)] p-5 md:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Solar EPC field intelligence</p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div><h2 className="text-2xl font-medium">Structured Site Survey</h2><p className="mt-2 max-w-3xl text-sm text-[var(--muted)]">Capture roof, electrical, access, safety and design constraints as a governed record before engineering begins.</p></div>
          <div className="text-left md:text-right"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Status</p><p className="mt-1 text-sm font-semibold">{titleCase(survey?.status || "not started")}</p></div>
        </div>
      </div>

      {!siteId ? <p className="m-5 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Assign a governed Site to the Opportunity before starting the survey.</p> : null}
      {locked ? <p className="m-5 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">This survey is approved and locked. Future changes must use a governed amendment workflow.</p> : null}

      <form action={saveSiteSurvey} className="p-5 md:p-6">
        <input type="hidden" name="opportunity_id" value={opportunityId} />
        <input type="hidden" name="site_id" value={siteId ?? ""} />
        <fieldset disabled={!siteId || locked} className="space-y-8 disabled:opacity-60">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-semibold">Survey reference<input required name="survey_reference" defaultValue={initialReference} className={`${inputClass} uppercase`} /></label>
            <label className="text-xs font-semibold">Survey date<input type="date" name="survey_date" defaultValue={value(survey, "survey_date")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Surveyor<input name="surveyor_name" defaultValue={value(survey, "surveyor_name")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Weather<input name="weather_conditions" defaultValue={value(survey, "weather_conditions")} className={inputClass} /></label>
          </div>

          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Roof and structure</p><div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-xs font-semibold">Roof type<input name="roof_type" defaultValue={value(survey, "roof_type")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Roof covering<input name="roof_covering" defaultValue={value(survey, "roof_covering")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Roof condition<input name="roof_condition" defaultValue={value(survey, "roof_condition")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Orientation (°)<input type="number" min="0" max="359.99" step="0.01" name="roof_orientation_deg" defaultValue={value(survey, "roof_orientation_deg")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Pitch (°)<input type="number" min="0" max="90" step="0.01" name="roof_pitch_deg" defaultValue={value(survey, "roof_pitch_deg")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Usable area (m²)<input type="number" min="0" step="0.01" name="usable_roof_area_m2" defaultValue={value(survey, "usable_roof_area_m2")} className={inputClass} /></label>
            <label className="text-xs font-semibold md:col-span-2">Shading summary<textarea rows={3} name="shading_summary" defaultValue={value(survey, "shading_summary")} className={textareaClass} /></label>
            <label className="text-xs font-semibold">Structural observations<textarea rows={3} name="structural_observations" defaultValue={value(survey, "structural_observations")} className={textareaClass} /></label>
          </div></div>

          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Electrical infrastructure</p><div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-xs font-semibold">Supply phase<select name="supply_phase" defaultValue={value(survey, "supply_phase")} className={`${inputClass} bg-[var(--background)]`}><option value="">Select</option><option value="single_phase">Single phase</option><option value="three_phase">Three phase</option><option value="unknown">Unknown</option></select></label>
            <label className="text-xs font-semibold">Main fuse rating (A)<input type="number" min="0" step="1" name="main_fuse_rating_a" defaultValue={value(survey, "main_fuse_rating_a")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Earthing arrangement<input name="earthing_arrangement" defaultValue={value(survey, "earthing_arrangement")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Meter location<input name="meter_location" defaultValue={value(survey, "meter_location")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Consumer unit location<input name="consumer_unit_location" defaultValue={value(survey, "consumer_unit_location")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Cable route notes<input name="cable_route_notes" defaultValue={value(survey, "cable_route_notes")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Inverter location<input name="inverter_location" defaultValue={value(survey, "inverter_location")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Battery location<input name="battery_location" defaultValue={value(survey, "battery_location")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Fire safety notes<input name="fire_safety_notes" defaultValue={value(survey, "fire_safety_notes")} className={inputClass} /></label>
          </div></div>

          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Access, risk and constraints</p><div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="text-xs font-semibold">Asbestos risk<select name="asbestos_risk" defaultValue={value(survey, "asbestos_risk")} className={`${inputClass} bg-[var(--background)]`}><option value="">Select</option><option value="none_identified">None identified</option><option value="possible">Possible</option><option value="confirmed">Confirmed</option><option value="unknown">Unknown</option></select></label>
            <label className="text-xs font-semibold">Access notes<textarea rows={3} name="access_notes" defaultValue={value(survey, "access_notes")} className={textareaClass} /></label>
            <label className="text-xs font-semibold">Working at height risk<textarea rows={3} name="working_at_height_risk" defaultValue={value(survey, "working_at_height_risk")} className={textareaClass} /></label>
            <label className="text-xs font-semibold">Planning constraints<textarea rows={3} name="planning_constraints" defaultValue={value(survey, "planning_constraints")} className={textareaClass} /></label>
            <label className="text-xs font-semibold">Grid constraints<textarea rows={3} name="grid_constraints" defaultValue={value(survey, "grid_constraints")} className={textareaClass} /></label>
            <label className="text-xs font-semibold">Other constraints<textarea rows={3} name="other_constraints" defaultValue={value(survey, "other_constraints")} className={textareaClass} /></label>
          </div></div>

          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Engineering handover</p><div className="mt-4 grid gap-5 md:grid-cols-2">
            <label className="text-xs font-semibold">Recommended PV (kWp)<input type="number" min="0" step="0.01" name="recommended_pv_kwp" defaultValue={value(survey, "recommended_pv_kwp")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Recommended battery (kWh)<input type="number" min="0" step="0.01" name="recommended_battery_kwh" defaultValue={value(survey, "recommended_battery_kwh")} className={inputClass} /></label>
            <label className="text-xs font-semibold">Photo links — one per line<textarea rows={4} name="photo_links" defaultValue={(survey?.photo_links ?? []).join("\n")} className={textareaClass} /></label>
            <label className="text-xs font-semibold">Drawing links — one per line<textarea rows={4} name="drawing_links" defaultValue={(survey?.drawing_links ?? []).join("\n")} className={textareaClass} /></label>
            <label className="text-xs font-semibold md:col-span-2">Review note<textarea rows={3} name="review_note" defaultValue={value(survey, "review_note")} className={textareaClass} /></label>
          </div></div>

          <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-end">
            <label className="text-xs font-semibold">Workflow decision<select name="status" defaultValue={survey?.status || "draft"} className="ml-3 min-h-11 border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"><option value="draft">Save draft</option><option value="in_progress">In progress</option><option value="under_review">Submit for review</option><option value="approved">Approve</option><option value="rejected">Reject</option></select></label>
            <button className="min-h-11 border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)]">Commit survey</button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
