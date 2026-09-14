import Link from "next/link";
import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: session } = await auth.getSession();
  const authenticated = Boolean(session?.user);

  return (
    <main className="min-h-screen px-6 py-10 md:px-12">
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Solar EPC Operations</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">HelioCoreOS</h1>
        </div>
        <Link
          href={authenticated ? "/dashboard" : "/login"}
          className="border border-[var(--foreground)] px-4 py-2 text-sm font-semibold transition hover:bg-[var(--foreground)] hover:text-white"
        >
          {authenticated ? "Open dashboard" : "Secure access"}
        </Link>
      </header>

      <section className="mx-auto grid max-w-5xl gap-10 py-20 md:grid-cols-[1.4fr_0.6fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">Operational system showcase</p>
          <h2 className="mt-4 max-w-3xl text-5xl font-medium leading-[1.04] tracking-[-0.04em] md:text-7xl">
            One command centre for the complete solar EPC lifecycle.
          </h2>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            Commercial, engineering, procurement, installation, quality, commissioning and handover—structured as one connected operating model.
          </p>
          <div className="mt-9">
            <Link
              href={authenticated ? "/dashboard" : "/login"}
              className="inline-flex min-h-11 items-center border border-[var(--foreground)] bg-[var(--foreground)] px-6 text-sm font-semibold text-white transition hover:opacity-90"
            >
              {authenticated ? "Continue to workspace" : "Sign in or create workspace"}
            </Link>
          </div>
        </div>

        <aside className="self-end border border-[var(--line)] p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Platform foundation</p>
          <div className="mt-5 flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            <strong>Neon production runtime</strong>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Neon Auth, tenant-isolated PostgreSQL and the governed HelioCoreOS workspace form the active production foundation.
          </p>
        </aside>
      </section>
    </main>
  );
}
