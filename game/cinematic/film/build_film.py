"""Build one scene of the film into one self-contained page: builds/film-<scene>.html (works offline).

    python3 game/cinematic/film/build_film.py m1        # or: brief, m5c, all

A scene is game/cinematic/film/scene-<name>.js plus the files SCENES lists for it. Inlines three.js r187, the Wraith,
Ironhowl 4's pictures (game/cinematic/build.py's), the scene's code and every voice take its LINES name (audio/voice/).
"""
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
CIN = HERE.parent
ROOT = CIN.parents[1]
sys.path.insert(0, str(CIN))
import build as cinbuild  # noqa: E402  (the reveal's build: assets, data urls)

KIT = ["cin-audio.js", "film/film-sfx.js", "cin-look.js", "cin-wraith.js", "cin-fx.js", "film/film-fx.js", "film/film-core.js"]
SCENES = {
    "m1": {"files": ["../creatures/creatures.js", "cin-signal.js", "film/set-strand.js", "film/scene-m1.js"], "out": "film-m1-first-light.html"},
    "brief": {"files": ["../creatures/creatures.js", "cin-signal.js", "film/set-strand.js", "film/set-city.js", "film/scene-brief.js"], "out": "film-brief.html"},
    "m2": {"files": ["../creatures/creatures.js", "cin-signal.js", "film/set-portarlen.js", "film/scene-m2.js"], "out": "film-m2-high-water.html"},
    "m3": {"files": ["../creatures/creatures.js", "cin-signal.js", "film/set-quarry.js", "film/scene-m3.js"], "out": "film-m3-the-dig.html"},
    "m4": {"files": ["../creatures/creatures.js", "cin-signal.js", "film/set-portarlen.js", "film/scene-m4.js"], "out": "film-m4-landfall.html"},
    "m7": {"files": ["../creatures/creatures.js", "cin-signal.js", "film/set-ridge.js", "film/scene-m7.js"], "out": "film-m7-the-ridge.html"},
    "m5c": {"files": ["../creatures/creatures.js", "cin-signal.js", "film/set-saltpans.js", "film/scene-m5c.js"], "out": "film-m5-copper.html"},
}


def build(name):
    sc = SCENES[name]
    files = KIT[:-1] + sc["files"][:-1] + [KIT[-1], sc["files"][-1]]
    page = (HERE / "film.src.html").read_text(encoding="utf-8")
    page = page.replace("<!--THREE-->", "<script>" + cinbuild.THREE.read_text(encoding="utf-8").replace("</script", "<\\/script") + "</script>", 1)
    page = page.replace("<!--ASSETS-->", cinbuild.assets(), 1)
    scene_src = (CIN / sc["files"][-1]).read_text(encoding="utf-8")
    ids = re.findall(r"id:'([A-Z0-9_]+)'", scene_src)
    cinbuild.LINES[:] = ids
    vtag, vfound = cinbuild.voices()
    page = page.replace("<!--VOICE-->", vtag, 1)
    code = "\n".join(f"/* ---- {f} ---- */\n" + (CIN / f).read_text(encoding="utf-8").replace("</script", "<\\/script") for f in files)
    page = page.replace("<!--SCENE-INC-->", code, 1)
    out = ROOT / "builds" / sc["out"]
    out.write_text(page, encoding="utf-8")
    print(out.relative_to(ROOT), f"{out.stat().st_size / 1e6:.2f} MB", "voices:", len(vfound), "of", len(ids))


if __name__ == "__main__":
    for n in (SCENES if sys.argv[1:] == ["all"] else sys.argv[1:] or ["m1"]):
        build(n)
