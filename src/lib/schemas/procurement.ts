import { z } from "zod";

export const procurementPackageSchema = z.object({
  id: z.string(),
  packageName: z.string().min(2),
  project: z.string().min(2),
  vendor: z.string().min(2),
  stage: z.string().min(1),
  requiredOnSite: z.string().min(1),
});

export type ProcurementPackage = z.infer<typeof procurementPackageSchema>;
