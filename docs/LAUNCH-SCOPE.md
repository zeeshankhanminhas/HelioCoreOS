# HelioCoreOS launch scope

> Governing reference: [HelioCoreOS Constitution](./CONSTITUTION.md)  
> UI reference: [UI Component Strategy](./UI-COMPONENT-STRATEGY.md)  
> Project profile: HelioCoreOS Solar EPC  
> Change classification: Project Extension  
> Core references: CORE-CTX-001, CORE-NAV-001, CORE-DATA-001, CORE-STATE-001, CORE-DOC-001, CORE-APP-001, CORE-AUDIT-001, CORE-FAIL-001, CORE-UX-001

## Product promise

HelioCoreOS launches as the smallest complete and governed commercial foundation for a Solar EPC workflow. It must allow a subscribed organisation to control access, capture and qualify demand, assign customer and site context progressively, assess readiness, and prepare an indicative proposal without introducing later delivery complexity prematurely.

The launch scope extends the Constitution. It does not redefine the protected core.

## Reference lifecycle

The complete Solar EPC lifecycle is:

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

Customer and Site are flexible relationships. They may be assigned after an Opportunity is created, but later workflow gates may require them before progression.

![HelioCoreOS operating system blueprint](./assets/heliocoreos-os-blueprint-v1.svg)

## Launch V1 boundary

Launch V1 is the commercial foundation only.

It includes:

1. organisation authentication and tenant isolation;
2. four fixed roles: Owner, Admin, Manager and Member;
3. simple teams and access visibility;
4. Opportunity creation and register;
5. Customer register and optional Opportunity assignment;
6. Site register and optional Opportunity assignment;
7. Customer Readiness and evidence tracking;
8. Indicative Proposal creation and governed lifecycle management;
9. activity history and audit visibility;
10. consistent breadcrumbs, parent paths and contextual actions;
11. foundational document metadata, states and approval references required by implemented workflows;
12. selective use of accessible UI primitives without surrendering the HelioCoreOS visual or operating hierarchy.

An Opportunity must be creatable without a Customer or Site. Only the minimum information required for commercial capture should be mandatory at intake.

## Launch navigation

Only operational destinations should appear as normal live navigation.

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

A future or incomplete destination must be hidden or clearly marked as planned. It must not appear to be a working operational module.

## Platform foundation

The launch platform supports:

- one organisation boundary per workspace;
- Supabase Row Level Security for tenant isolation;
- four fixed roles;
- simple teams;
- active, invited and suspended user states;
- manually governed subscription plan, status, currency and user limit;
- universal page context and navigation rules;
- universal state references;
- governed document and approval foundations;
- activity and audit history;
- explicit error handling and partial-failure detection.

The launch does not include custom roles, granular permission builders, automated payment collection, multi-office hierarchy, SSO or white labelling.

## UI implementation boundary

Tailwind CSS is the launch styling foundation. shadcn/ui may be introduced selectively for interaction primitives such as dialogs, drawers, menus, popovers, comboboxes, date controls, tabs, notifications, skeletons and progress indicators.

The workspace shell, navigation, breadcrumbs, record hierarchy, lifecycle controls, operational summaries, workflow gates, audit surfaces and Solar EPC workspaces remain custom HelioCoreOS components.

Launch UI work must preserve:

- Apple-like simplicity;
- The Ordinary-like clarity;
- enterprise governance;
- Solar EPC and industrial precision;
- accessible keyboard and screen-reader behaviour;
- explicit loading, empty, error, disabled and destructive states;
- restrained decoration with no generic SaaS visual language.

Introducing shadcn/ui does not authorise a wholesale redesign or unnecessary replacement of stable custom components.

## Future project additions

The following remain outside Launch V1 until the core commercial workflow is proven with real users:

- detailed technical and commercial quote;
- contract execution;
- automatic Opportunity-to-Project conversion;
- full survey workflow;
- engineering calculation engines;
- approved BOM;
- supplier pricing;
- procurement and inventory;
- vendor and subcontractor portals;
- civil and roof-access work packages;
- installation management;
- quality management;
- testing and commissioning;
- handover packs;
- O&M and asset management;
- net-metering automation;
- customer and supplier portals;
- public APIs and bespoke integrations;
- advanced reporting and analytics;
- automated recurring billing.

These are separate Project Additions. Each must reference the Core Constitution and define its own lifecycle, states, documents, approvals, permissions, audit behaviour and failure handling.

## Launch readiness test

A release is launch-ready only when a new organisation can:

1. authenticate and see only its own records;
2. see its subscription and available seats;
3. see its users, roles, statuses and teams;
4. understand its current location on every operational page;
5. navigate back to the correct parent context;
6. create an Opportunity without first creating a Customer or Site;
7. assign or create a Customer later;
8. assign or create a Site later;
9. request and validate the minimum Customer Readiness evidence;
10. create and manage an Indicative Proposal;
11. see clear object and document states;
12. see approval requirements where applicable;
13. recover visibly from failed or partially completed actions;
14. review the resulting activity and audit history;
15. operate all interactive components by keyboard with clear focus and state feedback.

## Diagnostic and build gate

Before a launch capability is considered complete, it must pass:

- route inventory;
- breadcrumb and back-path review;
- contextual action review;
- role and tenant isolation review;
- required versus optional field review;
- empty, loading, error and not-found states;
- state-transition validation;
- document and approval behaviour where applicable;
- partial-failure and recovery review;
- activity and audit review;
- accessibility and keyboard review for adopted UI primitives;
- desktop and mobile visual consistency review;
- `npm run lint`;
- `npm run typecheck`;
- `npm run build`;
- end-to-end workflow testing.

## Complexity rule

No deferred module enters the launch scope unless the current end-to-end commercial workflow cannot be completed correctly without it.

No dependency or UI component enters the launch branch without a demonstrated workflow, accessibility, consistency or maintenance benefit.

No Project Addition may alter or bypass a constitutional core rule. Any change to a core rule requires a formal constitutional amendment before implementation.
