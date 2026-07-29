import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  let connected = false;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("projects").select("id").limit(1);
    connected = !error;
  } catch {
    connected = false;
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Solar EPC Operations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">HelioCoreOS</h1>
        </div>
        <span className="text-sm text-[var(--muted)]">Foundation / v0.1</span>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 py-20 md:grid-cols-[1.4fr_0.6fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Operational system showcase</p>
          <h2 className="mt-4 max-w-3xl text-5xl font-medium leading-[1.04] tracking-[-0.04em] md:text-7xl">
            One command centre for the complete solar EPC lifecycle.
          </h2>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Commercial, engineering, procurement, installation, quality, commissioning and handover—structured as one connected operating model.
          </p>
        </div>

        <aside className="self-end border border-[var(--line)] p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Supabase status</p>
          <div className="mt-5 flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-600" : "bg-amber-600"}`} />
            <strong>{connected ? "Connected" : "Configuration required"}</strong>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            {connected
              ? "The application can reach the HelioCoreOS project database."
              : "Add the two public Supabase variables and apply the initial migration."}
          </p>
        </aside>
      </section>
    </main>
  );
}
