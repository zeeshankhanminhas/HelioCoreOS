"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { opportunityCoreSchema, opportunityStages, type OpportunityCoreInput } from "@/lib/schemas/opportunity";

type Owner = { id: string; full_name: string | null };

type Props = {
  opportunityId: string;
  customerId: string | null;
  siteId: string | null;
  owners: Owner[];
  initialValues: OpportunityCoreInput;
  action: (formData: FormData) => Promise<void>;
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function OpportunityCoreForm({ opportunityId, customerId, siteId, owners, initialValues, action }: Props) {
  const [pending, startTransition] = useTransition();
  const form = useForm<OpportunityCoreInput>({ resolver: zodResolver(opportunityCoreSchema), defaultValues: initialValues });

  const submit = form.handleSubmit((values) => {
    const fd = new FormData();
    fd.set("opportunity_id", opportunityId);
    fd.set("customer_id", customerId ?? "");
    fd.set("site_id", siteId ?? "");
    Object.entries(values).forEach(([key, value]) => fd.set(key, value == null ? "" : String(value)));
    startTransition(() => { void action(fd); });
  });

  const fieldError = (name: keyof OpportunityCoreInput) => {
    const message = form.formState.errors[name]?.message;
    return message ? <p className="mt-1 text-xs text-red-700">{String(message)}</p> : null;
  };

  return (
    <form onSubmit={submit} className="grid gap-5 p-5 md:grid-cols-2 md:p-6" noValidate>
      <div><Label htmlFor="opp-title">Opportunity title</Label><Input id="opp-title" className="mt-2" {...form.register("title")} aria-invalid={Boolean(form.formState.errors.title)} />{fieldError("title")}</div>
      <div><Label htmlFor="opp-reference">Reference</Label><Input id="opp-reference" className="mt-2 uppercase" {...form.register("reference")} aria-invalid={Boolean(form.formState.errors.reference)} />{fieldError("reference")}</div>
      <div><Label htmlFor="opp-stage">Stage</Label><NativeSelect id="opp-stage" className="mt-2" {...form.register("stage")}>{opportunityStages.map((stage) => <option key={stage} value={stage}>{titleCase(stage)}</option>)}</NativeSelect></div>
      <div><Label htmlFor="opp-owner">Owner</Label><NativeSelect id="opp-owner" className="mt-2" {...form.register("owner_id")}><option value="">Unassigned</option>{owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.full_name || "Unnamed user"}</option>)}</NativeSelect></div>
      <div><Label htmlFor="opp-lead-source">Lead source</Label><Input id="opp-lead-source" className="mt-2" {...form.register("lead_source")} /></div>
      <div><Label htmlFor="opp-pv">Estimated PV (kWp)</Label><Input id="opp-pv" className="mt-2" type="number" min="0" step="0.01" {...form.register("estimated_pv_kwp")} />{fieldError("estimated_pv_kwp")}</div>
      <div><Label htmlFor="opp-battery">Estimated battery (kWh)</Label><Input id="opp-battery" className="mt-2" type="number" min="0" step="0.01" {...form.register("estimated_battery_kwh")} />{fieldError("estimated_battery_kwh")}</div>
      <div><Label htmlFor="opp-value">Estimated value (£)</Label><Input id="opp-value" className="mt-2" type="number" min="0" step="0.01" {...form.register("estimated_value_gbp")} />{fieldError("estimated_value_gbp")}</div>
      <div className="md:col-span-2"><Label htmlFor="opp-notes">Notes</Label><Textarea id="opp-notes" rows={4} className="mt-2" {...form.register("notes")} />{fieldError("notes")}</div>
      <div className="flex justify-end md:col-span-2"><Button type="submit" size="lg" disabled={pending}>{pending ? "Saving…" : "Save opportunity"}</Button></div>
    </form>
  );
}
