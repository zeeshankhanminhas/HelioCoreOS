import Link from "next/link";
import { signIn, signUp } from "@/app/auth/actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

const inputClassName =
  "mt-2 w-full border border-[var(--line)] bg-transparent px-4 py-3 text-sm outline-none transition focus:border-[var(--foreground)]";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params.next ?? "/dashboard";

  return (
    <main className="min-h-screen px-6 py-8 md:px-12">
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-5">
        <Link href="/" className="font-semibold tracking-tight">
          HelioCoreOS
        </Link>
        <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          Governed access
        </span>
      </header>

      <section className="mx-auto max-w-6xl py-14 md:py-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            Solar EPC operating system
          </p>
          <h1 className="mt-4 text-4xl font-medium tracking-[-0.04em] md:text-6xl">
            Enter the operational command centre.
          </h1>
          <p className="mt-5 max-w-xl leading-7 text-[var(--muted)]">
            Secure access to projects, engineering evidence, delivery controls and handover governance.
          </p>
        </div>

        {(params.error || params.message) && (
          <div
            className={`mb-8 border px-4 py-3 text-sm ${
              params.error
                ? "border-red-300 bg-red-50 text-red-800"
                : "border-[var(--line)] bg-white/40 text-[var(--foreground)]"
            }`}
            role="status"
          >
            {params.error ?? params.message}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="border border-[var(--line)] bg-white/30 p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Existing workspace</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Sign in</h2>

            <form action={signIn} className="mt-8 space-y-5">
              <input type="hidden" name="next" value={next} />
              <label className="block text-sm font-medium">
                Email address
                <input className={inputClassName} type="email" name="email" autoComplete="email" required />
              </label>
              <label className="block text-sm font-medium">
                Password
                <input
                  className={inputClassName}
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              <button
                type="submit"
                className="w-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)] transition hover:opacity-90"
              >
                Sign in to HelioCoreOS
              </button>
            </form>
          </section>

          <section className="border border-[var(--line)] p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">First governed workspace</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">Create account</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Your first account becomes the executive owner of a new Solar EPC organisation.
            </p>

            <form action={signUp} className="mt-8 space-y-5">
              <label className="block text-sm font-medium">
                Full name
                <input className={inputClassName} type="text" name="fullName" autoComplete="name" required />
              </label>
              <label className="block text-sm font-medium">
                Organisation name
                <input className={inputClassName} type="text" name="organisationName" required />
              </label>
              <label className="block text-sm font-medium">
                Email address
                <input className={inputClassName} type="email" name="email" autoComplete="email" required />
              </label>
              <label className="block text-sm font-medium">
                Password
                <input
                  className={inputClassName}
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <button
                type="submit"
                className="w-full border border-[var(--foreground)] px-5 py-3 text-sm font-semibold transition hover:bg-[var(--foreground)] hover:text-[var(--background)]"
              >
                Create governed workspace
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
