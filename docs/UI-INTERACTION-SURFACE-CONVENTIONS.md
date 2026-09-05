# HelioCoreOS Interaction Surface Conventions

Status: Governing UX supplement  
Applies to: HelioCoreOS and HelioCalc interfaces  
Parent UX: [HelioCoreOS UX Constitution](./UX-CONSTITUTION.md)  
Engineering UX: [HelioCalc Engineering Cockpit UX](./HELIOCALC-UX.md)

## 1. Purpose

HelioCoreOS must use drawers, sheets, dialogs, modals, popovers and sliders consistently.

The interaction surface must communicate the consequence of the task. A user should be able to predict how an action will behave before opening it.

The default priority remains:

```text
Inline
→ Popover
→ Sheet / Drawer
→ Full page
→ Dialog / Modal
```

Use the least disruptive surface that can complete the task safely and clearly.

## 2. Canonical terminology

HelioCoreOS uses the following canonical terms in design specifications and code.

### Sheet / Drawer

`Sheet` is the canonical component name. `Drawer` may be used in product language when describing the behaviour, but both refer to the same interaction family: a contextual panel that enters from an edge while preserving the parent workspace.

### Slide-over

`Slide-over` describes the animation or presentation of a Sheet. It is not a separate semantic component.

Do not create separate `SliderPanel`, `SlideWindow`, `DrawerPanel` and `SideModal` components for the same behaviour.

### Range Slider

`Slider` is reserved for an input control that selects a numeric value or range along a track.

Examples:

- battery reserve SOC;
- desired backup duration where bounded;
- scenario comparison range;
- chart time-window selection.

A sliding side panel is never called a Slider in code or governance documents.

### Dialog

A `Dialog` is a focused temporary surface presented above the current workspace for a short task, deliberate decision or small amount of information that must be addressed before continuing that interaction.

### Modal

`Modal` describes behaviour, not a separate visual component. A modal surface blocks interaction with the background until dismissed or completed.

In implementation, use a governed `Dialog` or `AlertDialog` rather than creating an independent `Modal` component unless a platform primitive requires different naming.

## 3. Decision rule

Before opening an overlay, ask:

1. Does the user need to preserve the current workspace context?
2. Is the task inspection, editing, navigation or commitment?
3. How much information must be shown?
4. Can the task be safely dismissed?
5. Does completing it change a governed state?
6. Does the user need to compare the overlay content with the background?

Use these answers to choose the surface.

## 4. Sheet / Drawer convention

Use a Sheet when the user needs contextual depth without losing the active workspace.

### Appropriate uses

- equipment datasheet evidence;
- customer/site record preview;
- engineering finding detail;
- cable/circuit detail;
- calculation provenance;
- activity history;
- document history;
- scenario metadata;
- secondary editing;
- filter configuration that exceeds a Popover;
- responsive engineering rail;
- mobile navigation.

### Behaviour

A Sheet must:

- preserve parent route, selection, filters, scroll and Scenario state;
- have a visible title and close action;
- support Escape where dismissal is safe;
- restore focus to the invoking control on close;
- avoid hiding the identity of the parent record;
- remain deep-linkable only when the content itself warrants a route;
- never perform an irreversible action merely because the Sheet closes.

### Direction

Use direction semantically:

- **Right Sheet** — inspection, evidence, secondary editing, findings, record detail;
- **Left Sheet** — navigation or hierarchy on constrained screens;
- **Bottom Sheet** — compact mobile actions, selection or short contextual tasks;
- **Top Sheet** — prohibited unless a platform-specific requirement is documented.

Desktop contextual Sheets should normally enter from the right.

### Width

Use three practical size classes rather than arbitrary widths:

```text
Narrow   360–420 px   quick context / small record inspection
Medium   480–640 px   evidence / secondary editing / detailed findings
Wide     720–960 px   technical comparison / complex record inspection
```

A task that requires more width than a Wide Sheet probably belongs on a full page or dedicated workspace.

### Sheet actions

Routine actions may occur inside a Sheet.

Governed commitments such as Approve, Issue, Supersede, Reject or Delete may be initiated from a Sheet but must use the appropriate commitment confirmation convention when the consequence warrants it.

Do not nest Sheets inside Sheets.

If a second level of depth is needed, replace the Sheet content, use an internal view stack, or navigate to a full page while preserving a clear Back path.

## 5. Dialog convention

Use a Dialog for a short focused task that temporarily requires priority over the workspace.

### Appropriate uses

- rename Scenario;
- choose a small set of options;
- enter a rejection reason;
- confirm a governed state transition;
- resolve a short conflict;
- acknowledge a consequential warning;
- issue or supersede a controlled document;
- archive a governed record.

### Dialog anatomy

Every Dialog should contain, in order:

```text
Title
Short consequence / context
Focused content
Validation or warning if required
Secondary action
Primary action
```

The title must describe the task, not the UI component.

Prefer:

`Approve design revision?`

Avoid:

`Confirmation`

### Size

Dialogs are intentionally compact.

Use:

```text
Small    360–440 px
Medium   480–600 px
Large    640–760 px only when justified
```

If the interaction requires scrolling through a long form, a large table, extensive evidence or several workflow sections, it is not a Dialog task.

## 6. Modal / blocking convention

Modal behaviour is reserved for interactions that must block the background temporarily.

Use modal behaviour when:

- the user is making an irreversible or difficult-to-reverse commitment;
- proceeding with background work would create ambiguity or corruption;
- a security or permission decision must be resolved;
- a governed transition needs deliberate confirmation;
- destructive action is being confirmed.

Do not use modal behaviour merely to make ordinary content feel important.

### Background behaviour

While a modal Dialog is open:

- background interaction is disabled;
- focus is trapped correctly;
- the backdrop is visually restrained;
- Escape is allowed unless dismissal itself would be unsafe;
- closing never silently commits changes.

### Destructive actions

Use `AlertDialog` semantics for destructive or irreversible actions.

Examples:

- delete unsaved Scenario;
- cancel issued workflow;
- archive controlled record when consequences exist;
- supersede an approved revision.

The destructive action label must state the action explicitly.

Prefer:

`Archive scenario`

Avoid:

`Yes`

## 7. Popover convention

Use a Popover for a small, lightweight context shift that does not deserve a Sheet or Dialog.

Appropriate uses:

- assign owner;
- choose a filter;
- select a view;
- compact date selection;
- quick status explanation;
- column visibility;
- small engineering parameter selector.

A Popover must not contain:

- long forms;
- document review;
- destructive actions without confirmation;
- approval decisions;
- long evidence;
- scrolling technical tables.

## 8. Range Slider convention

A Range Slider is allowed only when continuous or bounded numeric manipulation genuinely improves the task.

Examples:

- battery reserve SOC from 10–40%;
- simulation chart time range;
- bounded sensitivity input when exact keyboard entry remains available.

Engineering values must never rely on a Slider alone.

Every engineering Slider must also provide:

- exact numeric value;
- unit;
- allowed range;
- keyboard operation;
- direct numeric input where precision matters;
- validation against governed limits.

Do not use a Slider for values such as module quantity, modules per string, cable size, inverter quantity or other discrete engineering selections where explicit choices are safer.

## 9. Full-page rule

Use a full page or dedicated workspace when the user needs:

- sustained work;
- several related sections;
- wide engineering tables;
- multiple simultaneous evidence sources;
- scenario comparison;
- a long governed form;
- a complex design task;
- deep-linkable operational state.

Examples:

- HelioCalc PV electrical workspace;
- structured Site Survey;
- Engineering Review;
- scenario comparison;
- procurement workbench;
- commissioning workspace.

Do not force these experiences into oversized Modals.

## 10. HelioCalc-specific mapping

HelioCalc should apply the conventions as follows.

| Interaction | Surface |
| --- | --- |
| Inspect module/inverter/BESS datasheet | Right Sheet |
| View datasheet revision history | Right Sheet / internal Sheet view |
| Inspect engineering finding evidence | Right Sheet |
| Edit detailed circuit assumptions | Medium/Wide Right Sheet |
| Switch Scenario | Inline selector / Popover |
| Rename Scenario | Small Dialog |
| Duplicate Scenario | Dialog only if options are required; otherwise immediate controlled action |
| Delete/archive draft Scenario | AlertDialog |
| Run calculation | Inline action; no Dialog for routine recalculation |
| Calculation progress | Inline within cockpit |
| Calculation failed | Inline error + optional technical-detail Sheet |
| Compare Scenarios | Dedicated workspace / full page |
| Review approved datasheet evidence | Sheet |
| Submit design for review | Dialog only when reviewer/note input is required |
| Approve design | Modal Dialog / Alert-style governed confirmation |
| Reject design | Modal Dialog requiring reason |
| Override engineering warning | Dialog requiring reason and authority context |
| Override blocking finding | Prohibited unless governance explicitly allows; then dedicated governed Dialog |
| Engineering rail on tablet/mobile | Right Sheet |
| Local Design navigation on mobile | Left Sheet |

## 11. Overlay stacking rules

Overlay stacking must remain shallow.

Allowed:

```text
Page
→ Popover

Page
→ Sheet

Page
→ Dialog

Page
→ Sheet
→ Dialog for a consequential action
```

Avoid:

```text
Page
→ Sheet
→ Sheet

Page
→ Dialog
→ Dialog

Page
→ Sheet
→ Dialog
→ Popover
```

Only one modal commitment surface may be active at a time.

## 12. Unsaved work and dismissal

A dismissible surface with unsaved changes must follow one of three patterns:

1. autosave safely;
2. preserve a draft automatically;
3. warn only when closing would genuinely lose work.

Do not show an unsaved-changes confirmation for every minor interaction.

Closing an evidence Sheet must never affect the active engineering calculation.

## 13. Responsive transformation

Components may change presentation across breakpoints without changing meaning.

Examples:

```text
Desktop right engineering rail
→ Tablet Right Sheet
→ Mobile full-height Right Sheet

Desktop Popover filter
→ Mobile Bottom Sheet

Desktop Right Sheet record preview
→ Mobile full-height Sheet
```

A Dialog remains a Dialog when its commitment semantics require background blocking, though it may occupy more screen area on mobile.

## 14. Motion convention

Motion explains spatial relationship; it is not decoration.

- Sheets enter from their owning edge.
- Dialogs use restrained scale/fade behaviour.
- Popovers appear from their anchor.
- Avoid springy, playful or exaggerated motion.
- Opening and closing durations should feel immediate and consistent.
- Respect reduced-motion preferences.

The application must remain understandable with motion disabled.

## 15. Accessibility

All interaction surfaces must provide:

- semantic role and accessible name;
- visible focus;
- correct focus transfer and restoration;
- keyboard operation;
- Escape behaviour where safe;
- screen-reader announcement of Dialog titles and important state;
- touch-friendly targets;
- no reliance on colour or animation alone.

Background content hidden by a modal surface must not remain available to assistive-technology focus.

## 16. Component implementation policy

Prefer shared accessible primitives rather than hand-building overlay mechanics.

Canonical HelioCoreOS component families should be:

```text
Sheet
Dialog
AlertDialog
Popover
Tooltip
RangeSlider
```

Domain-specific components compose these primitives, for example:

```text
DatasheetEvidenceSheet
FindingEvidenceSheet
CircuitDetailSheet
ScenarioRenameDialog
DesignApprovalDialog
EngineeringOverrideDialog
```

Domain components may change content and governance behaviour, but must not redefine the base interaction semantics.

## 17. Product rule

A surface is chosen by **task consequence and context**, not by visual preference.

The convention is:

> Inspect without losing context → Sheet.  
> Make a quick contextual adjustment → Popover.  
> Perform a short focused task → Dialog.  
> Confirm a consequential or destructive commitment → Modal Dialog / AlertDialog.  
> Perform sustained complex work → Full page.  
> Adjust a bounded numeric value → Range Slider, with exact input when engineering precision matters.

This convention applies across HelioCoreOS and HelioCalc so the same interaction always carries the same behavioural meaning.