import { z } from "zod";

export const constructionWorkfrontSchema = z.object({
  id: z.string(),
  workfront: z.string().min(2),
  project: z.string().min(2),
  progress: z.number().min(0).max(100),
  status: z.string().min(1),
  nextStep: z.string().min(1),
});

export type ConstructionWorkfront = z.infer<typeof constructionWorkfrontSchema>;
