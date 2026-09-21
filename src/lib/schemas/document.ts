import { z } from "zod";

export const controlledDocumentSchema = z.object({
  id: z.string(),
  title: z.string().min(2),
  project: z.string().min(2),
  revision: z.string().min(1),
  status: z.string().min(1),
  owner: z.string().min(2),
});

export type ControlledDocument = z.infer<typeof controlledDocumentSchema>;
