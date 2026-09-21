import { z } from "zod";

export const clientSchema = z.object({
  id: z.string(),
  company: z.string().min(2),
  sector: z.string().min(2),
  relationship: z.string().min(1),
  owner: z.string().min(2),
});

export type Client = z.infer<typeof clientSchema>;
