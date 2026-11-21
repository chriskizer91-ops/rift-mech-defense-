"""Build the mech arena into one self-contained page that works offline.

    python3 game/systems/build.py          # -> builds/mech-arena.html

It inlines, in order: three.js r187 (Ironhowl 4's bundle), the Wraith's combat models and pictures (from borrowed/ironhowl4/m4/,
the models kept as they are packed there: gzip + base64), the arena's ground picture, then the arena's code (game/systems,
game/mech, game/creatures-test), wrapped in one function.
"""
import base64
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = ROOT / "game/systems/arena.src.html"
OUT = ROOT / "builds/mech-arena.html"
THREE = ROOT / "borrowed/ironhowl4/js/three-ih3.min.js"
M4 = ROOT / "borrowed/ironhowl4/m4"
ART = ROOT / "borrowed/ironhowl4/art"

CODE = [
    "game/systems/base.js",
    "game/systems/input.js",
    "game/systems/render.js",
    "game/systems/fx.js",
    "game/creatures-test/rigs.js",
    "game/creatures-test/cluster.js",
    "game/mech/wraith.js",
    "game/mech/player.js",
    "game/mech/weapons.js",
    "game/systems/camera.js",
    "game/systems/hud.js",
    "game/systems/swarm.js",
    "game/systems/upgrades.js",
    "game/systems/main.js",
]

# models: (folder under m4/, stem). Each brings <stem>_combat.glb and its albedo and normal pictures; ORM pictures are listed apart.
MODELS = [("wraith-v2-hd", "wraith_v2"), ("autocannon", "ac_L"), ("autocannon", "ac_R"), ("lance", "ln_L"), ("lance", "ln_R"),
          ("arc", "ar_L"), ("arc", "ar_R"), ("mpod", "mpod"), ("watcher", "watcher"), ("jetpack", "jetpack")]
ORM = [("wraith-v2-hd", "wraith_v2_combat_orm"), ("autocannon", "ac_combat_orm"), ("lance", "ln_combat_orm"), ("arc", "ar_combat_orm"),
       ("mpod", "mpod_combat_orm"), ("watcher", "watcher_combat_orm"), ("jetpack", "jetpack_combat_orm")]
PICS = ["06-dirt-and-gravel.webp", "06-dirt-and-gravel-n.webp"]


def assets() -> dict:
    a = {}
    for d, stem in MODELS:
        glb = M4 / d / f"{stem}_combat.glb.json"
        a[f"{stem}_combat.glb"] = json.loads(glb.read_text())["b64"]  # still gzip + base64, unpacked in the page
        for kind in ("albedo", "normal"):
            p = M4 / d / f"{stem}_combat_{kind}.webp"
            a[p.name] = base64.b64encode(p.read_bytes()).decode()
    for d, stem in ORM:
        p = M4 / d / f"{stem}.webp"
        a[p.name] = base64.b64encode(p.read_bytes()).decode()
    for n in PICS:
        a[n] = base64.b64encode((ART / n).read_bytes()).decode()
    return a


def build() -> pathlib.Path:
    page = SRC.read_text(encoding="utf-8")
    lib = THREE.read_text(encoding="utf-8").replace("</script", "<\\/script")
    code = "\n".join(f"/* ==== {c} ==== */\n" + (ROOT / c).read_text(encoding="utf-8") for c in CODE)
    if "</script" in code:
        raise SystemExit("code contains </script")
    page = page.replace("<!--THREE-->", "<script>" + lib + "</script>", 1)
    page = page.replace("<!--ASSETS-->", "<script>window.RMD_ASSETS=" + json.dumps(assets(), separators=(",", ":")) + ";</script>", 1)
    page = page.replace("<!--CODE-->", "<script>(function(){'use strict';\n" + code + "\n})();</script>", 1)
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(page, encoding="utf-8")
    return OUT


if __name__ == "__main__":
    o = build()
    print(o.relative_to(ROOT), f"{o.stat().st_size / 1e6:.2f} MB")
