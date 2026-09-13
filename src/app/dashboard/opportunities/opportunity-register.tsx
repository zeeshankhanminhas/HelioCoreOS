"use client";

import Link from "next/link";
import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, ExternalLink, Search, X } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { useForm } from "react-hook-form";
import { DataRegister, dataRegisterFeatures } from "@/components/heliocore/data-register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { opportunityFilterSchema, opportunityStages, type OpportunityFilters } from "@/lib/schemas/opportunity";

export type OpportunityRegisterRow = {
  id: string;
  title: string;
  reference: string;
  stage: string;
  customer: string;
  site: string;
  owner: string;
  valueLabel: string;
  valueNumber: number | null;
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusClass(stage: string) {
  if (stage === "won") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (stage === "lost") return "border-red-200 bg-red-50 text-red-800";
  if (stage === "proposal") return "border-amber-300 bg-amber-50 text-amber-900";
  return "border-[var(--line)] bg-transparent text-[var(--foreground)]";
}

export function OpportunityRegister({ rows }: { rows: OpportunityRegisterRow[] }) {
  const [{ q, stage }, setQuery] = useQueryStates(
    { q: parseAsString.withDefault(""), stage: parseAsString.withDefault("") },
    { history: "push" },
  );
  const validStage = opportunityStages.includes(stage as (typeof opportunityStages)[number]) ? stage : "";
  const form = useForm<OpportunityFilters>({
    resolver: zodResolver(opportunityFilterSchema),
    values: { q, stage: validStage as OpportunityFilters["stage"] },
  });

  const filteredRows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      const stageMatches = !validStage || row.stage === validStage;
      const searchMatches = !needle || [row.title, row.reference, row.customer, row.site, row.owner].some((value) => value.toLowerCase().includes(needle));
      return stageMatches && searchMatches;
    });
  }, [q, rows, validStage]);

  const columns = useMemo<ColumnDef<typeof dataRegisterFeatures, OpportunityRegisterRow>[]>(() => [
    {
      accessorKey: "title",
      header: ({ column }) => <Button type="button" variant="ghost" size="sm" onClick={column.getToggleSortingHandler()}>Opportunity <ArrowUpDown className="h-3.5 w-3.5" /></Button>,
      cell: ({ row }) => <div><Link href={`/dashboard/opportunities/${row.original.id}`} className="font-semibold hover:underline">{row.original.title}</Link><p className="mt-1 text-xs text-[var(--muted)]">{row.original.reference}</p></div>,
    },
    { accessorKey: "customer", header: "Customer / Site", cell: ({ row }) => <div><p className="font-medium">{row.original.customer}</p><p className="mt-1 text-xs text-[var(--muted)]">{row.original.site}</p></div> },
    { accessorKey: "stage", header: "Stage", cell: ({ getValue }) => <span className={`inline-flex border px-2.5 py-1 text-xs font-semibold ${statusClass(String(getValue()))}`}>{titleCase(String(getValue()))}</span> },
    { accessorKey: "owner", header: "Owner", cell: ({ getValue }) => <span className="text-xs text-[var(--muted)]">{String(getValue())}</span> },
    { accessorKey: "valueNumber", header: ({ column }) => <Button type="button" variant="ghost" size="sm" onClick={column.getToggleSortingHandler()}>Estimated value <ArrowUpDown className="h-3.5 w-3.5" /></Button>, cell: ({ row }) => <span className="font-semibold tabular-nums">{row.original.valueLabel}</span> },
    { id: "open", header: "", cell: ({ row }) => <Button asChild variant="ghost" size="icon"><Link href={`/dashboard/opportunities/${row.original.id}`} aria-label={`Open ${row.original.title}`}><ExternalLink className="h-4 w-4" /></Link></Button> },
  ], []);

  const applyFilters = form.handleSubmit(async (values) => {
    await setQuery({ q: values.q || null, stage: values.stage || null });
  });

  const clearFilters = async () => {
    form.reset({ q: "", stage: "" });
    await setQuery({ q: null, stage: null });
  };

  return (
    <section className="mt-7 bg-[var(--background)]" aria-label="Opportunity register">
      <form onSubmit={applyFilters} className="grid gap-4 border border-[var(--line)] p-4 md:grid-cols-[minmax(240px,1fr)_220px_auto] md:items-end">
        <div><Label htmlFor="opportunity-search">Search</Label><div className="relative mt-2"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" /><Input id="opportunity-search" className="pl-9" placeholder="Title, reference, customer, site or owner" {...form.register("q")} /></div></div>
        <div><Label htmlFor="opportunity-stage">Stage</Label><NativeSelect id="opportunity-stage" className="mt-2" {...form.register("stage")}><option value="">All stages</option>{opportunityStages.map((item) => <option key={item} value={item}>{titleCase(item)}</option>)}</NativeSelect></div>
        <div className="flex gap-2"><Button type="submit" variant="outline">Apply filters</Button>{q || validStage ? <Button type="button" variant="ghost" onClick={clearFilters}><X className="h-4 w-4" />Clear</Button> : null}</div>
      </form>
      <div className="flex items-center justify-between border-x border-b border-[var(--line)] px-5 py-3 text-xs text-[var(--muted)]">
        <span>{filteredRows.length} matching {filteredRows.length === 1 ? "opportunity" : "opportunities"}</span>
        <span>URL-persisted filters · sortable register</span>
      </div>
      <DataRegister
        registerKey="opportunities-register"
        rows={filteredRows}
        columns={columns}
        caption="Opportunity register"
        emptyState={<><p className="text-sm font-semibold">No matching opportunities</p><p className="mt-2 text-sm text-[var(--muted)]">Adjust the search or stage filter.</p></>}
      />
    </section>
  );
}
