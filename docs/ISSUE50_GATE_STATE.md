# Issue #50 gate state

- Browser logic harness: PASS (30/30 baseline)
- Local Overdue correction static verification: PASS (41/41)
- Full-origin browser/runtime on physical Android local candidate: PASS
- Physical Android: PASS
- TalkBack/accessibility: PASS
- Offline/PWA runtime: PASS
- Offline reconnect/recovery: PASS
- Accepted School status order: `Now -> Submitted -> Feedback -> Overdue`
- Accepted Overdue rule: approved active `not_submitted` records with a due date before today are excluded from Now and shown in Overdue; Submitted/Received and Feedback continue to take precedence over DueDate
- PreferredSchoolView persistence remains limited to `now|subjects`; Submitted, Feedback and Overdue are transient
- Accepted School status blob: `c0b8fe35d98de93808282e099a3393571c7172d6`
- Accepted School focus blob: `c4c0ddeb397029a081a3e659f6e52c1f0b27fc47`
- Wave 1 rebase/integration: OPEN
- Release: OPEN
- Merge: NOT AUTHORISED / NOT PERFORMED
- Deployment: NOT AUTHORISED / NOT PERFORMED

Production `main` remains unchanged at `312028cd67e991cf41e12dc6a5326bc7e86a201d`.

Acceptance evidence above was produced from the local-only combined Wave 1 + issue #50 candidate on a physical Android device. Phase 1 records only the accepted School source and gate evidence on `issue50-school-status-ia`; it does not integrate Wave 1, modify PR #43, merge, or deploy.
