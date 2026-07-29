import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createSite } from "../../customers/actions";

type SearchParams = Promise<{ customer?: string; error?: string; created?: string }>;

export default async function NewSitePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: customers } = await supabase.from("customers").select("id, name").order("name");
  const selectedCustomer = customers?.some((customer) => customer.id === params.customer) ? params.customer : "";

  return (
    <div className="mx-auto max-w-[1100px]">
      <header className="flex flex-col gap-6 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Delivery intake</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.045em] md:text-5xl">Create site</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">Define the physical delivery location and connect it to the accountable customer.</p>
        </div>
        <Link href="/dashboard/sites" className="inline-flex min-h-10 w-fit items-center border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Return to register</Link>
      </header>

      {params.created === "customer" ? <p className="mt-6 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Customer created. Add its first delivery site to continue.</p> : null}
      {params.error ? <p className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{params.error}</p> : null}

      {!customers?.length ? (
        <section className="mt-7 border border-[var(--line)] p-7">
          <p className="text-sm font-semibold">Customer context required</p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">A site must belong to a governed customer record.</p>
          <Link href="/dashboard/customers/new" className="mt-6 inline-flex border border-[var(--line)] px-4 py-2.5 text-xs font-semibold">Create customer</Link>
        </section>
      ) : (
        <form action={createSite} className="mt-7 border border-[var(--line)] p-6 md:p-8">
          <div className="border-b border-[var(--line)] pb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Location context</p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Site identity</h2>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="text-xs font-semibold">Customer *</span>
              <select name="customer_id" required defaultValue={selectedCustomer} className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm">
                <option value="">Select customer</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </select>
            </label>
            <label className="md:col-span-2">
              <span className="text-xs font-semibold">Site name *</span>
              <input name="name" required autoFocus className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm outline-none focus:border-[var(--foreground)]" placeholder="e.g. Doncaster Distribution Centre" />
            </label>
            <label>
              <span className="text-xs font-semibold">Address</span>
              <textarea name="address" rows={4} className="mt-2 w-full border border-[var(--line)] bg-transparent px-3 py-3 text-sm outline-none focus:border-[var(--foreground)]" placeholder="Street, town or city" />
            </label>
            <label>
              <span className="text-xs font-semibold">Postcode</span>
              <input name="postcode" className="mt-2 min-h-11 w-full border border-[var(--line)] bg-transparent px-3 text-sm uppercase outline-none focus:border-[var(--foreground)]" placeholder="DN4 5JW" />
            </label>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-6 sm:flex-row sm:justify-end">
            <Link href="/dashboard/sites" className="inline-flex min-h-11 items-center justify-center border border-[var(--line)] px-5 text-xs font-semibold">Cancel</Link>
            <button className="min-h-11 border border-[var(--accent)] bg-[var(--accent)] px-5 text-xs font-semibold text-white">Create site and open project</button>
          </div>
        </form>
      )}
    </div>
  );
}
