import { z } from "zod";

export const projectStatusSchema = z.enum(["On Track", "At Risk", "Critical", "Completed"]);
export const projectStageSchema = z.enum(["Engineering", "Procurement", "Construction", "Commissioning", "Handover Complete", "O&M Transition", "Closed"]);

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(3, "Project name is required"),
  client: z.string().min(2, "Client is required"),
  system: z.string().min(2, "System configuration is required"),
  stage: projectStageSchema,
  owner: z.string().min(2, "Owner is required"),
  status: projectStatusSchema,
});

export const createProjectSchema = projectSchema.omit({ id: true }).extend({
  capacityMwp: z.number().positive("Capacity must be greater than zero"),
  location: z.string().min(2, "Location is required"),
});

export type Project = z.infer<typeof projectSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
