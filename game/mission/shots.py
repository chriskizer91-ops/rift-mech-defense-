"""Screenshots of mission 1 (headless Chrome, software WebGL: frame rates are only a floor).

    python3 -I game/mission/shots.py OUTDIR [phone|laptop] [only=name,name]

Each shot: a name, JS to run first (window.__rmd: C's test hook, plus M1 and MSN), seconds to let it draw.
__rmd.ffm(t) runs the game t seconds without drawing; __rmd.ctl({...}) holds controls (C's).
"""
import pathlib
import sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
PAGE = ROOT / "builds/mission-1.html"
SHOTS = [
    ("title", "", 2),
    ("real_open", "__rmd.startPlay();__rmd.ffm(6)", 3),
    ("sensor_on", "__rmd.ffm(9)", 3),
    ("wave1", "__auto(40)", 3),
    ("wade", "__rmd.ctl({my:1});__rmd.ffm(5);__rmd.ctl({})", 3),
    ("pier", "__rmd.P.x=58;__rmd.P.z=-40;__rmd.ffm(1)", 3),
    ("hold", "__auto(70)", 3),
    ("hold2", "__auto(70)", 3),
    ("away", "__auto(80)", 3),
    ("thermal", "__rmd.setThermal(true);__rmd.ffm(.2)", 3),
    ("cam_low", "__rmd.setThermal(false);__rmd.MSN.camYaw=.6;__rmd.ffm(.2)", 3),
    ("end", "__rmd.missionEnd(true)", 2),
]
out = pathlib.Path(sys.argv[1]);out.mkdir(parents=True, exist_ok=True)
kind = sys.argv[2] if len(sys.argv) > 2 and not sys.argv[2].startswith("only=") else "phone"
only = next((set(a[5:].split(",")) for a in sys.argv[2:] if a.startswith("only=")), None)
vp = {"phone": (412, 915, 2), "laptop": (1280, 760, 1)}[kind]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", headless=True,
                          args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"])
    pg = b.new_context(viewport={"width": vp[0], "height": vp[1]}, device_scale_factor=vp[2], has_touch=kind == "phone").new_page()
    errs = []
    pg.on("console", lambda m: errs.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    pg.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
    pg.goto(PAGE.as_uri() + "?dev" + ("&touch" if kind == "phone" else ""))
    pg.wait_for_function("window.__rmd && __rmd.info().ready", timeout=180000)
    # a stand-in player: walks toward the pier's root, aims at the nearest creature and fires (controls in world directions)
    pg.evaluate("""window.__auto=function(secs){const R=__rmd;for(let s=0;s<secs;s+=.25){const P=R.P;let best=null,bd=1e9;
      for(const e of R.EN){if(e.dead||e.spawnT>0)continue;const d=Math.hypot(e.x-P.x,e.z-P.z);if(d<bd){bd=d;best=e;}}
      const tx=82,tz=-72,dx=tx-P.x,dz=tz-P.z,dd=Math.hypot(dx,dz);const c={mx:dd>6?dx/dd:0,my:dd>6?-dz/dd:0,aim:false,fire:false};
      if(best&&bd<70){c.aim=true;c.ax=(best.x-P.x)/bd;c.az=(best.z-P.z)/bd;c.fire=true;}R.ctl(c);R.ffm(.25);if(R.M1.done)break;}R.ctl({});}""")
    for name, js, wait in SHOTS:
        if js:
            pg.evaluate(js)
        if only and name not in only:
            continue
        pg.wait_for_timeout(int(wait * 1000))
        pg.screenshot(path=str(out / f"{name}.jpg"), quality=82, timeout=180000)
        i = pg.evaluate("Object.assign(__rmd.info(),{phase:__rmd.M1.phase,t:+__rmd.M1.t.toFixed(1),real:__rmd.MSN.real,sent:__rmd.M1.sent,saved:__rmd.M1.savedN})")
        print(name, i)
    for e in errs[:25]:
        print(e)
    b.close()
