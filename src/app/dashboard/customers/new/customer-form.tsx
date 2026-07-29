"use client";

import Link from "next/link";
import { useState } from "react";
import { createCustomer } from "../actions";

const fieldClass = "mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal outline-none focus:border-[var(--foreground)]";
const areaClass = "mt-2 w-full border border-[var(--line)] bg-transparent px-3 py-3 text-sm font-normal outline-none focus:border-[var(--foreground)]";

export function CustomerForm() {
  const [kind, setKind] = useState<"individual" | "organisation">("organisation");

  return (
    <form action={createCustomer} className="mt-7 space-y-7">
      <section className="border border-[var(--line)]">
        <div className="border-b border-[var(--line)] p-5 md:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">01 · Identity</p>
          <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Customer definition</h2>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
          <label className="text-xs font-semibold">
            Customer type *
            <select name="customer_kind" value={kind} onChange={(event) => setKind(event.target.value as "individual" | "organisation")} className={fieldClass}>
              <option value="organisation">Organisation</option>
              <option value="individual">Individual</option>
            </select>
          </label>
          <label className="text-xs font-semibold">
            Customer category
            <select name="customer_category" className={fieldClass} defaultValue="">
              <option value="">Not classified</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
              <option value="public_sector">Public sector</option>
              <option value="non_profit">Non-profit</option>
              <option value="education">Education</option>
              <option value="healthcare">Healthcare</option>
              <option value="property_developer">Property developer</option>
              <option value="energy_developer">Energy developer</option>
              <option value="other">Other</option>
            </select>
          </label>

          {kind === "individual" ? (
            <>
              <label className="text-xs font-semibold">
                Title
                <select name="title" className={fieldClass} defaultValue="">
                  <option value="">No title</option>
                  <option value="Mr">Mr</option><option value="Mrs">Mrs</option><option value="Miss">Miss</option><option value="Ms">Ms</option><option value="Mx">Mx</option><option value="Dr">Dr</option><option value="Prof">Prof</option><option value="Other">Other</option><option value="Prefer not to say">Prefer not to say</option>
                </select>
              </label>
              <label className="text-xs font-semibold">Given name<input name="given_name" className={fieldClass} /></label>
              <label className="text-xs font-semibold">Middle name<input name="middle_name" className={fieldClass} /></label>
              <label className="text-xs font-semibold">Family name<input name="family_name" className={fieldClass} /></label>
              <label className="text-xs font-semibold md:col-span-2">Display name <span className="font-normal text-[var(--muted)]">(optional override)</span><input name="display_name" className={fieldClass} placeholder="Generated automatically from the personal name" /></label>
            </>
          ) : (
            <>
              <label className="text-xs font-semibold md:col-span-2">Organisation name *<input name="organisation_name" required className={fieldClass} placeholder="e.g. Northgate Manufacturing" /></label>
              <label className="text-xs font-semibold md:col-span-2">Display name <span className="font-normal text-[var(--muted)]">(optional override)</span><input name="display_name" className={fieldClass} placeholder="Defaults to the organisation name" /></label>
            </>
          )}

          <label className="text-xs font-semibold">Country code<input name="country_code" defaultValue="GB" maxLength={2} className={`${fieldClass} uppercase`} placeholder="GB" /></label>
          <label className="text-xs font-semibold">Customer status<select name="status" defaultValue="active" className={fieldClass}><option value="prospect">Prospect</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="blocked">Blocked</option><option value="archived">Archived</option></select></label>
        </div>
      </section>

      <section className="border border-[var(--line)]">
        <div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">02 · Contact</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Primary communication</h2></div>
        <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
          {kind === "organisation" ? <label className="text-xs font-semibold">Primary contact name<input name="contact_name" className={fieldClass} placeholder="Contact person" /></label> : <input type="hidden" name="contact_name" value="" />}
          <label className="text-xs font-semibold">Email<input name="contact_email" type="email" className={fieldClass} placeholder="name@example.com" /></label>
          <label className="text-xs font-semibold">Phone<input name="phone" type="tel" className={fieldClass} /></label>
        </div>
      </section>

      <section className="border border-[var(--line)]">
        <div className="border-b border-[var(--line)] p-5 md:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">03 · Commercial basics</p><h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">Account controls</h2></div>
        <div className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
          {kind === "organisation" ? <label className="text-xs font-semibold">Registration identifier<input name="registration_identifier" className={fieldClass} /></label> : null}
          <label className="text-xs font-semibold">Tax identifier<input name="tax_identifier" className={fieldClass} /></label>
          <label className="text-xs font-semibold">Currency code<input name="currency_code" defaultValue="GBP" maxLength={3} className={`${fieldClass} uppercase`} /></label>
          <label className="text-xs font-semibold">Payment terms (days)<input name="payment_terms_days" type="number" min="0" max="365" className={fieldClass} /></label>
          <label className="text-xs font-semibold md:col-span-2">Notes<textarea name="notes" rows={4} className={areaClass} /></label>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-6 sm:flex-row sm:justify-end">
        <Link href="/dashboard/customers" className="inline-flex min-h-11 items-center justify-center border border-[var(--line)] px-5 text-xs font-semibold">Cancel</Link>
        <button className="min-h-11 border border-[var(--accent)] bg-[var(--accent)] px-5 text-xs font-semibold text-white">Create customer and add site</button>
      </div>
    </form>
  );
}
