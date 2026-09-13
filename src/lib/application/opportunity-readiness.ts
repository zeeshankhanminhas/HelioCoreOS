export type ReadinessStatus = "requested" | "uploaded" | "accepted" | "rejected" | "waived";

export type ReadinessItem = {
  item_type: string;
  status: ReadinessStatus;
  is_required: boolean;
};

export type OpportunityReadinessInput = {
  customerId: string | null;
  siteId: string | null;
  items: ReadinessItem[];
};

export type OpportunityReadinessAssessment = {
  state: "not_ready" | "action_required" | "ready";
  readyForEngineering: boolean;
  score: number;
  requiredTotal: number;
  requiredComplete: number;
  blockers: string[];
};

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function assessOpportunityEngineeringReadiness(input: OpportunityReadinessInput): OpportunityReadinessAssessment {
  const blockers: string[] = [];

  if (!input.customerId) blockers.push("Customer must be assigned.");
  if (!input.siteId) blockers.push("Site must be assigned.");

  const required = input.items.filter((item) => item.is_required);
  const complete = required.filter((item) => item.status === "accepted" || item.status === "waived");

  for (const item of required) {
    if (item.status === "accepted" || item.status === "waived") continue;
    blockers.push(`${label(item.item_type)} is ${label(item.status).toLowerCase()}.`);
  }

  const score = required.length ? Math.round((complete.length / required.length) * 100) : 100;
  const readyForEngineering = blockers.length === 0;
  const state = readyForEngineering ? "ready" : input.customerId && input.siteId ? "action_required" : "not_ready";

  return {
    state,
    readyForEngineering,
    score,
    requiredTotal: required.length,
    requiredComplete: complete.length,
    blockers,
  };
}
