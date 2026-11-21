"""Build the Signal's reveal into one self-contained page: builds/signal-reveal.html (works offline).

    python3 game/cinematic/build.py

Inlines three.js r187 (Ironhowl 4's bundle), the Wraith with its jet pack and autocannons (Ironhowl 4's combat models,
as session B's world does), a few of Ironhowl 4's pictures, the code in game/cinematic/, and the voices if they are there:
audio/voice/<id>.mp3, lower case, for every line the film uses (cin-main.js LINES). Without them the film plays with captions.
"""
import base64
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = ROOT / "game/cinematic"
THREE = ROOT / "borrowed/ironhowl4/js/three-ih3.min.js"
ART = ROOT / "borrowed/ironhowl4/art"
M4 = ROOT / "borrowed/ironhowl4/m4"
VOICE = ROOT / "audio/voice"
TEX = {"conc": "02-wet-concrete", "concN": "02-wet-concrete-n", "pave": "07-harbor-paving", "paveN": "07-harbor-paving-n",
       "rock": "65-hill-rock", "metal": "12-rusted-steel-plate", "skyline": "33-harbor-skyline"}
GLB = {"wraith": ("wraith-v2-hd", "wraith_v2", "wraith_v2_combat_orm"),
       "jetpack": ("jetpack", "jetpack", "jetpack_combat_orm"),
       "acL": ("autocannon", "ac_L", "ac_combat_orm"),
       "acR": ("autocannon", "ac_R", "ac_combat_orm")}
# the lines the film plays: every id in cin-main.js's LINES
LINES = re.findall(r"id:'([A-Z0-9_]+)'", (HERE / "cin-main.js").read_text(encoding="utf-8"))


def data_url(p: pathlib.Path, mime="image/webp") -> str:
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()


def assets() -> str:
    tex = {k: data_url(ART / (v + ".webp")) for k, v in TEX.items()}
    glb = {}
    for k, (d, stem, orm) in GLB.items():
        glb[k] = {"b64": json.loads((M4 / d / (stem + "_combat.glb.json")).read_text())["b64"],
                  "map": data_url(M4 / d / (stem + "_combat_albedo.webp")),
                  "nrm": data_url(M4 / d / (stem + "_combat_normal.webp")),
                  "orm": data_url(M4 / d / (orm + ".webp"))}
    return "<script>window.CIN_ASSETS=" + json.dumps({"tex": tex, "glb": glb}) + ";</script>"


def voices():
    found = {}
    for lid in LINES:
        for ext, mime in ((".mp3", "audio/mpeg"), (".wav", "audio/wav"), (".m4a", "audio/mp4")):
            p = VOICE / (lid.lower() + ext)
            if p.exists():
                found[lid] = data_url(p, mime)
                break
    return "<script>window.CIN_VOICE=" + json.dumps(found) + ";</script>", sorted(found)


def build():
    page = (HERE / "signal-reveal.src.html").read_text(encoding="utf-8")
    page = page.replace("<!--THREE-->", "<script>" + THREE.read_text(encoding="utf-8").replace("</script", "<\\/script") + "</script>", 1)
    page = page.replace("<!--ASSETS-->", assets(), 1)
    vtag, vfound = voices()
    page = page.replace("<!--VOICE-->", vtag, 1)
    for m in re.findall(r"<!--INC:([^>]+?)-->", page):
        code = (HERE / m).read_text(encoding="utf-8").replace("</script", "<\\/script")
        page = page.replace(f"<!--INC:{m}-->", f"/* ---- {m} ---- */\n" + code, 1)
    out = ROOT / "builds/signal-reveal.html"
    out.write_text(page, encoding="utf-8")
    print(out.relative_to(ROOT), f"{out.stat().st_size / 1e6:.2f} MB", "voices:", len(vfound), "of", len(LINES))


if __name__ == "__main__":
    build()
