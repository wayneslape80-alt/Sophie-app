# v2.8 supervision-option availability prototype

**Status:** prototype only; draft PR; not wired into production.

## Scope

This prototype adds a post-v2.8 technique-choice layer that preflights the current technique's linked candidates against all four existing rec-v1 `availableSafetySupport` values using the existing authenticated `getLearningCandidateCatalogue` route through `recommendationPost()`.

It does **not** modify Google Sheets, rec-v1, D-006, credential provisioning/storage, the backend, or production files.

## Behaviour

When Step 1 opens:

1. Resolve the technique's `primary_practice` candidate IDs through `app.v28CandidateIdsForTechnique`.
2. Start four catalogue requests in parallel for `none`, `adult_available`, `adult_nearby`, and `direct_supervision`.
3. Filter each authoritative catalogue response back to the linked candidate IDs.
4. Cache the normalised candidates and eligible count in memory for that dialog session.
5. Keep all four safety choices visible.
6. Disable/grey a choice only when its authoritative response contains zero eligible linked candidates and show `No learning choice for this setup`.
7. If a preflight request itself fails, do not infer unavailability; leave that option available for the existing selected-setup fallback check.
8. When the user continues with a successfully preflighted setup, Step 2 consumes the cached candidates, so it does not make a fifth catalogue request.

The Step 1 copy remains: `This checks safety eligibility; it is not a score of what you can do.` The prototype also states that safety setup is not a score of Sophie's ability.

## Set Up Sharp Tools Safely fixture

Authoritative source data used only to identify the test target:

- Technique: `COOK-T003` — `Set Up Sharp Tools Safely`
- Direct `primary_practice` candidate: `LC-COOK-001` — `Set Up for Safe Cutting`

The browser fixture mocks the authenticated catalogue responses; it does not use or expose a real recommendation credential. The mock returns zero eligible linked candidates for the first three safety values and one eligible linked candidate for `direct_supervision`.

## Request count and latency

Normal successful Step 1 open:

- 4 authenticated catalogue POSTs, launched in parallel.
- 0 additional catalogue POSTs when Step 2 uses the selected cached result.
- A failed preflight for the selected setup can fall back to the existing selected-setup request, making the worst case 5 requests for that dialog.

Deterministic browser fixture delays were 90 / 130 / 170 / 210 ms. Observed wall clock was ~211 ms. The same requests issued serially would total ~600 ms. In production the wall clock should therefore track roughly the slowest of the four catalogue requests rather than their sum, but Apps Script receives four concurrent authenticated calls per uncached technique dialog and that load should be considered before release.

## Verification

- `node --check prototype.js` — PASS
- Browser fixture at 390 px — PASS
- Browser fixture at 412 px — PASS
- Exactly four catalogue-shaped requests — PASS
- Three zero-eligible options disabled/greyed — PASS
- One eligible option remains selectable — PASS
- Neutral unavailable explanation present — PASS
- Safety-is-not-ability wording preserved — PASS
- Selecting `direct_supervision` then continuing uses cached candidates; request count remains 4 — PASS

## Production gate

If accepted, integrate the module after `assets/skill-pathways-v28-choice.js`, repeat the browser tests against the full app shell, then perform a separate production review. Do not merge this prototype branch as-is merely to activate the behaviour.
