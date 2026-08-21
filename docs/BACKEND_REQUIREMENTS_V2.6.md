# Sophie App v2.6 deferred backend requirements

Status: FOLLOW-UP — NOT A FRONTEND RELEASE BLOCKER

The v2.6 Skills and Android-first package preserves `v2.5.0`, `d006-v1`, `lr-v1` and `rec-v1`. No backend, sheet schema or security contract is changed by this staged candidate.

## 1. Sophie-originated proposals

There is no accepted scoped route for Sophie to originate an arbitrary activity. A future backend package needs separate, fail-closed proposal actions for:

- a non-curated Learn idea;
- a suggested Contribute idea; and
- a suggested Earn idea.

Proposal records must not create authoritative D-006 Opportunities until parent review. Parent review must set or confirm requiredness for Contribute and the work scope/value for Earn. Sophie must never be able to authorise her own payment.

## 2. Structured technique evidence for domain pathways

The current public frontend payload exposes legacy skill summaries but not authoritative technique evidence or prerequisite records. `rec-v1` remains authoritative for candidate eligibility and supplies an eligibility status/reason during Cooking discovery.

If the app is to show a personalised domain-wide pathway outside a recommendation session, add a read-only capability that returns:

- domain and technique identifiers;
- hard versus recommended prerequisite relationships;
- whether each hard prerequisite is confirmed for Sophie;
- the evidence/confirmation source and current validity; and
- a safe precursor Sophie can practise when a hard prerequisite is unmet.

Until that contract exists, the frontend shows the accepted sharp-tools chain as an explanatory pathway and uses `rec-v1` eligibility for actual candidate availability. It does not infer mastery from legacy levels, repetition counts or completed Learn activities.
