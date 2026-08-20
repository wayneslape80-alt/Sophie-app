# W-011 / D-006 BACKEND DEPLOYMENT & AUDIT PACKAGE

**Status:** STAGED — NOT YET DEPLOYED  
**Backend release:** Sophie App v2.4.0  
**Opportunity contract:** `d006-v1`  
**Owner:** 00.03 — Backend, Sheets & Security  
**Behavioural authority:** D-006 (do not reopen)  
**Historical Transactions:** PRESERVE — migration does not rewrite/delete historical rows

## Staged source

- Drive staged source: `Code.gs.v2.4.0-D006-STAGED.txt`
- Drive file ID: `1xzV6L4w82WbZsZjFX6dP2L26pFZdSoR5`
- SHA-256: `0e22afc5caf93d1eade2f828d4e54d36a20c4130293a7561c7e3c005b6cb48a2`
- Built from verified deployed/source baseline v2.3.0 Drive `Code.gs`, not the stale GitHub v2.2.0 copy.
- GitHub staging branch: `w-011-d006-backend-v2.4`
- D-006 contract: `docs/OPPORTUNITY_BACKEND_CONTRACT_D006.md`

## Static/local verification completed

- Node JavaScript syntax check: PASS.
- `runD006OpportunityContractTests()` executed in a Node VM with Apps Script globals stubbed: PASS 16/16.
- Six-item migration planner exercised against the live six-row source shape with:
  - Dog poo -> ordinary Contribution branch: PASS; resulting plan = 11 rows, source IDs 2 and 6 retired, 5 new IDs created.
  - Dog poo -> genuinely extra Earn branch: PASS; resulting plan = 12 rows, source IDs 2, 3 and 6 retired, 6 new IDs created.
- Live production Sheet has not been migrated by this staging work.

## v2.4.0 contract functions

Public/child Opportunity mutations:
- `startOpportunity`
- `finishOpportunity`
- `withdrawEarn`
- `stopLearn`

Parent-key protected:
- `reviewEarn`
- `completeContributionReview`
- `cancelOpportunity`
- `createOpportunity`

Legacy mutations are disabled:
- `claimJob`
- `approveJob`
- `rejectJob`

They return `CLIENT_UPDATE_REQUIRED` rather than recreating the prohibited pre-D006 start -> pending-money semantics.

## Financial invariants implemented

- Start: no `Stats.Pending`, no Balance, no Transaction.
- Earn full finish: frozen agreed amount enters Pending and exactly one `pending/full_completion` Transaction is created.
- Full payment: full frozen amount leaves Pending and enters Balance.
- Return for completion: full frozen amount leaves Pending; no Balance payment.
- Partial payment from full review: full frozen amount leaves Pending; only agreed partial amount enters Balance; Transaction preserves `AgreedAmount` separately from actual `Amount`.
- Partial-work withdrawal request: zero Pending and no Transaction until a parent agrees an amount.
- Partial payment after withdrawal: agreed partial amount goes directly to Balance and a completed Transaction is appended.
- No partial payment: no money movement and no invented zero-dollar financial Transaction.

## Schema delta

`Opportunities` is additive: legacy 20 columns are retained and 30 D-006 columns are added, including requiredness, scope, completion standard, lifecycle timestamps, immutable Earn agreement snapshot, review fields and migration provenance.

`Transactions` retains all existing columns and adds:
- `AgreedAmount`
- `ReviewKind`
- `ReviewOutcome`

Historical Transaction rows are preserved; the migration only adds empty columns to old rows.

## Six-item migration safety

`migrateD006SixItems()`:

1. requires an explicit parent-confirmed JSON config in Script Property `SOPHIE_D006_MIGRATION_CONFIG`;
2. requires exactly six live legacy Opportunity rows for this scoped migration;
3. aborts if any Opportunity is pending/claimed/in-progress/waiting-for-review;
4. aborts if any pending Transaction exists;
5. creates hidden rollback snapshots **before** live-table writes:
   - `Opportunities_PreD006_v23`
   - `Transactions_PreD006_v23`
6. never deletes source rows that split into multiple new contracts; those source rows are marked `cancelled` / `d006-v1-retired` and hidden from `getData`;
7. does not rewrite historical Transaction rows;
8. runs `auditDataIntegrity()` immediately after migration and stops release on any issue.

## Parent-confirmation config required before migration

Do not guess these values. Use `getD006MigrationConfigTemplate()` for the exact shape.

Required confirmations include:
- Dishwasher: `expected|negotiated` + reasonable completion standard.
- Dinner Learn: `negotiated|optional` + practice target.
- Extra dinner Earn: independently confirmed amount, genuinely additional scope, completion standard.
- Dog poo: ordinary Contribution vs distinct extra Earn; corresponding requiredness/standard or value/scope/standard.
- Tidy room: `negotiated|optional` + functional `tidy enough` target.
- Laundry: `negotiated|optional` + practice target.
- Recycling/bins: `split|combined`, Contribution requiredness and standards for each timing point/checklist.

## Deployment sequence

### Phase A — pre-deploy

Run on currently deployed v2.3.0 before replacing source:

1. `auditDataIntegrity()` — must be `ok:true`.
2. Confirm live Opportunities still have no active/pending claim.
3. Confirm no pending Transaction exists.

### Phase B — deploy code

1. Replace Apps Script `Code.gs` with the staged v2.4.0 source.
2. Save.
3. Deploy -> Manage deployments -> edit the **existing** Web App deployment.
4. Select **New version**.
5. Deploy, preserving the existing deployment ID and `/exec` URL.
6. Do not run `initialiseSophieAppV2()`.

### Phase C — verify code before migration

Run:

1. `runD006OpportunityContractTests()` — expected `ok:true`, `testCount:16`, `failureCount:0`.
2. `auditD006OpportunityReadiness()` — data readiness should be `ok:true`; config may still report not ready until parent-confirmed config is set.
3. Web endpoint health must report:
   - `version: 2.4.0`
   - `opportunityContractVersion: d006-v1`

**Important:** the legacy frontend Opportunity mutations are disabled in v2.4.0. Keep the migration/frontend release window controlled and short.

### Phase D — configure and preview migration

1. Set Script Property `SOPHIE_D006_MIGRATION_CONFIG` to the parent-confirmed JSON.
2. Run `previewD006OpportunityMigration()`.
3. Require `ready:true`.
4. Review resulting counts, transformed IDs, retired IDs and created IDs.
5. Do not migrate if any configuration or source conflict remains.

### Phase E — migrate

Run once:

`migrateD006SixItems()`

Expected properties:
- `migrated:true`
- `historicalTransactionsTouched:false`
- snapshot sheet names present
- nested post-migration `audit.ok:true`

### Phase F — final verification

Run:

1. `auditDataIntegrity()` — require `opportunityContractReady:true`, `ok:true`.
2. `deploymentAuditD006()` — require contract tests and integrity clean.
3. Inspect live `Opportunities` and `Transactions` directly.
4. Verify `Stats.Pending` equals pending D-006 full-review ledger total.
5. Verify no historical Transaction row changed except addition of blank D-006 columns.
6. Smoke-test with controlled test Opportunities if desired before Sophie uses the board:
   - Contribute start/finish
   - Learn start/stop
   - Earn start -> no money
   - Earn finish -> pending
   - Earn return -> pending removed
   - Earn finish again -> pending restored
   - Earn full payment
   - Earn partial-work withdrawal -> zero pending
   - Earn partial payment/no-partial-payment branches

## Release gate to 00.02

Return to 00.02 only after:
- deployed health = `2.4.0 / d006-v1`;
- six-item migration completed;
- `auditDataIntegrity().ok === true`;
- `deploymentAuditD006().contractTests.ok === true`;
- `Stats.Pending`/ledger invariant clean;
- no historical Transaction rewrite detected.

00.02 must then release the staged Opportunity Board immediately against `d006-v1`, bump service-worker cache/version, and never call the retired `claimJob/approveJob/rejectJob` paths.
