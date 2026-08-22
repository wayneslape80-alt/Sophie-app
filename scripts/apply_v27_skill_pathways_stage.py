from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
index_path = ROOT / "index.html"
sw_path = ROOT / "sw.js"
asset_path = ROOT / "assets" / "skill-pathways-v27.js"
choice_path = ROOT / "assets" / "skill-pathways-v27-choice.js"

index = index_path.read_text(encoding="utf-8")
script_tag = '  <script src="./assets/skill-pathways-v27.js"></script>\n'
choice_script_tag = '  <script src="./assets/skill-pathways-v27-choice.js"></script>\n'
anchor = "</body>\n</html>"
if script_tag not in index:
    if anchor not in index:
        raise SystemExit("index.html body-close anchor not found")
    index = index.replace(anchor, script_tag + anchor, 1)
if choice_script_tag not in index:
    if script_tag not in index:
        raise SystemExit("pathway script integration anchor not found")
    index = index.replace(script_tag, script_tag + choice_script_tag, 1)
index_path.write_text(index, encoding="utf-8")

sw = sw_path.read_text(encoding="utf-8")
old_cache = 'const CACHE_NAME = "sophie-app-v2-15-effective-mobile-scale";'
old_stage_cache = 'const CACHE_NAME = "sophie-app-v2-16-skill-pathways-stage";'
new_cache = 'const CACHE_NAME = "sophie-app-v2-17-skill-pathways-choice-stage";'
if old_cache in sw:
    sw = sw.replace(old_cache, new_cache, 1)
elif old_stage_cache in sw:
    sw = sw.replace(old_stage_cache, new_cache, 1)
elif new_cache not in sw:
    raise SystemExit("unexpected service-worker cache name")

asset_line = '  "./assets/skill-pathways-v27.js",\n'
choice_asset_line = '  "./assets/skill-pathways-v27-choice.js",\n'
if asset_line not in sw:
    css_anchor = '  "./assets/android-first.css",\n'
    if css_anchor not in sw:
        raise SystemExit("service-worker APP_FILES anchor not found")
    sw = sw.replace(css_anchor, css_anchor + asset_line, 1)
if choice_asset_line not in sw:
    if asset_line not in sw:
        raise SystemExit("service-worker pathway asset anchor not found")
    sw = sw.replace(asset_line, asset_line + choice_asset_line, 1)

sw_path.write_text(sw, encoding="utf-8")

asset = asset_path.read_text(encoding="utf-8")

old_css = '.technique-groups{display:grid;gap:24px}.technique-group-head{margin-bottom:10px}.technique-group-head h3{margin:0 0 4px}.technique-group-head p{margin:0;color:var(--muted);font-size:.875rem;line-height:1.5}'
new_css = '.technique-groups{display:grid;gap:12px}.technique-group{border:1px solid var(--line);border-radius:18px;background:var(--surface);overflow:hidden}.technique-group>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:52px;padding:12px 14px;cursor:pointer;list-style:none}.technique-group>summary::-webkit-details-marker{display:none}.technique-group>summary::after{content:"+";color:var(--brand);font-size:1.2rem;font-weight:900}.technique-group[open]>summary::after{content:"−"}.technique-group-head{min-width:0}.technique-group-head h3{margin:0 0 3px}.technique-group-head p{margin:0;color:var(--muted);font-size:.8125rem;line-height:1.4}.technique-group-body{padding:0 12px 12px}'
if old_css in asset:
    asset = asset.replace(old_css, new_css, 1)
elif new_css not in asset:
    raise SystemExit("technique group CSS anchor not found")

old_small = '.technique-card-copy small{display:block;color:var(--muted);font-size:.78rem;line-height:1.35}'
new_small = '.technique-card-copy small{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;color:var(--muted);font-size:.78rem;line-height:1.35}'
if old_small in asset:
    asset = asset.replace(old_small, new_small, 1)
elif new_small not in asset:
    raise SystemExit("technique card copy CSS anchor not found")

old_group_markup = 'return `<section class="technique-group" aria-labelledby="v27-group-${safe(id)}"><div class="technique-group-head"><h3 id="v27-group-${safe(id)}">${safe(title)}</h3><p>${safe(copy)}</p></div><div class="technique-grid">${items.map(techniqueCardMarkup).join("")}</div></section>`;'
new_group_markup = 'return `<details class="technique-group" ${id === "prepare" ? "open" : ""}><summary><span class="technique-group-head"><h3>${safe(title)}</h3><p>${safe(copy)} · ${items.length} techniques</p></span></summary><div class="technique-group-body"><div class="technique-grid">${items.map(techniqueCardMarkup).join("")}</div></div></details>`;'
if old_group_markup in asset:
    asset = asset.replace(old_group_markup, new_group_markup, 1)
elif new_group_markup not in asset:
    raise SystemExit("technique group markup anchor not found")

old_heading = 'const heading = hard ? "Needed first for Sophie-led practice" : direction === "prerequisite" ? "Helpful preparation" : hard ? "Safety-gated next step" : "Can support this next step";'
new_heading = 'const heading = direction === "next" ? (hard ? "Safety-gated next step" : "Can support this next step") : hard ? "Needed first for Sophie-led practice" : "Helpful preparation";'
if old_heading in asset:
    asset = asset.replace(old_heading, new_heading, 1)
elif new_heading not in asset:
    raise SystemExit("technique edge heading anchor not found")

asset_path.write_text(asset, encoding="utf-8")

choice = choice_path.read_text(encoding="utf-8")
internal_copy = "These are linked activities checked by rec-v1 for the safety setup you chose."
sophie_copy = "These are linked activities that fit the safety setup you chose."
if internal_copy in choice:
    choice = choice.replace(internal_copy, sophie_copy, 1)
elif sophie_copy not in choice:
    raise SystemExit("technique choice copy anchor not found")

old_safety_options = '${REC_SAFETY_OPTIONS.map(option => `<button class="rec-choice ${flow.safetySupport === option.value ? "active" : ""}" type="button" data-v27-technique-safety="${safe(option.value)}"><strong>${safe(option.label)}</strong></button>`).join("")}'
new_safety_options = '${REC_SAFETY_OPTIONS.map(([value, label]) => `<button class="rec-choice ${flow.safetySupport === value ? "active" : ""}" type="button" data-v27-technique-safety="${safe(value)}"><strong>${safe(label)}</strong></button>`).join("")}'
if old_safety_options in choice:
    choice = choice.replace(old_safety_options, new_safety_options, 1)
elif new_safety_options not in choice:
    raise SystemExit("safety option tuple anchor not found")

old_support_options = '${REC_SUPPORT_OPTIONS.map(option => `<button class="rec-choice ${app.rec.supportChoice === option.value ? "active" : ""}" type="button" data-rec-support="${safe(option.value)}"><strong>${safe(option.label)}</strong><span>${safe(option.copy)}</span></button>`).join("")}'
new_support_options = '${REC_SUPPORT_OPTIONS.map(([value, label]) => `<button class="rec-choice ${app.rec.supportChoice === value ? "active" : ""}" type="button" data-rec-support="${safe(value)}"><strong>${safe(label)}</strong></button>`).join("")}'
if old_support_options in choice:
    choice = choice.replace(old_support_options, new_support_options, 1)
elif new_support_options not in choice:
    raise SystemExit("support option tuple anchor not found")

old_dialog_target = '    const title = document.querySelector("#rec-dialog-title");\n    const body = document.querySelector("#recommendation-body");\n    if (!title || !body) return;'
new_dialog_target = '    const body = document.querySelector("#recommendation-dialog-body");\n    if (!body) return;'
if old_dialog_target in choice:
    choice = choice.replace(old_dialog_target, new_dialog_target, 1)
elif new_dialog_target not in choice:
    raise SystemExit("recommendation dialog container anchor not found")

replacements = [
    (
        '      title.textContent = "Set up this learning choice";\n      body.innerHTML = `<div class="rec-screen">',
        '      body.innerHTML = `<div class="dialog-head"><h2>Set up this learning choice</h2><button type="button" class="close-button" data-rec-exit aria-label="Close">×</button></div><div class="rec-screen">'
    ),
    (
        '      title.textContent = "Choose a real activity";\n      body.innerHTML = `<div class="rec-screen">',
        '      body.innerHTML = `<div class="dialog-head"><h2>Choose a real activity</h2><button type="button" class="close-button" data-rec-exit aria-label="Close">×</button></div><div class="rec-screen">'
    ),
    (
        '      title.textContent = "Choose the support you want";\n      body.innerHTML = `<div class="rec-screen">',
        '      body.innerHTML = `<div class="dialog-head"><h2>Choose the support you want</h2><button type="button" class="close-button" data-rec-exit aria-label="Close">×</button></div><div class="rec-screen">'
    )
]
for old, new in replacements:
    if old in choice:
        choice = choice.replace(old, new, 1)
    elif new not in choice:
        raise SystemExit(f"recommendation dialog heading anchor not found: {new[:42]}")

choice_path.write_text(choice, encoding="utf-8")
