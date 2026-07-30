# Sprint 5 — Governed System Design

## Objective

Convert an approved Structured Site Survey into a controlled Solar PV and battery design record that engineering, procurement and delivery can trust.

## Governance contract

A System Design cannot begin until:

1. the Opportunity has a governed Site;
2. the Site Survey belongs to the same Organisation, Opportunity and Site;
3. the Site Survey status is `approved`.

Lifecycle:

`Draft → In Progress → Under Review → Approved`

An `Under Review` design may be rejected and returned to `In Progress`. An approved revision is locked. Future changes must be issued as a new revision rather than silently overwriting approved engineering.

## Controlled design content

- design basis and survey inheritance;
- module manufacturer, model, rating and quantity;
- calculated or confirmed array capacity;
- inverter manufacturer, model, quantity and capacity;
- automatic DC/AC ratio calculation;
- string and MPPT configuration;
- mounting system;
- battery equipment, quantity and usable capacity;
- annual generation, specific yield and performance ratio;
- export limitation and grid application control;
- single-line diagram;
- array layout drawing;
- structural calculations;
- generation report;
- assumptions, constraints and review note.

## Review gates

Submission for review and approval requires:

- complete PV module specification;
- complete inverter specification;
- array capacity;
- string configuration;
- mounting system;
- annual generation estimate;
- design basis and assumptions;
- single-line diagram URL;
- layout drawing URL;
- grid application reference when grid approval is required.

Approval is only permitted from `under_review`.

## Data integrity

The `commit_system_design` PostgreSQL RPC performs the design write and audit event in one transaction. A failure in either operation retains no partial workflow state.

Tenant isolation is enforced through RLS and explicit Organisation matching. Opportunity, Site and Survey relationships are revalidated server-side and again inside the database function.

## Runtime validation matrix

- draft save with partial information;
- blocked start without a Site;
- blocked start without an approved Site Survey;
- blocked cross-Site or cross-Opportunity Survey relationship;
- automatic array-capacity calculation;
- automatic DC/AC-ratio calculation;
- rejected decimal equipment quantities;
- blocked review when required engineering fields are incomplete;
- blocked grid-controlled review without application reference;
- approved only from `under_review`;
- rejection and rework path;
- approved-revision locking;
- forced RPC failure with zero partial persistence;
- tenant-isolation proof;
- desktop, mobile and keyboard review.

## Migration

`supabase/migrations/202607300200_governed_system_design.sql`

## Downstream handover

An approved design becomes the governed technical source for Sprint 6: BOM and Procurement. Procurement must consume equipment identities and quantities from the approved revision rather than re-keying uncontrolled values.
