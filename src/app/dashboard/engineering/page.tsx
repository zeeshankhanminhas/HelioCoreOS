import { createClient } from "@/lib/supabase/server";
import { systemTypeLabels } from "@/lib/engineering/design-rules";
import type { SystemType } from "@/lib/engineering/types";
import { DesignIntake } from "./_components/design-intake";

type Props = {
  searchParams: Promise<{ error?: string; created?: string }>;
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export default async function EngineeringPage({ searchParams }: Props) {
  const messages = await searchParams;
  const supabase = await createClient();

  const [{ data: opportunities }, { data: sites }, { data: recentIntakes }] = await Promise.all([
    supabase
      .from("opportunities")
      .select("id,reference,title,site_id,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("sites").select("id,name,postcode"),
    supabase
      .from("engineering_intakes")
      .select("id,opportunity_id,system_type,design_objective,status,created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const siteMap = new Map((sites ?? []).map((site) => [site.id, site]));
  const opportunityMap = new Map((opportunities ?? []).map((opportunity) => [opportunity.id, opportunity]));
  const opportunityOptions = (opportunities ?? [])
    .filter((opportunity) => Boolean(opportunity.site_id))
    .map((opportunity) => {
      const site = opportunity.site_id ? siteMap.get(opportunity.site_id) : null;
      return {
        id: opportunity.id,
        reference: opportunity.reference,
        title: opportunity.title,
        siteLabel: site ? `${site.name}${site.postcode ? ` · ${site.postcode}` : ""}` : "Assigned site",
      };
    });

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="border-b border-[var(--line)] pb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Engineering core · V1</p>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-medium tracking-[-0.045em] md:text-5xl">System design intake</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--muted)]">One shared engineering foundation for On-grid, Off-grid and Hybrid systems. Load profile is mandatory across all three, while system-specific rules branch after the common intake.</p>
          </div>
          <div className="border border-[var(--line)] px-4 py-3 text-xs leading-5 text-[var(--muted)]">
            <span className="font-semibold text-[var(--foreground)]">Build focus:</span> intake → load model → equipment → calculations → validation → BOM
          </div>
        </div>
      </header>

      {messages.error ? <div className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{messages.error}</div> : null}
      {messages.created ? <div className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Engineering intake and linked load-profile draft created successfully.</div> : null}

      <div className="mt-7">
        <DesignIntake opportunities={opportunityOptions} />
      </div>

      <section className="mt-7 border border-[var(--line)]">
        <div className="flex items-end justify-between gap-4 border-b border-[var(--line)] p-5 md:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Engineering register</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Recent design intakes</h2>
          </div>
          <span className="text-xs tabular-nums text-[var(--muted)]">{recentIntakes?.length ?? 0} recent</span>
        </div>
        {recentIntakes?.length ? (
          <div className="divide-y divide-[var(--line)]">
            {recentIntakes.map((intake) => {
              const opportunity = opportunityMap.get(intake.opportunity_id);
              return (
                <article key={intake.id} className="grid gap-3 p-5 md:grid-cols-[minmax(0,1.5fr)_140px_minmax(0,1fr)_100px_120px] md:items-center md:px-6">
                  <div>
                    <p className="text-sm font-semibold">{opportunity?.reference ?? "Engineering intake"}</p>
                    <p className="mt-1 truncate text-xs text-[var(--muted)]">{opportunity?.title ?? intake.id}</p>
                  </div>
                  <p className="text-xs font-semibold">{systemTypeLabels[intake.system_type as SystemType] ?? titleCase(intake.system_type)}</p>
                  <p className="text-xs text-[var(--muted)]">{titleCase(intake.design_objective)}</p>
                  <p className="text-xs text-[var(--muted)]">{titleCase(intake.status)}</p>
                  <p className="text-xs tabular-nums text-[var(--muted)] md:text-right">{date.format(new Date(intake.created_at))}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-12 text-sm text-[var(--muted)]">No engineering intakes have been created yet. The first saved intake will appear here.</div>
        )}
      </section>
    </div>
  );
}
