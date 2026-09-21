import { z } from "zod";

export const equipmentSchema = z.object({
  id: z.string(),
  model: z.string().min(2),
  category: z.string().min(2),
  rating: z.string().min(1),
  manufacturer: z.string().min(2),
  approval: z.string().min(1),
});

export type Equipment = z.infer<typeof equipmentSchema>;
