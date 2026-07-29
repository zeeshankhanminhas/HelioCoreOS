# Navigation Integrity Sprint

Project profile: HelioCoreOS Solar EPC  
Change type: Project Extension  
Launch scope: Yes

## Core references

- CORE-CTX-001 — Location and context
- CORE-NAV-001 — Navigation integrity
- CORE-UX-001 — Consistent operating pattern
- CORE-AUDIT-001 — Complete traceability
- CORE-FAIL-001 — No silent failure

## Purpose

Implement the launch navigation and page-context foundation without changing the protected constitutional core.

## Implemented in this slice

- reduced primary navigation to launch-relevant operational destinations;
- aligned navigation groups with Command, Sales, Delivery and Administration;
- removed future delivery modules from normal live navigation;
- added a persistent breadcrumb/address trail derived from the current route;
- added a parent/back path for nested and record pages;
- replaced the context-blind global Opportunities button with route-specific actions;
- preserved active-module indication across nested routes;
- supported horizontal breadcrumb scrolling on small screens.

## Launch lifecycle relationship

This extension supports navigation across the implemented commercial foundation:

```text
Opportunity
→ optional Customer assignment
→ optional Site assignment
→ Customer Readiness
→ Indicative Proposal
```

It does not add Detailed Quote, Contract, automated Project Creation, Engineering, Procurement, Installation, Commissioning, Handover or O&M capabilities.

## Diagnostic acceptance criteria

1. Every dashboard page displays an address trail.
2. Nested pages display their parent module and record context.
3. Record pages provide a direct return path to their register.
4. List pages display only a relevant creation action.
5. No future module appears as a normal live navigation destination.
6. Mobile users can read or horizontally scroll the complete address trail.
7. Existing tenant, role, state and data rules are unchanged.

## Required validation before merge

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- manual route review for Dashboard, Tasks, Opportunities, Customers, Sites, Projects and Team & Access
- nested-route review for create and record pages

## Known boundary

Route-derived breadcrumbs use `Record` for UUID path segments. A later project extension may supply record titles or references from server data, but it must preserve the same constitutional location hierarchy.
