# Session 01 — Repository Baseline Audit

Status: Baseline freeze candidate  
Date: 2026-09-13  
Repository: `zeeshankhanminhas/HelioCoreOS`

## Purpose

Session 01 freezes the current engineering implementation before the database-platform transition and before any further ERP scope expansion.

The objective is to establish one known implementation baseline, remove repository hygiene blockers, separate implementation code from architecture-only material, and define the checks required before the baseline is accepted.

## Baseline candidate

Implementation baseline candidate:

- Pull request: `#18 Build HelioCoreOS calculator + HelioCalc engineering foundation`
- Branch: `feature/design-engine-v1`
- Product boundary: Calculator first, equipment-driven Detailed Design, HelioCalc as the authoritative persisted engineering service
- Project boundary: Projects remain post-contract delivery records
- Engineering truth: one canonical electrical-design model feeds validation, PVWatts, SLD and BOM

PR #18 is the implementation baseline because it contains the current working calculator, Python/FastAPI HelioCalc service, engineering persistence preparation, PVWatts integration, deterministic SLD/BOM generation and Engineering Core CI.

## PR #16 disposition

Pull request `#16 Define HelioCalc architecture, validation and EPC engineering boundaries` remains architecture/governance reference material and is **not** part of the baseline merge decision in Session 01.

Reason:

- it is an older draft branch;
- it overlaps files subsequently changed by PR #18;
- merging it directly into the implementation baseline risks reintroducing stale assumptions or merge conflicts;
- its useful governing documents should be reconciled deliberately after the implementation baseline is frozen, not mixed into the freeze itself.

No governing principle from PR #16 is considered discarded merely because the PR is not merged during this baseline freeze.

## Repository hygiene findings

A tracked `.env.local` file was present on the implementation branch. It contained public/publishable Supabase client configuration rather than a service-role/private credential, but local environment files must not be tracked.

Action completed in Session 01:

- removed `.env.local` from `feature/design-engine-v1`;
- confirmed `.gitignore` already ignores `.env*` while allowing `.env.example`.

Rule going forward:

- `.env.local` and all local/deployment secret files remain untracked;
- `.env.example` contains placeholders only;
- private database passwords, service-role keys, API secrets and privileged HelioCalc tokens must never be committed.

## Baseline architecture to preserve

The following decisions are frozen for the next phase unless changed through an explicit architecture decision:

1. `Organisation → Customer → Site → Opportunity → Project` remains the business hierarchy.
2. Project creation remains contract-gated.
3. Pre-contract engineering remains attached to Opportunity and Site.
4. HelioCoreOS governs workflow, persistence, review, approval and audit.
5. HelioCalc owns deterministic engineering calculations and returns structured findings/provenance.
6. Browser TypeScript calculations remain preview-only where Python HelioCalc is the governed authority.
7. Manufacturer datasheet limits and equipment revisions remain first-class engineering inputs.
8. PVWatts remains a performance model and is not electrical-compliance authority.
9. SLD and BOM derive from the same canonical electrical design model.
10. Standards-dependent cable derating, protection coordination, earthing and jurisdiction-specific approval remain explicit engineering gates until sourced and versioned.

## Database transition boundary

Session 01 does **not** convert the application from Supabase to Neon.

It freezes the Supabase-backed implementation so the migration can be measured against a known working baseline.

The next platform phase must preserve:

- tenant isolation;
- role and organisation membership semantics;
- auditability;
- atomic governed writes;
- immutable engineering revisions;
- HelioCalc service boundary;
- project conversion gates.

A Neon migration must not weaken these controls merely to simplify database access.

## Required baseline checks

The freeze is accepted only when the candidate branch passes:

### Application

- `npm run typecheck`
- `npm run lint`
- `npm run build`

### Engineering service

- Python dependency installation from the pinned HelioCalc requirements
- HelioCalc unit tests

### Workflow

At least one end-to-end path proving:

`Organisation → Customer → Site → Opportunity → Load Profile → Calculator → HelioCalc → persisted calculation revision`

### Security / repository

- no tracked `.env.local`;
- no committed private credentials;
- tenant/RLS assumptions documented before replacement;
- database migration order reproducible from a clean environment.

## Freeze rule

After the baseline is accepted, do not add new ERP modules to this baseline branch.

Subsequent work must occur as focused migration or product slices against the frozen baseline so regressions can be attributed clearly.

## Session 01 exit criteria

Session 01 is complete when:

- repository and open engineering PRs are audited;
- PR #18 is identified as the implementation baseline;
- PR #16 is separated as architecture reference rather than blindly merged;
- tracked local environment configuration is removed;
- CI is green on the updated PR #18 head;
- the baseline is merged or otherwise preserved as the known-good starting point for Session 02.
