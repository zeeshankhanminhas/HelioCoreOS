import { z } from "zod";

export const commissioningSystemSchema = z.object({
  id: z.string(),
  system: z.string().min(2),
  project: z.string().min(2),
  testPack: z.string().min(1),
  readiness: z.number().min(0).max(100),
  nextGate: z.string().min(1),
});

export type CommissioningSystem = z.infer<typeof commissioningSystemSchema>;
