# v2.9.2.7 Settings refinement — staging only

## Scope
This revision preserves the previously tested v2.9.2.6 Android/header candidate and applies only the reviewed Settings simplification.

- Former avatar/profile-looking control becomes an explicit gear Settings button.
- The existing sync indicator is retained as connection status, not character/avatar state.
- Settings heading becomes `SOPHIE // SETTINGS` / `Settings`.
- `Your character` is removed from the Settings DOM.
- Legacy `Colour theme` is removed from the Settings DOM.
- The visual row is `Visual look` and points to Pattern Studio.
- Pattern Studio / Saved Looks remains authoritative for the repeating artwork and six app colours.
- Legacy `data-theme` is removed after startup so it cannot override the Saved Look visual system.

## Preservation evidence
Comparison from the previously tested Android/header candidate `617a7cb2d6df26966f231f645f8f08ff7d8e0369` to the Settings candidate before this report shows no changes to `index.html`, `assets/android-first.css`, `assets/concept-a.css`, `assets/style-lab.js`, backend code, product images, navigation markup or Pattern Studio implementation.

Runtime product delta is limited to:
- `assets/skill-pathways-v28-choice.js`: +55 / -3, adding the DOM Settings refinement while preserving the existing technique-choice bridge.
- `sw.js`: cache-name bump only to `sophie-app-v2-9-2-7-settings`.

The original v2.9.2.6 candidate already passed the 30/30 Android/static preservation suite and screenshot-equivalent checks at 360, 390 and 412 CSS px plus 1280px desktop. Those unchanged layout assets remain the basis of this revision.

## Settings-specific verification
- PASS: Settings refinement snippet parses with `node --check`.
- PASS: staged source changes `#settings-button` from `avatar-button` to `icon-button settings-button` at DOM startup.
- PASS: staged source replaces the avatar glyph with `⚙` and changes accessible label/title to Settings.
- PASS: staged source physically removes rows labelled `Your character` and `Colour theme`.
- PASS: staged source rewrites the visual row to `Visual look` with Pattern Studio as the sole visual-customisation entry.
- PASS: staged source removes legacy `data-theme` after startup.
- PASS: staged source preserves the existing `#sync-dot` node.
- PASS: service worker remains same-origin GET-only, keeps old-cache cleanup, and uses the new v2.9.2.7 cache name.
- PASS: production `main` remains untouched.

## Boundary
Draft staging only. No merge or production deployment is authorised by this document.
