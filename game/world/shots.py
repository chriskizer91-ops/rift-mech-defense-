"""Screenshots of the world test, many from one page load (headless Chrome, software WebGL, as tools/shoot.py).

    python3 -I game/world/shots.py OUTDIR [phone|laptop] [only=name,name]

Each shot: a name, JS to run first (WT is the page's test hook), and seconds to let it draw. Software WebGL is far
slower than a phone, so the frame rates printed are only a floor.
"""
import pathlib
import sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
PAGE = ROOT / "builds/world-test.html"

SHOTS = [
    # name, js, wait
    ("real_beach", "WT.place(-6,9,0);WT.setView(0);WT.sim(.5)", 2),
    ("walk_prints", "WT.place(-34,11,0);WT.sim(5,1,0);WT.sim(1,0,0);WT.zoomTo(-22)", 2),
    ("thermal_sea", "WT.zoomTo(10);WT.place(-20,-60,0);WT.setView(2);WT.sim(.3)", 3),
    ("wade", "WT.setView(0);WT.zoomTo(-6);WT.place(-20,-8,0);WT.sim(4.2,.15,-1)", 2),
    ("too_deep", "WT.zoomTo(0);WT.place(-20,-30,0);WT.sim(9,0,-1)", 2),
    ("hover_sea", "WT.zoomTo(6);WT.place(-20,-40,0);WT.sim(2,0,-1,1);WT.sim(3,.2,-1,1)", 2),
    ("flooded_street", "WT.zoomTo(-8);WT.place(-41,40,Math.PI);WT.sim(4,0,-1);WT.sim(1,0,0)", 2),
    ("drowned_quarter", "WT.zoomTo(10);WT.place(-80,49,0);WT.sim(3,-1,0)", 2),
    ("sensor_beach", "WT.zoomTo(10);WT.place(-6,9,0);WT.setView(1);WT.sim(4)", 3),
    ("thermal_beach", "WT.setView(2);WT.sim(.5)", 3),
    ("swarm_churn_real", "WT.setView(0);WT.sim(12)", 2),
    ("rift_real", "WT.zoomTo(4);WT.place(100,36,0);WT.setView(0);WT.sim(.5)", 2),
    ("rift_sensor", "WT.setView(1);WT.sim(2)", 3),
    ("barrage", "WT.setView(0);WT.barrage();WT.sim(3.4)", 2),
    ("barrage_thermal", "WT.setView(2);WT.sim(.3)", 3),
    ("rift_sealed", "WT.setView(0);WT.sim(6)", 2),
    ("rift_sealed_sensor", "WT.setView(1);WT.sim(6)", 3),
    ("crack_thermal", "WT.zoomTo(30);WT.place(-30,-45,0);WT.setView(2);WT.sim(.3)", 3),
    ("crack_real", "WT.setView(0);WT.sim(.3)", 2),
]

out = pathlib.Path(sys.argv[1])
kind = sys.argv[2] if len(sys.argv) > 2 else "phone"
only = None
for a in sys.argv[3:]:
    if a.startswith("only="):
        only = set(a[5:].split(","))
out.mkdir(parents=True, exist_ok=True)
vp = {"phone": (412, 915, 2), "laptop": (1280, 760, 1)}[kind]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", headless=True,
                          args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": vp[0], "height": vp[1]}, device_scale_factor=vp[2])
    pg = ctx.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(f"{m.type}: {m.text}") if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
    pg.goto(PAGE.as_uri())
    pg.wait_for_function("window.WT && WT.ready", timeout=120000)
    pg.evaluate("WT.ready")
    for name, js, wait in SHOTS:
        if only and name not in only:
            pg.evaluate(js)
            continue
        pg.evaluate(js)
        pg.evaluate("window.__f=0;(function c(){window.__f++;requestAnimationFrame(c)})()")
        pg.wait_for_timeout(int(wait * 1000))
        f = pg.evaluate("window.__f")
        pg.screenshot(path=str(out / f"{name}.jpg"), quality=82, timeout=180000)
        st = pg.evaluate("WT.stats()")
        print(f"{name}: {f / wait:.1f} fps, {st['tris']} tris, {st['calls']} calls, x {st['x']:.1f} z {st['z']:.1f} depth {st['depth']:.2f} air {st['air']} rift {st['rift']} prints {st['prints']}")
    for e in errs[:20]:
        print(e)
    b.close()
