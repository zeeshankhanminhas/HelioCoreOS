import Link from "next/link";
import { createCustomer } from "../actions";

type SearchParams = Promise<{ error?: string }>;

export default async function NewCustomerPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-[1100px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Commercial intake</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Create customer</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Establish the commercial owner before defining delivery sites and EPC projects.</p>
        </div>
        <Link href="/dashboard/customers" className="inline-flex min-h-10 w-fit items-center border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Return to register</Link>
      </header>

      {params.error ? <p className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{params.error}</p> : null}

      <form action={createCustomer} className="mt-7 border border-[var(--line)] p-6 md:p-8">
        <div className="border-b border-[var(--line)] pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Relationship context</p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Customer identity</h2>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="text-xs font-semibold">Customer or organisation name *</span>
            <input name="name" required autoFocus className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm outline-none focus:border-[var(--foreground)]" placeholder="e.g. Northgate Manufacturing Ltd" />
          </label>
          <label>
            <span className="text-xs font-semibold">Primary contact</span>
            <input name="contact_name" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm outline-none focus:border-[var(--foreground)]" placeholder="Full name" />
          </label>
          <label>
            <span className="text-xs font-semibold">Contact email</span>
            <input name="contact_email" type="email" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm outline-none focus:border-[var(--foreground)]" placeholder="name@company.co.uk" />
          </label>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-6 sm:flex-row sm:justify-end">
          <Link href="/dashboard/customers" className="inline-flex min-h-11 items-center justify-center border border-[var(--line)] px-5 text-xs font-semibold">Cancel</Link>
          <button className="min-h-11 border border-[var(--accent)] bg-[var(--accent)] px-5 text-xs font-semibold text-white">Create customer and add site</button>
        </div>
      </form>
    </div>
  );
}
