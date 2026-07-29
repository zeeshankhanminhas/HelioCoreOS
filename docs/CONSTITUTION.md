# HelioCoreOS Constitution

Version: 1.0  
Status: Governing foundation  
Effective: 29 July 2026

![HelioCoreOS operating system blueprint](./assets/heliocoreos-os-blueprint-v1.svg)

## 1. Purpose

This Constitution defines the non-negotiable core of HelioCoreOS. It protects the platform from becoming a collection of disconnected screens, one-off workflows, or project-specific shortcuts.

HelioCoreOS is an operating system for governed Solar EPC work. Its core must remain stable, reusable, auditable and independent from any single project implementation.

Project-specific capabilities may extend the core, but they must not redefine, bypass or silently weaken it.

## 2. Constitutional separation

HelioCoreOS is governed through two distinct layers.

### 2.1 Core Constitution

The Core Constitution is project-independent. It defines the operating rules that every module and project profile must inherit.

The protected core consists of:

- identity and authentication;
- organisation and tenant isolation;
- roles and access control;
- navigation and information hierarchy;
- universal lifecycle and state rules;
- document generation and version control;
- review and approval routing;
- tasks, activity and notifications;
- audit history and traceability;
- error handling and data integrity;
- security and compliance boundaries.

### 2.2 Project Additions

Project Additions contain domain-specific entities, workflows, templates and rules.

For HelioCoreOS, the active project profile is:

> HelioCoreOS Solar EPC Profile

Project additions may include opportunities, customer readiness, PV and BESS proposals, surveys, engineering, procurement, installation, commissioning, handover and O&M.

Every Project Addition must explicitly reference the constitutional capability it implements.

Example:

```text
Project addition: Indicative Proposal
Core references:
- CORE-DOC-001 Universal Document Engine
- CORE-STATE-001 Universal State Model
- CORE-APP-001 Approval Engine
- CORE-AUDIT-001 Auditability
```

A Project Addition must never alter the meaning of the referenced core rule.

## 3. Core invariants

The following rules are constitutional invariants.

### CORE-CTX-001 — Location and context

Every operational page must clearly show:

1. where the user is;
2. which object or record is being viewed;
3. the current state of that object;
4. the available next action;
5. the route back to the parent context.

A breadcrumb or equivalent address trail is mandatory for nested pages.

Example:

```text
Dashboard > Sales > Opportunities > OPP-2026-001
```

A breadcrumb communicates location. A back action provides immediate movement. Both are required where appropriate.

### CORE-NAV-001 — Navigation integrity

Navigation must reflect the actual operating hierarchy, not merely database tables.

A visible navigation destination must be one of:

- implemented and operational;
- intentionally marked as planned;
- unavailable for the current role.

A dead, empty or misleading destination must not appear as a normal live module.

The primary launch navigation is:

```text
Command
- Overview
- Tasks

Sales
- Opportunities
- Customers
- Sites

Delivery
- Projects

Administration
- Team & Access
- Settings
```

Future modules may be introduced only when their minimum operational journey is complete.

### CORE-DATA-001 — Collect only what is needed

The system must request information progressively.

Customer and Site relationships may be assigned after an Opportunity is created. They must not be mandatory at the point of first commercial capture unless the active workflow genuinely requires them.

The platform must distinguish between:

- required now;
- required before a later state transition;
- optional;
- unknown;
- not applicable.

### CORE-STATE-001 — Universal state model

Every governed business object must have an explicit state.

The canonical cross-object state vocabulary is:

```text
Created
Draft
Pending
In Progress
Review
Approved
Rejected
Completed
Cancelled
Archived
```

Project profiles may use a relevant subset or a mapped domain state. They must not invent ambiguous state meanings without documenting the mapping.

State changes must be validated, authorised and recorded.

### CORE-DOC-001 — Universal document engine

A document is a governed object, not an unmanaged file attachment.

Every governed document must support, where relevant:

- document type;
- title and reference;
- related organisation, customer, site, opportunity or project;
- owner;
- template;
- version and revision;
- status;
- approval route;
- issue date;
- expiry date;
- access and visibility;
- supersession relationship;
- complete activity history.

Document types may include proposals, quotes, contracts, drawings, calculations, datasheets, RAMS, method statements, permits, certificates, invoices, purchase orders and variations.

### CORE-DOC-002 — Document lifecycle

The canonical governed document lifecycle is:

```text
Draft
Under Review
Internal Approved
Customer Review
Customer Approved
Issued
Superseded
Archived
```

Not every document requires customer review, but every issued document must have a traceable route from draft to issue.

An issued document must not be destructively overwritten. A changed issued document becomes a new revision. The prior revision remains available and may become Superseded.

### CORE-APP-001 — Approval engine

Approvals are explicit governed decisions.

An approval route may contain:

- reviewer;
- technical approver;
- commercial approver;
- final authority;
- external or customer approver.

Each approval step must record:

- assigned person or role;
- decision;
- timestamp;
- comments;
- version or revision reviewed;
- resulting state transition.

Approval routes may be configured by project profile, document type, value threshold, risk level or role.

No interface action may claim that an item is approved without a recorded approval decision or an explicitly authorised waiver.

### CORE-AUDIT-001 — Complete traceability

Every material business action must be attributable.

The audit history must record, where relevant:

- actor;
- organisation;
- object;
- action;
- previous value or state;
- resulting value or state;
- time;
- source;
- related approval or document revision.

Audit history must not be editable through normal application workflows.

### CORE-FAIL-001 — No silent failure

HelioCoreOS must never represent an incomplete operation as successful.

Multi-step operations must be transactional where practical. Where a transaction is not possible, the system must:

- detect partial completion;
- display a clear error;
- preserve recoverable state;
- log the failure;
- provide an explicit retry or remediation path.

Examples include Opportunity creation followed by readiness-item creation, document generation followed by approval routing, and Project conversion followed by task creation.

### CORE-REL-001 — Relationship integrity

Relationships must be flexible but controlled.

A Customer or Site may be assigned after Opportunity creation, but a later workflow state may require those relationships before proceeding.

The system must prevent incompatible assignments, such as assigning a Site belonging to another organisation or assigning a customer-incompatible site without explicit remediation.

### CORE-SEC-001 — Tenant and access security

Every governed record must belong to an organisation boundary.

Tenant isolation must be enforced at the database layer using Row Level Security or an equivalent control. Interface-level filtering alone is not sufficient.

Access must be role-aware and least-privilege by default.

### CORE-UX-001 — Consistent operating pattern

Every primary record page should use a consistent hierarchy:

1. breadcrumb and page context;
2. record identity and state;
3. contextual actions;
4. summary information;
5. secondary record navigation;
6. working content;
7. activity and audit visibility.

The user must not have to relearn navigation for each module.

## 4. Platform architecture

HelioCoreOS uses three architectural layers.

### Layer 1 — Platform OS

- identity;
- permissions;
- tenancy;
- navigation;
- workflows;
- documents;
- approvals;
- states;
- tasks;
- notifications;
- activity;
- audit;
- security.

### Layer 2 — Governed business objects

- lead;
- opportunity;
- customer;
- site;
- project;
- task;
- asset;
- supplier;
- document.

### Layer 3 — Solar EPC project profile

- customer readiness;
- PV and BESS proposal;
- survey;
- design;
- engineering;
- procurement;
- installation;
- quality;
- commissioning;
- handover;
- O&M.

Layer 3 inherits Layers 1 and 2. It must not duplicate or replace them.

## 5. Solar EPC lifecycle reference

The complete reference lifecycle is:

```text
Enquiry / Lead
→ Opportunity
→ Customer assignment
→ Site assignment
→ Customer Readiness
→ Indicative Proposal
→ Detailed Quote
→ Contract
→ Project Creation
→ Engineering
→ Procurement
→ Installation
→ Testing and Commissioning
→ Handover
→ Operations and Maintenance
```

Customer and Site assignment may occur at any suitable point before a dependent gate requires them.

The lifecycle is a reference model, not a requirement to expose every future module at launch.

## 6. Launch boundary

The Launch V1 commercial foundation includes only the minimum coherent governed journey:

- authentication and organisation context;
- team and access visibility;
- opportunity creation and register;
- optional customer assignment;
- optional site assignment;
- customer readiness evidence;
- indicative proposal;
- activity history;
- consistent navigation and page context;
- foundational states, document metadata and approval references required by implemented workflows.

The following are future Project Additions and are not launch dependencies unless a validated end-to-end test proves otherwise:

- detailed quote;
- contract execution;
- automatic project conversion;
- full survey management;
- design calculation engines;
- approved BOM;
- supplier pricing;
- procurement and inventory;
- installation management;
- commissioning;
- handover packs;
- O&M;
- advanced reporting;
- customer and supplier portals;
- public integrations.

## 7. Change control

### 7.1 Constitutional amendment

A change is constitutional when it alters a core invariant, universal state meaning, security boundary, audit rule, document rule, approval principle or navigation principle.

A constitutional amendment must:

1. identify the affected CORE reference;
2. explain the reason;
3. describe compatibility impact;
4. define required migrations;
5. receive explicit approval before implementation;
6. update this document and the blueprint version.

### 7.2 Project extension

A change is a Project Extension when it adds Solar EPC behaviour while preserving all core invariants.

A Project Extension must:

1. identify its project profile;
2. reference the relevant CORE rules;
3. define lifecycle, states, permissions, documents and approvals;
4. identify launch or future scope;
5. include error and audit behaviour;
6. pass the required diagnostic and build gates.

### 7.3 Prohibited deviation

No Project Extension may:

- silently change a core state meaning;
- bypass tenant isolation;
- destructively overwrite issued records;
- remove auditability;
- create approval without evidence;
- introduce a dead navigation destination;
- require premature information without a documented gate;
- report success after partial failure.

## 8. Implementation references

Every future implementation document, issue, branch or pull request should carry a reference block similar to:

```text
Project profile: HelioCoreOS Solar EPC
Change type: Project Extension
Core references:
- CORE-CTX-001
- CORE-NAV-001
- CORE-STATE-001
- CORE-DOC-001
- CORE-APP-001
- CORE-FAIL-001
Launch scope: Yes / No
```

This ensures that additions remain visibly separate from the protected core while remaining traceable to it.

## 9. Diagnostic gate

Before a capability is considered implemented, it must pass:

- route and navigation review;
- location, breadcrumb and back-path review;
- role and tenant isolation review;
- required/optional field review;
- empty, loading, error and not-found states;
- state transition validation;
- document and approval behaviour where applicable;
- partial-failure review;
- activity and audit review;
- lint;
- TypeScript check;
- production build;
- end-to-end workflow test.

## 10. Governing principle

> The core is protected. Project additions are explicit. Every addition references the core it implements. No convenience, deadline or module-specific shortcut may silently weaken context, integrity, governance, security or auditability.
