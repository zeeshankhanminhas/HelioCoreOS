import Link from "next/link";
import { notFound } from "next/navigation";
import { RecordHeader, RecordWorkspace, RecordWorkspaceSection } from "@/components/heliocore/record-workspace";
import { createClient } from "@/lib/supabase/server";
import type { OpportunityCoreInput } from "@/lib/schemas/opportunity";
import { updateOpportunity } from "../actions";
import { OpportunityCoreForm } from "./opportunity-core-form";
import { ProposalGovernance } from "./proposal-governance";
import { ReadinessGovernance } from "./readiness-governance";
import { RelationshipAssignment } from "./relationship-assignment";
import { SiteSurveyGovernance } from "./site-survey-governance";
import { WorkflowProof } from "./workflow-proof";

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

  const [opportunityResult, readinessResult, proposalResult, surveyResult, engineeringResult, customersResult, sitesResult, profilesResult] = await Promise.all([
    supabase.from("opportunities").select("id,title,reference,stage,lead_source,customer_id,site_id,owner_id,estimated_pv_kwp,estimated_battery_kwh,estimated_value_gbp,notes,customers(name,display_name),sites(name,postcode),profiles(full_name)").eq("id", id).single(),
    supabase.from("opportunity_readiness_items").select("id,item_type,status,evidence_url,review_note,decision_note,is_required,reviewed_by,reviewed_at,updated_at").eq("opportunity_id", id).order("item_type"),
    supabase.from("indicative_proposals").select("*").eq("opportunity_id", id).maybeSingle(),
    supabase.from("site_surveys").select("*").eq("opportunity_id", id).maybeSingle(),
    supabase.from("engineering_intakes").select("id,load_profile_id,system_type,status,created_at").eq("opportunity_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("customers").select("id,name,display_name").order("name"),
    supabase.from("sites").select("id,customer_id,name,postcode").order("name"),
    supabase.from("profiles").select("id,full_name").eq("status", "active").order("full_name"),
  ]);

  if (!opportunityResult.data) notFound();
  const opportunity = opportunityResult.data;
  const readiness = readinessResult.data ?? [];
  const proposal = proposalResult.data;
  const survey = surveyResult.data;
  const engineering = engineeringResult.data;
  const customer = firstRelation(opportunity.customers);
  const site = firstRelation(opportunity.sites);
  const owner = firstRelation(opportunity.profiles);
  const requiredReadiness = readiness.filter((item) => item.is_required);
  const acceptedRequired = requiredReadiness.filter((item) => item.status === "accepted" || item.status === "waived").length;
  const readinessScore = requiredReadiness.length ? Math.round((acceptedRequired / requiredReadiness.length) * 100) : 100;
  const reviewerNames = Object.fromEntries((profilesResult.data ?? []).map((profile) => [profile.id, profile.full_name || "Unnamed user"]));
  const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
  const loadFailure = readinessResult.error || proposalResult.error || surveyResult.error || engineeringResult.error || customersResult.error || sitesResult.error || profilesResult.error;

  const engineeringStage = !engineering ? "Not started" : engineering.status === "ready" ? "Calculator" : "Load Profile";
  const engineeringHref = !engineering
    ? `/dashboard/engineering?opportunity=${id}`
    : engineering.status === "ready"
      ? `/dashboard/engineering/calculators/${engineering.id}`
      : engineering.load_profile_id
        ? `/dashboard/engineering/load-profiles/${engineering.load_profile_id}`
        : `/dashboard/engineering?opportunity=${id}`;

  const coreInitialValues: OpportunityCoreInput = {
    title: opportunity.title,
    reference: opportunity.reference,
    stage: opportunity.stage as OpportunityCoreInput["stage"],
    owner_id: opportunity.owner_id ?? "",
    lead_source: opportunity.lead_source ?? "",
    estimated_pv_kwp: opportunity.estimated_pv_kwp == null ? "" : String(opportunity.estimated_pv_kwp),
    estimated_battery_kwh: opportunity.estimated_battery_kwh == null ? "" : String(opportunity.estimated_battery_kwh),
    estimated_value_gbp: opportunity.estimated_value_gbp == null ? "" : String(opportunity.estimated_value_gbp),
    notes: opportunity.notes ?? "",
  };

  const missingRelationship = [!opportunity.customer_id ? "Customer" : null, !opportunity.site_id ? "Site" : null].filter(Boolean).join(" + ");

  return (
    <RecordWorkspace>
      <RecordHeader
        eyebrow="Opportunity"
        title={opportunity.title}
        meta={<>{opportunity.reference} · {customer?.display_name || customer?.name || "Customer unassigned"} · {site?.name || "Site unassigned"}</>}
        actions={<Link href="/dashboard/opportunities" className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Opportunities</Link>}
      />

      {query.error ? <p className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{query.error}</p> : null}
      {query.created ? <p className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Opportunity created.</p> : null}
      {query.updated ? <p className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Changes saved.</p> : null}
      {loadFailure ? <p className="mt-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Some related data could not be loaded.</p> : null}
      {missingRelationship ? <p className="mt-6 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"><span className="font-semibold">Blocked:</span> {missingRelationship} required before Engineering and Proposal.</p> : null}

      <section className="mt-7 grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-6">
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Stage</p><p className="mt-2 text-2xl font-medium">{titleCase(opportunity.stage)}</p></div>
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Readiness</p><p className="mt-2 text-2xl font-medium">{readinessScore}%</p></div>
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Site survey</p><p className="mt-2 text-lg font-medium">{titleCase(survey?.status ?? "not started")}</p></div>
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Engineering</p><p className="mt-2 text-lg font-medium">{engineeringStage}</p><p className="mt-1 text-xs text-[var(--muted)]">{engineering?.system_type ? titleCase(engineering.system_type) : "No intake"}</p></div>
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Value</p><p className="mt-2 text-2xl font-medium">{opportunity.estimated_value_gbp == null ? "Not estimated" : money.format(Number(opportunity.estimated_value_gbp))}</p></div>
        <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Owner</p><p className="mt-2 text-sm font-semibold">{owner?.full_name ?? "Unassigned"}</p></div>
      </section>

      <WorkflowProof customerAssigned={Boolean(opportunity.customer_id)} siteAssigned={Boolean(opportunity.site_id)} requiredReadinessTotal={requiredReadiness.length} requiredReadinessComplete={acceptedRequired} proposalStatus={proposal?.status ?? null} opportunityStage={opportunity.stage} />

      <RecordWorkspaceSection eyebrow="Account" title="Customer & Site">
        <RelationshipAssignment opportunityId={id} initialCustomerId={opportunity.customer_id} initialSiteId={opportunity.site_id} customers={customersResult.data ?? []} sites={sitesResult.data ?? []} />
      </RecordWorkspaceSection>

      <RecordWorkspaceSection eyebrow="Commercial" title="Opportunity details">
        <OpportunityCoreForm opportunityId={id} customerId={opportunity.customer_id} siteId={opportunity.site_id} owners={profilesResult.data ?? []} initialValues={coreInitialValues} action={updateOpportunity} />
      </RecordWorkspaceSection>

      <ReadinessGovernance opportunityId={id} items={readiness} reviewerNames={reviewerNames} />
      <SiteSurveyGovernance opportunityId={id} siteId={opportunity.site_id} opportunityReference={opportunity.reference} survey={survey} />

      <RecordWorkspaceSection
        eyebrow="Engineering"
        title="Engineering"
        action={<Link href={engineeringHref} className="inline-flex min-h-11 items-center justify-center border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)]">{!engineering ? "Start engineering" : engineering.status === "ready" ? "Open calculator" : "Continue load profile"}</Link>}
      >
        <div className="grid gap-px bg-[var(--line)] sm:grid-cols-3">
          <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Stage</p><p className="mt-2 text-lg font-semibold">{engineeringStage}</p></div>
          <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">System type</p><p className="mt-2 text-lg font-semibold">{engineering?.system_type ? titleCase(engineering.system_type) : "Not selected"}</p></div>
          <div className="bg-[var(--background)] p-5"><p className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted)]">Project</p><p className="mt-2 text-lg font-semibold text-[var(--muted)]">Contract required</p></div>
        </div>
      </RecordWorkspaceSection>

      <ProposalGovernance opportunityId={id} opportunityReference={opportunity.reference} customerAssigned={Boolean(opportunity.customer_id)} siteAssigned={Boolean(opportunity.site_id)} readinessTotal={requiredReadiness.length} readinessComplete={acceptedRequired} proposal={proposal} estimatedPv={opportunity.estimated_pv_kwp} estimatedBattery={opportunity.estimated_battery_kwh} estimatedValue={opportunity.estimated_value_gbp} />
    </RecordWorkspace>
  );
}
