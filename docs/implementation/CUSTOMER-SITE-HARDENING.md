# Customer and Site Hardening

Project profile: HelioCoreOS Solar EPC  
Change type: Project Extension  
Launch scope: Yes

## Core references

- CORE-CTX-001 — Location and context
- CORE-DATA-001 — Progressive and validated data capture
- CORE-STATE-001 — Explicit customer status
- CORE-AUDIT-001 — Complete traceability
- CORE-FAIL-001 — No silent failure
- CORE-REL-001 — Customer and Site relationship integrity
- CORE-SEC-001 — Tenant isolation
- CORE-UX-001 — Consistent record hierarchy

## Implemented scope

### Customer governance

- adds a governed customer edit route;
- validates display name, email, country code, currency code, payment terms and status;
- blocks duplicate display names within the organisation;
- records ordinary updates separately from status changes;
- preserves linked Site and Project visibility;
- exposes a clear edit action from the customer command view.

### Site governance

- adds a dedicated Site command view;
- adds a governed Site edit route;
- validates Site identity and Customer assignment against the active organisation;
- blocks duplicate Site names for the same Customer;
- records Customer reassignment separately from ordinary updates;
- displays linked Opportunities and Projects;
- exposes governed navigation between Customer, Site, Opportunity and Project records.

## Relationship rules

1. Every Site belongs to one Customer in the same Organisation.
2. Customer reassignment is explicit, tenant-scoped and audited.
3. Duplicate Site names are blocked per Customer.
4. Archived Customers are not offered as normal Site reassignment targets.
5. Customer and Site edits never rely on interface filtering alone; server actions validate the organisation boundary.

## Audit events

- `customer.updated`
- `customer.status_changed`
- `site.updated`
- `site.customer_changed`

## Validation required

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- edit Customer identity and contact details
- reject invalid email, country code, currency code and payment terms
- reject duplicate Customer display name
- change Customer status and verify audit event
- edit Site name, address and postcode
- reject duplicate Site name for one Customer
- reassign Site to another valid Customer and verify audit event
- verify Customer, Site, Opportunity and Project links
- verify desktop and mobile layouts
