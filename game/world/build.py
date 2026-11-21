"""Build the world test into one self-contained page (works offline).

    python3 game/world/build.py            # game/world/world-test.src.html -> builds/world-test.html

Inlines three.js r187 (Ironhowl 4's bundle), the world's code (game/world/wt-*.js), the ground pictures (Mud Lab's
texpack and Ironhowl 4's art) and the Wraith with its jet pack and autocannons (Ironhowl 4's combat models).
"""
import base64
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = ROOT / "game/world"
THREE = ROOT / "borrowed/ironhowl4/js/three-ih3.min.js"
ART = ROOT / "borrowed/ironhowl4/art"
M4 = ROOT / "borrowed/ironhowl4/m4"
TEXPACK = ROOT / "borrowed/mud-lab/base/texpack.js"

# Mud Lab's ground pictures (already data URLs in its texpack)
MUD = {"sand": "DIRT2", "mud": "MUD"}   # DIRT2: soft creek-bed sand (recoloured to beach sand)
# Ironhowl 4's art
IH4 = {"dirt": "61-dry-prairie-ground", "asph": "03-asphalt", "pave": "07-harbor-paving", "rock": "65-hill-rock", "fac1": "13-yard-building-facade",
       "fac2": "14-docks-building-facade", "roof": "15-roof-gravel", "fx": "fx-atlas", "smoke": "37-smoke-puff",
       "metal": "12-rusted-steel-plate"}
# the Wraith and its kit: combat models (glb, gzip + base64 as Ironhowl 4 ships them) and their maps
GLB = {"wraith": ("wraith-v2-hd", "wraith_v2", "wraith_v2_combat_orm"),
       "jetpack": ("jetpack", "jetpack", "jetpack_combat_orm"),
       "acL": ("autocannon", "ac_L", "ac_combat_orm"),
       "acR": ("autocannon", "ac_R", "ac_combat_orm")}


def data_url(p: pathlib.Path) -> str:
    return "data:image/webp;base64," + base64.b64encode(p.read_bytes()).decode()


def assets() -> str:
    pack = TEXPACK.read_text(encoding="utf-8")
    pack = json.loads(pack[pack.index("{"):pack.rindex("}") + 1])
    tex = {k: pack[v]["src"] for k, v in MUD.items()}
    tex.update({k: data_url(ART / (v + ".webp")) for k, v in IH4.items()})
    glb = {}
    for k, (d, stem, orm) in GLB.items():
        glb[k] = {"b64": json.loads((M4 / d / (stem + "_combat.glb.json")).read_text())["b64"],
                  "map": data_url(M4 / d / (stem + "_combat_albedo.webp")),
                  "nrm": data_url(M4 / d / (stem + "_combat_normal.webp")),
                  "orm": data_url(M4 / d / (orm + ".webp"))}
    return "<script>window.WT_ASSETS=" + json.dumps({"tex": tex, "glb": glb}) + ";</script>"


def build() -> pathlib.Path:
    page = (HERE / "world-test.src.html").read_text(encoding="utf-8")
    lib = THREE.read_text(encoding="utf-8").replace("</script", "<\\/script")
    page = page.replace("<!--THREE-->", "<script>" + lib + "</script>", 1)
    page = page.replace("<!--ASSETS-->", assets(), 1)

    def js(m):
        src = (HERE / m.group(1)).read_text(encoding="utf-8").replace("</script", "<\\/script")
        return "<script>\n" + src + "\n</script>"
    page = re.sub(r"<!--JS:([\w.-]+)-->", js, page)
    out = ROOT / "builds/world-test.html"
    out.write_text(page, encoding="utf-8")
    return out


if __name__ == "__main__":
    o = build()
    print(o.relative_to(ROOT), f"{o.stat().st_size / 1e6:.2f} MB")
