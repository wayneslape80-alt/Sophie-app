# Mobile viewport test matrix

Primary use: installed/browser PWA on Android phone.

| Width x height | Class | Required |
| --- | --- | --- |
| 320 x 700 | compact stress case | yes |
| 360 x 800 | compact Android baseline | yes |
| 390 x 844 | compact Android baseline | yes |
| 412 x 915 | compact Android baseline | yes |
| 480 x 900 | compact upper-range | yes |
| 600 x 900 | medium boundary | yes |
| 839 x 900 | medium upper boundary | yes |
| 840 x 900 | expanded boundary | yes |
| 1280 x 900 | desktop | yes |

Each run must check touch targets, horizontal overflow, dialogs/forms, bottom/rail navigation, Skills -> domain -> learning flow, system/browser Back behaviour, text zoom, and existing product regressions.

## Real mobile viewport contract

The compact matrix must run in two forms:

1. ordinary responsive viewport sizes for boundary coverage; and
2. genuine Android mobile emulation with a phone screen, touch input, mobile user agent and device-pixel ratio.

For the `360 x 800` SM-S911B profile, the test must assert that:

- the document contains exactly one early viewport tag with `width=device-width` and `initial-scale=1`;
- `window.innerWidth` and `visualViewport.width` resolve to the phone width;
- the `<600px` compact breakpoint is active;
- the `840px+` expanded breakpoint is inactive;
- navigation is a five-item bottom bar, not an 82px rail;
- Skills domain cards are one column;
- base text is not scaled below 16px;
- there is no horizontal overflow and visible controls meet the 48px target baseline.

The suite must also inject a `980px` virtual desktop viewport into the same Android profile. The candidate passes only if the runtime guard detects and repairs that state before presentation, the compact breakpoint becomes active, and the rail/two-column desktop layout never remains visible. A desktop browser merely resized to `360px` is not sufficient evidence for this contract.

## Compact Skills density

On a phone, Current Learning, learning domains and Capabilities must render as grouped list rows rather than separate floating cards. Tests must verify zero inter-row gap, divider-based grouping, no individual row shadow or corner radius, and bounded row heights while preserving 48px actions and readable descriptions.

## Compact typography hierarchy

The phone Skills workspace uses a reduced Material-style role set rather than unrelated per-component sizes:

- page title: at least 24px equivalent;
- section title: at least 20px and visibly below the page title;
- row title and introductory body: at least 16px;
- supporting descriptions: at least 14px with 1.4 line height or greater;
- labels: at least 13px;
- metadata and bottom-navigation labels: at least 12px.

The browser suite must assert the computed hierarchy on genuine Android emulation and confirm that relative units scale to 200% without horizontal overflow or loss of functionality.
