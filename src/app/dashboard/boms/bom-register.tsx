"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink, Search, X } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DataRegister, dataRegisterFeatures } from "@/components/heliocore/data-register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const filterSchema = z.object({ q: z.string().trim().max(120) });
type Filters = z.infer<typeof filterSchema>;

export type BomRegisterRow = {
  id: string;
  designReference: string;
  revision: number;
  designStatus: string;
  opportunity: string;
  site: string;
  lineCount: number;
  itemQuantity: number;
  releaseState: string;
  updatedAt: string;
};

const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function BomRegister({ rows }: { rows: BomRegisterRow[] }) {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault("").withOptions({ history: "push" }));
  const form = useForm<Filters>({ resolver: zodResolver(filterSchema), values: { q } });
  const needle = q.trim().toLowerCase();
  const filtered = useMemo(() => rows.filter((row) => !needle || [row.designReference, row.opportunity, row.site, row.designStatus, row.releaseState].some((v) => v.toLowerCase().includes(needle))), [needle, rows]);

  const columns = useMemo<ColumnDef<typeof dataRegisterFeatures, BomRegisterRow>[]>(() => [
    { accessorKey: "designReference", header: ({ column }) => <Button variant="ghost" size="sm" onClick={column.getToggleSortingHandler()}>BOM baseline <ArrowUpDown className="h-3.5 w-3.5" /></Button>, cell: ({ row }) => <div><Link href={`/dashboard/designs/${row.original.id}`} className="font-semibold hover:underline">{row.original.designReference}</Link><p className="mt-1 text-xs text-[var(--muted)]">Design revision {row.original.revision}</p></div> },
    { accessorKey: "opportunity", header: "Opportunity / Site", cell: ({ row }) => <div><p className="font-medium">{row.original.opportunity}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.original.site}</p></div> },
    { accessorKey: "lineCount", header: ({ column }) => <Button variant="ghost" size="sm" onClick={column.getToggleSortingHandler()}>Lines <ArrowUpDown className="h-3.5 w-3.5" /></Button>, cell: ({ row }) => <div><p className="font-semibold tabular-nums">{row.original.lineCount}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.original.itemQuantity} total qty</p></div> },
    { accessorKey: "designStatus", header: "Design status", cell: ({ getValue }) => <span className="text-xs font-semibold">{titleCase(String(getValue()))}</span> },
    { accessorKey: "releaseState", header: "Procurement readiness", cell: ({ getValue }) => <span className="text-xs font-semibold">{String(getValue())}</span> },
    { accessorKey: "updatedAt", header: "Updated", cell: ({ getValue }) => <span className="text-xs tabular-nums text-[var(--muted)]">{date.format(new Date(String(getValue())))}</span> },
    { id: "open", header: "", cell: ({ row }) => <Button asChild variant="ghost" size="icon"><Link href={`/dashboard/designs/${row.original.id}`} aria-label={`Open BOM for ${row.original.designReference}`}><ExternalLink className="h-4 w-4" /></Link></Button> },
  ], []);

  const apply = form.handleSubmit(async (values) => setQ(values.q || null));
  const clear = async () => { form.reset({ q: "" }); await setQ(null); };

  return <section className="mt-7" aria-label="BOM register">
    <form onSubmit={apply} className="grid gap-4 border border-[var(--line)] p-4 md:grid-cols-[minmax(240px,1fr)_auto] md:items-end">
      <div><Label htmlFor="bom-search">Search</Label><div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"/><Input id="bom-search" className="pl-9" placeholder="Design, opportunity, site or readiness" {...form.register("q")} /></div></div>
      <div className="flex gap-2"><Button type="submit" variant="outline">Apply search</Button>{q ? <Button type="button" variant="ghost" onClick={clear}><X className="h-4 w-4"/>Clear</Button> : null}</div>
    </form>
    <div className="border-x border-b border-[var(--line)] px-5 py-3 text-xs text-[var(--muted)]">{filtered.length} matching {filtered.length === 1 ? "BOM" : "BOMs"}</div>
    <DataRegister registerKey="boms-register" rows={filtered} columns={columns} caption="BOM register" emptyState={<><p className="text-sm font-semibold">No BOM baselines found</p><p className="mt-2 text-sm text-[var(--muted)]">BOMs are generated from the same canonical design model as the SLD.</p></>} />
  </section>;
}
