# HelioCoreOS Enterprise Floorplan Conventions

Status: Governing UX and IA supplement  
Applies to: HelioCoreOS record, workflow and engineering interfaces  
Parent UX: [HelioCoreOS UX Constitution](./UX-CONSTITUTION.md)  
Parent IA: [HelioCoreOS Information Architecture](./INFORMATION-ARCHITECTURE.md)  
Interaction surfaces: [UI Interaction Surface Conventions](./UI-INTERACTION-SURFACE-CONVENTIONS.md)  
Engineering UX: [HelioCalc Engineering Cockpit UX](./HELIOCALC-UX.md)

## 1. Purpose

HelioCoreOS should borrow proven enterprise interaction discipline without inheriting another product's visual language.

This convention is informed by mature SAP Fiori patterns for object pages, dynamic page headers, draft handling, message handling, action placement and contextual side content. It does **not** make SAP Fiori a UI dependency and does not authorise HelioCoreOS to copy SAP styling, navigation chrome, spacing, iconography or generic floorplans blindly.

The objective is to make every class of work predictable:

- registers behave like registers;
- governed records behave like durable business objects;
- operational workflows preserve object context;
- drafts are resumable and attributable;
- messages and findings navigate users to the affected work;
- finalising actions are separated from routine editing;
- contextual information remains available without becoming navigation;
- the HelioCalc Engineering Cockpit remains a workbench rather than being forced into a list-detail layout.

## 2. Supersession and replacement map

This document refines or supersedes the following earlier conventions.

| Existing convention | New convention | Effect |
| --- | --- | --- |
| UX Constitution §5: four generic page types | Canonical HelioCoreOS floorplans | Replaces the generic page-type model with task-specific floorplans. |
| Generic `Record detail` structure | `Object 360` floorplan | Governed records gain persistent identity, dynamic header behaviour, local sections and progressive disclosure. |
| Shared static Page Header on every page | Module Page Header + Dynamic Record Header | Registers/modules keep the shared Page Header; durable records use a collapsible/persistent record header. |
| Register row normally opens a detail Sheet | Primary identity opens Object 360; explicit preview opens Sheet | Prevents critical records from being trapped in ever-growing drawers while preserving quick preview. |
| Draft preservation as an implementation option | Governed Draft + Edit Ownership convention | Long operational edits must expose draft state, resume behaviour and edit ownership/locking strategy. |
| All contextual depth defaults to Sheet | Persistent Context Panel vs transient Sheet | Frequently referenced context may stay beside the work; temporary inspection still uses a Sheet. |
| Inline errors/blockers only | Message / Findings navigation model | Cross-section problems are collected, prioritised and can navigate directly to the affected input, row or sub-workspace. |
| One primary action per page | Hierarchical action placement | Object-wide, section, row and finalising actions have explicit locations and may not be duplicated. |
| Three-column patterns may be interpreted generically | Flexible Column Layout restricted to drill-down/list-detail | HelioCalc is explicitly **not** implemented as a generic flexible-column layout. |

Where this supplement is more specific than the parent UX Constitution, this supplement governs the affected behaviour.

## 3. Canonical HelioCoreOS floorplans

A floorplan is a reusable interaction architecture. It is **not** an IA hierarchy level and does not create a route by itself.

HelioCoreOS uses six canonical floorplans.

### 3.1 Operational Overview

Purpose: attention, exceptions, changes and next actions across a scope.

Examples:

- Command Overview;
- Project Overview;
- commercial summary where it is genuinely operational.

Must answer:

- what needs attention;
- what changed;
- what is blocked;
- what is due next;
- where risk is increasing.

This replaces decorative dashboard-card thinking.

### 3.2 Register / Worklist

Purpose: scan, filter, prioritise and act on a family or queue of records.

Examples:

- Opportunities;
- Customers;
- Sites;
- Projects;
- Documents Registry;
- Approval Queue.

The primary record identity should navigate to its Object 360 when the record has sustained operational depth.

A dedicated preview action, secondary click pattern or row quick-view may open a contextual Sheet.

### 3.3 Object 360

Purpose: operate a durable governed business object.

Examples:

- Opportunity 360;
- Customer 360;
- Site 360;
- Project 360;
- future Supplier 360 or Asset 360 where justified.

Canonical anatomy:

```text
Breadcrumb
Dynamic Record Header
├── identity / reference / state
├── key relationship context
├── owner / responsibility
├── current blocker / next action
└── object-wide actions

Local section navigation
Main object content
Contextual evidence / related objects
Workflow state and history
```

An Object 360 is not a content dump. It uses progressive disclosure and shows only information relevant to the active task and role.

### 3.4 Governed Workflow

Purpose: complete a structured operational process owned by a record.

Examples:

- Customer Readiness;
- Site Survey;
- Procurement workflow;
- Installation QA;
- Commissioning;
- Handover.

This floorplan may contain sections, completion state, drafts, validation, evidence and review gates.

It must preserve the owning record context rather than behaving like a detached form application.

### 3.5 Engineering Cockpit

Purpose: sustained technical work requiring simultaneous design context, calculation state and engineering evidence.

Primary implementation: HelioCalc Engineering.

Canonical composition remains:

```text
Design Rail | Active Engineering Workspace | Engineering Rail
```

This is a **workbench** floorplan, not a list-detail-detail floorplan.

Do not replace it with SAP-style Flexible Column Layout or a generic three-column master/detail component. Flexible-column behaviour is reserved for drill-down between related objects, not for splitting one engineering object into three work areas.

### 3.6 Governance Queue

Purpose: role-oriented decisions across records.

Examples:

- Approvals;
- Documents requiring issue/review;
- future exceptions requiring authorised intervention.

A Governance Queue provides decision context and links back to the owning record/workflow. It does not duplicate the full workflow inside the queue.

## 4. Dynamic Record Header convention

Durable governed records use a Dynamic Record Header rather than the generic module Page Header.

The expanded state may show:

- record name/reference;
- customer/site;
- commercial or technical summary;
- owner;
- current state;
- blocker count;
- next action;
- relevant object-wide actions.

When the user scrolls into sustained work, the header may collapse while keeping the minimum decision context visible:

```text
PRJ-2026-014 · Lahore Textile Mill · Engineering · In Review
```

Object-wide actions that remain valid must not disappear merely because the header collapsed.

### What this replaces

- Replaces a large static `PageHeader` at the top of deep record pages.
- Does **not** replace `PageHeader` on registers, settings, queues or lightweight module pages.

Recommended component boundary:

```text
PageHeader            // module/register level
DynamicRecordHeader   // durable governed record level
```

## 5. Object 360 local navigation

A durable record may contain enough work to require local navigation.

Use local sections/tabs/anchor navigation for record-owned work such as:

```text
Project 360
Overview
Engineering
BOM & Procurement
Installation
Quality
Commissioning
Handover
Documents
Approvals
Activity
```

Rules:

- local navigation never competes visually with global sidebar navigation;
- sections belong to the active record and preserve its identity;
- future/incomplete sections remain hidden or visibly planned;
- a section is not promoted to the global sidebar simply because it is complex;
- opening contextual evidence does not alter the active local section.

## 6. Register-to-object behaviour

The previous default that a register row normally opens a detail Sheet is refined.

### Primary identity

Selecting the explicit primary record identity opens the full Object 360 when the record supports sustained work.

Examples:

- `OPP-2026-018` → Opportunity 360;
- `PRJ-2026-014` → Project 360.

### Quick preview

Use a Sheet for fast inspection where the user is comparing records or does not need to begin sustained work.

The preview should contain:

- identity;
- state;
- important relationships;
- blocker / next action;
- recent activity;
- explicit `Open full record` action.

The product must not silently turn a quick preview Sheet into the full record UI over time.

## 7. Governed Draft and Edit Ownership

Draft handling is a first-class operational behaviour for long or interruption-prone work.

Use it for capabilities such as:

- Site Survey;
- Engineering Scenario;
- long proposal/quote preparation;
- procurement package preparation;
- commissioning and handover records where work may be resumed.

A governed draft should expose:

- `Draft` state;
- last saved timestamp;
- draft owner/editor;
- whether the active saved version differs from the draft;
- resume action;
- discard action where authorised;
- save/publish/submit transition according to workflow semantics.

### Edit ownership

For V1 collaborative safety, HelioCoreOS should prefer an explicit single-editor/exclusive-edit model for high-consequence governed objects unless a module has been intentionally designed for concurrent editing.

Other users may remain able to inspect the active record while a draft is owned by another editor.

Display meaningful ownership, for example:

```text
Editing draft · Zeeshan Minhas
Last saved 04:38
```

or

```text
Read only while A. Khan is editing this revision
```

The lock must have defined expiry/recovery behaviour so abandoned sessions cannot block a record indefinitely.

### Saving semantics

Autosave may preserve the draft, but autosave is **not** approval, issue, publish or workflow submission.

The following remain distinct:

```text
Draft autosaved
Save / commit active record where relevant
Submit for review
Approve
Issue
```

### What this replaces

This supersedes the loose rule that long forms merely need “one or more of autosave / explicit draft save / resume later.”

For governed long-running work, draft/resume behaviour is now expected unless an explicit documented reason makes the workflow atomic and short-lived.

## 8. Persistent Context Panel versus transient Sheet

HelioCoreOS now distinguishes two forms of contextual depth.

### Persistent Context Panel

Use when the user benefits from repeatedly referencing the same supporting context while continuing the main task.

Examples:

- HelioCalc Engineering Rail;
- Findings summary during technical configuration;
- activity/comments alongside a review workspace where justified;
- comparison evidence that must remain visible during a decision.

Behaviour:

- occupies layout space rather than floating above the work;
- may collapse/expand;
- remains subordinate to the main workspace;
- is not navigation;
- does not contain finalising/global actions;
- should not contain the primary identity of the object.

### Transient Sheet / Drawer

Use for temporary inspection or secondary editing that can be dismissed after use.

Examples:

- datasheet evidence;
- customer/site preview;
- circuit detail;
- document history;
- calculation provenance detail.

### What this replaces

The previous “contextual information → Sheet” default remains valid only for temporary context.

When supporting content is continuously useful during sustained work, use a Persistent Context Panel instead of forcing users to repeatedly reopen a Sheet.

## 9. Message and Findings navigation model

Errors, warnings, blockers and engineering findings are not merely coloured messages. They are a navigation system for resolving work.

### Local validation

Field-level problems remain beside the field/control.

### Cross-section message summary

When problems span multiple fields, rows or sections, provide a Message / Findings summary that:

- groups by severity;
- identifies affected object/section;
- states the actual issue;
- explains the resolution where possible;
- navigates directly to the affected input, table row, circuit, string or section;
- moves focus appropriately;
- updates when the problem is resolved.

HelioCalc severities remain:

```text
BLOCKING
WARNING
ADVISORY
INFO
```

For general business workflows use domain-appropriate equivalents such as Error / Warning / Information without inventing unnecessary severity taxonomies.

### What this replaces

This strengthens generic blocker banners and inline validation. A banner may still summarise a blocker, but it cannot be the only mechanism when several actionable problems exist across a workflow.

## 10. Hierarchical action placement

Actions are placed according to the object they affect.

### Workspace/global actions

Examples:

- global search;
- notifications;
- workspace switch;
- user settings.

Location: shell/topbar.

### Object-wide actions

Examples:

- convert Opportunity;
- run full Scenario calculation;
- submit design for review;
- archive Project where permitted.

Location: Dynamic Record Header or governed action area.

### Section actions

Examples:

- add circuit;
- add equipment;
- upload evidence;
- create purchase order from selected BOM lines.

Location: section toolbar/header.

### Row/item actions

Examples:

- inspect equipment;
- edit string;
- open circuit;
- remove draft line.

Location: row/action menu.

### Finalising actions

Examples:

- Approve;
- Reject;
- Issue;
- Complete commissioning;
- Supersede.

Location: a stable workflow action area or concise confirmation Dialog where required by consequence.

Finalising actions must not be duplicated in several toolbars.

### What this replaces

“One primary action per page” remains a visual rule, but no longer means every action belongs in the page header. Action scope now determines placement.

## 11. Flexible-column restriction

Flexible Column Layout may be used in the future for true drill-down patterns such as:

```text
Register → Record → Child record
```

or

```text
Document Registry → Document → Revision
```

It must not be used:

- to split one Project into unrelated columns;
- to reproduce the HelioCalc Design Rail / Workspace / Engineering Rail;
- as a dashboard layout;
- merely because three columns fit on desktop;
- as a replacement for persistent contextual side content.

This protects HelioCalc from becoming a generic master/detail application.

## 12. Shell and environment boundary

Universal application concerns stay in the workspace shell:

- global search;
- notifications;
- help;
- user menu;
- workspace identity.

Operational actions remain inside the active module/record.

Non-production environments should use a restrained environment indicator so demo, development or staging data cannot be mistaken for production.

Examples:

```text
DEMO
STAGING
DEVELOPMENT
```

The indicator must be visible without becoming decorative branding.

## 13. Components introduced or refined

Recommended shared components:

```text
DynamicRecordHeader
Object360Shell
RecordSectionNav
RecordActionArea
DraftStateIndicator
EditOwnershipIndicator
PersistentContextPanel
MessageSummary
MessageNavigator
FinalActionBar
EnvironmentIndicator
```

Engineering-specific components such as `FindingRail`, `EngineeringFinding` and `EngineeringCockpitShell` remain domain components and compose these shared behaviours where appropriate.

## 14. What HelioCoreOS deliberately does not copy

Do not copy:

- SAP Fiori visual styling;
- SAP shell/launchpad appearance;
- Fiori spacing or colour tokens;
- iconography as a brand language;
- a universal Object Page for every screen;
- flexible-column layout for HelioCalc;
- oversized enterprise forms merely because legacy ERP systems use them;
- object pages as content dumps;
- side panels as navigation;
- modal-heavy enterprise behaviour.

HelioCoreOS remains visually governed by its own design language:

- Apple-like clarity;
- The Ordinary-style restraint;
- industrial precision;
- compact enterprise density;
- restrained orange accent;
- evidence-first technical interaction.

## 15. Adoption priority

Apply these conventions in this order:

### E1 — Object 360 foundation

- Opportunity 360;
- Project 360;
- Dynamic Record Header;
- local record section navigation;
- register-to-object behaviour.

### E2 — Draft and ownership

- Site Survey;
- Engineering Scenario;
- long governed operational forms.

### E3 — Message / Findings navigation

- cross-section validation summary;
- direct focus/navigation to affected work;
- HelioCalc finding navigation hardening.

### E4 — Persistent context

- Engineering Rail semantics;
- contextual review/history panels where repeated reference is valuable.

### E5 — action placement and finalisation

- object/section/row/final action audit across implemented workflows.

## 16. Product decision

HelioCoreOS adopts mature enterprise interaction principles selectively.

The governing rule is:

> Borrow the operating discipline, not the visual identity.

For records:

> Register finds the object. Object 360 operates the object. Workflow completes the work. Context panels support the work. Dialogs confirm consequential decisions.

For Engineering:

> HelioCalc remains a purpose-built workbench. It must not be flattened into a generic list-detail floorplan.