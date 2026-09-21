export const queryKeys = {
  projects: {
    all: ["projects"] as const,
    list: (filter?: string) => ["projects", "list", filter ?? "all"] as const,
  },
  equipment: {
    all: ["equipment"] as const,
  },
} as const;
