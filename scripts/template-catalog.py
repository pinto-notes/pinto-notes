#!/usr/bin/env python3
"""The app's copy of the website's templates (Pane/Resources/Templates): one line each and the note in use,
for the template viewer, in the gallery's order, with each cover made small. Run it after a template is
added or changed; web/lib/template-catalog.test.ts fails while the copy is behind."""
import json, re, shutil, subprocess, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
web = root / "web"
out = root / "Pane/Resources/Templates"
order = re.findall(r'"([a-z0-9-]+)"', re.search(r"export const ORDER = \[(.*?)\];", (web / "lib/templates.ts").read_text(), re.S).group(1))
grounds = dict(re.findall(r'"([a-z0-9-]+)": \{ ground: "#([0-9a-f]{6})"', (web / "lib/template-covers.ts").read_text()))

catalog = []
for slug in order:
    t = json.loads((web / f"content/templates/{slug}.json").read_text())
    catalog.append({
        "slug": slug, "title": t["title"], "tagline": t["tagline"], "description": t["description"],
        "category": t["category"], "app": bool(t.get("app")), "ground": grounds[slug], "ask": t["asks"][0],
        # In use: the note after the AI has filled it in; an app also shows a picture of it.
        "example": t["example"],
    })
    if t.get("app"):
        # An app runs in the viewer: its note, its compiled project and its starting data, as the site has them.
        catalog[-1]["note"] = t["note"]
    if "--check" not in sys.argv:
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "80", "-Z", "360",
                        str(web / f"public/templates/covers/{slug}.webp"), "--out", str(out / f"template-cover-{slug}.jpg")],
                       check=True, capture_output=True)
        for look in ("light", "dark") if t.get("app") else ():
            subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "82", "-Z", "960",
                            str(web / f"public/templates/apps/{slug}-{look}.png"), "--out", str(out / f"template-app-{slug}-{look}.jpg")],
                           check=True, capture_output=True)
        for kind in ("project", "data") if t.get("app") else ():
            shutil.copyfile(web / f"public/templates/apps/{slug}.{kind}.json", out / f"template-app-{slug}.{kind}.json")
text = json.dumps(catalog, indent=1, ensure_ascii=False) + "\n"
if "--check" in sys.argv:
    sys.exit(0 if (out / "catalog.json").read_text() == text else "Pane/Resources/Templates is behind: run scripts/template-catalog.py")
(out / "catalog.json").write_text(text)
print(f"{len(catalog)} templates")
