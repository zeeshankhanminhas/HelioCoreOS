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

export type CustomerRegisterRow = {
  id: string;
  name: string;
  classification: string;
  contact: string;
  country: string;
  status: string;
  siteCount: number;
  activeProjectCount: number;
  projectCount: number;
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function CustomerRegister({ rows }: { rows: CustomerRegisterRow[] }) {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault("").withOptions({ history: "push" }));
  const form = useForm<Filters>({ resolver: zodResolver(filterSchema), values: { q } });
  const needle = q.trim().toLowerCase();
  const filteredRows = useMemo(() => rows.filter((row) => !needle || [row.name, row.classification, row.contact, row.country, row.status].some((value) => value.toLowerCase().includes(needle))), [needle, rows]);

  const columns = useMemo<ColumnDef<typeof dataRegisterFeatures, CustomerRegisterRow>[]>(() => [
    { accessorKey: "name", header: ({ column }) => <Button type="button" variant="ghost" size="sm" onClick={column.getToggleSortingHandler()}>Customer <ArrowUpDown className="h-3.5 w-3.5" /></Button>, cell: ({ row }) => <div><Link href={`/dashboard/customers/${row.original.id}`} className="font-semibold hover:underline">{row.original.name}</Link><p className="mt-1 text-xs text-[var(--muted)]">{row.original.classification}</p></div> },
    { accessorKey: "contact", header: "Primary contact", cell: ({ row }) => <div><p className="text-sm">{row.original.contact}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.original.country}</p></div> },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <span className="text-xs font-semibold">{titleCase(String(getValue()))}</span> },
    { accessorKey: "siteCount", header: ({ column }) => <Button type="button" variant="ghost" size="sm" onClick={column.getToggleSortingHandler()}>Sites <ArrowUpDown className="h-3.5 w-3.5" /></Button>, cell: ({ getValue }) => <span className="font-semibold tabular-nums">{String(getValue())}</span> },
    { accessorKey: "activeProjectCount", header: ({ column }) => <Button type="button" variant="ghost" size="sm" onClick={column.getToggleSortingHandler()}>Projects <ArrowUpDown className="h-3.5 w-3.5" /></Button>, cell: ({ row }) => <div className="text-right"><p className="font-semibold tabular-nums">{row.original.activeProjectCount} active</p><p className="mt-1 text-xs text-[var(--muted)]">{row.original.projectCount} total</p></div> },
    { id: "open", header: "", cell: ({ row }) => <Button asChild variant="ghost" size="icon"><Link href={`/dashboard/customers/${row.original.id}`} aria-label={`Open ${row.original.name}`}><ExternalLink className="h-4 w-4" /></Link></Button> },
  ], []);

  const apply = form.handleSubmit(async (values) => { await setQ(values.q || null); });
  const clear = async () => { form.reset({ q: "" }); await setQ(null); };

  return (
    <section className="mt-7" aria-label="Customer register">
      <form onSubmit={apply} className="grid gap-4 border border-[var(--line)] p-4 md:grid-cols-[minmax(240px,1fr)_auto] md:items-end">
        <div><Label htmlFor="customer-search">Search</Label><div className="relative mt-2"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" /><Input id="customer-search" className="pl-9" placeholder="Customer, contact, country or status" {...form.register("q")} /></div></div>
        <div className="flex gap-2"><Button type="submit" variant="outline">Apply search</Button>{q ? <Button type="button" variant="ghost" onClick={clear}><X className="h-4 w-4" />Clear</Button> : null}</div>
      </form>
      <div className="border-x border-b border-[var(--line)] px-5 py-3 text-xs text-[var(--muted)]">{filteredRows.length} matching {filteredRows.length === 1 ? "customer" : "customers"}</div>
      <DataRegister registerKey="customers-register" rows={filteredRows} columns={columns} caption="Customer register" minWidthClassName="min-w-[880px]" emptyState={<><p className="text-sm font-semibold">No matching customers</p><p className="mt-2 text-sm text-[var(--muted)]">Adjust the search or create a new customer.</p></>} />
    </section>
  );
}
