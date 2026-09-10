# HelioCoreOS UI Component Strategy

Version: 1.1  
Status: Governing implementation standard  
Effective: 29 July 2026  
Updated: 8 September 2026

## Purpose

HelioCoreOS uses a selective component-library strategy. The product must gain the accessibility, interaction quality and development speed of established primitives without inheriting a generic dashboard appearance.

## Decision

HelioCoreOS will use:

- Tailwind CSS as the styling foundation;
- shadcn/ui as a source of owned, editable interaction primitives;
- Radix-based accessibility behaviour supplied through those primitives;
- custom HelioCoreOS components for product identity, information hierarchy and operational workflows.

shadcn/ui is not the visual design system. Components copied into the repository become HelioCoreOS source code and must be adapted to the platform's tokens, hierarchy and governance rules.

## External interface-quality standards

All material UI work must also comply with `docs/INTERFACE-QUALITY-GATE.md`.

That gate incorporates current review principles from:

- Vercel Web Interface Guidelines — interaction correctness, keyboard/focus behaviour, state resilience, responsive coverage, layout precision, content clarity and implementation quality;
- Better UI by Jakub Krehel — concentric border radii, optical alignment, surface depth, icon balance, restrained motion and micro-interaction quality;
- Better Accessibility — native semantics, focus, keyboard operation and minimum hit-area discipline;
- Better Layout — grouping, shared alignment edges and progressive spatial hierarchy.

These sources are quality references, not visual identity systems. When an external preference conflicts with `docs/UX-CONSTITUTION.md`, the HelioCoreOS Constitution takes priority.

External guidance must be fetched fresh during material UI reviews rather than treated as a frozen copied checklist.

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

The interface-quality gate strengthens this visual language with mandatory optical and interaction checks. It does not permit a dark developer-tool/control-room theme, another company's brand system, or a card-heavy generic SaaS treatment to replace the HelioCoreOS direction.

## Adoption rule

shadcn/ui will be introduced incrementally, starting before the Project Workspace expands. Existing stable custom components do not require wholesale replacement.

A component should be adopted when at least one of these applies:

1. it provides meaningful accessibility or keyboard behaviour;
2. it removes repeated interaction code;
3. it standardises a pattern used across multiple modules;
4. maintaining a custom implementation would create avoidable risk.

A component should remain custom when it carries HelioCoreOS identity, operational hierarchy or governed workflow meaning.

## Interaction engineering requirements

Shared components must follow these baseline rules:

- use native semantic controls before custom ARIA widgets;
- provide visible `:focus-visible` treatment;
- make the perceived interactive area clickable with no dead zones;
- use at least 24 × 24 CSS px hit areas, aiming for 40 × 40 desktop and 44 × 44 touch where practical;
- use concentric nested radii when rounded parent/child curves are both visible;
- align icons and text optically rather than relying only on geometric centring;
- use spacing before background containers, and background containers before separator lines, for grouping;
- use borders for structure/state and elevation only for genuinely layered surfaces;
- deep-link meaningful navigable state and preserve scroll/filter/form context;
- design normal, hover, focus, active, disabled, loading, empty, error, blocked, read-only and responsive states;
- avoid `transition: all` and respect reduced-motion preferences;
- use tabular numerals for engineering and financial comparisons;
- never communicate status through colour alone.

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
- satisfy `docs/INTERFACE-QUALITY-GATE.md` for material UI changes;
- pass lint, TypeScript and production-build checks.

## Agent enforcement

The repository root `AGENTS.md` makes these standards required reading before interface work. Agents must not declare visual or browser interaction behaviour verified unless it was actually inspected.

## Constitutional alignment

This strategy implements `CORE-UX-001`, supports `CORE-CTX-001`, `CORE-NAV-001` and `CORE-FAIL-001`, and does not permit a UI library or external design system to redefine platform hierarchy, visual identity, state meaning, approvals, audit behaviour or security boundaries.
