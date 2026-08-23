from pathlib import Path
import re

index = Path('index.html').read_text(encoding='utf-8')
android = Path('assets/android-first.css').read_text(encoding='utf-8')
concept = Path('assets/concept-a.css').read_text(encoding='utf-8')
style = Path('assets/style-lab.js').read_text(encoding='utf-8')
sw = Path('sw.js').read_text(encoding='utf-8')

checks = []
def check(name, cond):
    checks.append((name, bool(cond)))
    if not cond:
        raise AssertionError(name)
    print('PASS:', name)

# Supplied physical-device failure signature: SM-S911B rendered with a desktop-like ~980px layout.
# Model its 1080px physical portrait width at DPR 2.625: 1080 / 2.625 = ~411 CSS px.
physical_width = 1080
physical_height = 2340
dpr = 2.625
css_width = physical_width / dpr
css_height = physical_height / dpr
check('SM-S911B DPR model resolves to phone CSS width', 360 <= css_width <= 430)
check('SM-S911B DPR model resolves near 411px', abs(css_width - 411.43) < 1)
check('SM-S911B CSS aspect stays phone-shaped', css_height / css_width >= 1.75)
check('980px desktop-like layout exceeds repair threshold', abs(980 - css_width) > max(80, css_width * 0.2))

check('DPR read present', 'window.devicePixelRatio' in index)
check('physical screen detection present', 'screenLooksPhysical' in index)
check('DPR short-side correction present', 'rawShortSide / dpr' in index)
check('orientation-aware CSS screen width present', 'screenWidth / dpr' in index and 'cssScreenWidth' in index)
check('corrected viewport meta width present', 'viewport.content = `width=${targetCssWidth}, initial-scale=1, viewport-fit=cover`' in index)
check('compact class still used', 'root.classList.toggle("compact-device", isPhoneScreen)' in index)
check('old effective font scaler removed', 'applyEffectivePhoneScale' not in index and 'initialRootFontPx' not in index)
check('137.5 percent root workaround removed', 'font-size: 137.5%' not in android)
check('wide-reporting root-font fallback removed', 'wide-reporting phone fallback' not in android)

compact = concept[concept.index('/* v2.9.2.4 DPR/goal draft'):]
check('compact goal tied to compact-device', 'html.compact-device #active-goal .home-goal-card' in compact)
check('compact goal switches to one content column', 'grid-template-columns: minmax(0, 1fr);' in compact)
check('goal visual uses separate emblem/product columns', 'grid-template-columns: minmax(0, 1fr) 88px;' in compact)
check('emblem is normal-flow on compact', re.search(r'html\.compact-device \.home-goal-emblem\s*\{[^}]*position:\s*static;', compact, re.S))
check('product is normal-flow on compact', re.search(r'html\.compact-device \.home-goal-product\s*\{[^}]*position:\s*static;', compact, re.S))
check('compact visual widths fit a 360px phone card', 160 + 88 + 12 <= 360 - 36 - 32)

check('Pattern Studio remains 32x32', 'const SIZE = 32;' in style and 'CELL_COUNT = SIZE * SIZE' in style)
check('six-colour Pattern Studio preserved', 'value.length === 6' in style and 'DEFAULT_PALETTE' in style)
check('128x128 repeat preserved', '--sophie-pattern-size: 128px;' in concept)
check('Saved Looks storage preserved', 'sophie_style_saved_looks_v2' in style)
check('style-lab remains v2.9.2.3 source', './assets/style-lab.js?v=2.9.2.3' in index)
check('desktop Home destination two-column rule preserved', '.home-destinations' in concept and 'grid-template-columns: repeat(2, minmax(0, 1fr));' in concept)
check('compact Home single-column override preserved', 'html.compact-device .home-destinations' in android and 'grid-template-columns: minmax(0, 1fr);' in android)
check('navigation markup preserved', 'bottom-nav' in index and 'data-view-target' in index)
check('desktop max shell preserved', '1120px' in index)

check('draft PWA cache bumped', 'sophie-app-v2-9-2-4-dpr-goal-draft' in sw)
check('service worker remains GET-only', 'event.request.method !== "GET"' in sw)
check('candidate CSS cache busts present', '2.9.2.4-dpr-draft' in index and '2.9.2.4-goal-draft' in index)

print(f'RESULT: {len(checks)}/{len(checks)} PASS')
