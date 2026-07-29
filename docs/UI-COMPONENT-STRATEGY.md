# HelioCoreOS UI Component Strategy

Version: 1.0  
Status: Governing implementation standard  
Effective: 29 July 2026

## Purpose

HelioCoreOS uses a selective component-library strategy. The product must gain the accessibility, interaction quality and development speed of established primitives without inheriting a generic dashboard appearance.

## Decision

HelioCoreOS will use:

- Tailwind CSS as the styling foundation;
- shadcn/ui as a source of owned, editable interaction primitives;
- Radix-based accessibility behaviour supplied through those primitives;
- custom HelioCoreOS components for product identity, information hierarchy and operational workflows.

shadcn/ui is not the visual design system. Components copied into the repository become HelioCoreOS source code and must be adapted to the platform's tokens, hierarchy and governance rules.

## Approved shadcn/ui use

Use shadcn/ui where interaction complexity, keyboard behaviour or accessibility would be wasteful to rebuild:

- Dialog and Alert Dialog;
- Sheet and Drawer;
- Dropdown Menu and Context Menu;
- Popover and Tooltip;
- Command and Combobox;
- Calendar and Date Picker;
- Tabs and Accordion;
- Toast or Sonner notifications;
- Skeleton and Progress;
- form-control primitives;
- table primitives where they improve semantics and consistency.

## Custom HelioCoreOS components

The following remain product-owned and must not be replaced by default library compositions:

- workspace shell and primary navigation;
- breadcrumb and page-context system;
- record headers and lifecycle controls;
- KPI and operational summary cards;
- opportunity, readiness, proposal and project workspaces;
- audit timelines and approval history;
- workflow gates, blocker panels and decision surfaces;
- Solar EPC diagrams, engineering summaries and project cockpit views.

## Visual language

All components must preserve:

- Apple-like simplicity;
- The Ordinary-like clarity;
- enterprise governance;
- industrial and Solar EPC precision;
- restrained colour and decoration;
- clear hierarchy and generous whitespace;
- no generic SaaS gradients, excessive pills, glass effects or decorative shadows.

## Adoption rule

shadcn/ui will be introduced incrementally, starting before the Project Workspace expands. Existing stable custom components do not require wholesale replacement.

A component should be adopted when at least one of these applies:

1. it provides meaningful accessibility or keyboard behaviour;
2. it removes repeated interaction code;
3. it standardises a pattern used across multiple modules;
4. maintaining a custom implementation would create avoidable risk.

A component should remain custom when it carries HelioCoreOS identity, operational hierarchy or governed workflow meaning.

## Supporting libraries

The preferred future application stack is:

- React Hook Form and Zod for complex form handling and shared validation;
- TanStack Table for large operational registers;
- TanStack Query only where client-side server-state orchestration becomes necessary;
- Recharts for governed dashboard visualisation;
- Supabase for authentication, PostgreSQL, storage and tenant controls.

These are adoption directions, not permission to add dependencies before a proven workflow requires them.

## Governance requirements

Every adopted component must:

- use HelioCoreOS design tokens;
- support keyboard and screen-reader operation;
- preserve loading, empty, error, disabled and destructive states;
- remain responsive at launch breakpoints;
- avoid hiding lifecycle or approval consequences;
- comply with tenant, role, audit and failure-handling rules;
- pass lint, TypeScript and production-build checks.

## Constitutional alignment

This strategy implements `CORE-UX-001`, supports `CORE-CTX-001`, `CORE-NAV-001` and `CORE-FAIL-001`, and does not permit a UI library to redefine platform hierarchy, state meaning, approvals, audit behaviour or security boundaries.
