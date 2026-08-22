# Sophie App v2.7 Interactive Skill Pathways - implementation status

Date: 2026-08-22  
Branch: `stage-v2.7-interactive-skill-pathways`  
Production base: `9fc9790b034dcdea0776b7c8ea17d776306fd814`  
Production deployment: not authorised by this checkpoint

## Outcome

The v2.7 staging candidate now implements an authoritative read-only Cooking pathway plus the existing-route learning-choice bridge, while preserving the accepted v2.6.3 Android layout and backend mutation boundaries.

Sophie can now move through:

`Skills -> Cooking -> technique group -> technique detail -> prerequisite or later technique`

The implementation does not infer readiness, mastery or prerequisite completion. `pathway-v1` supplies bounded technique, prerequisite and active-candidate linkage; rec-v1 supplies current catalogue eligibility and delegates the selected candidate to the existing authoritative conversion path.

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

## Authoritative-data boundary - superseded first-slice snapshot

The first slice used `v27-cooking-snapshot-2026-08-22`, generated from the authoritative spreadsheet tables:

- `Techniques`
- `TechniquePrerequisites`
- `CandidateTechniques`
- `LearnCandidates`

That first-slice snapshot was permitted only to describe pathway structure. It has now been removed from the staged product. The authoritative `pathway-v1` response still does not decide:

- whether a prerequisite is satisfied;
- whether Sophie is ready;
- candidate eligibility;
- mastery or competence;
- whether a Learn activity can be created.

## `I want to learn this` decision

No new backend mutation route should be implemented.

The existing `chooseRecommendedLearn` route already provides the correct security and D-006 lifecycle boundary: scoped device credential, server-side eligibility recheck, fail-closed errors, authoritative `learn/available` result, reload confirmation, no auto-start and no financial state.

The staging bridge now demonstrates the flow with authoritative `pathway-v1` structure and rec-v1 eligibility. No new write route is required.

The implemented backend choice is a dedicated, credential-protected read-only Cooking pathway action. It does not expose credentials, hidden scores, raw evidence, evidence expectations or legacy level/progress inference.

## Security evidence

- live backend advertises `d006-v1`, `lr-v1` and `rec-v1` with app version `2.5.0`;
- catalogue access without a recommendation-device credential returns `UNAUTHORISED`;
- the pathway asset contains no `fetch`, `apiPost`, credential storage, `chooseRecommendedLearn` or `createOpportunity` call;
- the separate choice bridge does not read or store the credential, does not name a new D-006 creation action, and does not call `createOpportunity`; it uses `recommendationPost` for the catalogue and the existing `chooseRecommendation` conversion function;
- staged `Code.gs` is derived from the release-verified v2.5.0 production source and adds only the bounded pathway read capability; production `Code.gs` is unchanged;
- no credential was requested, provisioned, logged, committed or placed in a URL;
- no production data was mutated during verification.

## Test coverage

Exact authoritative-pathway implementation head verified: `e8f925631b3a7286e984b873812ffcef27e0adce`
GitHub Actions: `32552944893` - completed successfully on 2026-08-22.

The exact-head workflow passed:

- deterministic patch application and committed-product verification;
- Apps Script/JavaScript syntax, bounded backend payload and static security contracts;
- the full Android-first and desktop viewport matrix;
- the focused v2.7 authoritative-pathway runtime regression;
- the complete D-006, rec-v1, Learning Resources, School, Goals, Parent Mode, accessibility and PWA regression.

Local checks completed:

- deterministic staging patch idempotence;
- JavaScript syntax;
- static pathway/data/security contracts;
- authoritative spreadsheet reconciliation for exactly 22 Cooking techniques;
- exactly two hard sharp-tool dependencies;
- recommended prerequisite separation;
- product asset and service-worker integration;
- `Code.gs` derivation from the release-verified deployed v2.5.0 source, not the stale repository copy;
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
- `Code.gs`
- `assets/skill-pathways-v27.js`
- `assets/skill-pathways-v27-choice.js`
- `index.html`
- `sw.js`
- `scripts/apply_v27_skill_pathways_stage.py`
- `tests/v27-static-contracts.cjs`
- `tests/v27-backend-pathway-contract.cjs`
- `tests/v27-browser-regression.cjs`
- `tests/v27-full-regression.cjs`
- `tests/v27-pathway-fixture.cjs`
- `tests/v27-pathways-runtime.cjs`
- `docs/V27_INTERACTIVE_SKILL_PATHWAYS_SPRINT.md`
- `docs/V27_REC_V1_REUSE_DECISION.md`
- `docs/V27_IMPLEMENTATION_STATUS_2026-08-22.md`

## Current release gate

The bounded read payload and frontend replacement are complete on staging, and exact-head GitHub Actions evidence is green. Coordinator review is still required before any controlled backend-first production release. Parent-facing copy refinement may continue as a separate non-blocking v2.7 polish slice.

Do not merge or deploy this branch until Coordinator review accepts browser evidence and the snapshot/read-contract production boundary.
