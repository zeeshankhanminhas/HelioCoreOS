import { createClient } from "@/lib/neon/client";

export type ProjectStage =
  | "Engineering"
  | "Procurement"
  | "Construction"
  | "Commissioning"
  | "Handover Complete"
  | "Closed";

export type ProjectControlStatus = "On Track" | "At Risk" | "Critical" | "Completed";

export type ProjectListItem = {
  databaseId: string;
  reference: string;
  name: string;
  client: string;
  site: string;
  location: string;
  system: string;
  stage: ProjectStage;
  owner: string;
  status: ProjectControlStatus;
  rawStatus: string;
  riskStatus: string;
  pvCapacityKwp: number | null;
  batteryCapacityKwh: number | null;
  targetCompletionDate: string | null;
  updatedAt: string;
};

export type ProjectEngineeringWorkspace = {
  project: ProjectListItem & { projectType: string | null; notes: string | null };
  opportunity: {
    id: string;
    reference: string;
    stage: string;
  } | null;
  survey: {
    id: string;
    reference: string;
    status: string;
    surveyDate: string | null;
    roofType: string | null;
    roofPitchDeg: number | null;
    usableRoofAreaM2: number | null;
    shadingSummary: string | null;
    recommendedPvKwp: number | null;
    recommendedBatteryKwh: number | null;
  } | null;
  intake: {
    id: string;
    systemType: string;
    designObjective: string | null;
    status: string;
  } | null;
  design: {
    id: string;
    designReference: string;
    revision: number;
    status: string;
    systemType: string;
    module: string;
    moduleRatingWp: number | null;
    moduleQuantity: number | null;
    arrayCapacityKwp: number | null;
    inverter: string;
    inverterCapacityKw: number | null;
    inverterQuantity: number | null;
    dcAcRatio: number | null;
    battery: string | null;
    batteryCapacityKwh: number | null;
    annualGenerationKwh: number | null;
    totalStrings: number | null;
    mountingSystem: string | null;
    updatedAt: string;
  } | null;
  documents: Array<{
    id: string;
    name: string;
    category: string | null;
    status: string;
    createdAt: string;
  }>;
};

type RawProjectRow = {
  id: string;
  reference: string;
  name: string;
  status: string;
  risk_status: string;
  pv_capacity_kwp: number | string | null;
  battery_capacity_kwh: number | string | null;
  target_completion_date: string | null;
  updated_at: string;
  project_type?: string | null;
  notes?: string | null;
  customers?: { name?: string | null; display_name?: string | null } | null;
  sites?: { name?: string | null; address?: string | null; postcode?: string | null } | null;
  profiles?: { full_name?: string | null } | null;
};

function numberOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapStage(status: string): ProjectStage {
  if (status === "procurement") return "Procurement";
  if (status === "installation") return "Construction";
  if (status === "commissioning") return "Commissioning";
  if (status === "handover") return "Handover Complete";
  if (status === "complete") return "Closed";
  return "Engineering";
}

function mapControlStatus(status: string, riskStatus: string): ProjectControlStatus {
  if (status === "complete") return "Completed";
  if (riskStatus === "red") return "Critical";
  if (riskStatus === "amber") return "At Risk";
  return "On Track";
}

function formatSystem(pvKwp: number | null, batteryKwh: number | null) {
  const parts: string[] = [];
  if (pvKwp !== null) parts.push(pvKwp >= 1000 ? `${(pvKwp / 1000).toFixed(pvKwp % 1000 === 0 ? 0 : 1)} MWp` : `${pvKwp} kWp`);
  if (batteryKwh !== null && batteryKwh > 0) parts.push(batteryKwh >= 1000 ? `${(batteryKwh / 1000).toFixed(batteryKwh % 1000 === 0 ? 0 : 1)} MWh` : `${batteryKwh} kWh`);
  return parts.length ? parts.join(" + ") : "Capacity not set";
}

function mapProject(row: RawProjectRow): ProjectListItem {
  const pvCapacityKwp = numberOrNull(row.pv_capacity_kwp);
  const batteryCapacityKwh = numberOrNull(row.battery_capacity_kwh);
  const site = row.sites?.name ?? "Site not set";
  const address = row.sites?.address ?? row.sites?.postcode ?? site;

  return {
    databaseId: row.id,
    reference: row.reference,
    name: row.name,
    client: row.customers?.display_name ?? row.customers?.name ?? "Client not set",
    site,
    location: address,
    system: formatSystem(pvCapacityKwp, batteryCapacityKwh),
    stage: mapStage(row.status),
    owner: row.profiles?.full_name ?? "Unassigned",
    status: mapControlStatus(row.status, row.risk_status),
    rawStatus: row.status,
    riskStatus: row.risk_status,
    pvCapacityKwp,
    batteryCapacityKwh,
    targetCompletionDate: row.target_completion_date,
    updatedAt: row.updated_at,
  };
}

export async function listProjects(): Promise<ProjectListItem[]> {
  const client = createClient();
  const { data, error } = await client
    .from("projects")
    .select("id,reference,name,status,risk_status,pv_capacity_kwp,battery_capacity_kwh,target_completion_date,updated_at,customers(name,display_name),sites(name,address,postcode),profiles(full_name)")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RawProjectRow[]).map(mapProject);
}

export async function getProjectEngineeringWorkspace(projectId: string): Promise<ProjectEngineeringWorkspace> {
  const client = createClient();

  const { data: projectData, error: projectError } = await client
    .from("projects")
    .select("id,reference,name,status,risk_status,pv_capacity_kwp,battery_capacity_kwh,target_completion_date,updated_at,project_type,notes,customers(name,display_name),sites(name,address,postcode),profiles(full_name)")
    .eq("id", projectId)
    .single();

  if (projectError || !projectData) throw new Error(projectError?.message ?? "Project not found or access denied.");

  const rawProject = projectData as unknown as RawProjectRow;
  const project = {
    ...mapProject(rawProject),
    projectType: rawProject.project_type ?? null,
    notes: rawProject.notes ?? null,
  };

  const { data: opportunityData, error: opportunityError } = await client
    .from("opportunities")
    .select("id,reference,stage")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (opportunityError) throw new Error(opportunityError.message);

  const opportunity = opportunityData
    ? {
        id: String(opportunityData.id),
        reference: String(opportunityData.reference),
        stage: String(opportunityData.stage),
      }
    : null;

  let survey: ProjectEngineeringWorkspace["survey"] = null;
  let intake: ProjectEngineeringWorkspace["intake"] = null;
  let design: ProjectEngineeringWorkspace["design"] = null;

  if (opportunity) {
    const [surveyResult, intakeResult, designResult] = await Promise.all([
      client
        .from("site_surveys")
        .select("id,survey_reference,status,survey_date,roof_type,roof_pitch_deg,usable_roof_area_m2,shading_summary,recommended_pv_kwp,recommended_battery_kwh")
        .eq("opportunity_id", opportunity.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      client
        .from("engineering_intakes")
        .select("id,system_type,design_objective,status")
        .eq("opportunity_id", opportunity.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      client
        .from("system_designs")
        .select("id,design_reference,revision,status,system_type,module_manufacturer,module_model,module_rating_wp,module_quantity,array_capacity_kwp,inverter_manufacturer,inverter_model,inverter_capacity_kw,inverter_quantity,dc_ac_ratio,battery_manufacturer,battery_model,battery_capacity_kwh,annual_generation_kwh,total_strings,mounting_system,updated_at")
        .eq("opportunity_id", opportunity.id)
        .order("revision", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (surveyResult.error) throw new Error(surveyResult.error.message);
    if (intakeResult.error) throw new Error(intakeResult.error.message);
    if (designResult.error) throw new Error(designResult.error.message);

    const s = surveyResult.data as Record<string, unknown> | null;
    if (s) {
      survey = {
        id: String(s.id),
        reference: String(s.survey_reference),
        status: String(s.status),
        surveyDate: s.survey_date ? String(s.survey_date) : null,
        roofType: s.roof_type ? String(s.roof_type) : null,
        roofPitchDeg: numberOrNull(s.roof_pitch_deg as number | string | null),
        usableRoofAreaM2: numberOrNull(s.usable_roof_area_m2 as number | string | null),
        shadingSummary: s.shading_summary ? String(s.shading_summary) : null,
        recommendedPvKwp: numberOrNull(s.recommended_pv_kwp as number | string | null),
        recommendedBatteryKwh: numberOrNull(s.recommended_battery_kwh as number | string | null),
      };
    }

    const i = intakeResult.data as Record<string, unknown> | null;
    if (i) {
      intake = {
        id: String(i.id),
        systemType: String(i.system_type),
        designObjective: i.design_objective ? String(i.design_objective) : null,
        status: String(i.status),
      };
    }

    const d = designResult.data as Record<string, unknown> | null;
    if (d) {
      const module = [d.module_manufacturer, d.module_model].filter(Boolean).map(String).join(" ");
      const inverter = [d.inverter_manufacturer, d.inverter_model].filter(Boolean).map(String).join(" ");
      const batteryText = [d.battery_manufacturer, d.battery_model].filter(Boolean).map(String).join(" ");
      design = {
        id: String(d.id),
        designReference: String(d.design_reference),
        revision: Number(d.revision ?? 1),
        status: String(d.status),
        systemType: String(d.system_type),
        module: module || "Not selected",
        moduleRatingWp: numberOrNull(d.module_rating_wp as number | string | null),
        moduleQuantity: numberOrNull(d.module_quantity as number | string | null),
        arrayCapacityKwp: numberOrNull(d.array_capacity_kwp as number | string | null),
        inverter: inverter || "Not selected",
        inverterCapacityKw: numberOrNull(d.inverter_capacity_kw as number | string | null),
        inverterQuantity: numberOrNull(d.inverter_quantity as number | string | null),
        dcAcRatio: numberOrNull(d.dc_ac_ratio as number | string | null),
        battery: batteryText || null,
        batteryCapacityKwh: numberOrNull(d.battery_capacity_kwh as number | string | null),
        annualGenerationKwh: numberOrNull(d.annual_generation_kwh as number | string | null),
        totalStrings: numberOrNull(d.total_strings as number | string | null),
        mountingSystem: d.mounting_system ? String(d.mounting_system) : null,
        updatedAt: String(d.updated_at),
      };
    }
  }

  const { data: documentData, error: documentError } = await client
    .from("documents")
    .select("id,name,category,status,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (documentError) throw new Error(documentError.message);

  const documents = ((documentData ?? []) as Array<Record<string, unknown>>).map((document) => ({
    id: String(document.id),
    name: String(document.name),
    category: document.category ? String(document.category) : null,
    status: String(document.status),
    createdAt: String(document.created_at),
  }));

  return { project, opportunity, survey, intake, design, documents };
}
