import { createClient } from "@/lib/supabase/server";

function titleCase(value: string | null) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()) : "Not set";
}

type Profile = {
  id: string;
  full_name: string | null;
  job_title: string | null;
  role: string | null;
  status: string | null;
  team_id: string | null;
};

type Team = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: organisation }, { data: teams }, { data: profiles }] = await Promise.all([
    user ? supabase.from("profiles").select("organisation_id, role").eq("id", user.id).single() : Promise.resolve({ data: null }),
    supabase.from("organisations").select("name, subscription_plan, subscription_status, user_limit, billing_currency").single(),
    supabase.from("teams").select("id, name, description, is_active").order("name"),
    supabase.from("profiles").select("id, full_name, job_title, role, status, team_id").order("full_name"),
  ]);

  const teamRows = (teams ?? []) as Team[];
  const people = (profiles ?? []) as Profile[];
  const activeUsers = people.filter((person) => person.status === "active").length;
  const seatsRemaining = Math.max(Number(organisation?.user_limit ?? 0) - activeUsers, 0);
  const canManage = profile?.role === "owner" || profile?.role === "admin";
  const teamMap = new Map(teamRows.map((team) => [team.id, team.name]));

  return (
    <div className="mx-auto max-w-[1500px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Platform control</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Team and access</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Keep organisation membership, accountability and subscription seats visible without introducing a complex permission builder at launch.
          </p>
        </div>
        <span className="inline-flex min-h-10 w-fit items-center border border-[var(--line)] px-4 text-xs font-semibold">
          {canManage ? "Administration enabled" : "Read-only access"}
        </span>
      </header>

      <section className="mt-7 grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-[var(--background)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Organisation</p>
          <p className="mt-3 text-xl font-medium">{organisation?.name ?? "Workspace"}</p>
        </div>
        <div className="bg-[var(--background)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Subscription</p>
          <p className="mt-3 text-xl font-medium">{titleCase(organisation?.subscription_plan ?? null)}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">{titleCase(organisation?.subscription_status ?? null)} · {organisation?.billing_currency ?? "PKR"}</p>
        </div>
        <div className="bg-[var(--background)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Active users</p>
          <p className="mt-3 text-3xl font-medium">{activeUsers}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">of {organisation?.user_limit ?? 0} seats</p>
        </div>
        <div className="bg-[var(--background)] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Seats remaining</p>
          <p className="mt-3 text-3xl font-medium">{seatsRemaining}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Manual billing control for launch</p>
        </div>
      </section>

      <div className="mt-7 grid gap-7 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="border border-[var(--line)]">
          <div className="border-b border-[var(--line)] p-5 md:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Delivery structure</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">{teamRows.length} teams</h2>
          </div>
          {teamRows.length ? (
            <div className="divide-y divide-[var(--line)]">
              {teamRows.map((team) => {
                const memberCount = people.filter((person) => person.team_id === team.id).length;
                return (
                  <div key={team.id} className="p-5 md:px-6">
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <p className="text-sm font-semibold">{team.name}</p>
                        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{team.description || "No description provided."}</p>
                      </div>
                      <span className="shrink-0 text-xs font-medium">{memberCount} members</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm font-semibold">No teams configured</p>
              <p className="mt-3 text-sm text-[var(--muted)]">Launch can begin with one shared team and expand only when ownership becomes unclear.</p>
            </div>
          )}
        </section>

        <section className="border border-[var(--line)]">
          <div className="border-b border-[var(--line)] p-5 md:px-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Organisation users</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Access register</h2>
          </div>
          {people.length ? (
            <div className="divide-y divide-[var(--line)]">
              {people.map((person) => (
                <div key={person.id} className="grid gap-3 p-5 md:grid-cols-[1.2fr_1fr_0.8fr_0.7fr] md:items-center md:px-6">
                  <div>
                    <p className="text-sm font-semibold">{person.full_name || "Unnamed user"}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{person.job_title || "Job title not set"}</p>
                  </div>
                  <p className="text-xs text-[var(--muted)]">{person.team_id ? teamMap.get(person.team_id) || "Unknown team" : "Unassigned"}</p>
                  <p className="text-xs font-medium">{titleCase(person.role)}</p>
                  <p className="text-xs md:text-right">{titleCase(person.status)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-8 text-center text-sm text-[var(--muted)]">No organisation users are available.</p>
          )}
        </section>
      </div>

      <section className="mt-7 border border-[var(--line)] p-5 md:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Launch boundary</p>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-[var(--muted)]">
          HelioCoreOS launches with Owner, Admin, Manager and Member roles. Custom roles, granular permission matrices, automated payments and multi-office hierarchy remain outside the first release.
        </p>
      </section>
    </div>
  );
}
