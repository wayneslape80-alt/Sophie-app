# Android visual correction v2.9.2.6 — staging only

Rebuilt cleanly from the current production tree. Closed PR #29 was inspected only as historical context and was not reused, cherry-picked, merged or imported.

## Intended visual correction
- `surreal-os-emblem.png` is a real image in the top-left header immediately beside “Make today yours.”
- Current Goal contains no surreal emblem element; the existing product image remains.
- Compact Android ordinary/supporting text is explicitly 16–18px with 20–28px headings. No compact root-font magnification is used.
- The v2.9.2.4 DPR viewport bootstrap is byte-preserved from `main`.
- Compact Home remains single-column.
- Pattern Studio JavaScript remains byte-preserved: six palette slots, Saved Looks v2, 32×32 editor and 128×128 CSS repeat remain intact.
- Navigation and non-compact desktop layout rules remain present.
- `index.html`, both affected CSS assets, the emblem URL and service-worker cache are cache-busted for this candidate.

## Release boundary
Draft staging only. Do not merge or deploy without separate approval.

## Static/preservation checks
```text
PASS: DPR viewport bootstrap byte-preserved
PASS: header emblem exists exactly once
PASS: header emblem cache-busted
PASS: emblem sits inside topbar title block before title
PASS: Current Goal emblem markup removed
PASS: Current Goal product image retained
PASS: compact goal is single column
PASS: compact home is single column
PASS: desktop home two-column rule retained
PASS: pattern repeat stays 128px
PASS: style-lab file byte-preserved
PASS: six-colour palette preserved
PASS: Saved Looks v2 preserved
PASS: 32x32 Pattern Studio preserved
PASS: compact type vars use explicit px
PASS: compact supporting text explicit 17px
PASS: compact ordinary paragraph floor explicit 17px
PASS: compact small/meta floor explicit 16px
PASS: compact heading floor explicit pixels
PASS: Pattern Studio injected label/meta floor explicit pixels
PASS: compact nav explicit 16px
PASS: no compact root font magnification added
PASS: affected CSS links cache-busted
PASS: service-worker cache bumped
PASS: service-worker affected assets cache-busted
PASS: service worker still GET-only
PASS: service worker cleanup retained
PASS: navigation destinations preserved
PASS: Pattern Studio controls preserved
PASS: no backend file touched by candidate logic
RESULT: 30/30 PASS
index.html 549b3b04db4af8e8a183430de4f96032445e3d9fb79d7d21fc1132b44b8e80ba
assets/android-first.css e1cda7abd80ed3e3ff8f440d5e3e1ef21d1660cf5e739e293a3c52f4474c9931
assets/concept-a.css 02965783d0a1d4865e24a66b33ed5f15a2f705c4f51335bdd048f50839956fce
assets/style-lab.js 59738ea0c6c6df5e4de869ae79fa5933f11c1b2da750ed44358554ef9e8e16f9
sw.js 98513d6a01a9ab653e966a0d1c59b1099331913562107520bb8e860282198861
```

## Screenshot-equivalent metrics
```text
HOME 360px PASS {"viewport":{"width":360,"height":900},"compact":true,"appWidth":360,"header":{"emblem":{"x":32,"y":64,"w":44,"h":44},"title":{"x":86,"y":64,"w":111,"h":91},"actions":{"x":207,"y":62,"w":105,"h":48}},"goal":{"emblemCount":0,"product":{"x":237,"y":422,"w":88,"h":88},"card":{"x":16,"y":244,"w":328,"h":290}},"homeColumns":"328px","fonts":{"title":28,"section":24,"goalTitle":20,"goalMeta":16,"destinationSupporting":17,"walletPending":16,"nowSupporting":17,"styleSupporting":17,"nav":16},"navButtons":5,"horizontalOverflow":0}
PATTERN 360px PASS_PATTERN {"viewport":{"width":360,"height":900},"open":true,"paletteSlots":6,"palettePickers":6,"savedLooksHost":true,"canvas":{"width":32,"height":32,"rect":{"x":16,"y":310,"w":328,"h":328}},"repeatSize":"128px","fonts":{"title":24,"intro":17,"tools":16,"note":17,"paletteHelp":17,"paletteLabel":17,"paletteMeta":16,"version":16},"horizontalOverflow":0}
HOME 390px PASS {"viewport":{"width":390,"height":900},"compact":true,"appWidth":390,"header":{"emblem":{"x":32,"y":64,"w":44,"h":44},"title":{"x":86,"y":64,"w":141,"h":91},"actions":{"x":237,"y":62,"w":105,"h":48}},"goal":{"emblemCount":0,"product":{"x":267,"y":422,"w":88,"h":88},"card":{"x":16,"y":244,"w":358,"h":290}},"homeColumns":"358px","fonts":{"title":28,"section":24,"goalTitle":20,"goalMeta":16,"destinationSupporting":17,"walletPending":16,"nowSupporting":17,"styleSupporting":17,"nav":16},"navButtons":5,"horizontalOverflow":0}
PATTERN 390px PASS_PATTERN {"viewport":{"width":390,"height":900},"open":true,"paletteSlots":6,"palettePickers":6,"savedLooksHost":true,"canvas":{"width":32,"height":32,"rect":{"x":16,"y":310,"w":358,"h":358}},"repeatSize":"128px","fonts":{"title":24,"intro":17,"tools":16,"note":17,"paletteHelp":17,"paletteLabel":17,"paletteMeta":16,"version":16},"horizontalOverflow":0}
HOME 412px PASS {"viewport":{"width":412,"height":900},"compact":true,"appWidth":412,"header":{"emblem":{"x":32,"y":49,"w":44,"h":44},"title":{"x":86,"y":64,"w":163,"h":60},"actions":{"x":259,"y":47,"w":105,"h":48}},"goal":{"emblemCount":0,"product":{"x":289,"y":392,"w":88,"h":88},"card":{"x":16,"y":214,"w":380,"h":290}},"homeColumns":"380px","fonts":{"title":28,"section":24,"goalTitle":20,"goalMeta":16,"destinationSupporting":17,"walletPending":16,"nowSupporting":17,"styleSupporting":17,"nav":16},"navButtons":5,"horizontalOverflow":0}
PATTERN 412px PASS_PATTERN {"viewport":{"width":412,"height":900},"open":true,"paletteSlots":6,"palettePickers":6,"savedLooksHost":true,"canvas":{"width":32,"height":32,"rect":{"x":16,"y":310,"w":380,"h":380}},"repeatSize":"128px","fonts":{"title":24,"intro":17,"tools":16,"note":17,"paletteHelp":17,"paletteLabel":17,"paletteMeta":16,"version":16},"horizontalOverflow":0}
DESKTOP 1280px PASS {"width":1280,"compact":false,"homeColumns":"697.938px 336.062px","navButtons":5,"headerEmblem":1,"goalEmblem":0,"product":true,"overflow":0}
```
