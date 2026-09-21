"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createProjectSchema, type CreateProjectInput } from "@/lib/schemas/project";
import { Input } from "@/components/ui/input";
import { HCButton } from "@/components/heliocore/hc-button";
import { HCFormField } from "@/components/heliocore/hc-form-field";

const inputClass = "min-h-9 h-9 bg-white text-[11px]";

export function ProjectForm({ onSubmit, submitting }: { onSubmit: (values: CreateProjectInput) => Promise<void> | void; submitting?: boolean }) {
  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      client: "",
      location: "",
      capacityMwp: 1,
      system: "Grid-tied PV",
      stage: "Engineering",
      owner: "",
      status: "On Track",
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <HCFormField label="Project name" htmlFor="project-name" error={form.formState.errors.name?.message}>
          <Input id="project-name" className={inputClass} aria-invalid={Boolean(form.formState.errors.name)} {...form.register("name")} />
        </HCFormField>
        <HCFormField label="Client" htmlFor="project-client" error={form.formState.errors.client?.message}>
          <Input id="project-client" className={inputClass} aria-invalid={Boolean(form.formState.errors.client)} {...form.register("client")} />
        </HCFormField>
        <HCFormField label="Location" htmlFor="project-location" error={form.formState.errors.location?.message}>
          <Input id="project-location" className={inputClass} aria-invalid={Boolean(form.formState.errors.location)} {...form.register("location")} />
        </HCFormField>
        <HCFormField label="Capacity (MWp)" htmlFor="project-capacity" error={form.formState.errors.capacityMwp?.message}>
          <Input id="project-capacity" type="number" step="0.1" className={inputClass} aria-invalid={Boolean(form.formState.errors.capacityMwp)} {...form.register("capacityMwp", { valueAsNumber: true })} />
        </HCFormField>
        <HCFormField label="System configuration" htmlFor="project-system" error={form.formState.errors.system?.message}>
          <Input id="project-system" className={inputClass} aria-invalid={Boolean(form.formState.errors.system)} {...form.register("system")} />
        </HCFormField>
        <HCFormField label="Owner" htmlFor="project-owner" error={form.formState.errors.owner?.message}>
          <Input id="project-owner" className={inputClass} aria-invalid={Boolean(form.formState.errors.owner)} {...form.register("owner")} />
        </HCFormField>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <HCFormField label="Stage" htmlFor="project-stage">
          <select id="project-stage" className="h-9 w-full border border-[var(--line)] bg-white px-3 text-[11px] focus:border-[var(--accent)] focus:outline-none" {...form.register("stage")}>
            {["Engineering","Procurement","Construction","Commissioning","Handover Complete","O&M Transition","Closed"].map((value)=><option key={value} value={value}>{value}</option>)}
          </select>
        </HCFormField>
        <HCFormField label="Status" htmlFor="project-status">
          <select id="project-status" className="h-9 w-full border border-[var(--line)] bg-white px-3 text-[11px] focus:border-[var(--accent)] focus:outline-none" {...form.register("status")}>
            {["On Track","At Risk","Critical","Completed"].map((value)=><option key={value} value={value}>{value}</option>)}
          </select>
        </HCFormField>
      </div>

      <div className="flex justify-end border-t border-[var(--line)] pt-3">
        <HCButton type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Project"}</HCButton>
      </div>
    </form>
  );
}
