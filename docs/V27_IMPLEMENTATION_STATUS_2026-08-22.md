# Sophie App v2.7 Interactive Skill Pathways - implementation status

Date: 2026-08-22  
Branch: `stage-v2.7-interactive-skill-pathways`  
Production base: `9fc9790b034dcdea0776b7c8ea17d776306fd814`  
Production deployment: not authorised by this checkpoint

## Outcome

The first v2.7 slice is implemented as a read-only Cooking pathway plus a staging-only existing-route learning-choice bridge, while preserving the accepted v2.6.3 Android layout and backend mutation boundaries.

Sophie can now move through:

`Skills -> Cooking -> technique group -> technique detail -> prerequisite or later technique`

The implementation does not infer readiness, mastery or prerequisite completion. The structural pathway is read-only. Where a snapshot technique has linked candidates, the separate staging bridge asks rec-v1 for current catalogue eligibility and delegates the selected candidate to the existing authoritative conversion path.

## Implemented product behaviour

- 22 Cooking techniques in five progressively disclosed groups.
- concise technique cards with explicit text status cues; state is not communicated by colour alone.
- hard safety prerequisites remain distinct from recommended preparation.
- recommended prerequisites never lock a technique.
- detail views show what the technique is, ordinary activity-level safety support, prerequisite rationale and where it can lead.
- prerequisite and later-technique rows are buttons with 48px minimum targets and visible focus treatment.
- browser state includes the selected technique, supporting Back navigation through related technique, original technique, Cooking and Skills states.
- `I want to learn this` uses three progressively disclosed steps: current safety support, eligible linked activity, and reversible learning support.
- catalogue results not linked to the selected technique are excluded before Sophie chooses.
- successful conversion still uses the existing `chooseRecommendation` function; it must return and reload-confirm a D-006 `learn/available` Opportunity and never auto-starts it.
- compact/real-phone layouts remain single-column; the accepted bottom-navigation and effective-scale fallback are unchanged.
- the new JavaScript asset is versioned in the staging service-worker cache.

## Authoritative-data boundary

The current UI uses `v27-cooking-snapshot-2026-08-22`, generated from the authoritative spreadsheet tables:

- `Techniques`
- `TechniquePrerequisites`
- `CandidateTechniques`
- `LearnCandidates`

That snapshot is permitted only to describe pathway structure. It is not used to decide:

- whether a prerequisite is satisfied;
- whether Sophie is ready;
- candidate eligibility;
- mastery or competence;
- whether a Learn activity can be created.

## `I want to learn this` decision

No new backend mutation route should be implemented.

The existing `chooseRecommendedLearn` route already provides the correct security and D-006 lifecycle boundary: scoped device credential, server-side eligibility recheck, fail-closed errors, authoritative `learn/available` result, reload confirmation, no auto-start and no financial state.

The staging bridge demonstrates the flow with the versioned snapshot and authoritative rec-v1 eligibility. The remaining production blocker is read-only data exposure: the frontend needs authoritative technique/prerequisite data and technique-to-candidate links in a bounded Sophie-safe response rather than treating a bundled snapshot as the continuing live mapping.

Preferred backend follow-up:

1. enrich `getLearningCandidateCatalogue` with safe `techniqueIds`/relationship roles and add the bounded pathway payload; or
2. add a dedicated read-only Cooking pathway action.

This is a read contract only. It must not expose credentials, hidden scores or legacy level/progress inference.

## Security evidence

- live backend advertises `d006-v1`, `lr-v1` and `rec-v1` with app version `2.5.0`;
- catalogue access without a recommendation-device credential returns `UNAUTHORISED`;
- the pathway asset contains no `fetch`, `apiPost`, credential storage, `chooseRecommendedLearn` or `createOpportunity` call;
- the separate choice bridge does not read or store the credential, does not name a new D-006 creation action, and does not call `createOpportunity`; it uses `recommendationPost` for the catalogue and the existing `chooseRecommendation` conversion function;
- `Code.gs` has no v2.7 diff from production base;
- no credential was requested, provisioned, logged, committed or placed in a URL;
- no production data was mutated during verification.

## Test coverage

Exact implementation head verified: `2ee369a4fc4103360031efbc0ffa3437ef9ad12d`
GitHub Actions: `32546005315` - completed successfully on 2026-08-22.

The exact-head workflow passed:

- deterministic patch application and committed-product verification;
- JavaScript syntax and static contracts;
- the full Android-first and desktop viewport matrix;
- the focused v2.7 runtime regression.

Local checks completed:

- deterministic staging patch idempotence;
- JavaScript syntax;
- static pathway/data/security contracts;
- exactly 22 techniques;
- exactly two hard sharp-tool dependencies;
- recommended prerequisite separation;
- product asset and service-worker integration;
- no v2.7 `Code.gs` change;
- clean diff validation.

The staging workflow now runs browser coverage at:

- `320x700`
- `360x800`
- `390x844`
- `412x915`
- `480x900`
- `600x900`
- `839x900`
- `840x900`
- `1280x900`

It checks progressive disclosure, adaptive columns, 48px targets, horizontal overflow, hard-prerequisite detail, absence of an unsecured learning-write action, related-technique Back navigation, 200% text reflow and reduced-motion mode.

## Files in this checkpoint

- `.github/workflows/v27-skill-pathways-stage.yml`
- `assets/skill-pathways-v27.js`
- `assets/skill-pathways-v27-choice.js`
- `scripts/apply_v27_skill_pathways_stage.py`
- `tests/v27-static-contracts.cjs`
- `tests/v27-browser-regression.cjs`
- `docs/V27_INTERACTIVE_SKILL_PATHWAYS_SPRINT.md`
- `docs/V27_REC_V1_REUSE_DECISION.md`
- `docs/V27_IMPLEMENTATION_STATUS_2026-08-22.md`

## Next controlled slice

Backend/security should now specify and stage the bounded read payload. Frontend should replace the snapshot linkage in the staging bridge with that authoritative payload without changing the rec-v1/D-006 mutation contract. Parent-facing copy refinement and the wider regression pass remain inside v2.7 after the read contract is resolved.

Do not merge or deploy this branch until Coordinator review accepts browser evidence and the snapshot/read-contract production boundary.
