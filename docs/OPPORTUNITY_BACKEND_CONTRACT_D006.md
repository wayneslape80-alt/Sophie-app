# SOPHIE APP - D-006 OPPORTUNITY BACKEND CONTRACT

**Status:** IMPLEMENTATION-READY CONTRACT - OD-008 / D-006  
**Owner:** 00.03 - Backend, Sheets & Security  
**Date:** 2026-08-20  
**Behavioural authority:** D-006 / OPP-D1 through OPP-D7  
**UX source:** `OPPORTUNITY_UX.md` Section 16  
**Current backend baseline reconciled:** deployed Apps Script v2.3.0 + live `Sophies app` spreadsheet  
**Implementation recipient:** 00.02 - Frontend & PWA Development  

This contract finalises the minimum backend/API semantics that 00.02 may implement against. It does **not** itself deploy or migrate the live Opportunity backend. The current v2.3.0 Opportunity implementation remains legacy until a coordinated D-006 backend/frontend release is staged.

---

# 1. Reconciliation against v2.3.0

## 1.1 Current live/backend facts

- Live `Opportunities` has the legacy 20-column schema: `ID`, `Title`, `Value`, `Tier`, `Status`, `Description`, `Category`, `Type`, `Skill`, `EstimatedMinutes`, `Repeatable`, `Frequency`, `ClaimedAt`, `SubmittedAt`, `ApprovedAt`, `Icon`, `Instructions`, `WhyItMatters`, `Feedback`, `ApprovedBy`.
- All six current live rows are still `Type=earn`, `Status=open`, with positive `Value`.
- Live `Transactions` currently contains headers only; there are no existing transaction rows at this reconciliation point.
- v2.3.0 `claimJob` moves `open -> pending`, increments `Stats.Pending` immediately and appends a pending Transaction immediately.
- v2.3.0 `approveJob` / `rejectJob` operate only on pending/claimed rows.
- v2.3.0 correctly uses immutable pending `Transaction.Amount` for approval/rejection rather than rereading mutable `Opportunity.Value`.
- v2.3.0 has no authoritative `in_progress`, withdrawal, partial-work review, partial-payment, cancellation, parent Opportunity creation, requiredness, completion-standard, approval-policy or full Earn agreement-snapshot model.

## 1.2 Section 16 gap assessment

| Section 16 requirement | v2.3.0 status | D-006 contract resolution |
|---|---|---|
| Common normalized activity object | PARTIAL | Add requiredness, completion/review fields, lifecycle timestamps and normalized wire contract. |
| Domain validity | FAIL | Server-enforce Contribute/Learn/Earn invariants; no reliance on hidden UI controls. |
| Normalized lifecycle | FAIL | Replace legacy `open/pending/completed` semantics with D-006 states. |
| Required lifecycle mutations | FAIL | Publish exact D-006 API actions below. |
| Earn agreement snapshot | PARTIAL | Preserve v2.3 immutable-amount principle but snapshot value + scope + standard + material estimated time at acceptance. |
| Earn review object | FAIL | Add review state/kind/outcome/approved amount/feedback metadata. |
| Withdrawal / partial work | FAIL | Add atomic Earn stop/partial-review path. |
| Financial semantics | FAIL AT START | Starting must have no money effect; full finish creates review/potential-pending state; only settled full/partial payment changes balance. |
| Parent creation payload | FAIL | Add parent-key-protected `createOpportunity`. |
| Six-item migration | NOT DONE | Use migration rules and hold ambiguous fields for parent confirmation rather than guessing. |
| Data truth / errors | PARTIAL | Keep fail-closed behaviour; add contract validation, unique-record mutation checks and machine-readable error codes. |

**Critical conclusion:** `claimJob -> pending` must not be reused as the implementation of `Take this job`. D-006 requires `available -> in_progress` with no financial write.

---

# 2. Contract version and rollout gate

Backend implementation target: **v2.4.0** or later.

The API must expose:

```js
opportunityContractVersion: "d006-v1"
```

in both `getData` and parent data responses. `health` should also return the contract version when practical.

00.02 may code against this document now, but must not treat new Opportunity mutations as live until the deployed backend reports `opportunityContractVersion = d006-v1`.

---

# 3. Normalized Opportunity wire object

`getData().jobs[]` and parent Opportunity data must expose these fields.

## Required common fields

```js
{
  id,
  title,
  type,                    // contribute | learn | earn
  requiredness,            // expected | negotiated | optional
  status,                  // D-006 lifecycle enum
  whyItMatters,
  instructions,
  scope,
  completionStandard,
  approvalRequired,
  reviewReason,
  description,
  estimatedMinutes,
  skillId,
  capabilityLabel,
  repeatable,
  frequency,
  supportPreference,
  createdAt,
  updatedAt,
  startedAt,
  finishedAt,
  reviewedAt,
  completedAt,
  withdrawnAt,
  cancelledAt,

  // Earn offer/agreement fields
  agreedValue,
  agreedScope,
  agreedCompletionStandard,
  agreedEstimatedMinutes,
  acceptedAt,

  // review fields
  reviewState,             // none | awaiting | settled
  reviewKind,              // blank | full_completion | partial_work_withdrawal | contribution_check
  reviewOutcome,           // blank | full_payment | returned_for_completion | partial_payment | no_partial_payment | contribution_completed
  approvedAmount,
  reviewFeedback,
  reviewedBy,
  withdrawalReviewRequested,
  partialWorkDescription,

  // migration/audit provenance; may be omitted from Sophie UI
  sourceOpportunityId,
  migrationVersion
}
```

### Compatibility aliases

For one controlled transition release the backend may continue returning legacy fields such as `value`, `skill`, `claimedAt`, `submittedAt`, `approvedAt`, `feedback`, but 00.02's new D-006 implementation must use the new contract fields.

For Contribute/Learn, `value` must normalize to `0` and must never be presented as payment.

For Earn, `agreedValue` means the current offered value while `available`, and the frozen accepted value after `acceptedAt` is set.

---

# 4. Additive `Opportunities` sheet delta

Preserve all existing columns for migration/backward compatibility. Add these columns:

1. `Requiredness`
2. `Scope`
3. `CompletionStandard`
4. `ApprovalRequired`
5. `ReviewReason`
6. `SkillID`
7. `SupportPreference`
8. `CreatedAt`
9. `UpdatedAt`
10. `StartedAt`
11. `FinishedAt`
12. `ReviewedAt`
13. `CompletedAt`
14. `WithdrawnAt`
15. `CancelledAt`
16. `AgreedValue`
17. `AgreedScope`
18. `AgreedCompletionStandard`
19. `AgreedEstimatedMinutes`
20. `AcceptedAt`
21. `ReviewState`
22. `ReviewKind`
23. `ReviewOutcome`
24. `ApprovedAmount`
25. `ReviewFeedback`
26. `ReviewedBy`
27. `WithdrawalReviewRequested`
28. `PartialWorkDescription`
29. `SourceOpportunityID`
30. `MigrationVersion`

### Existing-column authority after D-006

- `Value` = current **offer/template** value only; must be `0` for Contribute/Learn.
- `Status` = authoritative D-006 lifecycle state.
- `Skill` remains a compatibility/display label; `SkillID` is the stable capability link when present.
- `ClaimedAt`, `SubmittedAt`, `ApprovedAt`, `Feedback`, `ApprovedBy` are legacy compatibility fields and are no longer the authoritative D-006 lifecycle/review timestamps.

No separate recurring-instance engine is introduced under this contract. `Repeatable` / `Frequency` remain descriptive metadata. 00.02 must not locally reset a settled Opportunity into a new lifecycle instance.

---

# 5. Domain validation

Validation applies to API-created rows and every mutation. Manual spreadsheet inconsistencies must be reported by integrity audit rather than silently normalized into a different behavioural contract.

## Contribute

- `type = contribute`
- `requiredness = expected | negotiated`
- `Value = 0`
- `approvalRequired = false` by default
- if `approvalRequired = true`, `reviewReason` is required
- `completionStandard` required
- no Earn agreement/payment fields may be set
- no financial Transaction may be created by start/finish/completion

## Learn

- `type = learn`
- `requiredness = negotiated | optional`
- `Value = 0`
- `approvalRequired = false`
- `completionStandard` represents the current practice target, not mastery
- `SkillID` is required for new Learn records and must resolve to an existing Skill
- no financial Transaction may be created
- `supportPreference` is optional; no new Opportunity support-preference mutation is mandated by d006-v1

## Earn

- `type = earn`
- `requiredness = optional` only
- `Value > 0` while available
- `Scope` required
- `CompletionStandard` required
- `approvalRequired = true`
- start freezes the agreement snapshot
- accepted Earn rows cannot have value/scope/standard silently edited; material change requires cancelling/replacing the offer before acceptance or a new separately identified agreement after acceptance

---

# 6. Authoritative lifecycle

Stored/normalized states:

- `available`
- `in_progress`
- `waiting_for_review`
- `returned_for_completion`
- `completed`
- `withdrawn`
- `cancelled`

## Transition rules

| Domain | From | Mutation | To | Money effect |
|---|---|---|---|---|
| Contribute | available | start | in_progress | none |
| Contribute | in_progress | finish | completed when no review | none |
| Contribute | in_progress | finish | waiting_for_review when temporary review enabled | none |
| Contribute | waiting_for_review | parent completes review | completed | none |
| Learn | available | start | in_progress | none |
| Learn | in_progress | finish | completed | none |
| Learn | in_progress | stop for now | withdrawn | none |
| Earn | available | start | in_progress | **none** |
| Earn | in_progress | finish | waiting_for_review / full_completion | potential amount awaiting review only |
| Earn | returned_for_completion | keep working/start | in_progress | none |
| Earn | returned_for_completion | finish | waiting_for_review / full_completion | potential amount awaiting review only |
| Earn | in_progress or returned_for_completion | stop, no review | withdrawn | none |
| Earn | in_progress or returned_for_completion | stop + partial review request | waiting_for_review / partial_work_withdrawal | **zero pending amount** |
| Earn | waiting_for_review / full_completion | full payment | completed | approved full amount -> balance/ledger |
| Earn | waiting_for_review / full_completion | needs finishing | returned_for_completion | no balance payment |
| Earn | waiting_for_review / full_completion | partial payment | completed | approved partial amount -> balance/ledger |
| Earn | waiting_for_review / partial_work_withdrawal | partial payment | completed | approved partial amount -> balance/ledger |
| Earn | waiting_for_review / partial_work_withdrawal | no partial payment | withdrawn | none |

Server must reject every transition not explicitly allowed by this contract.

Expected Contribution has no Sophie `withdraw` mutation. Closing UI or choosing a later time does not remove the responsibility.

---

# 7. Exact API actions for 00.02

All POST responses retain the current envelope:

```js
{ success: true, data: ... }
```

Handled failures remain JSON with `success:false` and must add a machine-readable `code`.

## 7.1 `startOpportunity`

Child/Sophie route.

Payload:

```js
{ action: "startOpportunity", opportunityId }
```

Valid from `available` for all domains. For Earn, atomically freeze:

- `AgreedValue = Value`
- `AgreedScope = Scope`
- `AgreedCompletionStandard = CompletionStandard`
- `AgreedEstimatedMinutes = EstimatedMinutes`
- `AcceptedAt = now`

Then set `Status=in_progress`, `StartedAt`, `UpdatedAt`.

**No `Stats.Pending` change and no Transaction append.**

## 7.2 `finishOpportunity`

Child/Sophie route.

Payload:

```js
{ action: "finishOpportunity", opportunityId }
```

Domain behaviour follows Section 6. For Earn full completion, set review fields to `awaiting/full_completion` and create the awaiting-review financial record described in Section 8.

## 7.3 `withdrawEarn`

Child/Sophie route. This intentionally combines Section 16's stop and optional partial-review submission into one atomic mutation.

Payload without review:

```js
{
  action: "withdrawEarn",
  opportunityId,
  requestPartialReview: false
}
```

Payload requesting review:

```js
{
  action: "withdrawEarn",
  opportunityId,
  requestPartialReview: true,
  partialWorkDescription: "..."
}
```

When review is requested, description is required, the agreement ends, `WithdrawnAt` is written, and state becomes `waiting_for_review` with `reviewKind=partial_work_withdrawal`. It contributes **$0** to pending until a parent agrees an actual partial amount.

## 7.4 `stopLearn`

Child/Sophie route.

```js
{ action: "stopLearn", opportunityId }
```

Valid only for `learn/in_progress`; result `withdrawn`; no money effect.

## 7.5 `reviewEarn`

Parent-key protected. One endpoint owns all Earn review outcomes.

```js
{
  action: "reviewEarn",
  adminKey,
  opportunityId,
  outcome,            // full_payment | returned_for_completion | partial_payment | no_partial_payment
  approvedAmount,     // required only for partial_payment
  feedback,
  approvedBy
}
```

Validation:

- `full_completion` review allows `full_payment`, `returned_for_completion`, `partial_payment`.
- `partial_work_withdrawal` review allows `partial_payment`, `no_partial_payment`.
- `full_payment`: amount fixed to frozen `AgreedValue`.
- `returned_for_completion`: factual actionable feedback required.
- `partial_payment`: `approvedAmount > 0 && approvedAmount < AgreedValue`; factual coverage note required.
- `no_partial_payment`: approved amount fixed to `0`; factual explanation required.

## 7.6 `completeContributionReview`

Parent-key protected.

```js
{ action: "completeContributionReview", adminKey, opportunityId, feedback, approvedBy }
```

Valid only for `contribute/waiting_for_review` where `ApprovalRequired=true`. Result `completed`; no financial write.

## 7.7 `cancelOpportunity`

Parent-key protected.

```js
{ action: "cancelOpportunity", adminKey, opportunityId, reason }
```

In d006-v1 this is authoritative for unused/obsolete/error-created activities and non-financial work where cancellation creates no payment ambiguity.

**Accepted Earn cancellation after work has begun is not silently treated as a zero-payment cancellation.** If a post-acceptance Earn cancellation could create a fairness/payment question, the server must fail with `CANCELLATION_REQUIRES_REVIEW` rather than guess. This edge requires an explicit later settlement rule if it becomes operationally necessary.

## 7.8 `createOpportunity`

Parent-key protected.

Payload follows Section 16.9:

```js
{
  action: "createOpportunity",
  adminKey,
  type,
  title,
  requiredness,
  whyItMatters,
  instructions,
  scope,
  completionStandard,
  skillId,
  approvalRequired,
  reviewReason,
  estimatedMinutes,
  repeatable,
  frequency,
  value
}
```

Server applies the domain rules in Section 5 and generates a unique ID. New rows start `available` with `CreatedAt/UpdatedAt` set.

---

# 8. Earn financial and Transaction semantics

The v2.3 principle that an accepted amount must not be silently changed is retained and extended.

## 8.1 Start

- no pending change
- no balance change
- no Transaction

## 8.2 Full finish

When Earn enters `waiting_for_review/full_completion`:

- add frozen `AgreedValue` to `Stats.Pending`;
- append exactly one pending Transaction linked to the Opportunity;
- this amount means **awaiting review**, not earned/approved.

A partial-work withdrawal review creates **no** pending amount and **no** pending Transaction before the parent agrees a value.

## 8.3 Transaction schema additive delta

Preserve existing columns and add:

- `AgreedAmount`
- `ReviewKind`
- `ReviewOutcome`

For new D-006 records:

- pending full-review Transaction: `Amount=AgreedAmount=AgreedValue`, `Status=pending`;
- full payment: `Status=completed`, `ReviewOutcome=full_payment`;
- returned for completion: pending aggregate is reduced; Transaction becomes `Status=returned_for_completion`, `ReviewOutcome=returned_for_completion`; no balance change;
- partial payment from a full review: pending aggregate is reduced by full `AgreedAmount`; Transaction `Amount` becomes the actually approved partial amount while `AgreedAmount` retains the frozen full amount; `Status=completed`, `ReviewOutcome=partial_payment`;
- partial payment after withdrawal: append a completed Transaction only when the partial amount is agreed; `AgreedAmount` stores frozen full value and `Amount` stores the agreed partial amount;
- no-partial-payment withdrawal review: no financial Transaction is required; the Opportunity review fields are the factual record.

Historical Transaction rows must not be rewritten to simulate D-006 semantics.

## 8.4 Balance / pending invariants

- `Balance` changes only for settled positive Earn payments.
- `Pending` represents only the full agreed amount currently awaiting full-completion payment review.
- partial-work withdrawal review contributes `0` until an amount is actually agreed; once agreed it moves directly to settled balance/ledger.
- `Stats.Pending` must equal the sum of active D-006 pending full-review Transactions.

---

# 9. Duplicate, locking and audit requirements

All lifecycle/financial mutations use `LockService.getScriptLock()`.

Every mutation must resolve exactly one Opportunity row by ID. Zero matches -> `NOT_FOUND`; more than one -> `DUPLICATE_ID`; no mutation occurs.

Extend the read-only integrity audit to check at least:

- duplicate Opportunity IDs;
- valid type/requiredness combinations;
- Contribute/Learn `Value=0`;
- Earn optionality, positive value, scope, standard and review requirement;
- Learn `SkillID` resolves to an existing Skill;
- valid lifecycle states;
- accepted Earn agreement snapshot completeness;
- exactly one pending Transaction for `waiting_for_review/full_completion`;
- zero pending Transaction for `waiting_for_review/partial_work_withdrawal`;
- no pending Transaction on non-review states;
- `Stats.Pending` equals pending full-review ledger total;
- positive settled Transaction amounts do not exceed frozen agreed amount unless a separately approved future contract says otherwise.

---

# 10. Error contract

Handled failures:

```js
{
  success: false,
  code: "INVALID_TRANSITION",
  error: "Readable factual message"
}
```

Minimum codes:

- `NOT_FOUND`
- `DUPLICATE_ID`
- `INVALID_TRANSITION`
- `INVALID_DOMAIN_CONTRACT`
- `AGREEMENT_REQUIRED`
- `REVIEW_VALIDATION`
- `LEDGER_MISMATCH`
- `CANCELLATION_REQUIRES_REVIEW`
- `MIGRATION_CONFLICT`
- `UNAUTHORISED`

00.02 must preserve the authoritative pre-request state on failure and offer retry/reload; it must not manufacture a successful local lifecycle transition.

---

# 11. Six-item migration contract

## 11.1 Pre-migration gate

Immediately before migration:

1. run integrity audit;
2. require no legacy `pending/claimed` Opportunity and no pending Transaction;
3. snapshot pre-D006 `Opportunities` and `Transactions` for rollback;
4. abort rather than guessing any ambiguous requiredness/payment/scope field.

At contract-issue time the live sheet is favourable: all six rows are `open` and `Transactions` has no data rows. This must be rechecked at migration time.

## 11.2 Mapping

### ID 1 - Load & Unload Dishwasher

One-to-one migration may preserve ID `1`.

- `type=contribute`
- `Value=0`
- rationale from approved UX: `Shared dishes are part of keeping the household running.`
- requiredness must be confirmed as `expected` or `negotiated` before live migration; do not guess.
- completion standard must be parent-confirmed from the approved reasonable-standard direction.

### ID 2 - Cook Family Dinner

Do **not** preserve one row as both contracts.

- archive/remove the old active row only after rollback snapshot;
- create a new Learn/Cooking record with a new ID and `SourceOpportunityID=2`;
- create a separate optional Earn dinner record with another new ID and `SourceOpportunityID=2` only after parent confirms genuinely additional scope, value and completion standard;
- do not assume the old `$5` is the new agreement without confirmation.

### ID 3 - Dog poo

One-to-one migration may preserve ID `3` only if confirmed as Sophie's ordinary pet-care share.

- `type=contribute`
- `Value=0`
- rationale: `Caring for our dog includes keeping the yard clean and safe. This is one part of sharing pet care.`
- requiredness must be parent-confirmed.

If it is additional paid pet work instead, migration must stop for that row rather than guess.

### ID 4 - Having a tidy room

One-to-one migration may preserve ID `4`.

- `type=learn`
- `Value=0`
- `SkillID` must link to Self-management (`S008` in current Skills)
- rationale from approved UX: `Practise keeping your space workable so you can find things and look after your belongings.`
- requiredness (`negotiated|optional`) and concrete functional completion/practice standard must be parent-confirmed.

### ID 5 - Wash your clothes

One-to-one migration may preserve ID `5`.

- `type=learn`
- `Value=0`
- `SkillID` = Laundry (`S003` in current Skills)
- approved practice direction: sorting, washing, drying and putting clothes away
- requiredness must be parent-confirmed.

### ID 6 - Recycling and bins

The current row contains materially different timing points. Do not preserve the false `daily` bundled lifecycle.

- snapshot then replace the old active row with distinct Contribution records/IDs linked by `SourceOpportunityID=6` for the materially separate timing points (recycling, bins out, bins in) unless Wayne explicitly chooses a single same-time checklist before migration;
- `Value=0` for all resulting Contribution records;
- requiredness must be parent-confirmed.

All migrated rows set `MigrationVersion=d006-v1` and carry source linkage where applicable.

## 11.3 Historical preservation

Never rewrite historical Transactions to remove old payments or pretend prior work used D-006. Pre-D006 records remain factual history.

---

# 12. Rollout / compatibility

The current deployed v2.3.0 backend and current frontend are a matched legacy Opportunity pair. D-006 changes must ship as one controlled release.

Required sequence:

1. 00.02 implements against `opportunityContractVersion=d006-v1` without local fake lifecycle state.
2. 00.03 implements/stages backend v2.4.0 contract and migration helpers; no live Opportunity migration yet.
3. run syntax/tests and read-only pre-migration audit.
4. coordinate backend deployment to the existing Apps Script deployment URL.
5. verify health/contract version.
6. run controlled six-item migration after required parent confirmations.
7. release/bump frontend service-worker cache immediately after backend verification.
8. run child + parent regression tests for every domain and Earn review outcome.

### Legacy endpoint handling

`claimJob`, `approveJob`, `rejectJob` are deprecated. The new 00.02 implementation must not call them.

If temporarily retained server-side for stale-client safety, they must never preserve the old `start -> pending money` semantics. A stale PWA that cannot understand `d006-v1` should be forced to reload/update rather than be shown false state.

---

# 13. Explicit exclusions

This contract does not:

- redesign Goals/Money;
- redesign Skills beyond stable Skill linkage required for Learn;
- change School v2.3 architecture;
- change parent authentication;
- create automatic recurrence/scheduling or a general Opportunity event-history engine;
- add XP, streaks, badges, compliance scores or motivational self-report;
- invent a post-acceptance parent-cancellation payment rule not settled by D-006;
- change the public/child authentication threat model.

Any such requirement is a separate scoped backend change.

---

# 14. Implementation gate for 00.02

**Contract gate: PASSED.**

00.02 may now implement Sections 1–15 of `OPPORTUNITY_UX.md` against the exact normalized states/actions in this document.

00.02 must:

- use `startOpportunity`, not legacy `claimJob`, for `Take this job` / Start / Practise;
- never create pending money on start;
- render all seven authoritative lifecycle states;
- use `withdrawEarn` for both stop choices;
- use `reviewEarn` outcomes exactly as validated above;
- treat `opportunityContractVersion=d006-v1` as the backend capability gate;
- preserve current authoritative state on API failure;
- not reset repeatable activities locally;
- not implement backend-invented state transitions client-side.

Backend deployment/migration remains a coordinated 00.03 step after 00.02 implementation is staged.