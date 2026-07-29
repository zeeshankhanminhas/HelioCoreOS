# HelioCoreOS Constitution

**Version:** 1.0.0  
**Status:** Governing document  
**Framework:** Verilogix  
**Applies to:** Product strategy, architecture, database design, interface design, implementation, testing, documentation, deployment, and future extensions.

---

## 1. Constitutional purpose

HelioCoreOS is a portfolio-grade Solar EPC operating system. It exists to demonstrate how a fragmented solar project lifecycle can be converted into a governed, traceable, decision-ready operating model.

It is not a generic CRM, a collection of dashboards, or a decorative software prototype. Every part of the product must support the controlled movement of a Solar EPC project from commercial qualification through survey, design, procurement, installation, commissioning, handover, and completion.

The constitution protects the project from:

- uncontrolled feature growth;
- disconnected CRUD screens;
- duplicated or contradictory data;
- visually impressive but operationally empty dashboards;
- weak security and tenancy boundaries;
- undocumented decisions;
- premature complexity;
- building features that do not strengthen the portfolio story.

When implementation choices conflict, this document takes precedence over convenience.

---

## 2. Product mandate

HelioCoreOS shall provide one operational source of truth for Solar EPC delivery.

The system must make it possible to answer, with evidence:

1. What stage is each project in?
2. What must happen next?
3. Who owns the next action?
4. What is blocked, late, missing, or at risk?
5. Which commercial, technical, procurement, installation, quality, commissioning, and handover records support the current status?
6. What decision was made, by whom, and on what evidence?

A feature that cannot improve one or more of these answers requires explicit justification before it enters a sprint.

---

## 3. Verilogix operating doctrine

Every material capability must follow the Verilogix control pattern:

> **Assessment → Evidence → Document → Decision → Completion**

### 3.1 Assessment

The system determines the present condition, requirement, risk, or readiness of the work.

### 3.2 Evidence

The assessment must be supported by structured data, an uploaded artefact, an accountable user action, or another traceable source.

### 3.3 Document

Where the business process requires a formal record, the system must generate, store, reference, or govern that record.

### 3.4 Decision

A named role must approve, reject, return, hold, escalate, or advance the work.

### 3.5 Completion

The system records the outcome, timestamp, actor, resulting state, and any next obligation.

No workflow may be considered complete merely because a form was submitted.

---

## 4. Constitutional principles

### Article I — Workflow before interface

The operational workflow must be defined before the screen is designed. Pages must represent real business stages, decisions, responsibilities, and evidence.

### Article II — One source of truth

Each business concept must have one authoritative record. Duplicate state stored across unrelated tables, components, or documents is prohibited unless the duplication is deliberate, documented, and synchronised.

### Article III — Evidence before status

A project status must not advance solely because a user selected a value from a dropdown. Stage progression must be tied to defined readiness conditions and required evidence.

### Article IV — Decisions must be attributable

Material approvals, rejections, overrides, escalations, and stage changes must identify the actor and timestamp and must be represented in the activity history.

### Article V — Security is structural

Authentication, organisation tenancy, role boundaries, Row Level Security, secrets management, and safe server/client separation are foundational requirements, not later enhancements.

### Article VI — Simplicity earns complexity

The system shall begin with the smallest architecture that can correctly express the operational model. Complexity may be introduced only when an evidenced requirement cannot be handled cleanly by the existing design.

### Article VII — Modules must connect

A module is not complete if it functions only as an isolated list and form. Customers, sites, projects, tasks, documents, risks, decisions, and activity records must contribute to the same project operating picture.

### Article VIII — Dashboards must be truthful

A metric may appear only when its definition, source, filter, and state logic are clear. Placeholder numbers presented as operational facts are prohibited.

### Article IX — Portfolio value matters

Every sprint must strengthen at least one demonstrable capability: systems analysis, workflow governance, data modelling, security, application architecture, operational UX, analytics, or delivery discipline.

### Article X — Documentation is part of the product

Schema intent, business rules, stage gates, architectural decisions, setup instructions, and known limitations must be documented in the repository as they are introduced.

---

## 5. Governance domains

Every material requirement, feature, or change must be assessed across the following domains.

| Domain | Constitutional question |
|---|---|
| Business | What Solar EPC problem or decision does this solve? |
| Operations | Where does it sit in the end-to-end delivery workflow? |
| Technical | Is the implementation maintainable, typed, testable, and appropriately simple? |
| Data | What is the authoritative record, ownership boundary, validation rule, and lifecycle? |
| Security | Who may see or change it, and how is that enforced? |
| Compliance | What audit, privacy, contractual, or evidence obligations apply? |
| Experience | Can the intended role understand the state and next action without interpretation? |
| Trust | Can a reviewer verify how a status, KPI, or decision was produced? |
| Visual | Does the interface preserve HelioCoreOS clarity, hierarchy, and restraint? |
| Portfolio | What capability does this prove to an employer, client, or collaborator? |

A change with a serious unresolved issue in any relevant domain must not be described as complete.

---

## 6. Solar EPC lifecycle model

The principal project lifecycle is:

1. **Qualification**
2. **Survey**
3. **Design**
4. **Commercial**
5. **Procurement**
6. **Installation**
7. **Commissioning**
8. **Handover**
9. **Complete**

`On Hold` is a controlled exception state and not a normal delivery stage.

### 6.1 Stage-gate rule

Each stage must eventually define:

- entry conditions;
- required assessment;
- required structured data;
- required evidence or documents;
- accountable role;
- approval or decision rule;
- exit conditions;
- resulting tasks or downstream obligations;
- permitted exception or override process.

Until a stage gate is implemented, the UI must not imply that a simple status update represents full operational readiness.

### 6.2 Progressive implementation

The complete lifecycle may be delivered over several sprints, but each implemented slice must be vertically coherent. A smaller working workflow is preferable to many disconnected pages.

---

## 7. Core domain boundaries

The initial constitutional domain model consists of:

- **Organisation** — tenant and ownership boundary;
- **Profile** — authenticated user identity and role;
- **Customer** — contracting or client entity;
- **Site** — physical delivery location;
- **Project** — governed Solar EPC delivery record;
- **Task** — accountable action linked to delivery;
- **Document** — governed evidence or project artefact;
- **Activity Log** — immutable operational history where practical.

Future entities may include opportunities, surveys, designs, equipment schedules, procurement packages, installations, inspections, defects, commissioning tests, handover packs, risks, approvals, and change controls.

New entities require a defined owner, purpose, relationship, lifecycle, and access rule before implementation.

---

## 8. Data constitution

### 8.1 PostgreSQL is authoritative

Supabase PostgreSQL is the authoritative operational datastore. UI state, local storage, and generated documents may support the experience but must not silently become competing sources of truth.

### 8.2 Organisation isolation

All tenant-owned operational records must carry or inherit an organisation boundary. Row Level Security must enforce access independently of the interface.

### 8.3 Referential integrity

Relationships must be enforced using database constraints where possible. Orphaned project records and free-text substitutes for governed relationships should be avoided.

### 8.4 Controlled vocabularies

Business-critical states such as project status, risk status, role, task state, and document state must use controlled values. Changes to these values require review of downstream logic and migrations.

### 8.5 Migration discipline

All schema changes must be represented by ordered migration files. Production or shared schemas must not depend on undocumented manual edits.

Migrations should be safe, reviewable, and preferably idempotent where operationally appropriate. Destructive migrations require an explicit rationale and recovery plan.

### 8.6 Auditability

Material project changes must generate an activity record or equivalent audit evidence. Silent state changes are prohibited for governed actions.

---

## 9. Security constitution

1. Supabase Auth is the identity authority.
2. Secrets must never be committed to GitHub.
3. `.env.local`, service-role keys, secret keys, database passwords, and connection credentials remain private.
4. Public publishable keys may be used only with effective Row Level Security.
5. Server-only privileges must never be exposed to browser code.
6. Protected pages must verify the active session on the server where appropriate.
7. Role checks in the interface are usability controls; database policies remain the security boundary.
8. Users must not be able to assign themselves privileged roles without a governed administrative path.
9. File storage policies must align with organisation and project access.
10. Security shortcuts taken for a demo must be clearly isolated, documented, and removed before the feature is called complete.

---

## 10. Role model

Initial roles are:

- **Executive** — portfolio visibility, governance, and approved administrative control;
- **Project Manager** — project coordination, decisions, assignments, and delivery control;
- **Design Engineer** — technical inputs, design evidence, and technical readiness;
- **Site Supervisor** — site execution, installation evidence, quality observations, and field progress.

Role permissions must reflect accountable work rather than job-title decoration.

The system should support least privilege while retaining a clear demo path for the portfolio owner.

---

## 11. Architecture constitution

The approved baseline is:

- Next.js App Router;
- TypeScript;
- Tailwind CSS;
- shadcn/ui where useful;
- Supabase Auth;
- Supabase PostgreSQL;
- Supabase Storage;
- Supabase Row Level Security;
- Vercel deployment;
- GitHub source control.

### 11.1 Architectural rules

- Prefer Server Components for server-readable application data.
- Use Client Components only when browser interaction requires them.
- Keep Supabase browser and server clients separate.
- Validate untrusted inputs at the application boundary.
- Keep domain logic out of oversized page components.
- Avoid introducing a new library when the platform or current stack solves the problem adequately.
- Do not add microservices, queues, event buses, or additional databases without evidenced need.
- Use typed interfaces and generated database types when the schema stabilises.
- Errors must be handled intentionally and must not expose secrets or sensitive internals.

---

## 12. Experience and visual constitution

HelioCoreOS must feel like a precise operational instrument.

### 12.1 Visual language

- editorial minimalism;
- generous whitespace;
- strong hierarchy;
- neutral surfaces;
- restrained solar accent colour;
- clear technical typography;
- no decorative gradients, excessive shadows, glass effects, or novelty UI;
- no generic stock photography;
- no human imagery unless a future evidence-based use case explicitly requires it;
- diagrams, equipment, plans, technical objects, site evidence, and operational data are preferred.

### 12.2 Interaction rules

- Every primary screen must show context, present state, and next useful action.
- Empty states must explain what belongs there and how it enters the workflow.
- Forms must be grouped according to operational decisions, not database columns.
- Destructive actions require clear confirmation.
- Mobile layouts must be intentionally designed, not merely stacked desktop layouts.
- Accessibility, keyboard usability, labels, focus states, and contrast are acceptance criteria.

---

## 13. Sprint governance

Every sprint must declare:

1. **Goal** — the operational capability produced;
2. **Problem** — the specific failure, gap, or decision being addressed;
3. **Scope** — included work;
4. **Non-scope** — explicitly excluded work;
5. **Data impact** — schema, policies, migrations, and data ownership;
6. **Role impact** — who can view, create, change, approve, or delete;
7. **Evidence** — how the completed capability will be demonstrated;
8. **Acceptance criteria** — objective completion conditions;
9. **Risks** — security, migration, dependency, or UX risks;
10. **Constitution check** — confirmation that the change follows this document.

### 13.1 Sprint sizing

A sprint should deliver one coherent vertical slice. It may include database, security, server logic, interface, and documentation necessary to prove that slice.

A sprint should not be expanded merely because related ideas are attractive.

### 13.2 Scope control

New ideas discovered during a sprint belong in a backlog unless they are required to satisfy an existing acceptance criterion or correct a material defect.

---

## 14. Definition of Ready

Work may enter active implementation when:

- the user or business problem is clear;
- the relevant Solar EPC stage is identified;
- the accountable role is known;
- the authoritative data record is identified;
- access rules are understood;
- acceptance criteria are testable;
- dependencies are available or explicitly mocked;
- the proposed solution does not contradict an existing domain boundary.

If confidence in the proposed workflow or architecture is below **85%**, the item remains in assessment or requires a documented assumption.

---

## 15. Definition of Done

A feature is done only when all applicable conditions are met:

- it supports the declared operational outcome;
- data persists correctly;
- validation is implemented;
- authentication and authorisation are enforced;
- Row Level Security has been considered and tested;
- loading, empty, success, and error states are handled;
- the interface works at intended desktop and mobile sizes;
- relevant activity or audit evidence is recorded;
- no secret is committed or exposed;
- linting and type checks pass;
- the critical flow is manually verified end to end;
- migrations and setup changes are documented;
- the README or supporting documentation is updated where needed;
- the portfolio demonstration can explain the problem, design, control logic, and result;
- no unresolved constitutional violation remains.

Code being present is not sufficient evidence of completion.

---

## 16. Decision records

Material architectural or operational decisions should be recorded in `docs/decisions` using concise Architecture Decision Records.

A decision record should state:

- context;
- decision;
- alternatives considered;
- consequences;
- date and status.

Decisions that introduce a new platform, alter tenancy, change lifecycle semantics, weaken security, or create irreversible data consequences require a record.

---

## 17. Quality gates

Before merging or declaring a sprint complete, the project should pass the following gates where applicable:

1. **Business gate** — solves the declared Solar EPC problem;
2. **Workflow gate** — connects assessment, evidence, decision, and completion;
3. **Data gate** — schema and relationships are coherent;
4. **Security gate** — access is enforced at the correct boundary;
5. **Experience gate** — state and next action are understandable;
6. **Technical gate** — lint, types, build, and critical runtime flow pass;
7. **Trust gate** — claims, metrics, and status can be traced to evidence;
8. **Portfolio gate** — the capability can be clearly demonstrated and explained.

A failed mandatory gate blocks completion.

---

## 18. Prohibited shortcuts

The following are prohibited unless explicitly documented as temporary scaffolding:

- hard-coded operational KPIs presented as live data;
- bypassing Row Level Security for convenience;
- committing secrets;
- using service-role credentials in client code;
- creating tables manually without a migration record;
- adding status fields without defined semantics;
- implementing approval buttons with no persisted decision evidence;
- building disconnected modules that do not contribute to a project view;
- duplicating customer, site, project, or user identity as uncontrolled free text;
- treating visual completion as operational completion;
- replacing a required backend rule with a disabled button;
- merging known broken flows into the primary branch without documentation.

---

## 19. Sprint 1 constitutional mandate

Sprint 1 shall establish the governed application foundation:

- Supabase email authentication;
- session persistence;
- protected application routes;
- first-user organisation and profile bootstrap;
- safe default role assignment;
- application shell and navigation;
- dashboard summary cards sourced from Supabase;
- honest empty states for Customers, Sites, Projects, Tasks, and Documents;
- logout;
- documented setup and verification path.

Sprint 1 shall not attempt to implement the complete Solar EPC lifecycle. Its purpose is to establish identity, tenancy, navigation, data access, and a truthful operational foundation upon which later vertical workflows can be built.

---

## 20. Amendment process

This constitution may evolve, but it must not drift silently.

An amendment must:

1. identify the limitation or new requirement;
2. describe the proposed change;
3. explain its effect on existing architecture and workflows;
4. update the version number;
5. be committed with a message that identifies it as a constitutional amendment.

### Versioning

- **Patch** — clarification with no material governance change;
- **Minor** — new article, rule, or domain that preserves the existing mandate;
- **Major** — change to product identity, lifecycle, tenancy, security posture, or governing doctrine.

---

## 21. Final authority

The governing test for every contribution is:

> Does this change make HelioCoreOS a more coherent, secure, evidence-led, and decision-ready Solar EPC operating system?

If the answer is unclear, the work returns to assessment.
