import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateSite } from "../../../customers/customer-site-actions";

const field = "mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--foreground)]";

export default async function EditSitePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: site }, { data: customers }] = await Promise.all([
    supabase.from("sites").select("id,customer_id,name,address,postcode").eq("id", id).single(),
    supabase.from("customers").select("id,name,display_name,status").neq("status", "archived").order("name"),
  ]);
  if (!site) notFound();

  return <div className="mx-auto max-w-[1000px]">
    <header className="flex flex-col gap-5 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Governed site record</p><h1 className="mt-3 text-4xl font-medium tracking-[-0.045em]">Edit {site.name}</h1><p className="mt-3 text-sm text-[var(--muted)]">Customer reassignment is validated against the active organisation and written to audit history.</p></div>
      <Link href={`/dashboard/sites/${id}`} className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Cancel</Link>
    </header>
    {query.error ? <p className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{query.error}</p> : null}
    <form action={updateSite} className="mt-7 border border-[var(--line)] p-6 md:p-8">
      <input type="hidden" name="site_id" value={id} />
      <div className="grid gap-6 md:grid-cols-2">
        <label className="text-xs font-semibold md:col-span-2">Customer *<select required name="customer_id" defaultValue={site.customer_id} className={field}>{customers?.map((customer) => <option key={customer.id} value={customer.id}>{customer.display_name || customer.name}</option>)}</select></label>
        <label className="text-xs font-semibold md:col-span-2">Site name *<input required maxLength={160} name="name" defaultValue={site.name} className={field} /></label>
        <label className="text-xs font-semibold">Address<textarea name="address" rows={5} defaultValue={site.address ?? ""} className="mt-2 w-full border border-[var(--line)] bg-transparent px-3 py-3 text-sm outline-none focus:border-[var(--foreground)]" /></label>
        <label className="text-xs font-semibold">Postcode<input name="postcode" maxLength={12} defaultValue={site.postcode ?? ""} className={`${field} uppercase`} /></label>
      </div>
      <div className="mt-7 flex justify-end"><button className="min-h-11 border border-[var(--accent)] bg-[var(--accent)] px-5 text-xs font-semibold text-white">Save governed changes</button></div>
    </form>
  </div>;
}
