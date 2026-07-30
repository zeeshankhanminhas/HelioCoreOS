# Pakistan Demo Dataset

This pack creates a connected, fictional Pakistan commercial and industrial Solar EPC portfolio for HelioCoreOS module and lifecycle testing.

## Coverage

| Module | Records |
|---|---:|
| Customers | 25 |
| Sites | 35 |
| Opportunities | 50 |
| Readiness items | 300 |
| Indicative proposals | 40 |
| Site surveys | 30 |
| System designs | 25 |
| Projects | 25 |
| Activity events | 270 |

The records cover Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan and Islamabad Capital Territory. Utility context includes LESCO, FESCO, MEPCO, GEPCO, IESCO, PESCO, HESCO, QESCO and K-Electric.

All companies, people, telephone numbers, identifiers and documents are fictional. Email addresses use the reserved `.example` domain.

## Files

- `supabase/seed/pakistan_demo_dataset.sql` — rerunnable data seed
- `supabase/seed/pakistan_demo_validation.sql` — counts, relationships and lifecycle checks
- `supabase/seed/pakistan_demo_cleanup.sql` — removes only `PK-DEMO` records

## Important currency note

The current application schema still contains legacy columns named `estimated_value_gbp`, `indicative_price_gbp`, `estimated_annual_saving_gbp` and `contract_value_gbp`. For this Pakistan demonstration profile, values inserted into those fields are **PKR**, and the associated notes state that explicitly. This seed does not rename schema columns.

## Run in Supabase

Run the schema migrations first. Then open Supabase SQL Editor and execute the complete seed file.

When the database contains exactly one organisation, the script selects it automatically and uses its first active profile as the actor.

When multiple organisations exist, run these statements immediately above the seed in the same SQL query, replacing the UUIDs:

```sql
select set_config(
  'heliocore.demo_organisation_id',
  '00000000-0000-0000-0000-000000000000',
  false
);

select set_config(
  'heliocore.demo_actor_id',
  '00000000-0000-0000-0000-000000000000',
  false
);
```

The actor must be a profile belonging to the selected organisation.

## Validate

Run:

```text
supabase/seed/pakistan_demo_validation.sql
```

The first result set should show `PASS` for every module. The second result set should show zero failures for every relationship check. The final result set displays the lifecycle distribution for opportunities, proposals, surveys, designs and projects.

## Rerun

The seed is idempotent at dataset level. Before inserting, it deletes only records identified by the `PK-DEMO-` and `[PK-DEMO]` markers in reverse dependency order. It does not match ordinary user-created records.

## Remove

Run:

```text
supabase/seed/pakistan_demo_cleanup.sql
```

The cleanup script follows the same organisation-selection rules and removes only the Pakistan demonstration dataset.

## Suggested smoke-test route

1. Open Customers and verify 25 fictional Pakistan businesses.
2. Open a customer with a satellite facility and inspect both Sites.
3. Follow a `won` Opportunity into its accepted Proposal, approved Survey, governed Design and linked Project.
4. Inspect Opportunities in `lead`, `qualified`, `readiness`, `proposal`, `won` and `lost` states.
5. Inspect the rejected Survey and rejected Design examples.
6. Verify Project stages across qualification, survey, design, commercial, procurement, installation, commissioning, handover, complete and on hold.
7. Review activity timelines and confirm movement is visible across the operating history.
