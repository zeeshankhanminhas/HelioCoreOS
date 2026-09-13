"use client";

import Link from "next/link";
import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink, Search, X } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DataRegister, dataRegisterFeatures } from "@/components/heliocore/data-register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const filterSchema = z.object({ q: z.string().trim().max(120) });
type Filters = z.infer<typeof filterSchema>;

export type SiteRegisterRow = {
  id: string;
  customerId: string;
  name: string;
  customer: string;
  address: string;
  postcode: string;
  projectCount: number;
  risk: "red" | "amber" | "green";
};

function riskLabel(risk: SiteRegisterRow["risk"]) {
  return risk === "red" ? "High risk" : risk === "amber" ? "Attention" : "Normal";
}

function riskClass(risk: SiteRegisterRow["risk"]) {
  return risk === "red" ? "bg-red-600" : risk === "amber" ? "bg-amber-500" : "bg-emerald-600";
}

export function SiteRegister({ rows }: { rows: SiteRegisterRow[] }) {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault("").withOptions({ history: "push" }));
  const form = useForm<Filters>({ resolver: zodResolver(filterSchema), values: { q } });
  const needle = q.trim().toLowerCase();
  const filteredRows = useMemo(() => rows.filter((row) => !needle || [row.name, row.customer, row.address, row.postcode, riskLabel(row.risk)].some((value) => value.toLowerCase().includes(needle))), [needle, rows]);

  const columns = useMemo<ColumnDef<typeof dataRegisterFeatures, SiteRegisterRow>[]>(() => [
    { accessorKey: "name", header: ({ column }) => <Button type="button" variant="ghost" size="sm" onClick={column.getToggleSortingHandler()}>Site <ArrowUpDown className="h-3.5 w-3.5" /></Button>, cell: ({ row }) => <div className="flex items-start gap-3"><span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${riskClass(row.original.risk)}`} /><div><Link href={`/dashboard/sites/${row.original.id}`} className="font-semibold hover:underline">{row.original.name}</Link><p className="mt-1 text-xs text-[var(--muted)]">{row.original.customer}</p></div></div> },
    { accessorKey: "address", header: "Location", cell: ({ row }) => <div><p className="text-sm">{row.original.address}</p><p className="mt-1 text-xs font-medium text-[var(--muted)]">{row.original.postcode}</p></div> },
    { accessorKey: "risk", header: "Delivery risk", cell: ({ row }) => <div className="flex items-center gap-2"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${riskClass(row.original.risk)}`} /><span className="text-xs font-semibold">{riskLabel(row.original.risk)}</span></div> },
    { accessorKey: "projectCount", header: ({ column }) => <Button type="button" variant="ghost" size="sm" onClick={column.getToggleSortingHandler()}>Projects <ArrowUpDown className="h-3.5 w-3.5" /></Button>, cell: ({ getValue }) => <span className="font-semibold tabular-nums">{String(getValue())}</span> },
    { id: "open", header: "", cell: ({ row }) => <div className="flex justify-end gap-1"><Button asChild variant="ghost" size="sm"><Link href={`/dashboard/projects/new?customer=${row.original.customerId}&site=${row.original.id}`}>New project</Link></Button><Button asChild variant="ghost" size="icon"><Link href={`/dashboard/sites/${row.original.id}`} aria-label={`Open ${row.original.name}`}><ExternalLink className="h-4 w-4" /></Link></Button></div> },
  ], []);

  const apply = form.handleSubmit(async (values) => { await setQ(values.q || null); });
  const clear = async () => { form.reset({ q: "" }); await setQ(null); };

  return (
    <section className="mt-7" aria-label="Site register">
      <form onSubmit={apply} className="grid gap-4 border border-[var(--line)] p-4 md:grid-cols-[minmax(240px,1fr)_auto] md:items-end">
        <div><Label htmlFor="site-search">Search</Label><div className="relative mt-2"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" /><Input id="site-search" className="pl-9" placeholder="Site, customer, address, postcode or risk" {...form.register("q")} /></div></div>
        <div className="flex gap-2"><Button type="submit" variant="outline">Apply search</Button>{q ? <Button type="button" variant="ghost" onClick={clear}><X className="h-4 w-4" />Clear</Button> : null}</div>
      </form>
      <div className="border-x border-b border-[var(--line)] px-5 py-3 text-xs text-[var(--muted)]">{filteredRows.length} matching {filteredRows.length === 1 ? "site" : "sites"}</div>
      <DataRegister registerKey="sites-register" rows={filteredRows} columns={columns} caption="Site register" minWidthClassName="min-w-[820px]" emptyState={<><p className="text-sm font-semibold">No matching sites</p><p className="mt-2 text-sm text-[var(--muted)]">Adjust the search or create a delivery location.</p></>} />
    </section>
  );
}
