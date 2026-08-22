from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
index_path = ROOT / "index.html"
sw_path = ROOT / "sw.js"

index = index_path.read_text(encoding="utf-8")
script_tag = '  <script src="./assets/skill-pathways-v27.js"></script>\n'
if script_tag not in index:
    anchor = "</body>\n</html>"
    if anchor not in index:
        raise SystemExit("index.html body-close anchor not found")
    index = index.replace(anchor, script_tag + anchor, 1)
    index_path.write_text(index, encoding="utf-8")

sw = sw_path.read_text(encoding="utf-8")
old_cache = 'const CACHE_NAME = "sophie-app-v2-15-effective-mobile-scale";'
new_cache = 'const CACHE_NAME = "sophie-app-v2-16-skill-pathways-stage";'
if old_cache in sw:
    sw = sw.replace(old_cache, new_cache, 1)
elif new_cache not in sw:
    raise SystemExit("unexpected service-worker cache name")

asset_line = '  "./assets/skill-pathways-v27.js",\n'
if asset_line not in sw:
    anchor = '  "./assets/android-first.css",\n'
    if anchor not in sw:
        raise SystemExit("service-worker APP_FILES anchor not found")
    sw = sw.replace(anchor, anchor + asset_line, 1)

sw_path.write_text(sw, encoding="utf-8")
