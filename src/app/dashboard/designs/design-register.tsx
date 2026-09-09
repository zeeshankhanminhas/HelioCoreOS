"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink, Search, X } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DataRegister, dataRegisterFeatures } from "@/components/heliocore/data-register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

const statuses = ["draft", "in_progress", "under_review", "approved", "rejected", "superseded"] as const;
const filterSchema = z.object({ q: z.string().trim().max(120), status: z.enum(statuses).or(z.literal("")) });
type Filters = z.infer<typeof filterSchema>;

export type DesignRegisterRow = {
  id: string;
  reference: string;
  revision: number;
  status: string;
  opportunity: string;
  site: string;
  arrayKwp: number | null;
  inverterKw: number | null;
  batteryKwh: number | null;
  calculatorRevision: string;
  updatedAt: string;
};

const date = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function DesignRegister({ rows }: { rows: DesignRegisterRow[] }) {
  const [{ q, status }, setQuery] = useQueryStates({
    q: parseAsString.withDefault("").withOptions({ history: "push" }),
    status: parseAsString.withDefault("").withOptions({ history: "push" }),
  });
  const validStatus = statuses.includes(status as (typeof statuses)[number]) ? status : "";
  const form = useForm<Filters>({ resolver: zodResolver(filterSchema), values: { q, status: validStatus as Filters["status"] } });
  const needle = q.trim().toLowerCase();
  const filtered = useMemo(() => rows.filter((row) => (!validStatus || row.status === validStatus) && (!needle || [row.reference, row.opportunity, row.site, row.status].some((v) => v.toLowerCase().includes(needle)))), [needle, rows, validStatus]);

  const columns = useMemo<ColumnDef<typeof dataRegisterFeatures, DesignRegisterRow>[]>(() => [
    { accessorKey: "reference", header: ({ column }) => <Button variant="ghost" size="sm" onClick={column.getToggleSortingHandler()}>Design <ArrowUpDown className="h-3.5 w-3.5" /></Button>, cell: ({ row }) => <div><Link href={`/dashboard/designs/${row.original.id}`} className="font-semibold hover:underline">{row.original.reference}</Link><p className="mt-1 text-xs text-[var(--muted)]">Revision {row.original.revision}</p></div> },
    { accessorKey: "opportunity", header: "Opportunity / Site", cell: ({ row }) => <div><p className="font-medium">{row.original.opportunity}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.original.site}</p></div> },
    { accessorKey: "status", header: "Status", cell: ({ getValue }) => <span className="text-xs font-semibold">{titleCase(String(getValue()))}</span> },
    { accessorKey: "arrayKwp", header: "PV / Inverter / BESS", cell: ({ row }) => <span className="text-xs tabular-nums">{row.original.arrayKwp ?? "—"} kWp · {row.original.inverterKw ?? "—"} kW · {row.original.batteryKwh ?? "—"} kWh</span> },
    { accessorKey: "calculatorRevision", header: "Source", cell: ({ getValue }) => <span className="text-xs text-[var(--muted)]">{String(getValue())}</span> },
    { accessorKey: "updatedAt", header: ({ column }) => <Button variant="ghost" size="sm" onClick={column.getToggleSortingHandler()}>Updated <ArrowUpDown className="h-3.5 w-3.5" /></Button>, cell: ({ getValue }) => <span className="text-xs tabular-nums text-[var(--muted)]">{date.format(new Date(String(getValue())))}</span> },
    { id: "open", header: "", cell: ({ row }) => <Button asChild variant="ghost" size="icon"><Link href={`/dashboard/designs/${row.original.id}`} aria-label={`Open ${row.original.reference}`}><ExternalLink className="h-4 w-4" /></Link></Button> },
  ], []);

  const apply = form.handleSubmit(async (values) => setQuery({ q: values.q || null, status: values.status || null }));
  const clear = async () => { form.reset({ q: "", status: "" }); await setQuery({ q: null, status: null }); };

  return <section className="mt-7" aria-label="Design register">
    <form onSubmit={apply} className="grid gap-4 border border-[var(--line)] p-4 md:grid-cols-[minmax(240px,1fr)_220px_auto] md:items-end">
      <div><Label htmlFor="design-search">Search</Label><div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"/><Input id="design-search" className="pl-9" placeholder="Design, opportunity, site or status" {...form.register("q")} /></div></div>
      <div><Label htmlFor="design-status">Status</Label><NativeSelect id="design-status" className="mt-2" {...form.register("status")}><option value="">All statuses</option>{statuses.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</NativeSelect></div>
      <div className="flex gap-2"><Button type="submit" variant="outline">Apply filters</Button>{q || validStatus ? <Button type="button" variant="ghost" onClick={clear}><X className="h-4 w-4"/>Clear</Button> : null}</div>
    </form>
    <div className="border-x border-b border-[var(--line)] px-5 py-3 text-xs text-[var(--muted)]">{filtered.length} matching {filtered.length === 1 ? "design" : "designs"}</div>
    <DataRegister registerKey="designs-register" rows={filtered} columns={columns} caption="Governed design register" emptyState={<><p className="text-sm font-semibold">No matching designs</p><p className="mt-2 text-sm text-[var(--muted)]">Detailed designs appear here after the calculator-led engineering path creates a governed revision.</p></>} />
  </section>;
}
