# Issue #50 browser verification checkpoint — 2026-08-27

Status: **BROWSER LOGIC HARNESS PASS; FULL BROWSER/DEVICE/PWA/RELEASE GATES REMAIN OPEN**

Candidate branch: `issue50-school-status-ia`
Current head: `cd3d5732168314f79a65c369d40ee5ef9595b10a`

## Authoritative-state correction retained

`assets/issue50-school-status.js` continues to classify `SubmissionState` only from the authoritative structured `submissionState` field. `SubmittedAt` and `ReceiptConfirmedAt` do not infer or override submission state.

Feedback / All-history ordering remains:

`UpdatedAt -> SubmittedAt -> CreatedAt -> DueDate descending -> TaskID ascending`

`TaskID` ascending is the final deterministic tie-break.

## Browser logic verification

A headless Chromium harness exercised authoritative-shaped School records at a 390 x 844 viewport. Result: **30/30 PASS** after the keyboard-focus correction.

Covered cases included:

- three primary status tabs: Now / Submitted / Feedback;
- Subjects retained as a secondary retrieval surface;
- Past work renamed All history;
- one-record/one-main-state counts;
- `SubmissionState=not_submitted` remains Now even when `SubmittedAt` is populated;
- `SubmissionState=not_submitted` remains Now even when `ReceiptConfirmedAt` is populated;
- submitted and received records leave Now;
- structured `GradeOrResult`, `Mark`, `TeacherComment`, and exact normalized `results published` feedback classification;
- no SourceStatus substring guessing;
- conflict/review/unapproved records withheld;
- archived/history retrieval behavior;
- overdue active records remain actionable regardless of age;
- no three-record Now truncation;
- Submitted/Feedback transient selections do not use the persisted SchoolProfile path;
- A3 `TaskID` ascending tie-break in Feedback and All history;
- 390 px viewport has no horizontal overflow in the harness;
- ArrowRight / End / Home keyboard navigation and focus continuation.

## Browser-discovered correction

The first browser pass exposed focus loss after a status-tab key action because rendering replaces the tab nodes. The branch now includes:

- `assets/issue50-school-status-focus.js`;
- loader wiring through `assets/skill-pathways-v28-choice.js`;
- service-worker cache inclusion for the focus asset.

The correction captures status-tab key navigation before rerender and restores focus to the newly rendered target tab after rerender. The browser harness then passed 30/30.

## Remaining gates

Do **not** treat this checkpoint as physical-device or release acceptance. The following remain open:

- full-origin browser integration/runtime verification;
- Wave 1 rebase/integration;
- physical Android;
- TalkBack/accessibility acceptance;
- offline/PWA runtime acceptance;
- release gate.

The execution sandbox blocks localhost HTTP navigation, so a real service-worker/browser-origin runtime could not be exercised here. Loader and service-worker integration were statically rechecked instead. This does not close the offline/PWA gate.

No merge or deployment was performed. `main` is unchanged.
