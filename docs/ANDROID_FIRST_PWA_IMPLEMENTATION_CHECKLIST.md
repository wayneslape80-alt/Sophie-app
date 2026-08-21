# Android-first implementation checklist

Use with `docs/ANDROID_FIRST_PWA_DESIGN_BASELINE.md` and GitHub issue #7.

## Compact phone (<600px)
- [ ] 48px minimum touch targets for custom controls
- [ ] body/primary copy at readable mobile scale; essential labels >=14px
- [ ] single-column Skills/domain layout
- [ ] bottom navigation retained and thumb-reachable
- [ ] full-width/mobile-sheet dialogs with dynamic viewport scrolling
- [ ] no horizontal scrolling at 320/360/390/412/480 widths
- [ ] soft keyboard does not hide active controls
- [ ] Android/browser Back traverses app views before exiting

## Medium (600-839px)
- [ ] adaptive spacing/layout at 600px boundary
- [ ] optional supporting/list-detail panes only where useful
- [ ] navigation remains reachable and not stretched phone UI

## Expanded (>=840px)
- [ ] rail/wider navigation treatment
- [ ] useful multi-pane layouts where appropriate
- [ ] readable max widths rather than stretched cards

## Accessibility
- [ ] WCAG 2.2 AA contrast
- [ ] 200% text zoom without loss of content/function
- [ ] `prefers-reduced-motion` supported
- [ ] visible keyboard focus
- [ ] status/locks/safety never colour-only

## PWA
- [ ] stable manifest `id`
- [ ] verified maskable icon before declaring `purpose: maskable`
- [ ] standalone/browser modes both tested
- [ ] versioned service-worker cache
- [ ] API POST responses remain uncached

## Product regression
- [ ] Skills/Learn issue #7 requirements
- [ ] D-006 lifecycle
- [ ] rec-v1
- [ ] Learning Resources
- [ ] School
- [ ] Goals
