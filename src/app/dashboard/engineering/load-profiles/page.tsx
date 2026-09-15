import Link from "next/link";
import { createClient } from "@/lib/neon/client";

function relation(value: unknown) {
  if (Array.isArray(value)) return value[0] as Record<string, unknown> | undefined;
  return value && typeof value === "object" ? value as Record<string, unknown> : undefined;
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function number(value: unknown, suffix: string) {
  if (value == null || value === "") return "—";
  return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(Number(value))} ${suffix}`;
}

export default async function LoadProfilesPage() {
  const db = await createClient();
  const { data, error } = await db
    .from("load_profiles")
    .select("id,name,source,status,data_quality,annual_energy_kwh,peak_demand_kw,created_at,opportunities(id,reference,title),sites(id,name,postcode),engineering_intakes(id,status,system_type)")
    .order("created_at", { ascending: false });

  const profiles = data ?? [];

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-5 border-b border-[var(--line)] pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Engineering inputs</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Load profiles</h1>
          <p className="mt-3 max-w-3xl text-sm text-[var(--muted)]">Demand models that feed the governed calculator. Each profile stays connected to its Opportunity, Site and Engineering Intake.</p>
        </div>
        <Link href="/dashboard/engineering" className="inline-flex min-h-10 w-fit items-center border border-[var(--line)] px-4 text-xs font-semibold">Engineering workspace</Link>
      </header>

      {error ? <div className="mt-7 border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-800">Load Profile register could not be loaded: {error.message}</div> : null}

      <section className="mt-7 border border-[var(--line)]">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Demand model register</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{profiles.length} load {profiles.length === 1 ? "profile" : "profiles"}</p>
        </div>

        {profiles.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
              <thead className="border-b border-[var(--line)] bg-[var(--surface-subtle)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">
                <tr><th className="px-5 py-3">Load profile</th><th className="px-5 py-3">Opportunity / Site</th><th className="px-5 py-3">Source</th><th className="px-5 py-3">Demand</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Next action</th></tr>
              </thead>
              <tbody>
                {profiles.map((profile) => {
                  const opportunity = relation(profile.opportunities);
                  const site = relation(profile.sites);
                  const intake = relation(profile.engineering_intakes);
                  const calculatorHref = intake?.id ? `/dashboard/engineering/calculators/${String(intake.id)}` : null;
                  return (
                    <tr key={profile.id} className="border-b border-[var(--line)] align-middle">
                      <td className="px-5 py-4"><Link href={`/dashboard/engineering/load-profiles/${profile.id}`} className="font-semibold text-[var(--foreground)] hover:text-[var(--accent)]">{profile.name}</Link><p className="mt-1 text-xs text-[var(--muted)]">{titleCase(String(profile.data_quality))}</p></td>
                      <td className="px-5 py-4"><p className="font-medium">{String(opportunity?.reference ?? "Opportunity")}</p><p className="mt-1 text-xs text-[var(--muted)]">{String(site?.name ?? "Site")}{site?.postcode ? ` · ${String(site.postcode)}` : ""}</p></td>
                      <td className="px-5 py-4">{titleCase(String(profile.source))}</td>
                      <td className="px-5 py-4"><p className="tabular-nums">{number(profile.annual_energy_kwh, "kWh/year")}</p><p className="mt-1 text-xs tabular-nums text-[var(--muted)]">Peak {number(profile.peak_demand_kw, "kW")}</p></td>
                      <td className="px-5 py-4"><span className={`text-xs font-semibold ${profile.status === "ready" ? "text-emerald-700" : "text-amber-700"}`}>{titleCase(String(profile.status))}</span>{intake?.system_type ? <p className="mt-1 text-xs text-[var(--muted)]">{titleCase(String(intake.system_type))}</p> : null}</td>
                      <td className="px-5 py-4 text-right"><div className="flex justify-end gap-2"><Link href={`/dashboard/engineering/load-profiles/${profile.id}`} className="inline-flex min-h-9 items-center border border-[var(--line)] px-3 text-xs font-semibold">Open profile</Link>{calculatorHref ? <Link href={calculatorHref} className={`inline-flex min-h-9 items-center border px-3 text-xs font-semibold ${profile.status === "ready" ? "border-[var(--accent)] text-[var(--accent)]" : "pointer-events-none border-[var(--line)] text-[var(--muted)]"}`}>Calculator</Link> : null}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center"><p className="text-sm font-semibold">No Load Profiles yet</p><p className="mt-2 text-sm text-[var(--muted)]">Start engineering from an Opportunity and Site to create the governed demand model.</p><Link href="/dashboard/opportunities" className="mt-5 inline-flex min-h-10 items-center border border-[var(--accent)] px-4 text-xs font-semibold text-[var(--accent)]">Open Opportunities</Link></div>
        )}
      </section>
    </div>
  );
}
