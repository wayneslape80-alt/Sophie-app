# Wave 1 + School Overdue production release

Wave 1 Skills/PWA work and the accepted issue #50 School status architecture were released to production on 27 August 2026 through PR #52, followed by the one-file PWA trust-loader correction in PR #53.

## Source authority

- Wave 1 accepted Android integration head: `f8734bd32e9d283c5f8b4cf7c546ae87bbc3a225`
- Accepted School issue #50 source head: `81dcd81bb3efff2e829ef9dad81aa2b413844545`
- Wave 1 choice implementation blob reused as `assets/skill-pathways-v28-choice-core.js`: `262f33c41fe8ec6a7c46967eed218f42facc6072`
- Wave 1 pathways blob: `32d073c9f7fda14e89d9ba4109b2bae82b490962`
- Wave 1 PWA trust blob: `5741f07962b4e8ec28dc47420d1b23aaa3daaacd`
- Accepted School status blob: `c0b8fe35d98de93808282e099a3393571c7172d6`
- Accepted School focus blob: `c4c0ddeb397029a081a3e659f6e52c1f0b27fc47`

## Production reconciliation

- `assets/skill-pathways-v28-choice.js` is a sequencing loader only.
- Production load order is Wave 1 choice core -> School status -> School focus -> Wave 1 PWA trust.
- The trust-layer URL loaded by the page exactly matches the service-worker precache entry: `./assets/wave1-pwa-trust.js?v=wave1-pwa-trust-draft`.
- Wave 1 service-worker lifecycle/fetch semantics are retained.
- Service-worker precache contains the choice core, the two School modules, and the PWA trust module.
- The accepted immutable cache generation retains the identifier `v2-9-2-9-wave1-school-overdue-rc1`; the identifier is a cache key and no longer represents release status.
- No backend Apps Script or Google Sheet/schema change was part of this release.

## Accepted School behaviour

Primary status order is `Now -> Submitted -> Feedback -> Overdue`.

Approved active `not_submitted` records with a due date before today are excluded from Now and shown in Overdue, after withheld/archived/feedback/submitted precedence. `PreferredSchoolView` persistence remains limited to `now|subjects`; Submitted, Feedback and Overdue are transient.

## Physical-device evidence completed before release

- Physical Android layout: PASS
- TalkBack/accessibility including Overdue: PASS
- Offline cached shell: PASS
- Reconnect/recovery: PASS

## Release record

- PR #52: merged — Wave 1 + School overdue production integration
- PR #53: merged — load the already-precached PWA trust layer after the accepted modules
- Source/acceptance PRs #36, #38, #39 and #43: closed unmerged as superseded
- Issue #50: closed as completed
- Issue #37: remains open only for later Wave 2 / Wave 3 roadmap work

This document is the durable production release record for the Wave 1 + School Overdue release.
