"use client";

import { useMemo, useState } from "react";
import { updateOpportunityRelationships } from "./relationship-actions";

type Customer = { id: string; name: string; display_name: string | null };
type Site = { id: string; customer_id: string | null; name: string; postcode: string | null };

type Props = {
  opportunityId: string;
  initialCustomerId: string | null;
  initialSiteId: string | null;
  customers: Customer[];
  sites: Site[];
};

export function RelationshipAssignment({ opportunityId, initialCustomerId, initialSiteId, customers, sites }: Props) {
  const [customerId, setCustomerId] = useState(initialCustomerId ?? "");
  const [siteId, setSiteId] = useState(initialSiteId ?? "");

  const visibleSites = useMemo(() => {
    if (!customerId) return sites;
    return sites.filter((site) => !site.customer_id || site.customer_id === customerId);
  }, [customerId, sites]);

  function handleCustomerChange(value: string) {
    setCustomerId(value);
    const selectedSite = sites.find((site) => site.id === siteId);
    if (selectedSite?.customer_id && selectedSite.customer_id !== value) setSiteId("");
  }

  return (
    <form action={updateOpportunityRelationships} className="grid gap-5 p-5 md:grid-cols-2 md:p-6">
      <input type="hidden" name="opportunity_id" value={opportunityId} />
      <label className="text-xs font-semibold">
        Customer <span className="font-normal text-[var(--muted)]">(optional at intake)</span>
        <select
          name="customer_id"
          value={customerId}
          onChange={(event) => handleCustomerChange(event.target.value)}
          className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"
        >
          <option value="">Unassigned</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.display_name || customer.name}</option>
          ))}
        </select>
      </label>

      <label className="text-xs font-semibold">
        Site <span className="font-normal text-[var(--muted)]">(filtered by Customer)</span>
        <select
          name="site_id"
          value={siteId}
          onChange={(event) => setSiteId(event.target.value)}
          className="mt-2 min-h-11 w-full border border-[var(--line)] bg-[var(--background)] px-3 text-sm font-normal"
        >
          <option value="">Unassigned</option>
          {visibleSites.map((site) => (
            <option key={site.id} value={site.id}>{site.name}{site.postcode ? ` · ${site.postcode}` : ""}</option>
          ))}
        </select>
      </label>

      <div className="md:col-span-2 flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-[var(--muted)]">
          Selecting a Site linked to a Customer will automatically preserve that relationship. Conflicting assignments are blocked.
        </p>
        <button className="min-h-11 shrink-0 border border-[var(--accent)] px-5 text-xs font-semibold text-[var(--accent)]">
          Save relationships
        </button>
      </div>
    </form>
  );
}
