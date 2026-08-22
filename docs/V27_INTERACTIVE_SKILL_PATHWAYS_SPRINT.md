# Sophie App v2.7 - Interactive Skill Pathways Sprint

Status: ACTIVE STAGING DESIGN
Branch: `stage-v2.7-interactive-skill-pathways`
Issue: #11
Production base: `9fc9790b034dcdea0776b7c8ea17d776306fd814`

## Goal

Turn Skills into an explorable learning pathway system while preserving the existing SDT, D-006, rec-v1, Android-first and financial boundaries.

Primary Sophie flow:

`Skills -> Domain -> Technique -> Choose learning -> Support choice -> Authoritative Learn activity`

Cooking is the first implemented domain. The structure must be reusable for later domains.

## Progressive disclosure model

### Skills overview

Show only:
- Currently learning
- learning domains
- concise capabilities

Do not expose technique graphs, prerequisite detail or recommendation controls here.

### Domain view

Example: Cooking.

Show:
- current Cooking Learn activities
- technique groups / pathway entry cards
- recommendation discovery
- relevant learning resources

Technique cards are explorable. The domain view should not become another long static information page.

### Technique detail

Open as an internal Skills subview, not a global navigation destination.

Show:
- technique name
- one-sentence purpose
- availability state
- prerequisite relationship
- why the relationship matters
- useful precursor when blocked
- contextual support choices
- linked learning resources where available
- `I want to learn this` only when a secure conversion path is available

Android/browser Back must return Technique -> Domain -> Skills overview without exiting the app unexpectedly.

## Technique card layout

Collapsed card:

1. icon / visual marker
2. technique title
3. short capability statement
4. status treatment:
   - `Ready to explore`
   - `Try this first` for a genuine hard prerequisite
   - no mastery percentage
5. optional short relationship cue such as `Builds on: Safe sharp-tool setup`
6. tap target opens Technique detail

No internal technique IDs are Sophie-facing.

### Hard prerequisite presentation

Use only for genuine safety/feasibility dependencies.

Example:

`Set Up Sharp Tools Safely -> Control the Knife -> knife-based preparation`

Blocked technique detail should say, in plain language:
- what is unavailable for now
- why
- what Sophie can practise first
- whether adult-led/shared variants remain possible

Do not hide the future technique entirely.

### Recommended prerequisite presentation

Never lock.

Use copy such as:
- `This may feel easier after practising...`
- `You can still choose this. We can add more support if useful.`

Recommended prerequisites affect support, sequencing and recommendation fit only.

## Contextual support choices

Where applicable:
- Show me
- Do it with me
- Prompt me
- I've got this

These choices are contextual and reversible.

They are not:
- learner levels
- mastery evidence by themselves
- permanent preferences by default
- scores

Safety requirements can override a lower-support preference where necessary.

## `I want to learn this`

The action must never fabricate local authoritative state.

Preferred behaviour:
1. Sophie chooses a technique.
2. Frontend resolves one or more eligible curated LearnCandidates linked through CandidateTechniques.
3. Sophie selects a concrete activity/candidate if needed.
4. Existing secure rec-v1/D-006 conversion is used where contractually valid.
5. Backend creates authoritative `type=learn`, `status=available`, value 0 Opportunity.
6. Frontend reloads authoritative app data.
7. Opportunity is shown in Currently learning.
8. It is not auto-started.

If the current API cannot securely resolve technique -> eligible candidate -> authoritative Learn conversion outside a recommendation session, the UI must stop before creating state and surface the requirement for backend work.

## Existing data model mapping

### Techniques

Use as the canonical technique definition where suitable.

Needed frontend fields conceptually include:
- TechniqueID
- Domain
- Title / Name
- CapabilityLabel or equivalent short description
- safety metadata where already represented
- active/status

Do not invent a numeric readiness field.

### TechniquePrerequisites

Use:
- TechniqueID
- PrerequisiteTechniqueID
- RequirementKind (`hard` or `recommended`)
- EvidenceExpectation
- Rationale
- SafetyRelated
- SupportImplication
- AppliesWhen
- Active

Frontend rules:
- `hard` can block only when the underlying requirement truly applies and required evidence is not established
- `recommended` never blocks

### CandidateTechniques

Use to connect a selected technique to concrete LearnCandidates.

This is the bridge between an abstract capability and a real-world activity Sophie can choose.

### LearnCandidates

Use the existing candidate definition for:
- activity title
- practice description
- completion/practice standard
- why it matters
- estimated time
- challenge band/type
- safety requirement
- suggested support options
- authentic use
- source provenance

Do not show internal challenge/ranking machinery unless translated into ordinary Sophie-facing language.

### LearningEvidence

Use only factual evidence records.

Do not infer evidence from:
- legacy Skills Level
- legacy Skills Progress
- repetition counts alone
- number of completed activities alone
- support choice alone

If technique evidence is not available to the frontend through the current API, keep the pathway factual but non-personalised and document the missing read contract.

### LearningResources / SourceLinks

Technique detail may display relevant resources when authoritative links exist.

Do not fabricate a resource relationship from title similarity.

## Proposed read contract for pathway UI

Preferred future backend response shape, subject to backend review:

```json
{
  "domain": "cooking",
  "techniques": [
    {
      "techniqueId": "COOK-T004",
      "title": "Control the Knife",
      "capability": "Use a kitchen knife with deliberate grip, guiding-hand position and controlled movement.",
      "evidenceState": "not_confirmed",
      "prerequisites": [
        {
          "techniqueId": "COOK-T003",
          "title": "Set Up Sharp Tools Safely",
          "kind": "hard",
          "safetyRelated": true,
          "satisfied": false,
          "reason": "Safe setup and hand position need to be confirmed first."
        }
      ],
      "candidateIds": ["LC-COOK-005", "LC-COOK-007"]
    }
  ]
}
```

This is a design target, not an approved API/schema change.

## Parent-facing copy audit

Review visible Parent Mode wording only.

Prefer:
- `Agreed together`
- `Review together`
- `Needs another look`
- `Add Contribute`
- `Add Learn`
- `Add Earn`

Avoid exposing engineering/behaviour-model terms such as:
- contract
- schema
- lifecycle
- review state
- approval queue

Do not obscure authoritative parent decisions, requiredness, payment or safety.

## Android-first constraints

The v2.6.3 real-device layout is now the regression baseline.

Must preserve:
- bottom nav on Wayne's Android phone
- compact single-column lists
- effective scale under desktop-like mobile viewport behaviour
- 48dp-equivalent touch targets
- no horizontal overflow
- safe areas
- soft keyboard reachability
- internal Back handling

Technique detail should generally use a full-width compact subview or mobile sheet with reachable actions, not a desktop-sized modal scaled down onto the phone.

## Accessibility

Technique and prerequisite states must not rely on colour alone.

Required:
- semantic buttons/links
- visible focus
- useful accessible names
- readable status text
- logical heading order
- keyboard operation on PC
- 200% text reflow
- reduced-motion compliance

## Sprint sequence

1. Read-only technique/pathway rendering from existing data/API capability.
2. Technique detail and prerequisite exploration.
3. Contextual support-choice UI.
4. Determine whether secure technique-originated Learn conversion can reuse rec-v1.
5. If yes, implement authoritative conversion. If no, specify the minimal backend route/read contract.
6. Parent-facing copy refinement.
7. Android + desktop regression pass.
8. Coordinator acceptance before any production release.

## Stop conditions

Stop before implementation that would:
- infer mastery/readiness numerically
- unlock from repetition counts
- weaken safety gates
- persist support choice as competence without evidence
- create local fake Learn Opportunities
- add unsecured child-write routes
- change financial state
- regress D-006, rec-v1, School, Goals or Learning Resources
