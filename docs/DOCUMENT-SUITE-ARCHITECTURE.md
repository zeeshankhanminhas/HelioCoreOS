# HelioCoreOS Document Suite Architecture

Status: Governing Project Addition  
Applies to: HelioCoreOS Solar EPC Profile  
Parent governance: [HelioCoreOS Constitution](./CONSTITUTION.md)  
Information architecture: [HelioCoreOS Information Architecture](./INFORMATION-ARCHITECTURE.md)  
Interaction conventions: [UI Interaction Surface Conventions](./UI-INTERACTION-SURFACE-CONVENTIONS.md)  
Enterprise floorplans: [Enterprise Floorplan Conventions](./ENTERPRISE-FLOORPLAN-CONVENTIONS.md)

## 1. Purpose

HelioCoreOS requires a governed Document Suite rather than a file-upload area.

The Document Suite controls the full lifecycle of commercial, engineering, procurement, quality, commissioning and handover documents while preserving one core IA rule:

> Documents are created, reviewed and used inside the workflow that owns them. The global Documents module is the registry and control centre, not a parallel workflow.

The suite must make it possible to answer:

1. What is this document?
2. Which business record and workflow owns it?
3. Which revision is authoritative?
4. What state is it in?
5. Who owns the next action?
6. What evidence, approvals and comments exist?
7. Has it been issued externally?
8. Has it been superseded?
9. Can the exact historical revision be reproduced and audited?

## 2. Product boundary

The Document Suite is a HelioCoreOS governance capability, not a generic cloud drive.

It must not become:

- a folder browser that ignores workflow state;
- a duplicate of Supabase Storage;
- a second Project workspace;
- a generic document editor detached from governed records;
- an unmanaged attachment bucket;
- a parallel Approvals application.

Storage is an implementation detail. The governed document record is the product object.

## 3. Canonical document object

A governed document should support, where relevant:

- document ID;
- document type;
- title;
- document reference;
- organisation;
- customer;
- site;
- opportunity;
- project;
- owning workflow;
- source template and template revision;
- owner;
- author / generator;
- reviewer;
- approver;
- current revision;
- lifecycle state;
- confidentiality / visibility;
- issue purpose;
- issue recipient or distribution list;
- issued-at timestamp;
- expiry date where applicable;
- source file;
- rendered PDF or controlled output;
- related calculation / engineering revision where applicable;
- supersedes / superseded-by relationships;
- comments / change requests;
- approval history;
- issue history;
- audit events.

The product must distinguish the **document identity** from its **revisions**.

Example:

```text
Document
SLD-PRJ-014

Revision 1
Draft → Review → Changes Requested

Revision 2
Draft → Review → Approved → Issued

Revision 3
Draft → Review → Approved → Issued
Supersedes Revision 2
```

## 4. Canonical lifecycle

The target lifecycle is:

```text
Draft
→ Review
→ Changes Requested
→ Draft / Revised
→ Approved
→ Issued
→ Superseded
→ Archived
```

Not every document type requires every state, but lifecycle differences must be explicit and governed.

### Draft

The working revision may change. It is not authoritative outside its owning workflow.

### Review

The revision is frozen for the current review cycle. Review comments and requested changes are controlled against that revision.

### Changes Requested

The reviewer has rejected the current revision for amendment without destroying the review history.

### Approved

The revision has passed its governed approval route but has not necessarily been distributed externally.

### Issued

The approved revision has been formally released for its defined purpose or recipient.

### Superseded

A later governed revision has replaced this revision as authoritative. Historical access remains read-only.

### Archived

The document is retained for record purposes but no longer belongs in active operational work.

## 5. What this replaces

This architecture supersedes the idea that the current basic database states are the final product lifecycle.

Existing implementation:

```text
draft
in_review
approved
superseded
```

Target governed model:

```text
Draft
Review
Changes Requested
Approved
Issued
Superseded
Archived
```

The existing database remains a foundation until a dedicated migration is designed and tested. This specification does not silently change production data.

It also replaces:

- file upload as the primary document action;
- a global Documents page as the only place to operate documents;
- approval state stored only as a document status;
- overwriting the latest file in place;
- manual naming without document-reference governance;
- ambiguous "latest" links;
- attaching uncontrolled copies of the same document to multiple workflows.

## 6. Dual-context information architecture

Documents exist in two complementary contexts.

### 6.1 Workflow context — primary operating context

The user should see and act on a document where the work happens.

Examples:

```text
Opportunity
└── Proposal
    ├── Indicative Proposal
    └── Client Quote

Project
├── Engineering
│   ├── SLD
│   ├── Array Layout
│   ├── Structural Calculation
│   ├── Generation Report
│   └── Design Calculation Report
├── Procurement
│   ├── RFQ
│   ├── Purchase Order
│   └── Supplier Submittal
├── Installation
│   ├── RAMS
│   ├── Method Statement
│   └── Permit / Inspection Record
├── Commissioning
│   ├── Test Sheet
│   ├── Witness Record
│   └── Commissioning Certificate
└── Handover
    ├── As-built Drawing
    ├── O&M Manual
    ├── Training Record
    └── Handover Pack
```

A user should not leave Engineering simply to review an SLD or leave Commissioning simply to approve a test certificate.

### 6.2 Global Documents Registry — control context

The Documents module is a cross-record registry for authorised users.

It should support:

- search;
- filtering;
- status control;
- revision visibility;
- issue status;
- expiry monitoring;
- ownership;
- workflow / Project context;
- document type;
- approvals awaiting action;
- superseded documents;
- audit access;
- controlled download.

The Registry links back to the document's owning workflow rather than reimplementing the workflow.

## 7. Canonical Document Suite surfaces

The suite uses existing HelioCoreOS floorplans instead of inventing a new interface family.

### 7.1 Document Registry

Floorplan: `Register / Worklist`

Purpose: scan, search, filter and control documents across records.

Suggested columns:

```text
Reference
Title
Type
Project / Opportunity
Workflow
Revision
State
Owner
Next action
Issue / expiry signal
Updated
```

Primary identity opens the governed document record or owning workflow. Quick Preview opens a Sheet.

### 7.2 Workflow Document Panel

Floorplan: embedded governed workflow section.

Purpose: show only the documents relevant to the active workflow.

Examples:

```text
Engineering Outputs
SLD                    Rev 2   Approved   [View]
Array Layout           Rev 3   Review     [Review]
Generation Report      Rev 1   Draft      [Continue]
Structural Calculation —       Missing    [Create]
```

The panel must expose the next permitted action, not merely filenames.

### 7.3 Document 360 / controlled record

Floorplan: `Object 360` when a document has sufficient independent identity and history.

Use for documents where the user needs sustained control of:

- revision history;
- review cycles;
- approvals;
- issue history;
- distribution;
- related source data;
- controlled outputs;
- supersession;
- audit.

A lightweight document may remain within its workflow with a contextual Sheet rather than requiring a full Document 360 route.

### 7.4 Document Review workspace

Floorplan: `Governed Workflow`

Purpose: review one immutable revision with comments, evidence and decision context.

Recommended composition:

```text
Document identity / revision / state
Revision preview
Review comments / requested changes
Source evidence / linked calculations
Change history
Decision context
[Request changes] [Approve]
```

Review actions must target an explicit revision.

### 7.5 Document Preview / Evidence Sheet

Surface: Right Sheet

Use for contextual inspection when the user must preserve the parent workflow.

Examples:

- inspect datasheet;
- preview approved drawing;
- inspect prior revision;
- inspect issue history;
- inspect document metadata.

A Sheet is not the correct surface for sustained authoring or complex review.

## 8. Template system

Templates are governed source assets, not static files copied forever.

Each template should support:

- template ID;
- template type;
- name;
- revision;
- organisation applicability;
- document type applicability;
- source format;
- data placeholders;
- required sections;
- optional sections;
- effective-from date;
- superseded date;
- approval / verification state;
- owner.

A generated document must preserve the template revision used so it remains reproducible after later template changes.

## 9. Document generation

Where structured HelioCoreOS data exists, document generation should prefer governed data binding over manual re-entry.

Examples:

### Indicative Proposal

Inputs may include:

- Customer;
- Site;
- Opportunity reference;
- proposed PV capacity;
- proposed BESS capacity;
- commercial assumptions;
- validity date;
- exclusions.

### Engineering Calculation Report

Inputs may include:

- approved Scenario;
- equipment revisions;
- HelioCalc engine version;
- design basis;
- string / MPPT configuration;
- electrical margins;
- findings;
- performance outputs;
- reviewer / approver.

### Purchase Order

Inputs may include:

- supplier;
- approved BOM items;
- quantity;
- unit / commercial price;
- delivery terms;
- project/site;
- approval reference.

### Handover Pack

Inputs may aggregate controlled child documents rather than flattening unmanaged copies.

Generated content must never imply that a missing or estimated value is governed source data.

## 10. Source-of-truth rule

The Document Suite must preserve the relationship between a document and its authoritative source records.

Examples:

```text
Engineering Calculation Report
→ Approved Engineering Scenario Rev 4
→ HelioCalc result Calc Rev 7
→ Equipment datasheet revisions

Purchase Order
→ Approved BOM Rev 3
→ Supplier commercial selection

Commissioning Certificate
→ Completed governed test records
```

Changing the source record after document generation must not silently rewrite an approved or issued document.

A material source change creates a stale signal, amendment workflow or new document revision depending on document type.

## 11. Revision model

Every controlled change after a review/approval boundary creates a new revision.

A revision should preserve:

- revision number or code;
- parent document ID;
- source template revision;
- author;
- created-at;
- content fingerprint / hash where practical;
- source-record revision references;
- file / rendered output;
- review state;
- comments;
- approval result;
- issue status;
- supersession state.

Approved or issued revisions are immutable.

Corrections create a new revision rather than editing history in place.

## 12. Review and changes-requested model

Review is a workflow, not a status badge.

Reviewers should be able to:

- see the exact revision being reviewed;
- inspect relevant source evidence without leaving context;
- add comments tied to the revision;
- request changes with a meaningful reason;
- distinguish resolved and unresolved comments;
- approve when all required conditions are satisfied.

`Request Changes` must create an auditable transition and preserve the prior review decision.

The author creates or updates the next working revision rather than mutating the reviewed revision.

## 13. Approval model

Approval belongs to the same governance model as the global Approvals Queue.

Record context:

- current approval state;
- approver / role;
- blockers;
- next action.

Global queue:

- documents awaiting the current user's decision;
- links directly into the relevant review mode;
- does not duplicate document workflow.

Approval must record:

- revision;
- approver;
- timestamp;
- decision;
- comments / reason where required;
- applicable approval route;
- audit event.

## 14. Issue and distribution control

`Approved` and `Issued` are different states.

Issuing a document should capture, where relevant:

- issue purpose;
- recipient / distribution;
- issue date/time;
- issued by;
- approved source revision;
- controlled output delivered;
- transmittal/reference where applicable.

An issued revision must remain retrievable exactly as issued.

If a later revision becomes authoritative, the previous issued revision is superseded, not deleted.

## 15. Document types and workflow ownership

Initial type families should include:

### Commercial

- proposal;
- quotation;
- contract;
- variation;
- client approval;
- commercial schedule.

### Engineering

- site-survey report;
- design basis;
- SLD;
- array layout;
- string schedule;
- cable schedule;
- engineering calculation report;
- structural calculation;
- generation / performance report;
- manufacturer datasheet.

### Procurement

- RFQ;
- supplier quotation;
- technical submittal;
- purchase order;
- delivery note;
- goods receipt evidence.

### Installation / Quality

- RAMS;
- method statement;
- permit;
- inspection record;
- NCR;
- snag / punch record;
- test record.

### Commissioning / Handover

- commissioning plan;
- test sheet;
- witness record;
- commissioning certificate;
- as-built drawing;
- O&M manual;
- training record;
- warranty pack;
- handover certificate;
- final handover pack.

Document type is not only a category. It can determine lifecycle, template, approval route, naming convention, required source evidence and retention rules.

## 16. Naming and reference convention

Document references should be generated or validated by a documented rule rather than typed freely where governance matters.

Conceptual pattern:

```text
[Project]-[Discipline]-[Type]-[Sequence]-[Revision]

PRJ014-EL-SLD-001-R02
PRJ014-COM-QTE-002-R01
PRJ014-CX-TST-014-R03
```

Exact conventions may be organisation-configurable, but the system must preserve uniqueness and readability.

Display title and document reference are separate values.

## 17. UI interaction mapping

Use existing HelioCoreOS interaction conventions.

| Action | Surface |
| --- | --- |
| Quick document preview | Right Sheet |
| View metadata / issue history | Right Sheet |
| Create simple document from template | Dialog for minimal options, then workflow surface |
| Author complex controlled document | Full workflow / Object 360 |
| Review revision | Governed Review workspace |
| Add quick comment | Inline / contextual control |
| Request changes | Dialog requiring reason from Review workspace |
| Approve revision | Modal governed Dialog |
| Issue approved revision | Modal governed Dialog with distribution context |
| Supersede revision | Modal governed Dialog |
| Archive document | AlertDialog where consequences exist |
| Compare revisions | Dedicated comparison view or Wide Sheet for lightweight cases |

Do not author long documents inside Dialogs.

## 18. Action-placement convention

Actions must live with the object they affect.

Document-level actions:

- Create revision;
- Submit for review;
- Approve;
- Issue;
- Supersede.

Revision-level actions:

- Preview;
- Compare;
- Download controlled output;
- View comments;
- View audit.

Workflow-level actions:

- Create required document;
- Open current document;
- Resolve missing-document blocker.

Registry-level actions:

- Search;
- filter;
- change view;
- bulk export only where governance permits.

Do not place every document action in a single global toolbar.

## 19. Findings and blockers

Document governance should use the shared Message / Findings model.

Examples:

```text
BLOCKING
Engineering design cannot be submitted for approval.
Required SLD is missing.
[Create SLD]

BLOCKING
Handover cannot be completed.
Commissioning certificate is not issued.
[Open certificate]

WARNING
Supplier datasheet has been superseded by a newer verified revision.
[Review impact]
```

A document blocker must navigate to the owning document/workflow action.

## 20. Search and retrieval

Global search should index governed metadata, not only filenames.

Searchable fields may include:

- document reference;
- title;
- type;
- project;
- opportunity;
- customer;
- site;
- manufacturer / model for datasheets;
- owner;
- status;
- revision;
- issue recipient where permitted.

Search results must show context, for example:

```text
PRJ014-EL-SLD-001 · SLD · Rev 2 · Issued
Project PRJ-2026-014 · Packages Ltd Lahore
```

## 21. Permissions and visibility

Document access must respect organisation isolation and role/context permissions.

Potential visibility classes:

- internal;
- internal restricted;
- client-shareable;
- supplier-shareable;
- issued external;
- confidential commercial.

Visibility is not equivalent to lifecycle state.

A document may be Approved but still internal, or Issued to a defined recipient without becoming globally shareable.

## 22. Audit requirements

Every consequential document action should create an audit event.

Examples:

- document created;
- revision created;
- submitted for review;
- comment added;
- changes requested;
- review comment resolved;
- approved;
- rejected;
- issued;
- downloaded as controlled output where required;
- superseded;
- archived;
- visibility changed;
- source template changed for a new revision.

Audit events must identify actor, document, revision, time and business context.

## 23. Document Suite data model direction

The existing single `documents` table is a valid launch spine but is not sufficient for the final suite.

Future schema should separate concerns conceptually into entities such as:

```text
documents
document_revisions
document_templates
document_template_revisions
document_reviews
document_review_comments
document_approvals
document_issues
document_distributions
document_relationships
document_activity / shared audit log
```

Exact tables may be consolidated where appropriate, but document identity, revision, review, approval and issue history must not be collapsed into one mutable row.

No schema migration should be implemented until the workflow contract and transition model are tested.

## 24. Document Suite build programme

### DS1 — Registry and lifecycle foundation

- document identity;
- revision model;
- target lifecycle;
- Project/Opportunity/workflow relationships;
- controlled registry;
- preview Sheet;
- audit integration.

### DS2 — Template and generation foundation

- template registry;
- template revisions;
- structured data binding;
- controlled PDF/output generation;
- source provenance.

### DS3 — Review and change control

- submit for review;
- immutable review revision;
- comments;
- Request Changes;
- comment resolution;
- review history.

### DS4 — Approval and issue control

- approval routes;
- global Approval Queue integration;
- approved vs issued distinction;
- distribution / issue history;
- controlled downloads.

### DS5 — Workflow packs

- engineering outputs;
- procurement pack;
- commissioning pack;
- handover pack;
- completeness rules and blockers.

### DS6 — Revision comparison and expiry control

- material revision comparison;
- supersession;
- expiry/renewal monitoring;
- document-impact warnings.

### DS7 — Production hardening

- permissions;
- retention rules;
- observability;
- recovery;
- storage integrity;
- performance;
- security review.

## 25. UI quality gate

A Document Suite capability is not complete until a user can:

1. identify the document and authoritative revision;
2. identify the owning Project/Opportunity and workflow;
3. see current lifecycle state;
4. see the next permitted action;
5. inspect revision history;
6. review without losing source context;
7. request changes without destroying prior review history;
8. approve an explicit revision;
9. distinguish Approved from Issued;
10. retrieve the exact issued output later;
11. see what revision superseded an older one;
12. understand missing-document blockers;
13. search globally without losing workflow ownership;
14. recover from failed generation/upload without corrupting state;
15. audit all consequential actions.

## 26. Product decision

HelioCoreOS Document Suite is a governed workflow capability with a cross-record registry.

The rule is:

> Create and use documents where the work happens. Govern and retrieve them globally through the Documents Registry. Never separate the file from its revision, workflow, approval and issue history.

The target operating model is:

```text
Workflow need
→ Create / Generate
→ Draft revision
→ Review
→ Changes Requested (when needed)
→ Approved
→ Issued
→ Superseded / Archived
→ Searchable audited history
```

This architecture becomes the default for all future HelioCoreOS commercial, engineering, procurement, quality, commissioning and handover document work.