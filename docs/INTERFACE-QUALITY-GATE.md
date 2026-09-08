# HelioCoreOS Interface Quality Gate

**Status:** Governing UI quality standard  
**Applies to:** All new or modified HelioCoreOS interface code  
**Relationship:** Supplements `docs/UX-CONSTITUTION.md` and `docs/UI-COMPONENT-STRATEGY.md`

## Purpose

HelioCoreOS uses external interface-engineering references as quality gates, not as a replacement visual identity.

The governing hierarchy is:

1. `docs/UX-CONSTITUTION.md` — HelioCoreOS product experience and visual direction.
2. `docs/UI-COMPONENT-STRATEGY.md` — component and implementation strategy.
3. This document — interaction, optical and implementation quality checks.
4. External source guidance — fetched fresh when auditing UI work.

If an external preference conflicts with the HelioCoreOS Constitution, HelioCoreOS wins.

## External sources

### Vercel Web Interface Guidelines

- Canonical guide: https://vercel.com/design/guidelines
- Agent skill: https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines
- Latest machine-readable review source used by the skill: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md

Use Vercel guidance for interaction correctness, accessibility, layout precision, state handling, copy clarity and implementation quality. Vercel-specific brand preferences do not override HelioCoreOS visual language or terminology.

### Better UI / Interfaces skills by Jakub Krehel

- Repository: https://github.com/jakubkrehel/skills
- Better UI: https://github.com/jakubkrehel/skills/tree/main/skills/better-ui
- Better Accessibility: https://github.com/jakubkrehel/skills/tree/main/skills/better-accessibility
- Better Layout: https://github.com/jakubkrehel/skills/tree/main/skills/better-layout

Use these references for design-engineering polish: concentric radii, optical alignment, hit areas, surface depth, grouping, icon balance, motion restraint and accessibility detail.

## Mandatory quality rules

### 1. Optical alignment beats naive geometry

- Align controls, icons, labels and numerical values to deliberate shared edges and baselines.
- A mathematically centered icon may be nudged by 1 px when optical balance requires it.
- Icon stroke weight must visually match adjacent text weight.
- Numerical comparison surfaces use tabular figures and consistent decimal/unit treatment.

### 2. Hit areas must match perceived interaction

- If something looks interactive, the whole perceived control area must be interactive; no dead zones.
- Minimum target is 24 × 24 CSS px where density requires it.
- Aim for 40 × 40 px on desktop where practical and 44 × 44 px on touch/mobile.
- Small visible icons may use a larger invisible hit area, but expanded hit areas must not overlap.
- Labels and their checkbox/radio controls share one hit target.
- Decorative overlays must not intercept pointer events.

### 3. Nested radii must be concentric

For nested rounded surfaces:

`outer radius = inner radius + padding between the two curves`

Do not use equal radii on parent and inset child when both curves are visible. Avoid unnecessary rounding entirely where the HelioCoreOS Constitution calls for square or lightly rounded operational surfaces.

### 4. Borders communicate structure; shadows communicate elevation

- Do not add borders merely to make every region feel contained.
- Use whitespace first, background grouping second and separator lines only where density requires them.
- Keep borders for dividers, data structure, selection, focus and governed state.
- Use subtle layered elevation only where one surface genuinely sits above another, such as sheets, menus and dialogs.

### 5. Keyboard and focus are first-class

- Every flow must be keyboard operable.
- Use native `button`, `a`, `input`, `select`, `textarea` and semantic elements before custom ARIA controls.
- Every focusable control has a visible `:focus-visible` state.
- Dialogs/sheets manage focus correctly and restore focus to their trigger when closed.
- Links remain links so new-tab and browser navigation behaviours work.

### 6. URL and page state must be resilient

- Deep-link meaningful tabs, filters, pagination and expanded work contexts when they represent navigable state.
- Back/Forward navigation must behave predictably.
- Routine tab/filter changes must not reset scroll or destroy current work.
- Inputs must not lose value or focus through hydration or local state transitions.

### 7. Design every state

Every shared component and workflow surface must account for:

- normal
- hover
- focus
- active/pressed
- disabled
- loading
- empty
- sparse data
- dense data
- validation error
- server/runtime error
- read-only/permission state
- mobile/touch

Skeletons should mirror final content closely enough to avoid layout shift. Loading buttons retain their original action label with a progress indicator.

### 8. Motion is restrained and interruptible

- High-frequency interactions should be instant or use short transitions, normally 150 ms or less.
- Do not use `transition: all`; name the properties that change.
- Prefer interruptible CSS transitions for state changes.
- Press feedback may use subtle scale treatment when appropriate; do not apply motion where it distracts from engineering work.
- Respect `prefers-reduced-motion`.
- Motion must never be the only cue that a state changed.

### 9. Content and status must remain explicit

- Status never relies on colour alone.
- Errors explain the next recovery action rather than only reporting failure.
- Controls use specific action labels; avoid ambiguous `Continue` when the action is actually `Save Load Profile`, `Approve Design`, etc.
- Units are separated from values and kept consistent within the same surface.
- Engineering comparison values should use tabular numbers.

### 10. Responsive behaviour is intentional

- Verify mobile, laptop and ultra-wide layouts.
- Mobile is not stacked desktop.
- Touch controls meet touch target requirements.
- Forms use mobile-friendly input sizing and preserve browser zoom.
- Avoid accidental horizontal scrolling; data-heavy registers require an intentional mobile representation or controlled horizontal data viewport.

## HelioCoreOS-specific visual guardrails

External guidance must not pull the product toward another company's visual identity.

Keep:

- warm off-white workspace canvas
- light neutral work surfaces
- charcoal typography
- restrained orange for primary action, focus and current selection
- minimal elevation
- spacing and typography as the main grouping tools
- contextual side sheets for inspection and secondary editing
- one dominant primary action per page

Avoid:

- dark technical-console skins as a default product theme
- generic SaaS card grids
- border boxes around every section
- oversized rounded containers
- decorative gradients, glass or heavy shadows
- excessive pills
- exposing the complete lifecycle everywhere when current state, blocker and next action are enough

## Required UI review before completion

For any material UI change:

1. Read `docs/UX-CONSTITUTION.md`.
2. Read `docs/UI-COMPONENT-STRATEGY.md`.
3. Fetch the latest Vercel Web Interface Guidelines rather than relying on a stale local copy.
4. Review relevant Better UI / Better Accessibility / Better Layout rules.
5. Inspect every changed interaction state.
6. Verify keyboard navigation and visible focus.
7. Verify hit areas on desktop and touch.
8. Inspect nested radii and optical alignment.
9. Verify mobile, laptop and wide layouts.
10. Run TypeScript, lint and production build checks.

### Review verdict

Use the following severity model for UI reviews:

- **HIGH** — broken task, inaccessible flow, lost state, unusable hit area, hidden critical state or systemic interaction failure.
- **MEDIUM** — meaningful inconsistency in hierarchy, grouping, controls, responsiveness, motion or surface treatment.
- **LOW** — isolated optical/polish issue.

A UI change is not ready while a HIGH issue remains. Unverified browser states must be reported as unverified rather than assumed correct.
