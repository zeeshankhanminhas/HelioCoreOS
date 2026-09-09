import { z } from "zod";

export const opportunityStages = ["lead", "qualified", "readiness", "proposal", "won", "lost"] as const;

const optionalNumber = z.preprocess(
  (value) => value === "" || value == null ? undefined : Number(value),
  z.number().nonnegative().optional(),
);

export const opportunityFilterSchema = z.object({
  q: z.string().trim().max(120).default(""),
  stage: z.enum(opportunityStages).or(z.literal("")).default(""),
});

export const opportunityCoreSchema = z.object({
  title: z.string().trim().min(1, "Opportunity title is required").max(160),
  reference: z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9._/-]{2,39}$/, "Use 3–40 letters, numbers, dots, slashes, underscores or hyphens"),
  stage: z.enum(opportunityStages),
  owner_id: z.string().default(""),
  lead_source: z.string().trim().max(120).default(""),
  estimated_pv_kwp: optionalNumber,
  estimated_battery_kwh: optionalNumber,
  estimated_value_gbp: optionalNumber,
  notes: z.string().max(4000).default(""),
});

export type OpportunityFilters = z.infer<typeof opportunityFilterSchema>;
export type OpportunityCoreInput = z.infer<typeof opportunityCoreSchema>;
