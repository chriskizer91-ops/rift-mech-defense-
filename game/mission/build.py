"""Build mission 1 into one self-contained page that works offline.

    python3 game/mission/build.py          # -> builds/mission-1.html

What goes in, in order:
  C's page (game/systems/arena.src.html), retitled, with the mission's extra bits (the minimap, the objective line,
    the end screen) put in;
  three.js r187; C's assets (the Wraith, its kit) and B's (the ground pictures, the trees); the voices (audio/voice/m1_*);
  B's world (game/world: the map, Greywater Strand, the soil, the look, the trees, the minimap, RMD.World);
  D's radio (game/cinematic/cin-audio.js: RMD.RadioVoice);
  then, in one wrapper: A's creatures, C's code (the file list from game/systems/build.py), B's join
    (game/mission/mission.js) and mission 1 (game/mission/m1.js), and last the call that starts it.
C's code is read as it is, with the few changes listed in PATCHES; each must match once, or the build stops (so a change
in C's code can't break the mission quietly).
"""
import base64
import importlib.util
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = ROOT / "game/mission"


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


CB = load("c_build", ROOT / "game/systems/build.py")   # C's build: its file list and its assets
WB = load("w_build", ROOT / "game/world/build.py")     # B's world build: the ground pictures and the trees

WORLD = ["wt-map.js", "wt-fields.js", "wt-strand.js", "wt-soil.js", "wt-look.js", "wt-trees.js", "wt-minimap.js", "wt-world.js"]

# (file, what C wrote, what the mission needs). Each must appear exactly once.
PATCHES = [
    ("game/systems/base.js", "const hgt=(x,z)=>0;", "const hgt=(x,z)=>RMD.World.heightAt(x,z);"),
    ("game/systems/base.js", "const ARENA_R=170;", "const ARENA_R=RMD.World.radius;"),
    ("game/systems/render.js", "const cam=new THREE.PerspectiveCamera(42,1,1,900);", "const cam=new THREE.PerspectiveCamera(42,1,.5,1700);"),
    ("game/mech/player.js", "function updPlayer(c,dt){", "function updPlayerC(c,dt){"),
    ("game/systems/input.js", "function readCtl(dt){", "function readCtlC(dt){"),
    ("game/mech/wraith.js", "function poseMech(M,st,dt){", "function poseMechC(M,st,dt){"),
    ("game/systems/swarm.js", "function updAllies(dt){", "function updAlliesC(dt){"),
    ("game/mech/weapons.js", "AIM.e=null;AIM.x=P.x+dx*d;AIM.z=P.z+dz*d;AIM.y=1.2;", "AIM.e=null;AIM.x=P.x+dx*d;AIM.z=P.z+dz*d;AIM.y=hgt(AIM.x,AIM.z)+1.2;"),
    # the green marks over people and wingmates, at their ground (or deck) height
    ("game/systems/swarm.js", "a.h[0].set(a.x,1,a.z);", "a.h[0].set(a.x,(a.y==null?hgt(a.x,a.z):a.y)+1,a.z);"),
    ("game/systems/swarm.js", "if(thermal)DOTS.put(a.x,1,a.z,", "if(thermal)DOTS.put(a.x,(a.y==null?hgt(a.x,a.z):a.y)+1,a.z,"),
    ("game/systems/swarm.js", "DOTS.put(w.x,8,w.z,", "DOTS.put(w.x,hgt(w.x,w.z)+8,w.z,"),
    ("game/systems/main.js", "\nboot();", "\n/* boot() is called after the mission's code */"),
]

PAGE_SUBS = [
    ("<title>IRMD · Mech arena</title>", "<title>IRMD · Mission 1 · First Light</title>"),
    ("<h2>Intl. Rift Mech Defense · test arena</h2><h1>WRAITH</h1>",
     "<h2>Intl. Rift Mech Defense · Mission 1 · Greywater Strand · dawn</h2><h1>FIRST LIGHT</h1>"),
    ("Leave the arena", "Leave the mission"),
]
BRIEF = ("Gull is loading the last boats off the pier. Something is coming up out of the surf. Hold the beach and keep it "
         "off the pier until the boats are away. You and three more Wraiths. Every creature is a cluster of dots, and its "
         "dots are its hit points. The water slows you; past your hips you can't wade on: jet, then hold JET to hover.")

EXTRA_CSS = """
#radar{display:none!important}
#minib{display:block;margin:0 0 4px auto;padding:0;border:0;background:none;width:clamp(104px,28vw,150px);height:clamp(104px,28vw,150px);border-radius:50%;pointer-events:auto}
#mini{width:100%;height:100%;border-radius:50%;display:block}
#obj{left:0;right:0;top:calc(46px + env(safe-area-inset-top));text-align:center;font-size:12px;color:#4fe0b8;letter-spacing:.16em;text-shadow:0 0 6px #000;transition:opacity .4s}
@media (max-width:600px){#obj{top:calc(214px + env(safe-area-inset-top));font-size:11px}}
#mres{display:none}#mrl{display:flex;flex-direction:column;gap:4px;width:min(300px,90vw);margin:6px 0}
#mrl div{display:flex;justify-content:space-between;font-size:12px;color:#cfe2dc;border-bottom:1px solid #ffffff14;padding:3px 0}#mrl b{color:#fff}
"""
EXTRA_DOM = """
<div class="hud" id="obj"></div>
<div class="panel" id="mres"><h2>Mission 1 · First Light · Greywater Strand</h2><h1 id="mrt">MISSION COMPLETE</h1><div class="txt" id="mrs"></div>
  <div id="mrl"></div><div class="row"><button class="big" id="mragain">Again</button><button id="mrtitle">Title</button></div></div>
"""
START = """
$('tr').insertBefore(Object.assign(document.createElement('button'),{id:'minib',innerHTML:'<canvas id="mini"></canvas>'}),$('tr').firstChild);
boot();
$('minib').onclick=e=>{e.stopPropagation();MINI.ri=(MINI.ri+1)%MINI.ranges.length;};
$('mragain').onclick=e=>{e.stopPropagation();startPlay();};
$('mrtitle').onclick=e=>{e.stopPropagation();$('mres').style.display='none';G.mode='title';resetRun();$('title').style.display='flex';};
if(DEV)Object.assign(window.__rmd,{M1,MSN,say,missionEnd,world:RMD.World,ffm(t){const n=Math.round(t*30);for(let i=0;i<n;i++)tick(1/30);}});
"""


def world_assets() -> str:
    """B's ground pictures and trees, without what the mission doesn't use (B's own Wraith copy: C brings the Wraith;
    the coast's asphalt and paving; B's particle pictures: C has its own)."""
    fld = next(p for p in WB.PAGES if p[0] == "field-1")
    s = WB.assets(fld[2], fld[3])
    a = json.loads(s[len("<script>window.WT_ASSETS="):-len(";</script>")])
    for k in ("wraith", "jetpack", "acL", "acR"):
        a["glb"].pop(k, None)
    for k in ("asph", "pave", "fx", "smoke"):
        a["tex"].pop(k, None)
    return "<script>window.WT_ASSETS=" + json.dumps(a) + ";</script>"


def voices() -> str:
    v = {}
    for p in sorted((ROOT / "audio/voice").glob("m1_*.mp3")):
        v[p.stem.upper()] = base64.b64encode(p.read_bytes()).decode()
    return "<script>window.RMD_VOICE=" + json.dumps(v) + ";</script>"


def patched(rel) -> str:
    s = (ROOT / rel).read_text(encoding="utf-8")
    for f, a, b in PATCHES:
        if f != rel:
            continue
        n = s.count(a)
        if n != 1:
            raise SystemExit(f"{rel}: expected one of {a!r}, found {n}. C's code has changed: update PATCHES.")
        s = s.replace(a, b)
    return s


def build() -> pathlib.Path:
    page = (ROOT / "game/systems/arena.src.html").read_text(encoding="utf-8")
    for a, b in PAGE_SUBS:
        if a not in page:
            raise SystemExit(f"arena.src.html: {a!r} not found")
        page = page.replace(a, b)
    page = re.sub(r'(<h1>FIRST LIGHT</h1>\s*<div class="txt">)[^<]*(</div>)', lambda m: m.group(1) + BRIEF + m.group(2), page, count=1)
    page = page.replace("</style>", EXTRA_CSS + "</style>", 1)
    lib = CB.THREE.read_text(encoding="utf-8").replace("</script", "<\\/script")
    page = page.replace("<!--THREE-->", EXTRA_DOM + "<script>" + lib + "</script>", 1)
    c_assets = "<script>window.RMD_ASSETS=" + json.dumps(CB.assets(), separators=(",", ":")) + ";</script>"
    page = page.replace("<!--ASSETS-->", c_assets + world_assets() + voices(), 1)

    def js(path):
        s = path.read_text(encoding="utf-8")
        if "</script" in s:
            raise SystemExit(f"{path} contains </script")
        return s
    world = "<script>window.WT_MAP='strand';</script>" + "".join(
        "<script>\n" + js(ROOT / "game/world" / f) + "\n</script>" for f in WORLD)
    radio = "<script>\n" + js(ROOT / "game/cinematic/cin-audio.js") + "\n</script>"
    code = "\n".join(f"/* ==== {c} ==== */\n" + (patched(c) if any(p[0] == c for p in PATCHES) else js(ROOT / c)) for c in CB.CODE)
    mine = "\n".join(f"/* ==== game/mission/{f} ==== */\n" + js(HERE / f) for f in ("mission.js", "m1.js"))
    page = page.replace("<!--CODE-->", world + radio + "<script>(function(){'use strict';\n" + code + "\n" + mine + "\n" + START + "\n})();</script>", 1)
    out = ROOT / "builds/mission-1.html"
    out.write_text(page, encoding="utf-8")
    return out


if __name__ == "__main__":
    o = build()
    print(o.relative_to(ROOT), f"{o.stat().st_size / 1e6:.2f} MB")
