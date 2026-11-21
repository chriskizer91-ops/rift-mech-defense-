"""Build a concept page into one self-contained file (three.js and any <!--INC:path--> modules inlined).

    python3 tools/build_viewer.py                      # concept/swarm-viewer.src.html -> builds/swarm-viewer.html
    python3 tools/build_viewer.py concept/x.src.html   # any page with a <!--THREE--> marker
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
THREE = ROOT / "borrowed/ironhowl4/js/three-ih3.min.js"  # three.js r187 bundle from Ironhowl 4 (window.THREE)


def build(src: pathlib.Path) -> pathlib.Path:
    page = src.read_text(encoding="utf-8")
    if "<!--THREE-->" not in page:
        raise SystemExit(f"{src}: no <!--THREE--> marker")
    lib = THREE.read_text(encoding="utf-8").replace("</script", "<\\/script")
    page = page.replace("<!--THREE-->", "<script>" + lib + "</script>", 1)
    # <!--INC:game/creatures/creatures.js--> inlines a module from the repo
    for m in re.findall(r"<!--INC:([^>]+?)-->", page):
        code = (ROOT / m).read_text(encoding="utf-8").replace("</script", "<\\/script")
        page = page.replace(f"<!--INC:{m}-->", f"<script>/* {m} */\n" + code + "</script>", 1)
    out = ROOT / "builds" / src.name.replace(".src.html", ".html")
    out.parent.mkdir(exist_ok=True)
    out.write_text(page, encoding="utf-8")
    return out


if __name__ == "__main__":
    srcs = [pathlib.Path(a) for a in sys.argv[1:]] or [ROOT / "concept/swarm-viewer.src.html"]
    for s in srcs:
        o = build(s if s.is_absolute() else ROOT / s)
        print(o.relative_to(ROOT), f"{o.stat().st_size/1e6:.2f} MB")
