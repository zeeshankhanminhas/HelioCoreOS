# HelioCoreOS

A portfolio-grade Solar EPC operating system connecting commercial intake, governed documents, approvals, delivery workflows, commissioning, handover, and operations.

## Project governance

HelioCoreOS is governed by the [HelioCoreOS Constitution](./docs/CONSTITUTION.md), the [Solar EPC Launch Scope](./docs/LAUNCH-SCOPE.md), and the [UI Component Strategy](./docs/UI-COMPONENT-STRATEGY.md).

The constitution is the protected core. It defines the rules that every project addition must inherit, including:

- product scope and change control;
- navigation and page context;
- universal object states;
- document generation and revision control;
- approval routes and audit history;
- architecture, tenancy, and security;
- interface and visual decisions;
- diagnostic, testing, and deployment gates.

Solar EPC capabilities are implemented as project additions. They may extend the core but must not silently redefine or bypass it.

![HelioCoreOS operating system blueprint](./docs/assets/heliocoreos-os-blueprint-v1.svg)

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- selective shadcn/ui primitives
- Supabase Auth, PostgreSQL, Storage, and Row Level Security
- Vercel
- GitHub

## UI architecture

Tailwind CSS remains the styling foundation. shadcn/ui is adopted selectively for accessible interaction primitives such as dialogs, drawers, menus, popovers, comboboxes, date controls, tabs, notifications, skeletons and progress indicators.

The workspace shell, navigation, record hierarchy, lifecycle controls, operational cards, workflow gates, audit surfaces and Solar EPC workspaces remain custom HelioCoreOS components. The UI library must not determine the product identity or weaken governance visibility.

The visual language remains:

`Apple-like simplicity + The Ordinary-like clarity + enterprise governance + Solar EPC precision`

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add the Project URL and Publishable Key from the Supabase **Connect** dialog.
3. Run `npm install`.
4. Run `npm run dev`.

## Database

The schema is stored in `supabase/migrations`. Apply migrations with the Supabase CLI or the Supabase SQL editor.

All schema changes must be represented by ordered migration files and must comply with the Constitution and the Solar EPC project profile.

Never commit `.env.local` or any service-role key, secret, database password, or private connection credential.

## Current delivery stage

**Launch Foundation — Commercial Intake and Governance Diagnostic**

### Implemented

- authenticated, tenant-isolated workspace;
- organisation, profile, role, team, and subscription foundation;
- dashboard shell and responsive primary navigation;
- customer and site registers;
- opportunity register and opportunity creation;
- optional customer and site assignment during opportunity intake;
- customer readiness checklist and readiness scoring;
- governed indicative proposal lifecycle and issue gates;
- activity logging for key commercial actions;
- protected Constitution, launch scope, project-extension rules and UI component strategy;
- initial operating-system blueprint covering navigation, states, documents, approvals, and auditability.

### Current diagnostic sprint

The current sprint is validating and strengthening the implemented commercial workflow, with priority given to:

- route and page inventory;
- breadcrumbs and visible location context on every page;
- reliable back and parent navigation;
- contextual page actions;
- loading, empty, error, and not-found states;
- prevention of silent and partial workflow failures;
- database and UI state consistency;
- selective component standardisation without a generic dashboard appearance;
- lint, typecheck, build, and end-to-end workflow gates.

### Launch V1 scope

The required launch path is:

`Enquiry / Lead → Opportunity → Customer assignment → Site assignment → Customer Readiness → Indicative Proposal`

Customer and Site may be assigned after the Opportunity is created. They are not mandatory upfront, but both are required before an indicative proposal can be issued.

### Planned after the launch foundation is proven

- structured survey;
- detailed quotation;
- contract acceptance;
- project conversion;
- document generation and revision management;
- configurable approval routes;
- engineering, procurement, installation, quality, and commissioning control;
- handover packs;
- operations and maintenance.

These remain project additions and must reference the protected core rather than modifying it implicitly.
