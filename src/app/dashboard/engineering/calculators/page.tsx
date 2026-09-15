import Link from "next/link";
import { createClient } from "@/lib/neon/client";

function relation(value: unknown) {
  if (Array.isArray(value)) return value[0] as Record<string, unknown> | undefined;
  return value && typeof value === "object" ? value as Record<string, unknown> : undefined;
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default async function CalculatorsPage() {
  const db = await createClient();
  const { data, error } = await db
    .from("engineering_intakes")
    .select("id,status,system_type,design_objective,created_at,opportunities(id,reference,title),sites(id,name,postcode),load_profiles(id,name,status)")
    .order("created_at", { ascending: false });

  const intakes = data ?? [];

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-5 border-b border-[var(--line)] pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Engineering</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Calculators</h1>
          <p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">Open the governed sizing workspace for an Engineering Intake. Calculator records are always tied to an Opportunity, Site and Load Profile.</p>
        </div>
        <Link href="/dashboard/engineering" className="inline-flex min-h-10 w-fit items-center border border-[var(--line)] px-4 text-xs font-semibold">Engineering workspace</Link>
      </header>

      {error ? <div className="mt-7 border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800">Calculator register could not be loaded: {error.message}</div> : null}

      <section className="mt-7 border border-[var(--line)]">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Governed sizing register</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{intakes.length} engineering {intakes.length === 1 ? "intake" : "intakes"}</p>
        </div>

        {intakes.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead className="border-b border-[var(--line)] bg-[var(--surface-subtle)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                <tr><th className="px-5 py-3">Opportunity</th><th className="px-5 py-3">Site</th><th className="px-5 py-3">System</th><th className="px-5 py-3">Load profile</th><th className="px-5 py-3">Intake status</th><th className="px-5 py-3 text-right">Action</th></tr>
              </thead>
              <tbody>
                {intakes.map((intake) => {
                  const opportunity = relation(intake.opportunities);
                  const site = relation(intake.sites);
                  const load = relation(intake.load_profiles);
                  const ready = intake.status === "ready" && load?.status === "ready";
                  return (
                    <tr key={intake.id} className="border-b border-[var(--line)] align-middle">
                      <td className="px-5 py-4"><p className="font-semibold">{String(opportunity?.reference ?? "Opportunity")}</p><p className="mt-1 text-xs text-[var(--muted)]">{String(opportunity?.title ?? "Engineering intake")}</p></td>
                      <td className="px-5 py-4"><p>{String(site?.name ?? "Site")}</p><p className="mt-1 text-xs text-[var(--muted)]">{String(site?.postcode ?? "")}</p></td>
                      <td className="px-5 py-4"><p className="font-medium">{titleCase(String(intake.system_type))}</p><p className="mt-1 text-xs text-[var(--muted)]">{titleCase(String(intake.design_objective))}</p></td>
                      <td className="px-5 py-4">{load?.id ? <Link href={`/dashboard/engineering/load-profiles/${String(load.id)}`} className="font-semibold text-[var(--accent)]">{String(load.name ?? "Load profile")}</Link> : <span className="text-[var(--muted)]">Not linked</span>}</td>
                      <td className="px-5 py-4"><span className={`text-xs font-semibold ${ready ? "text-emerald-700" : "text-amber-700"}`}>{ready ? "Ready for sizing" : titleCase(String(intake.status))}</span></td>
                      <td className="px-5 py-4 text-right"><Link href={`/dashboard/engineering/calculators/${intake.id}`} className="inline-flex min-h-9 items-center border border-[var(--accent)] px-3 text-xs font-semibold text-[var(--accent)]">Open calculator</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center"><p className="text-sm font-semibold">No Engineering Intakes yet</p><p className="mt-2 text-sm text-[var(--muted)]">Create the engineering basis from an Opportunity before opening a calculator.</p><Link href="/dashboard/opportunities" className="mt-5 inline-flex min-h-10 items-center border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Open Opportunities</Link></div>
        )}
      </section>
    </div>
  );
}
