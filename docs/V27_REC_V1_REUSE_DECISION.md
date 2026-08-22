# v2.7 rec-v1 reuse decision

Status: Coordinator decision - accepted for staging
Date: 2026-08-22
Branch: `stage-v2.7-interactive-skill-pathways`

## Question

Can a Sophie-facing `I want to learn this` action from an interactive technique pathway securely reuse the existing rec-v1 / D-006 conversion path, or does it need a new backend write route?

## Decision

**Reuse the existing `chooseRecommendedLearn` write path. Do not add a new D-006 creation route for technique selection.**

The existing frontend/backend contract already provides the required security and lifecycle behaviour:

1. The device must hold the scoped local recommendation credential.
2. The frontend calls rec-v1 through `recommendationPost`, which attaches the credential and fails closed on `UNAUTHORISED`.
3. `chooseRecommendedLearn` receives an authoritative `candidateId` plus the current available safety support.
4. The backend re-evaluates candidate eligibility at choice time.
5. Ineligible candidates return `REC_CANDIDATE_INELIGIBLE` with an authoritative reason.
6. A successful choice returns an authoritative D-006 Opportunity.
7. The frontend already rejects the result unless the returned Opportunity has `type=learn` and `status=available`.
8. The frontend reloads `getData` and confirms the returned Opportunity exists before showing success.
9. The new Learn activity is not auto-started and creates no financial state.

This is the correct functional boundary for a technique-originated learning choice.

## What is missing

The browser currently does not receive the authoritative domain technique graph through normal `getData`.

The current `getLearningCandidateCatalogue` response is normalised to:

- candidateId
- title
- estimatedMinutes
- preferenceSuppressed
- eligibility status/reason

It does not expose the technique-to-candidate relationship that exists in `CandidateTechniques`, nor the technique and prerequisite records needed to render a live domain-wide pathway.

## Staging approach

The v2.7 read-only prototype uses a versioned snapshot generated from the authoritative spreadsheet tables:

- Techniques
- TechniquePrerequisites
- CandidateTechniques
- LearnCandidates

The snapshot may describe:

- technique title and description
- safety-critical flag and typical safety support
- hard and recommended prerequisite relationships
- candidate IDs linked as `primary_practice`

The snapshot **must not** decide mastery, prerequisite satisfaction, current eligibility, or whether Sophie is ready.

Actual candidate eligibility remains rec-v1 authority.

## Proposed technique choice flow

For a technique with one or more direct candidate links:

1. Sophie opens the technique.
2. The app asks who is around for the session using the existing safety-support options.
3. The app requests the existing rec-v1 candidate catalogue for that session setup.
4. The frontend intersects catalogue candidate IDs with the technique's linked candidate IDs.
5. If one or more linked candidates are eligible, Sophie chooses the real food/activity application she wants.
6. The app asks for the reversible support preference: Show me / Do it with me / Prompt me / I've got this.
7. The existing `chooseRecommendedLearn` call creates the authoritative D-006 Learn activity.
8. The frontend reloads and confirms the new `available` Learn Opportunity.

If no linked candidate is eligible, show the authoritative rec-v1 reason and allow the setup to change. Do not fabricate a local unlock.

## Production data recommendation

Before treating the Skill Tree as live production data, prefer one of these read-only changes:

1. **Preferred:** enrich the existing `getLearningCandidateCatalogue` response with safe technique linkage fields such as `techniqueIds` and role, plus a read-only domain technique/prerequisite payload; or
2. add a dedicated read-only domain pathway action returning Techniques, TechniquePrerequisites and CandidateTechniques in a bounded Sophie-safe shape.

No new mutation route is required.

A production read endpoint must not expose hidden scores because none are part of REC-V1, and it must not infer prerequisite satisfaction from legacy Skills Level/Progress data or repetition counts.

## Security conclusion

The existing rec-v1 credential and `chooseRecommendedLearn` conversion path are suitable for `I want to learn this` once technique selection resolves to an authoritative candidate ID. The remaining gap is read-only pathway/candidate-link exposure, not write authority.
