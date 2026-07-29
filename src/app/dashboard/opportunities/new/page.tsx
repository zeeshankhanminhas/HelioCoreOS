import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createOpportunity } from "../actions";

type SearchParams = Promise<{ error?: string }>;

export default async function NewOpportunityPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: customers }, { data: sites }, { data: profiles }] = await Promise.all([
    supabase.from("customers").select("id,name,display_name").order("name"),
    supabase.from("sites").select("id,customer_id,name,postcode").order("name"),
    supabase.from("profiles").select("id,full_name").eq("status", "active").order("full_name"),
  ]);

  return <div className="mx-auto max-w-[1100px]">
    <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Commercial intake</p><h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Create opportunity</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Capture the enquiry first. Customer and site can be assigned later as the opportunity becomes qualified.</p></div>
      <Link href="/dashboard/opportunities" className="w-fit border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Return to register</Link>
    </header>
    {params.error ? <p className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{params.error}</p> : null}
    <form action={createOpportunity} className="mt-7 space-y-7">
      <section className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">01 · Context</p><h2 className="mt-2 text-2xl font-medium">Opportunity definition</h2></div>
        <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
          <label className="text-xs font-semibold">Opportunity title<input required name="title" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold">Reference<input required name="reference" placeholder="OPP-2026-001" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal uppercase" /></label>
          <label className="text-xs font-semibold">Customer <span className="font-normal text-[var(--muted)]">(optional)</span><select name="customer_id" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"><option value="">Assign later</option>{customers?.map(c => <option key={c.id} value={c.id}>{c.display_name || c.name}</option>)}</select></label>
          <label className="text-xs font-semibold">Site <span className="font-normal text-[var(--muted)]">(optional)</span><select name="site_id" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"><option value="">Assign later</option>{sites?.map(s => <option key={s.id} value={s.id}>{s.name}{s.postcode ? ` · ${s.postcode}` : ""}</option>)}</select></label>
          <label className="text-xs font-semibold">Owner<select name="owner_id" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"><option value="">Unassigned</option>{profiles?.map(p => <option key={p.id} value={p.id}>{p.full_name || "Unnamed user"}</option>)}</select></label>
          <label className="text-xs font-semibold">Lead source<input name="lead_source" placeholder="Referral, website, LinkedIn" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold">Estimated PV (kWp)<input name="estimated_pv_kwp" type="number" min="0" step="0.01" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold">Estimated battery (kWh)<input name="estimated_battery_kwh" type="number" min="0" step="0.01" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold">Estimated value (£)<input name="estimated_value_gbp" type="number" min="0" step="0.01" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold md:col-span-2">Notes<textarea name="notes" rows={4} className="mt-2 w-full border border-[var(--line)] bg-transparent px-3 py-3 text-sm font-normal" /></label>
        </div>
      </section>
      <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-6"><Link href="/dashboard/opportunities" className="inline-flex min-h-11 items-center border border-[var(--line)] px-5 text-xs font-semibold">Cancel</Link><button className="min-h-11 border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)]">Create opportunity</button></div>
    </form>
  </div>;
}