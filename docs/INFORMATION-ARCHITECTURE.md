# HelioCoreOS Information Architecture

Status: Governing IA supplement  
Applies to: HelioCoreOS Solar EPC Profile and HelioCalc Engineering Cockpit  
Parent governance: [HelioCoreOS Constitution](./CONSTITUTION.md)  
Parent UX: [HelioCoreOS UX Constitution](./UX-CONSTITUTION.md)  
Interaction surfaces: [UI Interaction Surface Conventions](./UI-INTERACTION-SURFACE-CONVENTIONS.md)  
Engineering UX: [HelioCalc Engineering Cockpit UX](./HELIOCALC-UX.md)

## 1. Purpose

HelioCoreOS must organise information around the operating model of a Solar EPC business, not around database tables, implementation folders, or every feature that exists in code.

Information architecture determines:

- what deserves primary navigation;
- what is a module versus a record versus a workspace;
- where workflows live;
- how Engineering and HelioCalc fit inside Projects;
- where documents, evidence, approvals and activity appear;
- what belongs in contextual Sheets rather than navigation;
- how users preserve orientation while moving between commercial, technical and delivery work.

The system should feel like one coherent operating environment even as the domain becomes technically deep.

## 2. Core IA principle

The hierarchy is:

```text
Workspace
→ Business Domain
→ Operational Module
→ Register
→ Governed Record
→ Record Workspace / Workflow
→ Sub-workspace or View
→ Contextual Surface
```

Not every level becomes a route.

Navigation is reserved for stable destinations. Workflow detail should remain inside the record that owns it.

## 3. Canonical object levels

### 3.1 Workspace

The authenticated organisation boundary.

Examples:

- organisation identity;
- global search;
- notifications;
- current user;
- workspace-level settings.

There is one active HelioCoreOS workspace context at a time.

### 3.2 Business Domain

A non-clickable navigation grouping.

Examples:

```text
COMMAND
COMMERCIAL
DELIVERY
GOVERNANCE
ADMINISTRATION
```

A domain is not a module, dashboard or database entity. It exists to make the operating model understandable.

### 3.3 Operational Module

A stable navigable destination that owns a major record family or cross-cutting operational responsibility.

Examples:

- Opportunities;
- Customers;
- Sites;
- Projects;
- Tasks;
- Approvals;
- Documents;
- Team & Access.

A module normally provides a Register or operational queue.

### 3.4 Register

A scan-and-act collection of governed records.

Examples:

- Opportunity Register;
- Customer Register;
- Site Register;
- Project Register;
- Approval Queue;
- Document Registry.

A Register is a module view, not a separate business object.

### 3.5 Governed Record

A durable business object with identity, state, relationships and audit history.

Examples:

- Opportunity;
- Customer;
- Site;
- Project;
- Engineering Scenario;
- Site Survey;
- Purchase Order;
- Document revision.

### 3.6 Record Workspace / Workflow

The operating surface for work that belongs to a governed record.

Examples inside a Project:

- Engineering;
- Procurement;
- Installation;
- Commissioning;
- Handover.

Examples inside an Opportunity before Project conversion:

- Readiness;
- Indicative Proposal;
- Site Survey where the workflow begins pre-contract;
- preliminary Engineering where explicitly permitted.

A workflow should not become a top-level module merely because it contains many fields or calculations.

### 3.7 Sub-workspace / View

A stable working area inside a record workspace.

HelioCalc Engineering examples:

- Design Basis;
- Equipment;
- Strings / MPPT;
- Electrical;
- BESS;
- Performance;
- Findings;
- Outputs;
- Review.

These may be tabs, local rail destinations, or nested record routes depending on depth, but they are not global navigation.

### 3.8 Contextual Surface

Temporary contextual depth that preserves the parent workspace.

Examples:

- datasheet evidence Sheet;
- engineering finding detail;
- circuit detail;
- activity history;
- revision evidence;
- customer preview;
- scenario metadata.

A contextual surface is never promoted to navigation merely because the content is detailed.

## 4. Global navigation architecture

The target navigation should stay intentionally small.

```text
COMMAND
Overview
Tasks

COMMERCIAL
Opportunities
Customers
Sites

DELIVERY
Projects

GOVERNANCE
Approvals
Documents
Activity

ADMINISTRATION
Team & Access
Settings
```

Only implemented and operational modules should appear as live destinations.

### 4.1 What does not belong in global navigation

Do not add global navigation entries for:

- HelioCalc;
- PV Calculator;
- String Calculator;
- Cable Calculator;
- BESS Calculator;
- Scenario Comparison;
- Site Survey;
- Indicative Proposal;
- BOM for one Project;
- Drawings for one Project;
- Datasheet Evidence;
- Findings;
- individual workflow stages.

These are capabilities or record-owned workspaces, not independent operating domains.

## 5. Commercial-to-delivery IA

The lifecycle should remain understandable without mirroring every lifecycle stage in the sidebar.

```text
Opportunity
├── Customer
├── Site
├── Readiness
├── Proposal
├── Survey
└── Conversion
        ↓
Project
├── Overview
├── Engineering
├── Procurement
├── Installation
├── Commissioning
├── Handover
└── O&M
```

The Opportunity is the commercial case. The Project becomes the controlled delivery record after the relevant acceptance/conversion gate.

The same Customer and Site remain related objects rather than being duplicated into project-specific copies unless a governed snapshot is required.

## 6. Project 360 architecture

The Project record is the primary delivery container.

Recommended Project workspace:

```text
Project
├── Overview
├── Engineering
├── BOM & Procurement
├── Installation
├── Quality
├── Commissioning
├── Handover
├── Documents
├── Approvals
├── Activity
└── Commercial summary
```

The first view should answer:

- what stage the Project is in;
- what is blocked;
- what changed;
- what is due next;
- which technical/commercial decisions are awaiting approval;
- which evidence exists.

Project sub-workspaces may be hidden until they are operationally relevant. Empty future destinations must not appear as finished modules.

## 7. Engineering and HelioCalc IA

HelioCalc is not a separate application destination.

It is the calculation authority used inside the Project or Opportunity Engineering workspace.

Canonical hierarchy:

```text
Project
└── Engineering
    ├── Design Basis
    ├── Scenarios
    │   ├── Scenario A
    │   ├── Scenario B
    │   └── Scenario C
    ├── Equipment
    ├── PV Electrical
    ├── BESS
    ├── Cable & Protection
    ├── Performance
    ├── Findings
    ├── Outputs
    └── Review & Approval
```

The UI may expose this through the local Engineering Rail. The user remains inside the same Project and active Scenario context.

### 7.1 Scenario as a governed child record

A Scenario is a governed child of Engineering, not a global module.

A Scenario owns:

- selected equipment revisions;
- engineering inputs;
- calculation revision;
- findings;
- performance outputs;
- overrides;
- review state;
- approval state.

Only an approved preferred Scenario becomes the technical source for downstream BOM and procurement.

### 7.2 Calculators are capabilities, not destinations

String sizing, cable sizing, BESS sizing and performance simulation are calculation capabilities inside the active Scenario.

Do not create separate calculator pages that force users to copy data between tools.

The active Scenario supplies shared authoritative context so calculations remain linked and reproducible.

## 8. Equipment catalogue IA

Equipment technical data requires two distinct user contexts.

### Engineering selection context

Inside Engineering, users select from governed equipment through `EquipmentPicker` and inspect technical evidence in a Sheet.

This is contextual and Scenario-owned.

### Catalogue administration context

When equipment catalogue management becomes operational, a dedicated administration or engineering-data module may be introduced for authorised users to:

- add equipment;
- attach datasheets;
- extract/enter technical parameters;
- verify values;
- manage revisions;
- supersede technical data.

The catalogue-management route must not be exposed until its governance workflow is complete.

## 9. Documents IA

Documents exist in two contexts.

### Workflow context

A drawing, calculation, proposal, datasheet, quote or certificate should appear where it is used.

Examples:

- SLD in Engineering Outputs;
- module datasheet in Equipment evidence;
- commissioning certificate in Commissioning;
- purchase order in Procurement.

### Registry context

The Documents module is a controlled registry for search, audit, status, revision and cross-project access.

The registry must not become a parallel workflow that forces users to leave the operational record just to use a document.

## 10. Approvals IA

Approvals also have two contexts.

### Record context

The active workflow shows its current approval state, blocker and next permitted action.

### Approval queue

The global Approvals module is a role-oriented queue for work awaiting the current user's decision.

The queue links back into the underlying governed record and opens the appropriate Review mode. It does not duplicate the full workflow.

## 11. Activity and audit IA

Operational activity should be visible contextually inside records.

The global Activity destination is a cross-workspace observability surface for authorised users.

Audit evidence remains tied to the original object and cannot be edited through the activity feed.

## 12. Drawer / Sheet IA rule

A Sheet provides contextual depth but does not change the user's information location.

Example:

```text
Project > Engineering > Scenario B > Strings
                              ↓
                    Datasheet Evidence Sheet
```

The breadcrumb remains `Project > Engineering > Scenario B > Strings` because the user has not navigated to a new operational location.

A Sheet may have its own heading, internal tabs or view stack, but it does not invent a new global hierarchy.

If the content becomes sustained work with independent identity, deep linking, history or complex workflow, promote it to a governed record/sub-workspace rather than making an ever-larger Sheet.

## 13. Dialog IA rule

A Dialog is never a navigation destination.

It represents a temporary decision or short task attached to the current object.

Examples:

- `Approve design revision?`
- `Reject proposal`
- `Archive scenario`
- `Rename scenario`

Closing the Dialog returns the user to the same information location.

## 14. Breadcrumb model

Breadcrumbs describe hierarchy, not browser history.

Recommended pattern:

```text
Dashboard / Delivery / Projects / PRJ-2026-014 / Engineering / Scenario B
```

Rules:

- `Dashboard` is a route;
- `Delivery` is a non-clickable domain label;
- `Projects` is a module route;
- `PRJ-2026-014` is a record route;
- `Engineering` is a Project sub-workspace;
- `Scenario B` is the governed engineering child record.

Do not include transient Sheets, Popovers or Dialogs in breadcrumbs.

## 15. URL and route semantics

Routes should reflect stable information location.

Conceptual examples:

```text
/dashboard/opportunities
/dashboard/opportunities/[opportunityId]
/dashboard/customers/[customerId]
/dashboard/sites/[siteId]
/dashboard/projects/[projectId]
/dashboard/projects/[projectId]/engineering
/dashboard/projects/[projectId]/engineering/scenarios/[scenarioId]
```

Exact route structure may evolve, but routes must represent stable user-recognisable objects and workspaces.

Do not create routes simply to mirror internal service/package names such as:

```text
/heliocalc
/pv-engine
/string-calc
/python-service
```

Technical architecture must not leak into product IA.

## 16. Cross-linking rules

Related objects should be navigable without duplicating ownership.

Examples:

- Project → Customer;
- Project → Site;
- Opportunity → Customer;
- Scenario → Site Survey revision;
- Scenario → Equipment revision;
- BOM line → approved Scenario output;
- Purchase Order → BOM line;
- Finding → affected string/circuit/equipment.

A related-object link should preserve enough context to return to the originating workflow.

## 17. Search and command IA

Global search may find stable records and governed documents across modules.

Command palette actions may accelerate navigation and frequent operations, but they must not become the only way to discover a destination.

Search results should identify object type and parent context, for example:

```text
PRJ-2026-014 · Project · Lahore Textile Mill
DES-A · Engineering Scenario · PRJ-2026-014
INV-0042 rev 3 · Equipment revision · Huawei SUN2000...
```

## 18. Naming rules

Use business language in the interface.

Prefer:

- Engineering;
- Equipment;
- Scenario;
- Site Survey;
- Procurement;
- Commissioning;
- Calculation evidence;
- Design revision.

Avoid exposing implementation terminology such as:

- RPC;
- API payload;
- FastAPI;
- table name;
- Supabase object;
- Python model;
- service endpoint.

Those belong in technical diagnostics, not primary IA.

## 19. IA promotion test

Before creating a new module or navigation item, answer:

1. Does this represent a stable operational responsibility or record family?
2. Will users intentionally navigate here independently of another record?
3. Does it own durable records, a queue, or cross-record work?
4. Is its workflow sufficiently complete to justify navigation?
5. Would placing it inside its owning record preserve context better?

If questions 1–3 are mostly no, the capability should remain inside the owning record or a contextual surface.

## 20. IA anti-patterns

Prohibited patterns include:

- one sidebar item per database table;
- one sidebar item per lifecycle stage;
- separate pages for every calculator;
- dashboards used as parent folders;
- clickable navigation-domain labels;
- duplicate Documents workflows;
- duplicate Approvals workflows;
- orphan technical screens without Project/Scenario context;
- drawers treated as routes without need;
- breadcrumb trails that reflect implementation folders rather than business hierarchy;
- making unfinished modules appear operational;
- forcing users to remember IDs or manually carry data between technical tools.

## 21. IA quality gate

A new capability is not IA-complete until a user can answer:

1. Where am I?
2. Which business object owns this work?
3. What is the parent record?
4. What is the current state?
5. What related evidence exists?
6. What is the next permitted action?
7. How do I return without losing context?
8. Is this content a module, record, workflow, sub-view or contextual surface?

If those answers are unclear, the capability must not be considered production-ready.

## 22. Product decision

HelioCoreOS should expose the Solar EPC operating model, not its technical implementation.

The global navigation remains small and stable. Complexity lives inside governed records using local workspaces, progressive disclosure and contextual surfaces.

For Engineering specifically:

> Project owns Engineering. Engineering owns Scenarios. Scenarios own calculations. HelioCalc is the calculation authority, not a navigation destination.
