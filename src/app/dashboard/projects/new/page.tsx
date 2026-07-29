import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createProject } from "../actions";

const stages = ["qualification", "survey", "design", "commercial", "procurement", "installation", "commissioning", "handover"];
const risks = ["green", "amber", "red"];

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

type SearchParams = Promise<{ error?: string }>;

export default async function NewProjectPage({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const [{ data: customers }, { data: sites }, { data: profiles }] = await Promise.all([
    supabase.from("customers").select("id, name").order("name"),
    supabase.from("sites").select("id, customer_id, name, postcode").order("name"),
    supabase.from("profiles").select("id, full_name, role").order("full_name"),
  ]);

  const ready = Boolean(customers?.length && sites?.length);

  return (
    <div className="mx-auto max-w-[1100px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Governed intake</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Create EPC project</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Establish the commercial, delivery and accountability context that will drive the full project workspace.</p>
        </div>
        <Link href="/dashboard/projects" className="w-fit border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Return to register</Link>
      </header>

      {error ? <div className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

      {!ready ? (
        <section className="mt-7 border border-[var(--line)] p-7">
          <p className="text-sm font-semibold">Customer and site context required</p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Create at least one customer and one associated site before opening a project. This prevents orphaned delivery records.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/dashboard/customers" className="border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Open customers</Link>
            <Link href="/dashboard/sites" className="border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Open sites</Link>
          </div>
        </section>
      ) : (
        <form action={createProject} className="mt-7 space-y-7">
          <section className="border border-[var(--line)]">
            <div className="border-b border-[var(--line)] p-5 md:px-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">01 · Identity</p>
              <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Project definition</h2>
            </div>
            <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
              <label className="text-xs font-semibold">Project name<input required name="name" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal outline-none focus:border-[var(--foreground)]" /></label>
              <label className="text-xs font-semibold">Project reference<input required name="reference" placeholder="HC-2026-001" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal uppercase outline-none focus:border-[var(--foreground)]" /></label>
              <label className="text-xs font-semibold">Customer<select required name="customer_id" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"><option value="">Select customer</option>{customers!.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label className="text-xs font-semibold">Site<select required name="site_id" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"><option value="">Select site</option>{sites!.map((item) => <option key={item.id} value={item.id}>{item.name}{item.postcode ? ` · ${item.postcode}` : ""}</option>)}</select></label>
              <label className="text-xs font-semibold">Project type<input name="project_type" placeholder="Rooftop PV, ground mount, PV + BESS" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal outline-none focus:border-[var(--foreground)]" /></label>
              <label className="text-xs font-semibold">Project owner<select name="project_owner_id" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"><option value="">Unassigned</option>{(profiles ?? []).map((item) => <option key={item.id} value={item.id}>{item.full_name || "Unnamed profile"} · {titleCase(item.role)}</option>)}</select></label>
            </div>
          </section>

          <section className="border border-[var(--line)]">
            <div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">02 · Control</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Lifecycle and risk</h2></div>
            <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
              <label className="text-xs font-semibold">Current stage<select name="status" defaultValue="qualification" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">{stages.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
              <label className="text-xs font-semibold">Risk status<select name="risk_status" defaultValue="green" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">{risks.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</select></label>
              <label className="text-xs font-semibold">PV capacity (kWp)<input name="pv_capacity_kwp" type="number" min="0" step="0.01" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
              <label className="text-xs font-semibold">BESS capacity (kWh)<input name="battery_capacity_kwh" type="number" min="0" step="0.01" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
              <label className="text-xs font-semibold">Contract value (£)<input name="contract_value_gbp" type="number" min="0" step="0.01" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
              <label className="text-xs font-semibold">Target completion<input name="target_completion_date" type="date" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
              <label className="text-xs font-semibold md:col-span-2">Executive notes<textarea name="notes" rows={5} className="mt-2 w-full border border-[var(--line)] bg-transparent px-3 py-3 text-sm font-normal outline-none focus:border-[var(--foreground)]" /></label>
            </div>
          </section>

          <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-6">
            <Link href="/dashboard/projects" className="inline-flex min-h-11 items-center border border-[var(--line)] px-5 text-xs font-semibold">Cancel</Link>
            <button className="min-h-11 border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white">Create governed project</button>
          </div>
        </form>
      )}
    </div>
  );
}
