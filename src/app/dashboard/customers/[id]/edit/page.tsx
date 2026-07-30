import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCustomer } from "../../customer-site-actions";

const field = "mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm outline-none focus:border-[var(--foreground)]";

export default async function EditCustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).single();
  if (!customer) notFound();

  return <div className="mx-auto max-w-[1100px]">
    <header className="flex flex-col gap-5 border-b border-[var(--line)] pb-7 md:flex-row md:items-end md:justify-between">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">Governed customer record</p><h1 className="mt-3 text-4xl font-medium tracking-[-0.045em]">Edit {customer.display_name || customer.name}</h1><p className="mt-3 text-sm text-[var(--muted)]">Changes are tenant-scoped and written to the activity history.</p></div>
      <Link href={`/dashboard/customers/${id}`} className="inline-flex min-h-10 items-center border border-[var(--line)] px-4 text-xs font-semibold">Cancel</Link>
    </header>
    {query.error ? <p className="mt-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">{query.error}</p> : null}
    <form action={updateCustomer} className="mt-7 border border-[var(--line)] p-6 md:p-8">
      <input type="hidden" name="customer_id" value={id} />
      <div className="grid gap-5 md:grid-cols-2">
        <label className="text-xs font-semibold md:col-span-2">Display name *<input required maxLength={160} name="display_name" defaultValue={customer.display_name || customer.name} className={field} /></label>
        <label className="text-xs font-semibold">Category<input name="customer_category" defaultValue={customer.customer_category ?? ""} className={field} /></label>
        <label className="text-xs font-semibold">Status<select name="status" defaultValue={customer.status} className={field}><option value="prospect">Prospect</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="blocked">Blocked</option><option value="archived">Archived</option></select></label>
        <label className="text-xs font-semibold">Primary contact<input name="contact_name" defaultValue={customer.contact_name ?? ""} className={field} /></label>
        <label className="text-xs font-semibold">Email<input type="email" name="contact_email" defaultValue={customer.contact_email ?? ""} className={field} /></label>
        <label className="text-xs font-semibold">Phone<input name="phone" defaultValue={customer.phone ?? ""} className={field} /></label>
        <label className="text-xs font-semibold">Country code<input name="country_code" maxLength={2} defaultValue={customer.country_code || "GB"} className={`${field} uppercase`} /></label>
        <label className="text-xs font-semibold">Registration identifier<input name="registration_identifier" defaultValue={customer.registration_identifier ?? ""} className={field} /></label>
        <label className="text-xs font-semibold">Tax identifier<input name="tax_identifier" defaultValue={customer.tax_identifier ?? ""} className={field} /></label>
        <label className="text-xs font-semibold">Currency code<input name="currency_code" maxLength={3} defaultValue={customer.currency_code || "GBP"} className={`${field} uppercase`} /></label>
        <label className="text-xs font-semibold">Payment terms (days)<input type="number" min="0" max="365" name="payment_terms_days" defaultValue={customer.payment_terms_days ?? ""} className={field} /></label>
        <label className="text-xs font-semibold md:col-span-2">Notes<textarea name="notes" rows={5} defaultValue={customer.notes ?? ""} className="mt-2 w-full border border-[var(--line)] bg-transparent px-3 py-3 text-sm outline-none focus:border-[var(--foreground)]" /></label>
      </div>
      <div className="mt-7 flex justify-end"><button className="min-h-11 border border-[var(--accent)] bg-[var(--accent)] px-5 text-xs font-semibold text-white">Save governed changes</button></div>
    </form>
  </div>;
}
