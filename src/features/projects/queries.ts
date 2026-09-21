"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/query-keys";
import { createProjectSchema, projectSchema, type CreateProjectInput, type Project } from "@/lib/schemas/project";
import { projectMockData } from "./mock-data";

async function getProjects(): Promise<Project[]> {
  await new Promise((resolve) => setTimeout(resolve, 180));
  return projectSchema.array().parse(projectMockData);
}

async function createProject(input: CreateProjectInput): Promise<Project> {
  const parsed = createProjectSchema.parse(input);
  await new Promise((resolve) => setTimeout(resolve, 350));
  return projectSchema.parse({
    id: `HC-2026-${String(projectMockData.length + 20).padStart(3, "0")}`,
    name: parsed.name,
    client: parsed.client,
    system: `${parsed.capacityMwp} MWp`,
    stage: parsed.stage,
    owner: parsed.owner,
    status: parsed.status,
  });
}

export function useProjects() {
  return useQuery({ queryKey: queryKeys.projects.all, queryFn: getProjects });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: (created) => {
      queryClient.setQueryData<Project[]>(queryKeys.projects.all, (current = []) => [created, ...current]);
    },
  });
}
