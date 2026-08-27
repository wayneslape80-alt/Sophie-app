# Wave 1 + School Overdue release candidate

This branch is a release integration candidate built from production `main` `312028cd67e991cf41e12dc6a5326bc7e86a201d`.

## Source authority

- Wave 1 accepted Android integration head: `f8734bd32e9d283c5f8b4cf7c546ae87bbc3a225`
- Accepted School issue #50 source head: `81dcd81bb3efff2e829ef9dad81aa2b413844545`
- Wave 1 choice implementation blob reused as `assets/skill-pathways-v28-choice-core.js`: `262f33c41fe8ec6a7c46967eed218f42facc6072`
- Wave 1 pathways blob: `32d073c9f7fda14e89d9ba4109b2bae82b490962`
- Wave 1 PWA trust blob: `5741f07962b4e8ec28dc47420d1b23aaa3daaacd`
- Accepted School status blob: `c0b8fe35d98de93808282e099a3393571c7172d6`
- Accepted School focus blob: `c4c0ddeb397029a081a3e659f6e52c1f0b27fc47`

## Reconciliation

- `assets/skill-pathways-v28-choice.js` is a loader only.
- Load order is Wave 1 choice core -> School status -> School focus.
- Wave 1 service-worker lifecycle/fetch semantics are retained.
- Service-worker precache adds the choice core and the two School modules.
- Release-candidate cache generation is `v2-9-2-9-wave1-school-overdue-rc1`.

## Accepted School behaviour

Primary status order is `Now -> Submitted -> Feedback -> Overdue`.

Approved active `not_submitted` records with a due date before today are excluded from Now and shown in Overdue, after withheld/archived/feedback/submitted precedence. `PreferredSchoolView` persistence remains limited to `now|subjects`; Submitted, Feedback and Overdue are transient.

## Physical-device evidence already completed

- Physical Android layout: PASS
- TalkBack/accessibility including Overdue: PASS
- Offline cached shell: PASS
- Reconnect/recovery: PASS

## Release control

This integration branch does not itself merge or deploy. Production `main` remains unchanged until a separate release decision.
