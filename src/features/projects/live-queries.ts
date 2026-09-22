"use client";

import { useQuery } from "@tanstack/react-query";
import { getProjectEngineeringWorkspace, listProjects } from "@/lib/neon/projects";

export function useLiveProjects() {
  return useQuery({
    queryKey: ["projects", "live"],
    queryFn: listProjects,
  });
}

export function useLiveProjectEngineering(projectId: string) {
  return useQuery({
    queryKey: ["projects", "live", projectId, "engineering"],
    queryFn: () => getProjectEngineeringWorkspace(projectId),
    enabled: Boolean(projectId),
  });
}
