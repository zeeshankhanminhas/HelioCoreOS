# Navigation domain clarification

Project profile: HelioCoreOS Solar EPC  
Change type: Project Extension compliance correction  
Launch scope: Yes

Core references:
- CORE-CTX-001
- CORE-NAV-001
- CORE-UX-001

## Decision

Command, Sales, Delivery and Administration are navigation domains used only to group operational modules.

They are not modules, routes, dashboards or parent records.

The launch hierarchy is:

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
```

## Interface rules

1. A navigation domain is displayed as a visual separator or group heading.
2. A navigation domain must not be clickable.
3. A navigation domain must not have a fabricated route such as `/dashboard/sales`.
4. A navigation domain may appear in a breadcrumb only as a non-interactive hierarchy label.
5. Modules remain the actual navigable destinations.
6. Records remain nested beneath their owning module.

Example:

```text
Dashboard / Sales / Opportunities / OPP-2026-001
```

In this example:

- Dashboard is a route;
- Sales is a non-clickable navigation domain;
- Opportunities is a module route;
- OPP-2026-001 is a record route.

## Implementation

`src/components/workspace-shell.tsx` now:

- treats domain labels separately from route labels;
- renders domain headings as semantic non-link separators;
- prevents breadcrumbs from assigning module URLs to domain labels;
- marks only actual routes as current or clickable;
- preserves accessible grouping in desktop and mobile navigation.

## Scope boundary

This clarification does not create new modules and does not amend the protected core. It corrects the implementation so that it accurately follows the existing navigation and context rules.
