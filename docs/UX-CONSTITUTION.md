# HelioCoreOS UX Constitution

**Status:** Governing product document  
**Applies to:** All current and future HelioCoreOS interfaces  
**Product:** HelioCoreOS — Solar EPC Operating System  
**Version:** 1.0

---

## 1. Purpose

This Constitution defines the mandatory user-experience principles, interaction rules, information hierarchy, component strategy, and implementation standards for HelioCoreOS.

It exists to ensure that HelioCoreOS behaves and feels like one coherent operating system rather than a collection of independently designed pages.

The interface must support complex Solar EPC work without making the complexity visible all at once. Governance must remain rigorous, but the experience must remain calm, understandable, efficient, and resumable.

This document governs:

- Workspace architecture
- Navigation
- Registers and record pages
- Forms and validation
- Modals, sheets, popovers, and tooltips
- Workflow and lifecycle communication
- Approvals and blocking conditions
- Status, risk, and progress presentation
- Onboarding and guidance
- Empty, loading, error, and permission states
- Responsive and mobile behaviour
- Accessibility
- shadcn/ui usage
- Visual consistency across modules

Where a design decision conflicts with this Constitution, this Constitution takes priority unless formally amended.

---

## 2. Product Experience Principles

### 2.1 Preserve context

HelioCoreOS must preserve the user’s current place wherever possible.

Routine inspection and minor actions should not force page changes, reset filters, lose scroll position, or interrupt active work.

The preferred interaction order is:

1. Inline action
2. Popover
3. Side sheet
4. Full page
5. Modal confirmation

The least disruptive interaction capable of completing the task must be used.

### 2.2 Make the next action obvious

Every governed record must communicate:

- Its current state
- The next available action
- Any blocking condition
- The shortest path to resolution

A record must never leave the user guessing what should happen next.

### 2.3 Reduce time to value

Users should reach useful work quickly.

The product must avoid long introductory tours, unnecessary setup screens, and premature detail. Guidance should be contextual, brief, skippable, and resumable.

### 2.4 Use progressive disclosure

Complexity must be revealed in layers.

The first view should show what is most important for decision-making. Supporting engineering, commercial, compliance, and governance detail should be available through expandable sections, tabs, sheets, or secondary views.

### 2.5 Keep content actionable

Interface copy must help users decide or act.

Prefer:

- “Approval blocked — approved Site Survey required.”
- “3 readiness items remain.”
- “Issue proposal.”

Avoid:

- Long explanatory paragraphs
- Repeated policy text
- Generic labels without action
- Technical detail before it is needed

### 2.6 Governance without friction

Governance must be visible, understandable, and enforceable without turning every action into an interruption.

Routine work should remain inline and resumable. Consequential commitments must require deliberate confirmation.

### 2.7 Consistency before novelty

A familiar pattern used consistently is preferred over a visually novel pattern used once.

Users should be able to learn one register, one record page, one approval pattern, and one form system, then apply that knowledge throughout the product.

---

## 3. Visual Direction

HelioCoreOS must express:

- Apple-like clarity
- The Ordinary-style restraint
- Industrial precision
- Enterprise credibility
- Calm operational confidence

The interface must not resemble a generic SaaS template.

### 3.1 Visual characteristics

Use:

- Warm off-white workspace canvas
- Light neutral surfaces
- Charcoal typography
- Restrained orange accent
- Clear spacing and alignment
- Strong typographic hierarchy
- Subtle dividers
- Minimal elevation
- Purposeful status colour

Avoid:

- Decorative gradients
- Glassmorphism
- Excessive shadows
- Oversized rounded cards
- Bright multicolour dashboards
- Unnecessary pills
- Dense border-heavy layouts
- Generic stock imagery
- Visual decoration without operational meaning

### 3.2 Accent use

Orange is reserved for:

- Primary action
- Focus
- Current selection
- Important interactive emphasis

Orange must not be used as general decoration.

### 3.3 Semantic colour

Semantic colours must remain muted and consistent.

Colour must never be the only method of communicating state. Every status must also include text, iconography, or both.

---

## 4. Workspace Architecture

All modules must inherit from one shared workspace shell.

The standard structure is:

```text
Workspace
├── Sidebar
├── Topbar
├── Breadcrumb
├── Page Header
├── Optional Metric Strip
├── Toolbar / Filters
└── Main Content
```

### 4.1 Sidebar

The sidebar must:

- Be visually calm and compact
- Group navigation by business domain
- Use clear text labels
- Use one consistent active state
- Avoid unnecessary numbering
- Avoid oversized selected blocks
- Remain usable with long module names
- Collapse intentionally on smaller screens

Recommended grouping:

```text
COMMAND
Overview
Tasks

COMMERCIAL
Opportunities
Customers
Sites

DELIVERY
Projects
Procurement
Installation
Commissioning

GOVERNANCE
Documents
Approvals
Activity

ADMINISTRATION
Team & Access
Settings
```

### 4.2 Topbar

The topbar may contain:

- Workspace identity
- Global search or command palette
- Notifications
- Help
- User menu

It must not duplicate primary page actions.

### 4.3 Page header

Every module page should use the shared page-header pattern:

- Optional eyebrow or category
- Clear page title
- Brief description
- One primary action
- Optional secondary actions grouped separately

Only one visually dominant primary action is permitted per page.

Duplicate actions are prohibited.

---

## 5. Standard Page Types

HelioCoreOS recognises four principal page types.

### 5.1 Dashboard

A dashboard must surface operational signals, exceptions, and next actions.

It must not be a decorative collection of cards.

Dashboard content should answer:

- What requires attention?
- What changed?
- What is blocked?
- What is due next?
- Where is risk increasing?

### 5.2 Register

A register is the standard interface for Customers, Sites, Opportunities, Projects, Suppliers, Purchase Orders, and similar governed records.

Every register should share:

- Page header
- Optional metric strip
- Compact toolbar
- Consistent table or list behaviour
- Status presentation
- Row actions
- Empty state
- Loading state
- Error state
- Detail-sheet behaviour
- Responsive pattern

### 5.3 Record detail

A record page should follow a common structure:

```text
Record header
Summary
Next action / blockers
Lifecycle or workflow
Related records
Documents
Activity
Notes
Audit / history
```

Not every section must be visible at once. Progressive disclosure is required.

### 5.4 Governed workflow form

Long forms such as Site Survey, System Design, Procurement, Commissioning, and Handover must:

- Use single-column flow by default
- Group fields into meaningful sections
- Preserve drafts
- Show completion state
- Support resume later
- Provide inline validation
- Avoid modal-based form completion
- Show blockers near the affected section
- Separate data entry from approval commitment

---

## 6. Register Design Rules

Registers must prioritise scanability and action.

### 6.1 Required qualities

Each register must provide:

- Strong primary record identity
- Quiet secondary reference
- Related customer/site context where relevant
- Consistent status indicator
- Key operational values
- Owner or responsibility
- Next action where useful
- Row action menu
- Clear hover and focus states

### 6.2 Density

Registers must be compact enough for operational use but not visually cramped.

Rows should use consistent vertical rhythm and column alignment. Borders should support structure, not dominate it.

### 6.3 Row interaction

Selecting a row should normally open a contextual detail sheet.

The sheet may include:

- Summary
- Related customer and site
- Current lifecycle state
- Next action
- Blockers
- Recent activity
- Key documents
- Link to full record

The user’s filters, sort, search, and scroll position must remain intact.

### 6.4 Responsive registers

Desktop tables must not simply shrink on mobile.

On smaller screens, rows should become intentionally designed record summaries that preserve:

- Record identity
- Current state
- Critical value
- Owner or due date
- Primary next action

Secondary columns may move into the detail sheet.

---

## 7. Metrics and Dashboards

Metric strips must be operational, not decorative.

Use metrics such as:

- Pipeline value
- Open opportunities
- Proposal count
- Won count
- At-risk projects
- Pending approvals
- Outstanding readiness items
- Materials awaiting delivery

Metric strips should use typography and separators rather than oversized card containers where possible.

Every monetary value must use the record or organisation currency code. Hard-coded currency symbols are prohibited.

Examples:

- `PKR 156.2m`
- `GBP 42,500`
- `AED 1.8m`

Legacy database field names must not determine display currency.

---

## 8. Status, Risk, and Progress

### 8.1 Status

Status is a business concept, not merely a badge.

Use shared domain-aware components such as:

- `LifecycleStatus`
- `ApprovalState`
- `RiskIndicator`
- `ReadinessProgress`
- `NextAction`

Status components must be visually consistent but may vary semantically by domain.

### 8.2 Risk

Risk must include a label and clear meaning.

Examples:

- Green — no material exception
- Amber — attention required
- Red — critical blocker

Colour alone is insufficient.

### 8.3 Progress

Progress indicators may only represent measurable completion.

Valid examples:

- 5 of 6 readiness items accepted
- 8 of 10 survey sections complete
- 72% of ordered material received
- 14 of 18 commissioning checks passed

Avoid arbitrary project percentages unless the calculation is transparent and governed.

---

## 9. Modals, Sheets, Popovers, and Tooltips

### 9.1 Modal policy

Use `Dialog` or `AlertDialog` only when an action:

- Requires immediate focus
- Creates a formal commitment
- Is destructive or difficult to reverse
- Changes a governed state
- Issues or supersedes a controlled document
- Approves, rejects, archives, cancels, or converts a record

Examples:

- Approve proposal
- Reject system design
- Issue document
- Convert opportunity into project
- Archive record
- Cancel purchase order

A modal must contain:

- Concise title
- Brief consequence
- Clear primary action
- Clear cancel action
- Easy-to-find close mechanism where appropriate

### 9.2 Sheet policy

Use `Sheet` as the default pattern for contextual inspection and secondary editing.

Examples:

- Customer preview
- Site information
- Readiness evidence
- Proposal assumptions
- Survey observations
- Activity history
- Document history
- Approval context

Sheets must preserve the underlying page state.

### 9.3 Popover policy

Use `Popover` for minor context shifts and quick adjustments.

Examples:

- Assign owner
- Select filter
- Change view
- View compact status explanation
- Quick date adjustment

Popovers must not contain long forms or critical commitments.

### 9.4 Tooltip policy

Use `Tooltip` only for concise clarification.

Tooltips must not contain essential information, required instructions, or interactive workflows.

---

## 10. Forms and Validation

### 10.1 Form architecture

Forms should use:

- shadcn/ui form primitives
- `react-hook-form`
- `zod`
- Shared field wrappers
- Inline validation
- Accessible labels and descriptions

### 10.2 Layout

Use single-column form flow by default.

Two-column layouts are allowed only where fields are strongly related and remain readable on smaller screens.

### 10.3 Validation

Validation must:

- Appear near the affected field
- Explain how to resolve the issue
- Preserve entered values
- Avoid generic “invalid input” messages
- Distinguish required, invalid, blocked, and permission states

### 10.4 Draft preservation

Long or operational forms must support one or more of:

- Autosave
- Explicit draft save
- Resume later
- Section completion state
- Unsaved-change warning when genuinely necessary

Closing a sheet, navigating to another module, or temporarily losing connectivity must not unnecessarily destroy work.

### 10.5 Submission and approval separation

Saving data and making a governed commitment are separate actions.

For example:

- Save survey draft
- Submit survey for review
- Approve survey

These must not be merged into one ambiguous button.

---

## 11. Workflow and Governance Communication

### 11.1 Next action

Every governed record should display a clear next action where one exists.

Examples:

- Complete readiness
- Issue proposal
- Schedule Site Survey
- Submit design for review
- Approve supplier selection
- Confirm delivery

### 11.2 Blockers

Every blocker must communicate:

1. What is blocked
2. Why it is blocked
3. What resolves it

Preferred format:

```text
Approval blocked
Approved Site Survey required.
View Site Survey
```

Avoid long policy paragraphs in the primary interface.

### 11.3 Lifecycle presentation

Lifecycle views must show:

- Current stage
- Completed stages
- Available next transitions
- Blocked transitions
- Responsible person where relevant
- Dates or due dates where useful

Users must not be offered transitions they lack permission to perform.

### 11.4 Approval actions

Approval and rejection interfaces must include sufficient decision context without forcing the user to leave the workflow.

A rejection must require a meaningful reason where governance demands it.

---

## 12. Onboarding and Guidance

### 12.1 Time to value

Onboarding must help users perform real work quickly.

Use short workflow-based checklists such as:

```text
Set up your first project
1. Add a customer
2. Add a site
3. Create an opportunity
4. Complete readiness
5. Issue a proposal
```

### 12.2 Skipping and resuming

All educational workflows must be:

- Skippable
- Dismissible
- Resumable where practical

Users must not be trapped in tours.

### 12.3 Guidance patterns

Preferred guidance methods:

- Checklists
- Progress indicators
- Contextual empty states
- Hotspots used sparingly
- Inline examples
- Short tooltips
- Help inside sheets

Avoid long introductory carousels and multi-page mandatory tours.

---

## 13. Empty, Loading, Error, and Permission States

Every major screen and shared component must explicitly support:

- Normal
- Loading
- Empty
- Error
- Blocked
- Read-only
- Permission denied
- Partial data
- Offline or retry state where relevant

### 13.1 Empty states

An empty state should explain:

- What belongs here
- Why it matters
- The next available action

Avoid generic messages such as “No data”.

### 13.2 Loading states

Use skeletons that reflect the expected layout.

Avoid disruptive full-screen loaders for local content updates.

### 13.3 Error states

Errors must state:

- What failed
- Whether work was preserved
- What the user can do next

Technical error details may be available through secondary disclosure but should not dominate the interface.

### 13.4 Permission states

Read-only access should remain useful.

Do not hide all content merely because the user cannot edit it. Hide or disable only actions the role cannot perform, with a concise explanation where useful.

---

## 14. Responsive and Mobile Behaviour

Mobile must be designed intentionally.

It must not be treated as stacked desktop.

### 14.1 Mobile priorities

On smaller screens, preserve:

- Record identity
- Current state
- Next action
- Critical value
- Blocking condition
- Primary navigation

Move secondary detail into sheets, accordions, or dedicated views.

### 14.2 Navigation

The desktop sidebar may become a sheet or compact navigation pattern on mobile.

The mobile navigation must preserve business grouping and active-state clarity.

### 14.3 Forms

Forms must remain single-column on mobile. Controls must use touch-friendly sizing and spacing.

### 14.4 Modals and sheets

Sheets may become full-height on mobile where needed. Critical dialogs must remain concise and keyboard/screen-reader accessible.

---

## 15. Accessibility

Accessibility is a baseline requirement, not a final polish stage.

All interfaces must support:

- Keyboard navigation
- Visible focus states
- Semantic HTML
- Screen-reader labels
- Correct focus trapping in dialogs
- Escape and close behaviour
- Sufficient colour contrast
- Non-colour status communication
- Accessible validation messages
- Logical tab order
- Reduced-motion preferences

Use shadcn/ui and Radix primitives to support accessibility mechanics, but verify the final implementation rather than assuming accessibility automatically.

---

## 16. shadcn/ui Component Policy

### 16.1 Purpose

shadcn/ui provides accessible interaction primitives. It does not define the HelioCoreOS visual identity.

The governing formula is:

> shadcn underneath, HelioCoreOS on the surface.

### 16.2 Approved primitive use

Use shadcn/ui for:

- Dialog
- AlertDialog
- Sheet
- Popover
- Tooltip
- DropdownMenu
- Command
- Combobox
- Calendar
- Toast
- Tabs
- Accordion
- Skeleton
- Progress
- Form primitives

### 16.3 Custom HelioCoreOS components

The following must remain custom:

- Workspace shell
- Sidebar and topbar
- Page headers
- Metric strips
- Registers
- Record rows
- Status and risk components
- Next-action panels
- Governance notices
- Workflow views
- Timelines
- Record pages
- Operational dashboard cards
- Cockpit screens

### 16.4 Prohibition

Do not copy or install a generic shadcn dashboard template as the product shell.

Default shadcn styling must be adapted to HelioCoreOS tokens, spacing, typography, and interaction rules.

---

## 17. Component Architecture

Components should be organised into three layers.

### 17.1 UI primitives

```text
components/ui/
```

Examples:

- `dialog.tsx`
- `sheet.tsx`
- `popover.tsx`
- `form.tsx`
- `command.tsx`
- `tooltip.tsx`

### 17.2 HelioCoreOS design components

```text
components/heliocore/
```

Examples:

- `workspace-shell.tsx`
- `workspace-sidebar.tsx`
- `page-header.tsx`
- `metric-strip.tsx`
- `workspace-toolbar.tsx`
- `record-register.tsx`
- `record-row.tsx`
- `status-chip.tsx`
- `risk-indicator.tsx`
- `next-action.tsx`
- `governance-notice.tsx`
- `detail-sheet.tsx`
- `progress-checklist.tsx`
- `activity-timeline.tsx`
- `empty-state.tsx`

These components must not contain module-specific business logic.

### 17.3 Business components

```text
components/modules/
```

Examples:

- `opportunities/opportunity-register.tsx`
- `opportunities/readiness-panel.tsx`
- `proposals/proposal-approval-dialog.tsx`
- `surveys/survey-checklist.tsx`
- `designs/design-governance-panel.tsx`
- `projects/project-health-summary.tsx`

Business components may understand Solar EPC workflows but must use the shared design components.

---

## 18. Design Tokens

Visual values must be represented through shared tokens rather than repeated hard-coded values.

Required token categories:

- Canvas
- Surface
- Elevated surface
- Foreground
- Secondary foreground
- Muted foreground
- Border
- Accent
- Success
- Warning
- Danger
- Focus
- Typography scale
- Spacing scale
- Radius
- Control height
- Sidebar width
- Content width
- Table density
- Icon size
- Transition timing

Components must consume tokens consistently.

Changes to foundational tokens must be reviewed for their effect across all modules.

---

## 19. Content and Microcopy

### 19.1 Tone

Product language must be:

- Direct
- Calm
- Precise
- Professional
- Actionable

### 19.2 Labels

Use verbs for actions and nouns for destinations.

Examples:

- `Issue proposal`
- `Approve design`
- `Request evidence`
- `View activity`
- `Opportunities`
- `System Designs`

Avoid vague labels such as:

- `Proceed`
- `Continue` when the result is unclear
- `Submit` without context
- `Manage`
- `Process`

### 19.3 Confirmation copy

Confirmation interfaces must explain the consequence, not repeat the button label.

### 19.4 Dates, units, and currency

Dates, engineering units, and monetary values must be formatted consistently according to organisation and record context.

Examples:

- `625 kWp`
- `1.2 MWh`
- `PKR 156.2m`
- `30 Jul 2026`

---

## 20. Implementation Rules

### 20.1 Separate UI refactoring from business logic

UX work must not silently alter:

- Database schema
- RLS
- Lifecycle transitions
- Approval rules
- Document governance
- Relationship integrity
- Audit behaviour

Existing server actions, queries, and validation should feed new presentation components through stable view models.

### 20.2 Opportunities as pilot

The Opportunities module is the first reference implementation because it includes:

- Customers
- Sites
- Money
- Capacity
- Stages
- Search
- Filters
- Ownership
- Relationships
- Workflow

The pilot must establish the shared component APIs before broad rollout.

### 20.3 Rollout order

After the Opportunities pilot is accepted, refactor in this order:

1. Customers
2. Sites
3. Projects
4. Tasks
5. Team & Access
6. Indicative Proposals
7. Readiness
8. Site Surveys
9. System Designs
10. Overview dashboard
11. Future Procurement and Delivery modules

### 20.4 No page-specific duplication

A module must not create a second implementation of a shared header, toolbar, register, status system, detail sheet, or empty state without an approved reason.

---

## 21. Acceptance Criteria

A UX implementation is not complete until:

- The module uses the shared workspace shell
- There is one clear primary action
- Duplicate actions are removed
- Currency is record-aware
- Status and risk are consistently presented
- Next action and blockers are visible
- Routine work avoids unnecessary modals
- Contextual inspection uses sheets or popovers
- Long forms preserve drafts
- Loading, empty, error, blocked, and permission states exist
- Keyboard navigation works
- Mobile behaviour is intentional
- Governance behaviour remains unchanged
- Shared components are reused
- The page is understandable within seconds

---

## 22. Prohibited Patterns

The following patterns are prohibited unless formally justified:

- Multiple competing primary buttons
- Hard-coded currency symbols
- Full-page navigation for minor inspection
- Modals for routine field edits
- Long forms inside popovers
- Status communicated by colour alone
- Arbitrary progress percentages
- Mandatory onboarding tours
- Generic “No data” empty states
- Generic shadcn dashboard templates
- Module-specific duplicates of shared components
- Mobile layouts produced only by stacking desktop elements
- Hidden blockers without resolution guidance
- Approval actions without consequence context
- Destructive actions without confirmation

---

## 23. Amendment Procedure

This Constitution may be amended when product evidence demonstrates that a rule is incomplete, harmful, or no longer appropriate.

An amendment must:

1. Identify the affected rule
2. Explain the user or product problem
3. Describe the proposed change
4. Assess impact across modules
5. Preserve accessibility and governance
6. Be reviewed before implementation

Exceptions must not become undocumented precedents.

---

## 24. Final Governing Principles

> HelioCoreOS must preserve user context wherever possible. Interruptive interfaces are reserved for consequential decisions, irreversible actions, and governance commitments. Routine work must remain inline, progressive, and resumable.

> Every governed state must communicate the next available action, any blocking condition, and the shortest path to resolution.

> The interface must reveal complexity only when it becomes useful.

> shadcn/ui provides behaviour and accessibility primitives; HelioCoreOS defines the experience.

> Consistency across the operating system takes priority over isolated visual novelty.

> Governance must feel clear and dependable, not heavy.

---

**End of Constitution**
