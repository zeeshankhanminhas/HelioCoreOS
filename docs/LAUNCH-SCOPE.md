# HelioCoreOS launch scope

## Product promise

HelioCoreOS launches as the smallest complete, governed front end of a Solar EPC workflow. It must allow a subscribed organisation to control who has access and move a prospective customer from first record to a survey-ready project without introducing enterprise complexity prematurely.

## Launch workflow

Organisation → User → Customer → Site → Opportunity → Customer Readiness → Indicative Proposal → Survey → Project

## Platform foundation

The launch platform supports:

- one organisation boundary per workspace;
- four fixed roles: Owner, Admin, Manager, Member;
- simple teams;
- active, invited, and suspended user states;
- manually governed subscription plan, status, currency, and user limit;
- Supabase Row Level Security for tenant isolation.

The launch does not include custom roles, granular permission builders, automatic payment collection, multi-office hierarchy, SSO, or white labelling.

## Business capabilities

The first release is limited to:

1. Customers
2. Sites
3. Opportunities
4. Customer Readiness and Evidence
5. Indicative Proposals
6. Surveys
7. Project conversion
8. Team and access visibility

## Deferred capabilities

The following remain outside launch until the core workflow is proven with real users:

- full BOM and design calculation engines;
- procurement and inventory;
- vendor and subcontractor portals;
- civil and roof-access work packages;
- advanced approvals;
- net-metering automation;
- installation and commissioning control;
- O&M and asset management;
- public APIs and bespoke integrations;
- automated recurring billing.

## Launch readiness test

A release is launch-ready only when a new organisation can:

1. authenticate and see only its own records;
2. see its subscription and available seats;
3. see its users, roles, statuses, and teams;
4. create a customer and site;
5. create and qualify an opportunity;
6. request and validate the minimum customer evidence;
7. issue an indicative proposal;
8. complete a structured survey;
9. convert the opportunity to a project;
10. review the resulting activity history.

## Complexity rule

No deferred module enters the launch branch unless the current end-to-end workflow cannot be completed correctly without it.
