from pathlib import Path

path = Path("index.html")
text = path.read_text(encoding="utf-8")
link = '  <link rel="stylesheet" href="./assets/android-first.css">'

if link not in text:
    manifest = '  <link rel="manifest" href="./manifest.webmanifest">'
    if manifest not in text:
        raise SystemExit("manifest link anchor not found")
    text = text.replace(manifest, manifest + "\n" + link, 1)
    path.write_text(text, encoding="utf-8")

check = path.read_text(encoding="utf-8")
if check.count('./assets/android-first.css') != 1:
    raise SystemExit("Android-first stylesheet link missing or duplicated")
