# Sophie App v2.7 pathway-v1 backend staging record

Date: 2026-08-22
Branch: `stage-v2.7-interactive-skill-pathways`
Status: STAGED - COORDINATOR REVIEW REQUIRED
Production deployment: NOT AUTHORISED

## Outcome

The bundled Cooking technique snapshot has been replaced on staging by a bounded, Sophie-safe, credential-protected backend read model.

The staged flow is:

`Skills -> Cooking -> getLearningPathway/pathway-v1 -> Technique -> getLearningCandidateCatalogue/rec-v1 -> chooseRecommendedLearn -> D-006 learn/available`

No new mutation route was introduced.

## Backend-source reconciliation

The repository `Code.gs` was v2.2.0 and was not used as the implementation base.

The accepted production source was recovered from Drive:

- artefact: `Code.gs.v2.5.0-rec-v1-RELEASE-VERIFIED-STAGED.txt`
- Drive file ID: `1mHTc6Gg7gmXXFBDkrrOjvmfaHHpgJaxe`
- accepted production SHA-256: `22b7b8c9c6850e46f70bfcc8d9402719710d3dc9186b3efdfd6661530c7cca29`
- production acceptance record: `REC_V1_FINAL_BACKEND_ACCEPTANCE_2026-08-21.md`
- production verification record: `REC_V1_PHASE_E_PRODUCTION_VERIFICATION_2026-08-21.md`

The Drive text hydration added one terminal newline. Removing only that newline reproduced the accepted SHA-256 exactly. The staging `Code.gs` was then built from that verified source, with a normal terminal newline retained for version control.

Staged backend identifier:

- `APP_VERSION = 2.5.1`
- `learningPathwayContractVersion = pathway-v1`
- staged `Code.gs` SHA-256: `d3499860869767f082d4aeeb084debc52c3f51545a1e029eae014905fc37c927`

## New read action

`getLearningPathway` is a POST read action protected by the existing:

`requireLearningRecommendationAccess_(recommendationKey, adminKey)`

Input:

```json
{
  "action": "getLearningPathway",
  "domain": "cooking",
  "recommendationKey": "<attached by existing recommendationPost transport>"
}
```

The response contains:

- `learningPathwayContractVersion`
- `domain`
- active domain techniques
- Sophie-facing technique title, family and description
- ordinary support options
- bounded safety presentation
- links to active candidates with relationship role
- active hard/recommended prerequisite relationships
- prerequisite Sophie-facing title, rationale and support implication

The response deliberately excludes:

- `LearningEvidence`
- prerequisite evidence expectations
- prerequisite satisfaction/readiness claims
- recommendation history
- preferences
- source/provenance records
- hidden ranking, mastery or numeric readiness
- credentials
- timestamps and administrative metadata

## Domain-bounding rule

Techniques are included when they are active and either:

1. linked to an active candidate in the requested domain; or
2. share a `SkillID` with active candidates in that domain; or
3. are connected to an included technique through an active prerequisite relationship.

This prevents an active domain technique with no direct candidate mapping from disappearing while avoiding hard-coded Cooking technique IDs.

## Live spreadsheet verification

Read-only verification against spreadsheet `1qfuPKdDIT6WkLPRQ9qf7ww38JqYBu37bvLfYu3X2Eq0` confirmed:

- 26 active Cooking LearnCandidates
- 22 active Cooking Techniques
- 132 active-candidate technique mappings
- 52 `primary_practice` mappings
- 16 active prerequisite relationships
- 2 hard prerequisites
- 14 recommended prerequisites
- no orphan active-candidate technique mapping

`COOK-T018 — Keep the Kitchen Safe` has no candidate or prerequisite edge. The `SkillID` domain-bounding rule correctly preserves it, producing all 22 techniques.

No spreadsheet data was changed.

## Frontend integration

`assets/skill-pathways-v27.js` now:

- contains no bundled `COOK-T...` records;
- contains no bundled `LC-COOK-...` relationships;
- loads `getLearningPathway` through the existing credential-aware `recommendationPost`;
- validates `pathway-v1`;
- renders loading, unavailable and retry states honestly;
- derives technique cards, prerequisites and direct candidate IDs from the authoritative response;
- retains progressive disclosure and History API navigation.

`assets/skill-pathways-v27-choice.js` now:

- obtains linked candidate IDs from the loaded pathway response;
- supplies the selected `techniqueId` to `getLearningCandidateCatalogue`;
- intersects the catalogue with authoritative `primary_practice` links;
- continues delegating final conversion to `chooseRecommendation`;
- contains no new credential handling, direct `chooseRecommendedLearn` call or `createOpportunity` shortcut.

## Security and lifecycle

Preserved unchanged:

- `d006-v1`
- `lr-v1`
- `rec-v1`
- scoped recommendation-device credential handling
- fail-closed `UNAUTHORISED`
- server-side candidate eligibility recheck
- D-006 `learn/available` creation
- no automatic Learn start
- no financial state
- no production data mutation

## Test gates

Local passes:

- Apps Script/JavaScript syntax
- deterministic staging integration
- static security contracts
- bounded backend payload contract
- live-sheet count and relationship reconciliation
- clean diff validation

Exact staging head `e8f925631b3a7286e984b873812ffcef27e0adce` passed GitHub Actions run `32552944893` on 2026-08-22. The run covered:

- nine viewport Android-first/desktop matrix
- focused authoritative-pathway runtime flow
- full D-006, rec-v1, Learning Resources, School, Goals, Parent Mode and financial-isolation regression
- 48px target, Back navigation, no-overflow, 200% text, reduced-motion, keyboard focus and PWA checks

The local Playwright browser binary could not be downloaded because the runtime proxy returned a certificate/502 failure. GitHub Actions supplied the authoritative browser evidence for the exact staged commit. An initial run exposed a missing asynchronous wait in the browser harness; the harness was corrected to wait for the authoritative payload before asserting, and the complete exact-head run then passed.

## Release boundary

Do not deploy `Code.gs` or merge this branch until Coordinator review confirms:

1. exact-head CI success;
2. the staged `Code.gs` derives from the recorded v2.5.0 production source;
3. `pathway-v1` is accepted as the bounded read contract;
4. backend deployment will update the existing Apps Script deployment URL;
5. frontend production promotion occurs only after backend live capability verification;
6. rollback artefacts and hashes are recorded.
