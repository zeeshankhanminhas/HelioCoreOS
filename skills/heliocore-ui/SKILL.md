---
name: heliocore-ui
description: Review, redesign, and implement HelioCoreOS interfaces without changing product identity. Use for UI, UX, layout, navigation, registers, forms, engineering workbenches, responsive behaviour, accessibility, interaction polish, or visual-system changes.
metadata:
  author: HelioCoreOS
  version: "1.0"
---

# HelioCoreOS UI Skill

This skill packages the governing HelioCoreOS interface workflow using the open Agent Skills format.

## Authority order

1. `../../docs/UX-CONSTITUTION.md`
2. `../../docs/UI-COMPONENT-STRATEGY.md`
3. `../../docs/INTERFACE-QUALITY-GATE.md`
4. Current external quality references

External sources improve quality; they do not replace the HelioCoreOS visual identity.

## Activate for

- UI/UX redesign
- navigation or shell changes
- registers and record workspaces
- engineering calculators/workbenches
- equipment-library interfaces
- forms, dialogs, sheets, tabs, filters, menus and command surfaces
- responsive/mobile work
- accessibility work
- design tokens, typography, spacing, radii, iconography, motion and interaction polish

## Workflow

### 1. Scan

Read the existing implementation before proposing a visual direction. Identify:

- current shared tokens and global styles
- reusable components already present
- route/page type: dashboard, register, record workspace, governed form, engineering workbench
- current interaction states
- behaviour that must not regress

### 2. Diagnose

Review the current surface against:

- HelioCoreOS UX Constitution
- Interface Quality Gate
- latest Vercel Web Interface Guidelines
- Better UI / Better Accessibility / Better Layout from `jakubkrehel/skills`
- relevant `plugin87/ux-ui-agent-skills` review, token, accessibility and redesign guidance

Do not start by restyling. Identify root causes first: hierarchy, interaction model, grouping, token drift, accessibility, state loss, poor hit areas, inconsistent components, or optical defects.

### 3. Direct

Choose the smallest shared product pattern that solves the problem. Prefer the HelioCoreOS vocabulary:

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

Do not invent a new mini-design-system for a single screen.

### 4. Apply in order

For material redesigns, apply changes in this order:

1. tokens and semantic theme usage
2. typography and spacing hierarchy
3. layout and grouping
4. shared component structure
5. interaction states and accessibility
6. responsive behaviour
7. restrained motion and final optical polish

Preserve routes, data contracts and working business logic unless the task explicitly requires a behaviour change.

### 5. Verify

Before completion:

- verify normal, hover, focus, active, disabled, loading, empty, error, blocked and read-only states
- verify keyboard navigation and visible focus
- verify hit areas and that perceived clickable regions contain no dead zones
- inspect nested radii for concentric geometry
- inspect icons/text/numerical values for optical alignment
- verify mobile, laptop and wide layouts when browser tooling is available
- verify status is not colour-only
- verify engineering and financial comparisons use tabular numbers where appropriate
- run TypeScript, lint and production build checks
- never claim browser/visual verification that was not actually performed

## HelioCoreOS visual guardrails

Preserve:

- warm off-white workspace canvas
- light neutral work surfaces
- charcoal typography
- restrained orange for primary action, focus and current selection
- minimal elevation
- clear hierarchy and operational whitespace
- progressive disclosure
- contextual sheets/drawers for inspection and secondary editing

Avoid:

- generic SaaS card grids
- dark developer-tool/control-room skins as the default product theme
- gradients, glass and heavy shadows
- border boxes around every region
- oversized rounded containers
- excessive pills
- full lifecycle diagrams repeated on every screen
- large explanatory policy copy in the primary work surface

## External sources to refresh during material reviews

- Agent Skills specification: https://agentskills.io/specification
- Vercel Web Interface Guidelines: https://vercel.com/design/guidelines
- Vercel web-design-guidelines skill: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
- Better UI family: https://github.com/jakubkrehel/skills
- UX/UI Agent Skills: https://github.com/plugin87/ux-ui-agent-skills

## Plugin87 principles adopted

Use `plugin87/ux-ui-agent-skills` as an additional architecture/review source for:

- audit-first redesign instead of cosmetic-first restyling
- one coherent theme across the whole application
- semantic design tokens rather than page-specific hard-coded styling
- token-first implementation sequencing
- accessibility review against WCAG 2.2 expectations
- design review and regression checks before shipping
- framework-aware implementation that preserves the project stack

HelioCoreOS remains the source of truth for brand, information hierarchy, workflow semantics and product-specific components.
