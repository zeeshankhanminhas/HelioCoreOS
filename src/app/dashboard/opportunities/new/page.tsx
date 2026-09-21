"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/neon/client";
import { createOpportunityFromForm } from "@/lib/neon/opportunities";

type Customer = { id: string; name: string; display_name: string | null };
type Site = { id: string; customer_id: string; name: string; postcode: string | null };
type Profile = { id: string; full_name: string | null };

export default function NewOpportunityPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const client = createClient();
      const [customerResult, siteResult, profileResult] = await Promise.all([
        client.from("customers").select("id,name,display_name").order("name"),
        client.from("sites").select("id,customer_id,name,postcode").order("name"),
        client.from("profiles").select("id,full_name").eq("status", "active").order("full_name"),
      ]);
      if (cancelled) return;
      const firstError = customerResult.error ?? siteResult.error ?? profileResult.error;
      if (firstError) {
        setError(firstError.message || "Commercial context could not be loaded.");
        return;
      }
      setCustomers((customerResult.data ?? []) as Customer[]);
      setSites((siteResult.data ?? []) as Site[]);
      setProfiles((profileResult.data ?? []) as Profile[]);
    }
    void load().catch((loadError: unknown) => {
      if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Commercial context could not be loaded.");
    });
    return () => { cancelled = true; };
  }, []);

  async function submit(formData: FormData) {
    try {
      setSaving(true);
      setError(null);
      const reference = String(formData.get("reference") ?? "").trim().toUpperCase();
      const title = String(formData.get("title") ?? "").trim();
      if (!title || !/^[A-Z0-9][A-Z0-9._/-]{2,39}$/.test(reference)) {
        throw new Error("Enter a title and a valid 3–40 character opportunity reference.");
      }
      const toNumber = (key: string) => {
        const value = String(formData.get(key) ?? "").trim();
        if (!value) return null;
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) throw new Error("Estimated values must be valid non-negative numbers.");
        return parsed;
      };

      const opportunityId = await createOpportunityFromForm({
        title,
        reference,
        customerId: String(formData.get("customer_id") ?? "") || null,
        siteId: String(formData.get("site_id") ?? "") || null,
        ownerId: String(formData.get("owner_id") ?? "") || null,
        leadSource: String(formData.get("lead_source") ?? "").trim() || null,
        estimatedPv: toNumber("estimated_pv_kwp"),
        estimatedBattery: toNumber("estimated_battery_kwh"),
        estimatedValue: toNumber("estimated_value_gbp"),
        notes: String(formData.get("notes") ?? "").trim() || null,
      });

      router.push(`/dashboard/opportunities/${opportunityId}/engineering-readiness`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Opportunity could not be created.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="mx-auto max-w-[1100px]">
    <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Commercial intake</p><h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Create opportunity</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Create the governed commercial record through Neon Data API, then complete the engineering-readiness gate.</p></div>
      <Link href="/dashboard/opportunities" className="w-fit border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Return to register</Link>
    </header>
    {error ? <p className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
    <form action={submit} className="mt-7 space-y-7">
      <section className="border border-[var(--line)]"><div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">01 · Context</p><h2 className="mt-2 text-2xl font-medium">Opportunity definition</h2></div>
        <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
          <label className="text-xs font-semibold">Opportunity title<input required name="title" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold">Reference<input required name="reference" placeholder="OPP-2026-001" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal uppercase" /></label>
          <label className="text-xs font-semibold">Customer <span className="font-normal text-[var(--muted)]">(optional at lead stage)</span><select name="customer_id" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"><option value="">Assign later</option>{customers.map(c => <option key={c.id} value={c.id}>{c.display_name || c.name}</option>)}</select></label>
          <label className="text-xs font-semibold">Site <span className="font-normal text-[var(--muted)]">(required before engineering)</span><select name="site_id" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"><option value="">Assign later</option>{sites.map(s => <option key={s.id} value={s.id}>{s.name}{s.postcode ? ` · ${s.postcode}` : ""}</option>)}</select></label>
          <label className="text-xs font-semibold">Owner<select name="owner_id" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"><option value="">Unassigned</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || "Unnamed user"}</option>)}</select></label>
          <label className="text-xs font-semibold">Lead source<input name="lead_source" placeholder="Referral, website, LinkedIn" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold">Estimated PV (kWp)<input name="estimated_pv_kwp" type="number" min="0" step="0.01" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold">Estimated battery (kWh)<input name="estimated_battery_kwh" type="number" min="0" step="0.01" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold">Estimated value<input name="estimated_value_gbp" type="number" min="0" step="0.01" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold md:col-span-2">Notes<textarea name="notes" rows={4} className="mt-2 w-full border border-[var(--line)] bg-transparent px-3 py-3 text-sm font-normal" /></label>
        </div>
      </section>
      <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-6"><Link href="/dashboard/opportunities" className="inline-flex min-h-11 items-center border border-[var(--line)] px-5 text-xs font-semibold">Cancel</Link><button disabled={saving} className="min-h-11 border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)] disabled:opacity-50">{saving ? "Creating…" : "Create & open readiness"}</button></div>
    </form>
  </div>;
}
