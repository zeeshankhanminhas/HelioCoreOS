import type { Project } from "@/lib/schemas/project";

export const projectMockData: Project[] = [
  { id: "HC-2026-014", name: "Riverside Manufacturing Facility", client: "Riverside Industries", system: "8.5 MWp + 2 MWh", stage: "Engineering", owner: "M. Ali", status: "On Track" },
  { id: "HC-2026-012", name: "Falcon Textiles South Mill", client: "Falcon Textiles", system: "5.2 MWp", stage: "Procurement", owner: "A. Khan", status: "At Risk" },
  { id: "HC-2026-009", name: "Apex Foods Distribution Hub", client: "Apex Foods", system: "2.4 MWp + 1 MWh", stage: "Construction", owner: "S. Raza", status: "On Track" },
  { id: "HC-2026-006", name: "Orion Ceramics Plant", client: "Orion Ceramics", system: "7.8 MWp", stage: "Commissioning", owner: "H. Farooq", status: "Critical" },
  { id: "HC-2025-021", name: "Nexus Chemicals Phase 1", client: "Nexus Chemicals", system: "6.2 MWp", stage: "Handover Complete", owner: "M. Ali", status: "Completed" },
  { id: "HC-2025-018", name: "Metro Foods Rooftop", client: "Metro Foods", system: "1.1 MWp", stage: "O&M Transition", owner: "S. Raza", status: "Completed" },
  { id: "HC-2025-013", name: "Crescent Packaging", client: "Crescent Packaging", system: "3.8 MWp", stage: "Closed", owner: "A. Khan", status: "Completed" },
];
