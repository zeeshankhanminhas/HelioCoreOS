import Link from "next/link";
import { CustomerForm } from "./customer-form";

type SearchParams = Promise<{ error?: string }>;

export default async function NewCustomerPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-[1100px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Commercial intake</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Create customer</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Create an individual or organisation customer record before defining its delivery sites and EPC projects.</p>
        </div>
        <Link href="/dashboard/customers" className="inline-flex min-h-10 w-fit items-center border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Return to register</Link>
      </header>

      {params.error ? <p className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{params.error}</p> : null}
      <CustomerForm />
    </div>
  );
}
