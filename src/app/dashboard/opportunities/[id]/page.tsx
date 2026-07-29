import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateOpportunity } from "../actions";
import { ProposalGovernance } from "./proposal-governance";
import { ReadinessGovernance } from "./readiness-governance";
import { RelationshipAssignment } from "./relationship-assignment";

const opportunityStages = ["lead", "qualified", "readiness", "proposal", "won", "lost"];

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

type SearchParams = Promise<{ error?: string; updated?: string; created?: string }>;

export default async function OpportunityPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: SearchParams }) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const [opportunityResult, readinessResult, proposalResult, customersResult, sitesResult, profilesResult] = await Promise.all([
    supabase.from("opportunities").select("id,title,reference,stage,lead_source,customer_id,site_id,owner_id,estimated_pv_kwp,estimated_battery_kwh,estimated_value_gbp,notes,customers(name,display_name),sites(name,postcode),profiles(full_name)").eq("id", id).single(),
    supabase.from("opportunity_readiness_items").select("id,item_type,status,evidence_url,review_note,decision_note,is_required,reviewed_by,reviewed_at,updated_at").eq("opportunity_id", id).order("item_type"),
    supabase.from("indicative_proposals").select("*").eq("opportunity_id", id).maybeSingle(),
    supabase.from("customers").select("id,name,display_name").order("name"),
    supabase.from("sites").select("id,customer_id,name,postcode").order("name"),
    supabase.from("profiles").select("id,full_name").eq("status", "active").order("full_name"),
  ]);

  if (!opportunityResult.data) notFound();
  const opportunity = opportunityResult.data;
  const readiness = readinessResult.data ?? [];
  const proposal = proposalResult.data;
  const customer = firstRelation(opportunity.customers);
  const site = firstRelation(opportunity.sites);
  const owner = firstRelation(opportunity.profiles);
  const requiredReadiness = readiness.filter((item) => item.is_required);
  const acceptedRequired = requiredReadiness.filter((item) => item.status === "accepted" || item.status === "waived").length;
  const readinessScore = requiredReadiness.length ? Math.round((acceptedRequired / requiredReadiness.length) * 100) : 100;
  const reviewerNames = Object.fromEntries((profilesResult.data ?? []).map((profile) => [profile.id, profile.full_name || "Unnamed user"]));
  const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
  const loadFailure = readinessResult.error || proposalResult.error || customersResult.error || sitesResult.error || profilesResult.error;

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Opportunity command view</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">{opportunity.title}</h1>
          <p className="mt-4 text-sm text-[var(--muted)]">{opportunity.reference} · {customer?.display_name || customer?.name || "Customer unassigned"} · {site?.name || "Site unassigned"}</p>
        </div>
        <Link href="/dashboard/opportunities" className="w-fit border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Return to register</Link>
      </header>

      {query.error ? <p className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{query.error}</p> : null}
      {query.created ? <p className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Opportunity created with its readiness checklist and audit record.</p> : null}
      {query.updated ? <p className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Workflow updated successfully.</p> : null}
      {loadFailure ? <p className="mt-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Some related workflow data could not be loaded. Do not make decisions from incomplete information; refresh before continuing.</p> : null}
      {!opportunity.customer_id || !opportunity.site_id ? <p className="mt-6 border border-[var(--line)] px-4 py-3 text-sm"><span className="font-semibold">Progressive intake:</span> {!opportunity.customer_id ? "Customer" : "Site"}{!opportunity.customer_id && !opportunity.site_id ? " and site are" : " is"} still unassigned. This is permitted at lead stage but must be resolved before governed proposal issue.</p> : null}

      <section className="mt-7 grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Stage</p><p className="mt-2 text-2xl font-medium">{titleCase(opportunity.stage)}</p></div>
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Required readiness</p><p className="mt-2 text-2xl font-medium">{readinessScore}%</p></div>
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Estimated value</p><p className="mt-2 text-2xl font-medium">{opportunity.estimated_value_gbp == null ? "Not estimated" : money.format(Number(opportunity.estimated_value_gbp))}</p></div>
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Owner</p><p className="mt-2 text-sm font-semibold">{owner?.full_name ?? "Unassigned"}</p></div>
      </section>

      <section className="mt-7 border border-[var(--line)]">
        <div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Relationship control</p><h2 className="mt-2 text-2xl font-medium">Customer and Site assignment</h2><p className="mt-2 text-sm text-[var(--muted)]">Assign governed records after intake. Site choices are filtered by Customer and conflicts are blocked server-side.</p></div>
        <RelationshipAssignment opportunityId={id} initialCustomerId={opportunity.customer_id} initialSiteId={opportunity.site_id} customers={customersResult.data ?? []} sites={sitesResult.data ?? []} />
      </section>

      <section className="mt-7 border border-[var(--line)]">
        <div className="border-b border-[var(--line)] p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Opportunity control</p><h2 className="mt-2 text-2xl font-medium">Core record</h2><p className="mt-2 text-sm text-[var(--muted)]">Update commercial context and move the lifecycle deliberately.</p></div>
        <form action={updateOpportunity} className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
          <input type="hidden" name="opportunity_id" value={id} />
          <input type="hidden" name="customer_id" value={opportunity.customer_id ?? ""} />
          <input type="hidden" name="site_id" value={opportunity.site_id ?? ""} />
          <label className="text-xs font-semibold">Opportunity title<input required maxLength={160} name="title" defaultValue={opportunity.title} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold">Reference<input required maxLength={40} name="reference" defaultValue={opportunity.reference} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal uppercase" /></label>
          <label className="text-xs font-semibold">Stage<select name="stage" defaultValue={opportunity.stage} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal">{opportunityStages.map((stage) => <option key={stage} value={stage}>{titleCase(stage)}</option>)}</select></label>
          <label className="text-xs font-semibold">Owner<select name="owner_id" defaultValue={opportunity.owner_id ?? ""} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"><option value="">Unassigned</option>{profilesResult.data?.map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name || "Unnamed user"}</option>)}</select></label>
          <label className="text-xs font-semibold">Lead source<input name="lead_source" defaultValue={opportunity.lead_source ?? ""} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold">Estimated PV (kWp)<input name="estimated_pv_kwp" type="number" min="0" step="0.01" defaultValue={opportunity.estimated_pv_kwp ?? ""} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold">Estimated battery (kWh)<input name="estimated_battery_kwh" type="number" min="0" step="0.01" defaultValue={opportunity.estimated_battery_kwh ?? ""} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold">Estimated value (£)<input name="estimated_value_gbp" type="number" min="0" step="0.01" defaultValue={opportunity.estimated_value_gbp ?? ""} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm font-normal" /></label>
          <label className="text-xs font-semibold md:col-span-2">Notes<textarea name="notes" rows={4} defaultValue={opportunity.notes ?? ""} className="mt-2 w-full border border-[var(--line)] bg-transparent px-3 py-3 text-sm font-normal" /></label>
          <div className="flex justify-end md:col-span-2"><button className="min-h-11 border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)]">Save opportunity</button></div>
        </form>
      </section>

      <ReadinessGovernance opportunityId={id} items={readiness} reviewerNames={reviewerNames} />

      <ProposalGovernance
        opportunityId={id}
        opportunityReference={opportunity.reference}
        customerAssigned={Boolean(opportunity.customer_id)}
        siteAssigned={Boolean(opportunity.site_id)}
        readinessTotal={requiredReadiness.length}
        readinessComplete={acceptedRequired}
        proposal={proposal}
        estimatedPv={opportunity.estimated_pv_kwp}
        estimatedBattery={opportunity.estimated_battery_kwh}
        estimatedValue={opportunity.estimated_value_gbp}
      />
    </div>
  );
}