import {
  AlertTriangle, ArrowRight, BarChart3, Box, Building2, CalendarDays, CheckCircle2,
  CircleDollarSign, ClipboardCheck, Clock3, ContactRound, FileCheck2, FileText,
  FolderKanban, Gauge, HardHat, Library, PackageCheck, Settings, ShieldCheck,
  ShoppingCart, SunMedium, Users, Wrench
} from "lucide-react";

type Tone = "green" | "amber" | "red" | "blue" | "neutral";
type Metric = { label: string; value: string; note?: string; tone?: Tone };
type Row = { primary: string; secondary?: string; values: string[]; status?: string; tone?: Tone };
type ModuleConfig = {
  eyebrow: string;
  title: string;
  subtitle: string;
  primaryAction: string;
  secondaryAction: string;
  metrics: Metric[];
  queueTitle: string;
  queueSubtitle: string;
  columns: string[];
  rows: Row[];
  rightTitle: string;
  rightItems: { label: string; value: string; note?: string; tone?: Tone }[];
  actionTitle: string;
  actionBody: string;
  actionCta: string;
  lowerTitle: string;
  lowerItems: { title: string; meta: string; status: string; tone?: Tone }[];
};

const moduleConfigs: Record<string, ModuleConfig> = {
  "pre-sales": {
    eyebrow: "Commercial Pipeline",
    title: "Pre-Sales",
    subtitle: "Qualify opportunities, shape system concepts and move viable deals into controlled project delivery.",
    primaryAction: "New Opportunity",
    secondaryAction: "Open Proposal Register",
    metrics: [
      { label: "Open Opportunities", value: "18", note: "PKR 2.84bn pipeline", tone: "blue" },
      { label: "Technical Qualification", value: "7", note: "Awaiting engineering input", tone: "amber" },
      { label: "Proposals Submitted", value: "6", note: "3 due this week", tone: "neutral" },
      { label: "Weighted Pipeline", value: "PKR 1.17bn", note: "41% weighted conversion", tone: "green" },
    ],
    queueTitle: "Opportunity Workbench",
    queueSubtitle: "Commercial opportunities requiring qualification, design input or proposal action.",
    columns: ["Opportunity", "Client", "Capacity", "Stage", "Next Action"],
    rows: [
      { primary: "Falcon Textiles Expansion", secondary: "PS-2026-041", values: ["Falcon Textiles", "4.2 MWp", "Technical Study", "Load profile review"], status: "Due today", tone: "amber" },
      { primary: "Apex Foods Cold Store", secondary: "PS-2026-038", values: ["Apex Foods", "1.8 MWp + BESS", "Proposal", "Commercial review"], status: "In review", tone: "blue" },
      { primary: "Nexus Chemicals Plant 2", secondary: "PS-2026-035", values: ["Nexus Chemicals", "6.5 MWp", "Qualified", "Site survey"], status: "Ready", tone: "green" },
      { primary: "Metro Packaging Rooftop", secondary: "PS-2026-033", values: ["Metro Packaging", "950 kWp", "Discovery", "Utility bills"], status: "Blocked", tone: "red" },
    ],
    rightTitle: "Pipeline Control",
    rightItems: [
      { label: "New this month", value: "8", note: "PKR 940m", tone: "blue" },
      { label: "At proposal", value: "6", note: "PKR 610m", tone: "amber" },
      { label: "Commercially approved", value: "3", note: "Ready for contract", tone: "green" },
      { label: "Stalled >14 days", value: "2", note: "Needs owner action", tone: "red" },
    ],
    actionTitle: "Current Commercial Action",
    actionBody: "Complete technical qualification for Falcon Textiles before commercial pricing is released.",
    actionCta: "Open Qualification",
    lowerTitle: "Recent Proposal Activity",
    lowerItems: [
      { title: "Apex Foods · Proposal Rev C", meta: "Updated 14:32 by Z. Minhas", status: "Client Review", tone: "blue" },
      { title: "Nexus Chemicals · Survey Request", meta: "Assigned to Engineering", status: "Scheduled", tone: "green" },
      { title: "Metro Packaging · Missing utility bills", meta: "Client reminder sent", status: "Waiting", tone: "amber" },
    ],
  },
  "projects": {
    eyebrow: "Portfolio Delivery",
    title: "Projects",
    subtitle: "Control contracted projects from handover through engineering, procurement, construction and closeout.",
    primaryAction: "New Project",
    secondaryAction: "Portfolio Report",
    metrics: [
      { label: "Active Projects", value: "12", note: "38.7 MWp / 9 MWh", tone: "blue" },
      { label: "On Track", value: "8", note: "67% of active portfolio", tone: "green" },
      { label: "At Risk", value: "3", note: "Schedule or approval risk", tone: "amber" },
      { label: "Critical", value: "1", note: "Procurement hold", tone: "red" },
    ],
    queueTitle: "Project Portfolio",
    queueSubtitle: "Current delivery position, project stage and accountable next action.",
    columns: ["Project", "Client", "System", "Stage", "Owner"],
    rows: [
      { primary: "Riverside Manufacturing Facility", secondary: "HC-2026-014", values: ["Riverside Industries", "8.5 MWp + 2 MWh", "Engineering", "M. Ali"], status: "On Track", tone: "green" },
      { primary: "Falcon Textiles South Mill", secondary: "HC-2026-012", values: ["Falcon Textiles", "5.2 MWp", "Procurement", "A. Khan"], status: "At Risk", tone: "amber" },
      { primary: "Apex Foods Distribution Hub", secondary: "HC-2026-009", values: ["Apex Foods", "2.4 MWp + 1 MWh", "Construction", "S. Raza"], status: "On Track", tone: "green" },
      { primary: "Orion Ceramics Plant", secondary: "HC-2026-006", values: ["Orion Ceramics", "7.8 MWp", "Commissioning", "H. Farooq"], status: "Critical", tone: "red" },
    ],
    rightTitle: "Portfolio Gates",
    rightItems: [
      { label: "Engineering approval", value: "3", note: "Projects waiting", tone: "amber" },
      { label: "Procurement release", value: "2", note: "BOM approved", tone: "green" },
      { label: "Site mobilisation", value: "2", note: "Within 14 days", tone: "blue" },
      { label: "Client decisions", value: "4", note: "Open approvals", tone: "red" },
    ],
    actionTitle: "Portfolio Attention",
    actionBody: "Orion Ceramics remains blocked by protection relay approval and cannot close commissioning.",
    actionCta: "Open Critical Project",
    lowerTitle: "Milestones This Week",
    lowerItems: [
      { title: "Riverside · PV Layout Review", meta: "Engineering gate", status: "12 Sep", tone: "amber" },
      { title: "Falcon Textiles · PO Release", meta: "Procurement gate", status: "13 Sep", tone: "green" },
      { title: "Apex Foods · Mechanical Completion", meta: "Construction gate", status: "15 Sep", tone: "blue" },
    ],
  },
  "procurement": {
    eyebrow: "Supply Chain",
    title: "Procurement",
    subtitle: "Move approved BOM items through RFQ, technical comparison, purchase order and delivery control.",
    primaryAction: "Create RFQ",
    secondaryAction: "Vendor Register",
    metrics: [
      { label: "Open RFQs", value: "14", note: "6 due within 3 days", tone: "amber" },
      { label: "PO Value", value: "PKR 486m", note: "Across active projects", tone: "blue" },
      { label: "Delivery Risk", value: "4", note: "Items outside float", tone: "red" },
      { label: "Technical Approvals", value: "11", note: "Awaiting engineering", tone: "neutral" },
    ],
    queueTitle: "Procurement Control Register",
    queueSubtitle: "Equipment packages requiring sourcing, approval, purchase or expediting action.",
    columns: ["Package", "Project", "Vendor", "Stage", "Required On Site"],
    rows: [
      { primary: "PV Modules · 14,621 units", secondary: "PKG-RIV-PV-01", values: ["Riverside", "Jinko / Longi", "Commercial Evaluation", "18 Oct"], status: "On Track", tone: "green" },
      { primary: "Central Inverters · 24 units", secondary: "PKG-RIV-INV-01", values: ["Riverside", "Sungrow", "Technical Review", "22 Oct"], status: "Attention", tone: "amber" },
      { primary: "MV Switchgear", secondary: "PKG-FAL-MV-02", values: ["Falcon Textiles", "Schneider", "PO Issued", "06 Nov"], status: "Late", tone: "red" },
      { primary: "BESS Container System", secondary: "PKG-APX-BESS-01", values: ["Apex Foods", "CATL Integrator", "Manufacturing", "28 Nov"], status: "On Track", tone: "green" },
    ],
    rightTitle: "Supply Chain Health",
    rightItems: [
      { label: "POs issued", value: "27", note: "PKR 486m", tone: "blue" },
      { label: "On-time forecast", value: "86%", note: "Across open packages", tone: "green" },
      { label: "Vendor deviations", value: "7", note: "Need closure", tone: "amber" },
      { label: "Expediting escalations", value: "3", note: "Outside project float", tone: "red" },
    ],
    actionTitle: "Current Procurement Action",
    actionBody: "Close the Riverside inverter technical deviation before commercial evaluation can be completed.",
    actionCta: "Open Technical Comparison",
    lowerTitle: "Upcoming Deliveries",
    lowerItems: [
      { title: "Apex Foods · DC Cable Batch 2", meta: "ETA 17 Sep · Site APX-02", status: "In Transit", tone: "blue" },
      { title: "Falcon Textiles · Mounting Steel", meta: "ETA 19 Sep · 82 tonnes", status: "Confirmed", tone: "green" },
      { title: "Riverside · Transformer Package", meta: "Factory inspection pending", status: "Hold", tone: "amber" },
    ],
  },
  "construction": {
    eyebrow: "Site Delivery",
    title: "Construction",
    subtitle: "Coordinate work fronts, progress, inspections, constraints and field readiness across live sites.",
    primaryAction: "New Site Update",
    secondaryAction: "Open Lookahead",
    metrics: [
      { label: "Live Sites", value: "7", note: "23 active work fronts", tone: "blue" },
      { label: "Planned Progress", value: "68%", note: "Portfolio weighted", tone: "neutral" },
      { label: "Actual Progress", value: "64%", note: "4 points behind plan", tone: "amber" },
      { label: "Open Constraints", value: "9", note: "2 critical blockers", tone: "red" },
    ],
    queueTitle: "Workfront Control",
    queueSubtitle: "Current field packages, readiness state and immediate site constraint.",
    columns: ["Workfront", "Project", "Progress", "Status", "Constraint / Next Step"],
    rows: [
      { primary: "PV Block A · Mechanical", secondary: "WF-APX-041", values: ["Apex Foods", "78%", "Executing", "Complete torque records"], status: "On Track", tone: "green" },
      { primary: "MV Cable Route", secondary: "WF-FAL-033", values: ["Falcon Textiles", "42%", "Executing", "Civil crossing permit"], status: "At Risk", tone: "amber" },
      { primary: "Inverter Station 03", secondary: "WF-RIV-017", values: ["Riverside", "0%", "Not Released", "IFC foundation drawing"], status: "Blocked", tone: "red" },
      { primary: "BESS Foundation", secondary: "WF-APX-052", values: ["Apex Foods", "91%", "Inspection", "Close punch items"], status: "On Track", tone: "green" },
    ],
    rightTitle: "Site Control",
    rightItems: [
      { label: "Open inspections", value: "16", note: "5 due today", tone: "amber" },
      { label: "Safety observations", value: "6", note: "0 high severity", tone: "green" },
      { label: "RFIs open", value: "12", note: "3 > 5 days", tone: "red" },
      { label: "2-week lookahead", value: "87%", note: "Activities ready", tone: "blue" },
    ],
    actionTitle: "Critical Site Action",
    actionBody: "Riverside Inverter Station 03 cannot mobilise until the IFC foundation drawing is released.",
    actionCta: "Open Constraint",
    lowerTitle: "Today on Site",
    lowerItems: [
      { title: "Apex Foods · Block A module installation", meta: "Crew 04 · 620 modules planned", status: "In Progress", tone: "blue" },
      { title: "Falcon Textiles · MV trench inspection", meta: "Client witness required 14:00", status: "Inspection", tone: "amber" },
      { title: "Riverside · Survey setting-out", meta: "North field complete", status: "Complete", tone: "green" },
    ],
  },
  "commissioning": {
    eyebrow: "Testing & Handover",
    title: "Commissioning",
    subtitle: "Control pre-energisation checks, test packs, punch closure, energisation and client handover.",
    primaryAction: "Create Test Pack",
    secondaryAction: "Handover Register",
    metrics: [
      { label: "Systems in Commissioning", value: "4", note: "11 test packs active", tone: "blue" },
      { label: "Tests Complete", value: "82%", note: "Portfolio weighted", tone: "green" },
      { label: "Open Punch Items", value: "23", note: "4 category A", tone: "amber" },
      { label: "Energisation Holds", value: "1", note: "Protection approval", tone: "red" },
    ],
    queueTitle: "Commissioning Register",
    queueSubtitle: "Systems approaching energisation, acceptance or operational handover.",
    columns: ["System", "Project", "Test Pack", "Readiness", "Next Gate"],
    rows: [
      { primary: "33kV Interconnection", secondary: "COM-ORI-018", values: ["Orion Ceramics", "TP-33KV-04", "92%", "Utility witness"], status: "Hold", tone: "red" },
      { primary: "PV Array Blocks A–D", secondary: "COM-APX-026", values: ["Apex Foods", "TP-PV-11", "88%", "IV curve tests"], status: "Testing", tone: "blue" },
      { primary: "SCADA & PPC", secondary: "COM-FAL-021", values: ["Falcon Textiles", "TP-SCADA-02", "73%", "Point-to-point"], status: "In Progress", tone: "amber" },
      { primary: "BESS Functional Test", secondary: "COM-APX-031", values: ["Apex Foods", "TP-BESS-03", "100%", "Client acceptance"], status: "Ready", tone: "green" },
    ],
    rightTitle: "Readiness Summary",
    rightItems: [
      { label: "Test packs open", value: "11", note: "4 ready for witness", tone: "blue" },
      { label: "Category A punch", value: "4", note: "Blocks energisation", tone: "red" },
      { label: "Category B/C punch", value: "19", note: "Close before handover", tone: "amber" },
      { label: "Handover dossiers", value: "2", note: "Compilation active", tone: "green" },
    ],
    actionTitle: "Energisation Hold",
    actionBody: "Orion Ceramics protection relay approval is the final hold before utility witness testing.",
    actionCta: "Open Hold Point",
    lowerTitle: "Witness Schedule",
    lowerItems: [
      { title: "Orion Ceramics · Utility protection test", meta: "22 Sep · DISCO witness", status: "Pending", tone: "amber" },
      { title: "Apex Foods · BESS acceptance", meta: "23 Sep · Client + OEM", status: "Confirmed", tone: "green" },
      { title: "Falcon Textiles · SCADA SAT", meta: "25 Sep · EPC internal", status: "Planned", tone: "blue" },
    ],
  },
  "operations": {
    eyebrow: "Asset Performance",
    title: "Operations",
    subtitle: "Track operational assets, production, availability, alarms and maintenance obligations after handover.",
    primaryAction: "Log O&M Event",
    secondaryAction: "Performance Report",
    metrics: [
      { label: "Operational Capacity", value: "31.4 MWp", note: "8 client assets", tone: "blue" },
      { label: "Fleet Availability", value: "98.4%", note: "30-day rolling", tone: "green" },
      { label: "Open Alarms", value: "7", note: "1 high priority", tone: "amber" },
      { label: "Performance Ratio", value: "81.7%", note: "+1.8 pts vs target", tone: "green" },
    ],
    queueTitle: "Asset Operations",
    queueSubtitle: "Fleet performance, active alarms and maintenance actions requiring attention.",
    columns: ["Asset", "Client", "Today", "Availability", "Condition"],
    rows: [
      { primary: "Apex Foods Solar + BESS", secondary: "OPS-APX-01", values: ["Apex Foods", "12.8 MWh", "99.1%", "BESS balancing"], status: "Healthy", tone: "green" },
      { primary: "Orion Ceramics PV", secondary: "OPS-ORI-01", values: ["Orion Ceramics", "31.4 MWh", "96.2%", "Inv. 07 derating"], status: "Attention", tone: "amber" },
      { primary: "Nexus Chemicals PV", secondary: "OPS-NEX-01", values: ["Nexus Chemicals", "24.7 MWh", "99.5%", "No active issue"], status: "Healthy", tone: "green" },
      { primary: "Metro Packaging Rooftop", secondary: "OPS-MET-01", values: ["Metro Packaging", "3.1 MWh", "92.4%", "String outage"], status: "Alarm", tone: "red" },
    ],
    rightTitle: "Fleet Health",
    rightItems: [
      { label: "Healthy assets", value: "6", note: "No priority alarms", tone: "green" },
      { label: "Under investigation", value: "2", note: "Field action open", tone: "amber" },
      { label: "Planned maintenance", value: "5", note: "Next 14 days", tone: "blue" },
      { label: "Warranty cases", value: "2", note: "OEM action pending", tone: "red" },
    ],
    actionTitle: "Priority O&M Action",
    actionBody: "Metro Packaging string outage has exceeded the two-hour response threshold.",
    actionCta: "Open Incident",
    lowerTitle: "Maintenance Plan",
    lowerItems: [
      { title: "Apex Foods · BESS quarterly inspection", meta: "24 Sep · OEM technician", status: "Scheduled", tone: "blue" },
      { title: "Orion Ceramics · Inverter fan replacement", meta: "Parts on site", status: "Ready", tone: "green" },
      { title: "Nexus Chemicals · Module washing", meta: "Weather dependent", status: "Planned", tone: "neutral" },
    ],
  },
  "clients": {
    eyebrow: "Relationship Management",
    title: "Clients & Contacts",
    subtitle: "Keep companies, decision makers, project relationships and outstanding client actions in one controlled view.",
    primaryAction: "Add Company",
    secondaryAction: "Add Contact",
    metrics: [
      { label: "Active Clients", value: "24", note: "12 with live projects", tone: "blue" },
      { label: "Key Contacts", value: "68", note: "42 decision makers", tone: "neutral" },
      { label: "Open Client Actions", value: "13", note: "5 overdue", tone: "amber" },
      { label: "Repeat Clients", value: "9", note: "37.5% of active base", tone: "green" },
    ],
    queueTitle: "Client Portfolio",
    queueSubtitle: "Companies with current commercial, project or operational relationships.",
    columns: ["Company", "Sector", "Relationship", "Projects", "Owner"],
    rows: [
      { primary: "Riverside Industries", secondary: "CL-0018", values: ["Manufacturing", "Active Project", "1", "Z. Minhas"], status: "Active", tone: "green" },
      { primary: "Falcon Textiles", secondary: "CL-0011", values: ["Textiles", "Repeat Client", "3", "Z. Minhas"], status: "Strategic", tone: "blue" },
      { primary: "Apex Foods", secondary: "CL-0007", values: ["Food & Cold Chain", "Active + O&M", "2", "S. Raza"], status: "Active", tone: "green" },
      { primary: "Metro Packaging", secondary: "CL-0026", values: ["Packaging", "Prospect", "0", "Z. Minhas"], status: "Follow-up", tone: "amber" },
    ],
    rightTitle: "Relationship Signals",
    rightItems: [
      { label: "Decisions outstanding", value: "7", note: "Across 5 clients", tone: "amber" },
      { label: "Meetings this week", value: "6", note: "3 project reviews", tone: "blue" },
      { label: "Expansion signals", value: "4", note: "Potential new work", tone: "green" },
      { label: "Escalations", value: "1", note: "Commercial response due", tone: "red" },
    ],
    actionTitle: "Client Follow-up",
    actionBody: "Riverside Industries has two design decisions outstanding before Engineering can close PV Layout.",
    actionCta: "Open Client Record",
    lowerTitle: "Recent Client Activity",
    lowerItems: [
      { title: "Falcon Textiles · QBR completed", meta: "Expansion opportunity recorded", status: "Follow-up", tone: "blue" },
      { title: "Apex Foods · Handover meeting", meta: "Minutes issued 20 Sep", status: "Complete", tone: "green" },
      { title: "Riverside · Design decision request", meta: "Reminder due tomorrow", status: "Waiting", tone: "amber" },
    ],
  },
  "documents": {
    eyebrow: "Controlled Information",
    title: "Documents",
    subtitle: "Control project documents, revisions, approvals, transmittals and authoritative issue status.",
    primaryAction: "Upload Document",
    secondaryAction: "New Transmittal",
    metrics: [
      { label: "Controlled Documents", value: "1,284", note: "Across active portfolio", tone: "blue" },
      { label: "For Review", value: "47", note: "12 due within 48h", tone: "amber" },
      { label: "Approved", value: "823", note: "Current revisions", tone: "green" },
      { label: "Superseded", value: "211", note: "Retained for audit", tone: "neutral" },
    ],
    queueTitle: "Document Register",
    queueSubtitle: "Latest controlled revisions requiring review, approval or formal issue.",
    columns: ["Document", "Project", "Revision", "Status", "Owner"],
    rows: [
      { primary: "PV Layout Drawing", secondary: "RIV-ENG-PVL-001", values: ["Riverside", "B", "For Review", "A. Khan"], status: "Due Today", tone: "amber" },
      { primary: "Single Line Diagram", secondary: "RIV-ENG-SLD-004", values: ["Riverside", "C", "Approved", "M. Ali"], status: "Current", tone: "green" },
      { primary: "MV Cable Schedule", secondary: "FAL-ENG-CBL-008", values: ["Falcon Textiles", "A", "For Approval", "N. Ahmed"], status: "Review", tone: "blue" },
      { primary: "Commissioning Test Plan", secondary: "ORI-COM-PLN-002", values: ["Orion Ceramics", "D", "Rejected", "H. Farooq"], status: "Rework", tone: "red" },
    ],
    rightTitle: "Document Control",
    rightItems: [
      { label: "Reviews overdue", value: "9", note: "Across 6 projects", tone: "red" },
      { label: "Transmittals open", value: "14", note: "Client / vendor", tone: "blue" },
      { label: "Revisions today", value: "22", note: "7 discipline leads", tone: "neutral" },
      { label: "IFC releases", value: "5", note: "This week", tone: "green" },
    ],
    actionTitle: "Document Control Action",
    actionBody: "Riverside PV Layout Rev B is due for technical review today and blocks the next design stage.",
    actionCta: "Open Review Queue",
    lowerTitle: "Recent Transmittals",
    lowerItems: [
      { title: "TR-RIV-046 · Engineering package", meta: "Issued to client · 8 documents", status: "Acknowledged", tone: "green" },
      { title: "TR-FAL-031 · Vendor drawings", meta: "Issued for approval · 5 documents", status: "Open", tone: "blue" },
      { title: "TR-ORI-028 · Commissioning package", meta: "Returned with comments", status: "Rework", tone: "amber" },
    ],
  },
  "reports": {
    eyebrow: "Management Information",
    title: "Reports",
    subtitle: "Turn delivery, commercial, engineering and operational data into concise management reporting.",
    primaryAction: "Generate Report",
    secondaryAction: "Schedule Report",
    metrics: [
      { label: "Portfolio Value", value: "PKR 4.8bn", note: "Contracted EPC value", tone: "blue" },
      { label: "Gross Margin Forecast", value: "17.8%", note: "+0.6 pts vs baseline", tone: "green" },
      { label: "Schedule Confidence", value: "82%", note: "3 projects at risk", tone: "amber" },
      { label: "Open Executive Risks", value: "6", note: "1 critical", tone: "red" },
    ],
    queueTitle: "Reporting Centre",
    queueSubtitle: "Recurring and on-demand reports used for project, portfolio and client governance.",
    columns: ["Report", "Scope", "Period", "Owner", "Next Issue"],
    rows: [
      { primary: "Executive Portfolio Report", secondary: "RPT-EXE-001", values: ["All Active Projects", "Weekly", "PMO", "23 Sep"], status: "Ready", tone: "green" },
      { primary: "Engineering Gate Summary", secondary: "RPT-ENG-004", values: ["Engineering", "Weekly", "M. Ali", "23 Sep"], status: "Draft", tone: "blue" },
      { primary: "Procurement Risk Report", secondary: "RPT-PRO-006", values: ["Supply Chain", "Weekly", "N. Ahmed", "22 Sep"], status: "Attention", tone: "amber" },
      { primary: "O&M Performance Pack", secondary: "RPT-OPS-003", values: ["Operational Fleet", "Monthly", "Ops Lead", "30 Sep"], status: "Scheduled", tone: "neutral" },
    ],
    rightTitle: "Executive Signals",
    rightItems: [
      { label: "Projects on track", value: "8 / 12", note: "67% portfolio", tone: "green" },
      { label: "Cost variance", value: "+1.9%", note: "Vs approved baseline", tone: "amber" },
      { label: "Revenue recognised", value: "PKR 1.92bn", note: "FY to date", tone: "blue" },
      { label: "Critical risks", value: "1", note: "Commissioning hold", tone: "red" },
    ],
    actionTitle: "Reporting Action",
    actionBody: "Weekly executive report is ready for issue once the Orion Ceramics risk commentary is updated.",
    actionCta: "Open Executive Report",
    lowerTitle: "Scheduled Outputs",
    lowerItems: [
      { title: "Weekly portfolio report", meta: "Every Monday 08:00", status: "Scheduled", tone: "green" },
      { title: "Monthly commercial pack", meta: "Last working day", status: "Scheduled", tone: "blue" },
      { title: "Client O&M performance reports", meta: "8 asset reports", status: "Monthly", tone: "neutral" },
    ],
  },
  "equipment-library": {
    eyebrow: "Technical Master Data",
    title: "Equipment Library",
    subtitle: "Maintain approved technical equipment records, datasheets, design parameters and vendor status.",
    primaryAction: "Add Equipment",
    secondaryAction: "Import Datasheet",
    metrics: [
      { label: "Approved Items", value: "426", note: "Across 14 categories", tone: "green" },
      { label: "Under Review", value: "31", note: "Technical approval pending", tone: "amber" },
      { label: "Preferred Vendors", value: "22", note: "Current approved list", tone: "blue" },
      { label: "Expired Documents", value: "9", note: "Datasheet/certificate", tone: "red" },
    ],
    queueTitle: "Equipment Master",
    queueSubtitle: "Approved and candidate equipment used by engineering, BOM and procurement workflows.",
    columns: ["Equipment", "Category", "Rating", "Manufacturer", "Approval"],
    rows: [
      { primary: "JKM-580N-72HL4-V", secondary: "EQ-PV-0048", values: ["PV Module", "580 Wp", "Jinko Solar", "Approved"], status: "Preferred", tone: "green" },
      { primary: "SG250HX", secondary: "EQ-INV-0021", values: ["String Inverter", "250 kW", "Sungrow", "Approved"], status: "Active", tone: "green" },
      { primary: "PowerTitan 2.0", secondary: "EQ-BESS-0014", values: ["BESS", "5 MWh block", "Sungrow", "Under Review"], status: "Review", tone: "amber" },
      { primary: "RMU 36kV Compact", secondary: "EQ-MV-0032", values: ["MV Switchgear", "36 kV", "Schneider", "Approved"], status: "Active", tone: "blue" },
    ],
    rightTitle: "Library Governance",
    rightItems: [
      { label: "Technical reviews", value: "31", note: "8 overdue", tone: "amber" },
      { label: "Datasheets current", value: "97.9%", note: "Across approved items", tone: "green" },
      { label: "Vendor records", value: "64", note: "22 preferred", tone: "blue" },
      { label: "Expired evidence", value: "9", note: "Needs refresh", tone: "red" },
    ],
    actionTitle: "Technical Library Action",
    actionBody: "PowerTitan 2.0 requires battery degradation and PCS efficiency data before design approval.",
    actionCta: "Open Equipment Review",
    lowerTitle: "Recent Technical Updates",
    lowerItems: [
      { title: "Jinko JKM-580N · Datasheet Rev 06", meta: "Updated electrical coefficients", status: "Approved", tone: "green" },
      { title: "Sungrow SG250HX · Grid code certificate", meta: "Pakistan compliance record", status: "Current", tone: "blue" },
      { title: "CATL EnerOne · Warranty terms", meta: "Commercial clarification pending", status: "Review", tone: "amber" },
    ],
  },
  "settings": {
    eyebrow: "Platform Governance",
    title: "Settings",
    subtitle: "Configure roles, workflow gates, numbering conventions, approval authorities and organisation standards.",
    primaryAction: "Save Changes",
    secondaryAction: "Audit Log",
    metrics: [
      { label: "Active Users", value: "38", note: "7 roles configured", tone: "blue" },
      { label: "Approval Workflows", value: "12", note: "Across lifecycle stages", tone: "green" },
      { label: "Controlled Standards", value: "28", note: "Engineering + quality", tone: "neutral" },
      { label: "Pending Access Requests", value: "3", note: "Admin review required", tone: "amber" },
    ],
    queueTitle: "Governance Configuration",
    queueSubtitle: "Core operating controls that define how work moves through HelioCore OS.",
    columns: ["Control", "Area", "Current Rule", "Owner", "State"],
    rows: [
      { primary: "Engineering Design Approval", secondary: "WF-ENG-01", values: ["Engineering", "Prepared → Reviewed → Approved", "Technical Director", "Active"], status: "Controlled", tone: "green" },
      { primary: "Procurement PO Release", secondary: "WF-PRO-03", values: ["Procurement", "Tech + Commercial approval", "Procurement Lead", "Active"], status: "Controlled", tone: "green" },
      { primary: "Project Numbering", secondary: "STD-NUM-01", values: ["Projects", "HC-YYYY-NNN", "PMO", "Active"], status: "Current", tone: "blue" },
      { primary: "External Portal Access", secondary: "SEC-EXT-02", values: ["Security", "Disabled", "Admin", "Review"], status: "Review", tone: "amber" },
    ],
    rightTitle: "Platform Controls",
    rightItems: [
      { label: "Roles", value: "7", note: "38 assigned users", tone: "blue" },
      { label: "Workflow gates", value: "12", note: "All enabled", tone: "green" },
      { label: "Audit exceptions", value: "0", note: "Last 30 days", tone: "green" },
      { label: "Access requests", value: "3", note: "Awaiting admin", tone: "amber" },
    ],
    actionTitle: "Administration Action",
    actionBody: "Three user access requests are awaiting role assignment and approval.",
    actionCta: "Review Access Requests",
    lowerTitle: "Recent Configuration Changes",
    lowerItems: [
      { title: "Engineering approval matrix updated", meta: "S. Rahman · 20 Sep 2026", status: "Applied", tone: "green" },
      { title: "Document numbering standard revised", meta: "PMO · 18 Sep 2026", status: "Applied", tone: "blue" },
      { title: "Vendor portal permission set", meta: "Security review pending", status: "Review", tone: "amber" },
    ],
  },
};

export function DashboardWorkspace() {
  const projectRows = moduleConfigs.projects.rows;
  return (
    <div className="p-3.5 lg:p-4">
      <PageHeader eyebrow="Executive Workspace" title="Dashboard" subtitle="A single operational view of commercial pipeline, delivery, engineering gates, supply chain and live asset performance." primary="Open Portfolio" secondary="Weekly Report" />
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <MetricCard metric={{label:"Contracted Portfolio",value:"38.7 MWp",note:"12 active EPC projects",tone:"blue"}}/>
        <MetricCard metric={{label:"Pipeline",value:"PKR 2.84bn",note:"18 open opportunities",tone:"green"}}/>
        <MetricCard metric={{label:"Projects At Risk",value:"3",note:"1 critical commissioning hold",tone:"amber"}}/>
        <MetricCard metric={{label:"Operational Fleet",value:"31.4 MWp",note:"98.4% availability",tone:"green"}}/>
      </div>

      <div className="mt-2.5 grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_292px]">
        <div className="space-y-2.5">
          <section className="border border-[#dde1e4] bg-white">
            <SectionHead title="Portfolio Control" subtitle="Live delivery position across active projects." action="View all projects"/>
            <WorkTable columns={["Project","Client","System","Stage","Owner"]} rows={projectRows}/>
          </section>
          <div className="grid gap-2.5 lg:grid-cols-3">
            <SignalPanel icon={<Wrench size={15}/>} title="Engineering" value="5 gates" note="3 awaiting review" tone="amber"/>
            <SignalPanel icon={<ShoppingCart size={15}/>} title="Procurement" value="4 risks" note="2 outside float" tone="red"/>
            <SignalPanel icon={<HardHat size={15}/>} title="Construction" value="64%" note="4 pts behind plan" tone="amber"/>
          </div>
          <section className="border border-[#dde1e4] bg-white">
            <SectionHead title="Cross-Functional Actions" subtitle="Items requiring action across the operating system."/>
            <ActivityList items={[
              {title:"Riverside PV Layout Rev B",meta:"Engineering review due today",status:"Review",tone:"amber"},
              {title:"Falcon Textiles MV Switchgear",meta:"Delivery now outside project float",status:"Escalate",tone:"red"},
              {title:"Apex Foods BESS Acceptance",meta:"Client witness confirmed 23 Sep",status:"Ready",tone:"green"},
              {title:"Orion Ceramics Energisation",meta:"Protection relay approval outstanding",status:"Blocked",tone:"red"},
            ]}/>
          </section>
        </div>

        <aside className="space-y-2.5">
          <ActionCard title="Executive Attention" body="Orion Ceramics commissioning remains the only critical portfolio blocker. Protection approval is required before utility witness testing." cta="Open Critical Item"/>
          <section className="border border-[#dde1e4] bg-white">
            <SectionHead title="Lifecycle Snapshot"/>
            <div className="divide-y divide-[#e7e9eb]">
              {[
                ["Pre-Sales","18","6 proposals"],["Engineering","5","3 reviews"],["Procurement","14","4 risks"],["Construction","7","23 work fronts"],["Commissioning","4","1 hold"],["Operations","8","7 alarms"]
              ].map(([a,b,c])=><div key={a} className="flex items-center px-3 py-2.5 text-[10px]"><span className="flex-1 font-medium">{a}</span><span className="mr-3 text-[13px] font-semibold tabular-nums">{b}</span><span className="w-[72px] text-right text-[#707982]">{c}</span></div>)}
            </div>
          </section>
          <section className="border border-[#dde1e4] bg-white">
            <SectionHead title="This Week"/>
            <ActivityList items={[
              {title:"3 design approvals",meta:"Engineering",status:"Due",tone:"amber"},
              {title:"2 PO releases",meta:"Procurement",status:"Ready",tone:"green"},
              {title:"4 client decisions",meta:"Commercial / Project",status:"Open",tone:"blue"},
            ]}/>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function ModuleWorkspace({ moduleKey, projectFilter }: { moduleKey: string; projectFilter?: "active" | "completed" }) {
  const base = moduleConfigs[moduleKey] ?? moduleConfigs.projects;
  const config = moduleKey === "projects" && projectFilter
    ? {
        ...base,
        title: projectFilter === "active" ? "Active Projects" : "Completed Projects",
        eyebrow: "Portfolio Delivery",
        subtitle: projectFilter === "active"
          ? "Projects currently moving through engineering, procurement, construction, commissioning or handover."
          : "Closed projects retained with final delivery, handover and performance records.",
        rows: projectFilter === "completed"
          ? [
              { primary: "Nexus Chemicals Phase 1", secondary: "HC-2025-021", values: ["Nexus Chemicals", "6.2 MWp", "Handover Complete", "M. Ali"], status: "Completed", tone: "green" as Tone },
              { primary: "Metro Foods Rooftop", secondary: "HC-2025-018", values: ["Metro Foods", "1.1 MWp", "O&M Transition", "S. Raza"], status: "Completed", tone: "green" as Tone },
              { primary: "Crescent Packaging", secondary: "HC-2025-013", values: ["Crescent Packaging", "3.8 MWp", "Closed", "A. Khan"], status: "Completed", tone: "green" as Tone },
            ]
          : base.rows,
      }
    : base;

  return (
    <div className="p-3.5 lg:p-4">
      <PageHeader eyebrow={config.eyebrow} title={config.title} subtitle={config.subtitle} primary={config.primaryAction} secondary={config.secondaryAction}/>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {config.metrics.map((m)=><MetricCard key={m.label} metric={m}/>)}
      </div>

      <div className="mt-2.5 grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_292px]">
        <div className="space-y-2.5">
          <section className="border border-[#dde1e4] bg-white">
            <SectionHead title={config.queueTitle} subtitle={config.queueSubtitle} action="Open register"/>
            <WorkTable columns={config.columns} rows={config.rows}/>
          </section>
          <section className="border border-[#dde1e4] bg-white">
            <SectionHead title={config.lowerTitle}/>
            <ActivityList items={config.lowerItems}/>
          </section>
        </div>

        <aside className="space-y-2.5">
          <ActionCard title={config.actionTitle} body={config.actionBody} cta={config.actionCta}/>
          <section className="border border-[#dde1e4] bg-white">
            <SectionHead title={config.rightTitle}/>
            <div className="divide-y divide-[#e7e9eb]">
              {config.rightItems.map((item)=><div key={item.label} className="px-3 py-2.5"><div className="flex items-start justify-between gap-3"><span className="text-[10px] font-medium">{item.label}</span><span className="text-[13px] font-semibold tabular-nums">{item.value}</span></div>{item.note?<div className="mt-1 flex items-center justify-between text-[9px] text-[#707982]"><span>{item.note}</span><StatusDot tone={item.tone}/></div>:null}</div>)}
            </div>
          </section>
          <section className="border border-[#dde1e4] bg-white">
            <SectionHead title="Control Notes"/>
            <div className="space-y-2 p-3 text-[9px] leading-4 text-[#65707a]">
              <p>Statuses shown here are operational control states, not decorative labels.</p>
              <p>Each module keeps the same HelioCore hierarchy: context, work queue, accountable action and supporting evidence.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function PageHeader({eyebrow,title,subtitle,primary,secondary}:{eyebrow:string;title:string;subtitle:string;primary:string;secondary:string}) {
  return <section className="mb-3 flex flex-col gap-2.5 xl:flex-row xl:items-end xl:justify-between">
    <div>
      <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#8a5a35]">{eyebrow}</div>
      <h1 className="text-[22px] font-semibold tracking-[-0.035em]">{title}</h1>
      <p className="mt-1 max-w-[760px] text-[10px] leading-4 text-[#68717a]">{subtitle}</p>
    </div>
    <div className="flex flex-wrap gap-1.5">
      <button className="h-8 border border-[#d9dde0] bg-white px-3 text-[9px] font-medium text-[#39434c]">{secondary}</button>
      <button className="flex h-8 items-center gap-1.5 bg-[#f36c00] px-3 text-[9px] font-semibold text-white">{primary}<ArrowRight size={12}/></button>
    </div>
  </section>;
}

function MetricCard({metric}:{metric:Metric}) {
  return <div className="border border-[#dde1e4] bg-white px-3 py-2.5">
    <div className="flex items-center justify-between"><p className="text-[9px] font-medium text-[#68717a]">{metric.label}</p><StatusDot tone={metric.tone}/></div>
    <p className="mt-1.5 text-[18px] font-semibold tracking-[-0.03em] tabular-nums">{metric.value}</p>
    {metric.note?<p className="mt-1 text-[9px] text-[#7b848c]">{metric.note}</p>:null}
  </div>;
}

function SectionHead({title,subtitle,action}:{title:string;subtitle?:string;action?:string}) {
  return <div className="flex items-center justify-between gap-3 border-b border-[#e3e6e8] px-3 py-2">
    <div><h2 className="text-[12px] font-semibold">{title}</h2>{subtitle?<p className="mt-0.5 text-[9px] text-[#727b84]">{subtitle}</p>:null}</div>
    {action?<button className="text-[9px] font-medium text-[#44617d]">{action}</button>:null}
  </div>;
}

function WorkTable({columns,rows}:{columns:string[];rows:Row[]}) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[760px] table-fixed text-left">
    <thead className="bg-[#f4f5f5]"><tr>{columns.map((c,i)=><th key={c} className={`px-3 py-2 text-[9px] font-semibold text-[#58636c] ${i===0?"w-[27%]":""}`}>{c}</th>)}<th className="w-[90px] px-3 py-2 text-[9px] font-semibold text-[#58636c]">Control</th></tr></thead>
    <tbody className="divide-y divide-[#e7e9eb]">{rows.map((row)=><tr key={row.primary} className="hover:bg-[#fafaf8]">
      <td className="px-3 py-2.5"><div className="text-[10px] font-semibold text-[#273139]">{row.primary}</div>{row.secondary?<div className="mt-0.5 text-[8px] text-[#7b858e]">{row.secondary}</div>:null}</td>
      {row.values.map((v)=><td key={v} className="px-3 py-2.5 text-[9px] text-[#525d66]">{v}</td>)}
      <td className="px-3 py-2.5"><StatusBadge label={row.status ?? "Open"} tone={row.tone}/></td>
    </tr>)}</tbody>
  </table></div>;
}

function ActionCard({title,body,cta}:{title:string;body:string;cta:string}) {
  return <section className="border border-[#dde1e4] bg-white">
    <SectionHead title="Current Action"/>
    <div className="p-3">
      <div className="flex gap-2.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#f36c00] text-white"><ClipboardCheck size={18}/></div><div><h3 className="text-[12px] font-semibold">{title}</h3><p className="mt-1 text-[9px] leading-4 text-[#66717a]">{body}</p></div></div>
      <button className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 bg-[#f36c00] text-[9px] font-semibold text-white">{cta}<ArrowRight size={12}/></button>
    </div>
  </section>;
}

function ActivityList({items}:{items:{title:string;meta:string;status:string;tone?:Tone}[]}) {
  return <div className="divide-y divide-[#e7e9eb]">{items.map((item)=><div key={item.title} className="flex items-center gap-3 px-3 py-2.5">
    <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#dfe3e6] bg-[#f7f8f7]"><FileCheck2 size={13} className="text-[#55616b]"/></div>
    <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-medium">{item.title}</p><p className="mt-0.5 text-[8px] text-[#7b848c]">{item.meta}</p></div>
    <StatusBadge label={item.status} tone={item.tone}/>
  </div>)}</div>;
}

function SignalPanel({icon,title,value,note,tone}:{icon:React.ReactNode;title:string;value:string;note:string;tone?:Tone}) {
  return <div className="border border-[#dde1e4] bg-white p-3"><div className="flex items-center gap-2 text-[10px] font-semibold">{icon}{title}<span className="ml-auto"><StatusDot tone={tone}/></span></div><p className="mt-3 text-[17px] font-semibold">{value}</p><p className="mt-1 text-[9px] text-[#707982]">{note}</p></div>;
}

function StatusBadge({label,tone="neutral"}:{label:string;tone?:Tone}) {
  const cls = tone==="green"?"bg-[#e0f3e8] text-[#176d4d]":tone==="amber"?"bg-[#fff0d8] text-[#9a5b00]":tone==="red"?"bg-[#fde8e6] text-[#a43b34]":tone==="blue"?"bg-[#e8f0fb] text-[#2f639a]":"bg-[#eef0f2] text-[#69737c]";
  return <span className={`inline-flex whitespace-nowrap px-1.5 py-0.5 text-[8px] font-medium ${cls}`}>{label}</span>;
}

function StatusDot({tone="neutral"}:{tone?:Tone}) {
  const cls = tone==="green"?"bg-[#159366]":tone==="amber"?"bg-[#e59a1c]":tone==="red"?"bg-[#d94d45]":tone==="blue"?"bg-[#4b7eb5]":"bg-[#9aa2a9]";
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`}/>;
}
