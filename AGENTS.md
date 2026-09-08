# HelioCoreOS Agent Instructions

This repository contains a governed Solar EPC operating system. Do not redesign the product from generic SaaS conventions or from personal taste.

## Read before changing UI

For any interface, UX, layout, component, form, register, navigation, dashboard, engineering workbench or responsive change, read these files first:

1. `docs/UX-CONSTITUTION.md`
2. `docs/UI-COMPONENT-STRATEGY.md`
3. `docs/INTERFACE-QUALITY-GATE.md`

The HelioCoreOS UX Constitution is authoritative. External design references are quality gates, not replacement brand systems.

## External UI quality references

Before completing a material UI change, fetch the latest guidance from:

- Vercel Web Interface Guidelines: https://vercel.com/design/guidelines
- Vercel review skill/source: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
- Better UI: https://github.com/jakubkrehel/skills/tree/main/skills/better-ui
- Better Accessibility: https://github.com/jakubkrehel/skills/tree/main/skills/better-accessibility
- Better Layout: https://github.com/jakubkrehel/skills/tree/main/skills/better-layout

Do not copy another product's visual identity. Apply these sources to interaction quality, accessibility, optical alignment, hit targets, grouping, radii, motion and implementation detail.

## HelioCoreOS visual direction

Preserve:

- warm off-white workspace canvas
- light neutral surfaces
- charcoal typography
- restrained orange accent
- calm Apple-like clarity
- The Ordinary-like restraint
- industrial Solar EPC precision
- minimal elevation
- generous but operational whitespace
- progressive disclosure
- contextual sheets/drawers for inspection and secondary editing

Avoid:

- generic SaaS dashboards
- dark control-room or developer-tool skins as the default theme
- decorative gradients or glass
- excessive shadows
- oversized rounded cards
- excessive pills
- border-heavy layouts
- repeated explanatory policy text in the main interface
- exposing every lifecycle stage on every screen

## Interaction rules

- Preserve user context. Prefer inline action → popover → side sheet → full page → confirmation dialog.
- Routine interactions must not reset scroll, filters, tabs or entered values.
- If an area looks clickable, the perceived area must be clickable; no dead zones.
- Use native semantic controls first.
- Every flow must work with keyboard navigation and visible focus.
- Minimum hit target: 24 × 24 CSS px; aim for 40 × 40 desktop and 44 × 44 touch where practical.
- Nested rounded surfaces must use concentric radii. Do not apply rounding by default when a square/lightly rounded operational surface is more appropriate.
- Use whitespace for grouping before backgrounds, and backgrounds before separator lines.
- Borders communicate structure/state; elevation communicates layering.
- Do not use `transition: all`.
- Respect reduced motion.
- Status must have text/icon meaning and never rely on colour alone.
- Use tabular numbers for engineering/financial comparisons.
- Design loading, empty, error, blocked, read-only, dense and mobile states deliberately.

## Product patterns

Build HelioCoreOS from a small shared vocabulary:

- `WorkspaceShell`
- `PageHeader`
- `WorkspaceToolbar`
- `DataRegister`
- `RecordHeader`
- `ContextSheet`
- `EditSheet`
- `LifecycleStatus`
- `ApprovalState`
- `NextAction`
- `BlockerPanel`
- `ApprovalDialog`
- `FormSection`
- `EngineeringMetric`
- `EngineeringCheck`

Do not invent a new visual or interaction system for each module.

## Engineering UI

Engineering screens must expose enough technical context to make a decision without becoming forms full of implementation detail.

Use progressive disclosure for:

- advanced assumptions
- provenance
- revision history
- validations
- performance modelling detail
- datasheet detail

The primary surface should make current state, key engineering values, blockers and next action obvious.

## Verification

Before declaring a material UI change complete:

- review against `docs/INTERFACE-QUALITY-GATE.md`
- verify keyboard and focus states
- verify desktop and touch hit areas
- inspect optical alignment and nested radii
- inspect loading/empty/error/disabled/read-only states
- verify mobile, laptop and wide layouts when browser tooling is available
- run `npm run typecheck`
- run `npm run lint`
- run `npm run build`

Do not claim browser behaviour or visual polish was verified if it was not actually inspected.
