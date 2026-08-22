from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
index_path = ROOT / "index.html"
sw_path = ROOT / "sw.js"

index = index_path.read_text(encoding="utf-8")
pathway_tag = '  <script src="./assets/skill-pathways-v27.js"></script>\n'
choice_tag = '  <script src="./assets/skill-pathways-v27-choice.js"></script>\n'
anchor = "</body>\n</html>"
if pathway_tag not in index:
    if anchor not in index:
        raise SystemExit("index.html body-close anchor not found")
    index = index.replace(anchor, pathway_tag + anchor, 1)
if choice_tag not in index:
    index = index.replace(pathway_tag, pathway_tag + choice_tag, 1)
index_path.write_text(index, encoding="utf-8")

sw = sw_path.read_text(encoding="utf-8")
accepted = 'const CACHE_NAME = "sophie-app-v2-18-authoritative-pathways-stage";'
if accepted not in sw:
    marker = 'const CACHE_NAME = "'
    start = sw.find(marker)
    if start < 0:
        raise SystemExit("service-worker cache name not found")
    end = sw.find('";', start)
    if end < 0:
        raise SystemExit("service-worker cache terminator not found")
    sw = sw[:start] + accepted + sw[end + 2:]

asset_line = '  "./assets/skill-pathways-v27.js",\n'
choice_line = '  "./assets/skill-pathways-v27-choice.js",\n'
if asset_line not in sw:
    css_anchor = '  "./assets/android-first.css",\n'
    if css_anchor not in sw:
        raise SystemExit("service-worker APP_FILES anchor not found")
    sw = sw.replace(css_anchor, css_anchor + asset_line, 1)
if choice_line not in sw:
    sw = sw.replace(asset_line, asset_line + choice_line, 1)
sw_path.write_text(sw, encoding="utf-8")
