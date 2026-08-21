# Android-first PWA design baseline

Status: ACTIVE PRODUCT AND FRONTEND REQUIREMENT
Date: 2026-08-21
Owner: 00 - Sophie App Coordinator

## Product assumption

Sophie App is primarily used as an installed or browser-based PWA on an Android phone in portrait orientation. It must remain fully usable on desktop/PC and other window sizes. The design must adapt to available window width rather than assuming a particular phone model.

## Authoritative external guidance used

- Android Developers, Window Size Classes: compact width <600dp, medium 600-839dp, expanded 840-1199dp, large 1200-1599dp, extra-large >=1600dp.
- Android Developers accessibility guidance: interactive touch targets should be at least 48dp x 48dp.
- WCAG 2.2 AA: target-size minimum 24 x 24 CSS px, text can be resized to 200% without loss of content/functionality, normal text contrast at least 4.5:1.
- web.dev PWA guidance: installable manifest, 192px and 512px icons, start_url, scope, standalone display, theme/background colours, stable PWA id, Android adaptive/maskable icons where a suitable asset exists.

Sources:
- https://developer.android.com/develop/adaptive-apps/guides/use-window-size-classes
- https://developer.android.com/guide/topics/ui/accessibility/views/apps-views
- https://www.w3.org/TR/WCAG22/
- https://www.w3.org/WAI/WCAG22/Understanding/resize-text
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- https://web.dev/articles/add-manifest
- https://web.dev/articles/maskable-icon

## Required implementation baseline

### 1. Compact Android layout is the primary design target

- Use a compact breakpoint below 600 CSS px as the main phone layout.
- Primary test widths: 320, 360, 390, 412 and 480 CSS px.
- Portrait is the priority use case, but do not lock orientation.
- No horizontal page scrolling at any supported compact width.
- Use approximately 16px compact-screen side gutters, with safe-area support.
- Use `100dvh`/dynamic viewport sizing where full-height surfaces are required so the soft keyboard and browser UI do not trap content.

### 2. Adaptive desktop/tablet behaviour

- 600-839px: medium layout. Increase breathing room and permit two-column/list-detail patterns where useful.
- >=840px: expanded layout. Prefer a navigation rail or wider navigation treatment rather than simply stretching the phone bottom bar.
- >=1200px: constrain readable content width and use available space for supporting panes, not oversized cards/text.
- Preserve the same functionality at every breakpoint.

### 3. Touch and one-handed use

- All primary custom interactive controls must have a minimum 48 x 48 CSS-px target box on touch layouts.
- Icon-only controls must also meet 48 x 48 and have an accessible name.
- Destructive/irreversible actions require clear separation from adjacent controls.
- Frequent primary actions should not depend on tiny top-right controls.
- Bottom navigation is retained for compact width because there are five primary destinations.

### 4. Typography and readability

- Default body text should generally be 16px/1rem with approximately 1.45-1.6 line height.
- Secondary text should generally not drop below 14px unless genuinely incidental.
- Avoid 0.66-0.78rem text for essential navigation/actions on phones.
- Use `rem`/relative sizing so Android/browser font scaling and 200% text resize do not clip content or controls.
- Cards, dialogs and form controls must grow/reflow when text is enlarged.

### 5. Navigation and Android system Back

- Internal app navigation must integrate with browser history so Android system Back returns to the previous app view rather than unexpectedly exiting the PWA.
- An open modal/dialog should close before Back leaves the current primary view where technically practical.
- Preserve app state when changing width/orientation.

### 6. Dialogs, forms and keyboard

- Compact-screen dialogs should behave as reachable mobile sheets/full-height panels where needed rather than narrow desktop popups.
- Dialog content must scroll independently if taller than the visible dynamic viewport.
- Keep the active form field and primary submit/cancel controls reachable when the Android soft keyboard is open.
- Maintain explicit labels, appropriate `inputmode`, autocomplete where appropriate, and semantic error/status messages.

### 7. Accessibility

- Target WCAG 2.2 AA as the web baseline.
- Normal text contrast >=4.5:1; large text >=3:1.
- Do not use colour alone to convey status, prerequisite locks, safety or errors.
- Preserve keyboard focus visibility on PC.
- Add `prefers-reduced-motion` handling so decorative transitions/animations can be effectively disabled.
- Use semantic headings, controls, labels, live regions and accessible names.

### 8. Skills/Learn mobile IA

For GitHub issue #7:

- Skills is the primary mobile learning destination.
- Skill/domain cards should be large tap targets and single-column by default on compact screens.
- Opening Cooking shows Cooking-specific learning, prerequisites and `Find something to practise`; the Cooking setup must not be presented as a generic all-domain Learn dialog.
- Hard prerequisite locks are visible and explanatory, with the precursor/action needed to become eligible.
- Recommended prerequisites alter sequence/support but do not visually lock the item.
- Current Learn items appear in Skills rather than being duplicated as primary Opportunities content.

### 9. Contribute / Earn mobile IA

- Opportunities becomes primarily Contribute and Earn on Sophie-facing compact layouts.
- Parent Mode must expose clear, reachable Add Contribute / Add Learn / Add Earn entry points instead of burying creation under review work.
- Sophie-originated proposal controls, when implemented, must use mobile-sized controls and preserve D-006 authority boundaries.

### 10. PWA / Android installation

- Keep HTTPS/GitHub Pages installability.
- Manifest must retain name/short_name, start_url, scope, standalone display, background/theme colours and 192/512 icons.
- Add a stable manifest `id` during the staged build.
- Add a dedicated maskable icon only after the icon asset is verified/designed for Android's maskable safe zone. Do not falsely mark the existing icon as maskable without checking it.
- Keep service-worker caches versioned and POST/API responses uncached.
- Installed and browser modes must both remain usable.

### 11. Performance and resilience

- Keep initial mobile payload light. Avoid new heavyweight frameworks for this single-page app without a measured need.
- Lazy-load non-critical images/media where possible.
- Avoid layout shifts from images by supplying dimensions/aspect ratio where practical.
- Maintain useful offline shell behaviour while failing closed for authoritative data mutations.

## Current known gaps in production v2.5.0 frontend

- `.icon-button` is 42 x 42px, below the Android 48dp recommendation.
- Several action/navigation labels use approximately 0.66-0.78rem text.
- Primary/secondary buttons are not globally guaranteed a 48px touch height.
- Existing high-level responsive breakpoint is 760px rather than the Android 600/840 window-size model.
- No `popstate`/History API handling has been identified for primary app navigation.
- No `prefers-reduced-motion` override is present in the inspected CSS.
- Manifest has the core installability fields, but no explicit stable `id` and no verified maskable icon declaration.

## Acceptance testing for the next staged frontend

Mandatory viewport/browser runs:

- 360 x 800 Android-class portrait
- 390 x 844 Android-class portrait
- 412 x 915 Android-class portrait
- 600 x 900 medium-width boundary
- 840 x 900 expanded-width boundary
- 1280 x 900 desktop

Also test:

- 200% browser text zoom/reflow
- keyboard-only PC navigation
- reduced-motion preference
- Android-style coarse pointer/touch target audit
- soft-keyboard form/dialog reachability
- system/browser Back navigation through at least Home -> Skills -> Cooking -> candidate/detail
- no horizontal scrolling
- service-worker update and offline-shell regression
- D-006, rec-v1, Learning Resources, School and Goals regressions

This baseline is cross-cutting and applies to future Sophie App frontend work, not only issue #7.
