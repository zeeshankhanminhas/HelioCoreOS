import { z } from "zod";

export const opportunityStages = ["lead", "qualified", "readiness", "proposal", "won", "lost"] as const;

const optionalNonNegativeNumberText = z
  .string()
  .trim()
  .refine((value) => value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0), "Enter a non-negative number");

export const opportunityFilterSchema = z.object({
  q: z.string().trim().max(120),
  stage: z.enum(opportunityStages).or(z.literal("")),
});

export const opportunityCoreSchema = z.object({
  title: z.string().trim().min(1, "Opportunity title is required").max(160),
  reference: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9._/-]{2,39}$/, "Use 3–40 letters, numbers, dots, slashes, underscores or hyphens"),
  stage: z.enum(opportunityStages),
  owner_id: z.string(),
  lead_source: z.string().trim().max(120),
  estimated_pv_kwp: optionalNonNegativeNumberText,
  estimated_battery_kwh: optionalNonNegativeNumberText,
  estimated_value_gbp: optionalNonNegativeNumberText,
  notes: z.string().max(4000),
});

export type OpportunityFilters = z.infer<typeof opportunityFilterSchema>;
export type OpportunityCoreInput = z.infer<typeof opportunityCoreSchema>;
