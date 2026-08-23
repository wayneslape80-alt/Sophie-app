from pathlib import Path
import re

INDEX = Path('index.html')
ANDROID = Path('assets/android-first.css')
CONCEPT = Path('assets/concept-a.css')
SW = Path('sw.js')

index = INDEX.read_text(encoding='utf-8')
android = ANDROID.read_text(encoding='utf-8')
concept = CONCEPT.read_text(encoding='utf-8')
sw = SW.read_text(encoding='utf-8')

viewport_pattern = re.compile(
    r'  <script>\n    \(\(\) => \{\n      const root = document\.documentElement;.*?\n    \}\)\(\);\n  </script>',
    re.S,
)
viewport_replacement = '''  <script>
    (() => {
      const root = document.documentElement;
      const coarsePointer = window.matchMedia("(pointer: coarse)");
      const approvedViewport = "width=device-width, initial-scale=1, viewport-fit=cover";
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement("meta");
        viewport.name = "viewport";
        viewport.content = approvedViewport;
        document.head.insertBefore(viewport, document.currentScript);
      }

      const resolvePhoneViewport = () => {
        const screenWidth = Number(window.screen?.width) || Infinity;
        const screenHeight = Number(window.screen?.height) || Infinity;
        const rawShortSide = Math.min(screenWidth, screenHeight);
        const rawLongSide = Math.max(screenWidth, screenHeight);
        const rawAspect = rawLongSide / Math.max(1, rawShortSide);
        const dpr = Math.max(1, Number(window.devicePixelRatio) || 1);
        const dprShortSide = rawShortSide / dpr;
        const isTouchDevice = coarsePointer.matches || navigator.maxTouchPoints > 0;
        const screenLooksPhysical = isTouchDevice
          && dpr > 1.25
          && rawShortSide > 600
          && dprShortSide >= 320
          && dprShortSide <= 520
          && rawAspect >= 1.4;
        const cssScreenWidth = screenLooksPhysical ? screenWidth / dpr : screenWidth;
        const cssScreenHeight = screenLooksPhysical ? screenHeight / dpr : screenHeight;
        const cssShortSide = Math.min(cssScreenWidth, cssScreenHeight);
        const cssLongSide = Math.max(cssScreenWidth, cssScreenHeight);
        const cssAspect = cssLongSide / Math.max(1, cssShortSide);
        const isPhoneScreen = isTouchDevice
          && cssShortSide >= 320
          && cssShortSide <= 600
          && cssAspect >= 1.4;
        const targetCssWidth = isPhoneScreen && Number.isFinite(cssScreenWidth)
          ? Math.round(Math.min(900, Math.max(320, cssScreenWidth)))
          : 0;
        return { isPhoneScreen, targetCssWidth, screenLooksPhysical, dpr };
      };

      const applyDeviceLayout = () => {
        const { isPhoneScreen, targetCssWidth, screenLooksPhysical, dpr } = resolvePhoneViewport();
        root.classList.toggle("compact-device", isPhoneScreen);
        const desktopLikeLayout = isPhoneScreen && targetCssWidth > 0
          && Math.abs(window.innerWidth - targetCssWidth) > Math.max(80, targetCssWidth * 0.2);
        if (desktopLikeLayout || (isPhoneScreen && root.dataset.viewportRepair === "dpr")) {
          viewport.content = `width=${targetCssWidth}, initial-scale=1, viewport-fit=cover`;
          root.dataset.viewportRepair = "dpr";
          root.dataset.phoneCssWidth = String(targetCssWidth);
          root.dataset.phoneDpr = dpr.toFixed(3);
          if (screenLooksPhysical) root.dataset.physicalPixelScreen = "true";
          else delete root.dataset.physicalPixelScreen;
        } else if (!isPhoneScreen) {
          viewport.content = approvedViewport;
          delete root.dataset.viewportRepair;
          delete root.dataset.phoneCssWidth;
          delete root.dataset.phoneDpr;
          delete root.dataset.physicalPixelScreen;
        }
      };

      applyDeviceLayout();
      window.addEventListener("resize", applyDeviceLayout, { passive: true });
      window.addEventListener("orientationchange", applyDeviceLayout, { passive: true });
    })();
  </script>'''
index, count = viewport_pattern.subn(viewport_replacement, index, count=1)
assert count == 1, f'viewport bootstrap replacement count={count}'

index = index.replace('./assets/android-first.css?v=2.9.2.3', './assets/android-first.css?v=2.9.2.4-dpr-draft')
index = index.replace('./assets/concept-a.css?v=2.9.2-candidate-2', './assets/concept-a.css?v=2.9.2.4-goal-draft')
index = index.replace('./sw.js?v=2.9.2.3', './sw.js?v=2.9.2.4-dpr-draft')

compact_old = '''html.compact-device {
  --nav-height: 6rem;
  /* Physical Android feedback: 125% was still too small. */
  font-size: 137.5% !important;
}'''
compact_new = '''html.compact-device {
  --nav-height: 6rem;
  /* v2.9.2.4 draft: viewport width is corrected with DPR; do not magnify root text. */
}'''
assert compact_old in android, 'compact font scaling block missing'
android = android.replace(compact_old, compact_new, 1)

fallback_pattern = re.compile(
    r'\n/\* v2\.9\.2\.3: wide-reporting phone fallback\..*?\n@media \(pointer: coarse\) and \(max-width: 1200px\), \(hover: none\) and \(max-width: 1200px\) \{.*?\n\}\s*$',
    re.S,
)
android, count = fallback_pattern.subn(
    '\n/* v2.9.2.4 draft: the DPR-aware viewport bootstrap makes phone CSS width authoritative;\n * the previous coarse-pointer root-font fallback is deliberately removed. */\n',
    android,
    count=1,
)
assert count == 1, f'wide-reporting font fallback removal count={count}'

goal_css = r'''

/* v2.9.2.4 DPR/goal draft — compact Current Goal keeps emblem and product separate. */
html.compact-device #active-goal .home-goal-card {
  min-height: 0;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  padding: 18px;
}

html.compact-device .home-goal-visual {
  min-height: 104px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 88px;
  gap: 12px;
  align-items: center;
}

html.compact-device .home-goal-emblem {
  position: static;
  width: min(100%, 160px);
  max-width: 160px;
  right: auto;
  top: auto;
  justify-self: start;
  transform: rotate(4deg);
}

html.compact-device .home-goal-product {
  position: static;
  width: 88px;
  height: 88px;
  right: auto;
  bottom: auto;
  justify-self: end;
  align-self: center;
}
'''
assert 'v2.9.2.4 DPR/goal draft' not in concept
concept = concept.rstrip() + goal_css + '\n'

sw = sw.replace('const CACHE_NAME = "sophie-app-v2-9-2-3-android-readable-logo";', 'const CACHE_NAME = "sophie-app-v2-9-2-4-dpr-goal-draft";')
sw = sw.replace('./assets/android-first.css?v=2.9.2.3', './assets/android-first.css?v=2.9.2.4-dpr-draft')
sw = sw.replace('./assets/concept-a.css?v=2.9.2-candidate-2', './assets/concept-a.css?v=2.9.2.4-goal-draft')

assert 'font-size: 137.5% !important' not in android
assert 'effective-mobile-scale' not in index
assert 'initialRootFontPx' not in index
assert '--sophie-pattern-size: 128px;' in concept
assert 'assets/style-lab.js?v=2.9.2.3' in index
assert 'grid-template-columns: repeat(2, minmax(0, 1fr));' in concept

INDEX.write_text(index, encoding='utf-8')
ANDROID.write_text(android, encoding='utf-8')
CONCEPT.write_text(concept, encoding='utf-8')
SW.write_text(sw, encoding='utf-8')
print('v2.9.2.4 DPR/goal draft transformation complete')
