"""Drive builds/mech-arena.html with no screen and take screenshots (headless Chrome, software WebGL).

    python3 -I game/systems/test_arena.py out.png [phone|laptop] "query" "js run after the Wraith has loaded" [seconds to wait]

The page is opened with ?dev (window.__rmd: ff(t) runs the game t seconds without drawing, ctl({...}) holds controls,
info() reports the state). Prints console errors and __rmd.info(). Software WebGL is far slower than a phone: the frame rate
here is only a floor.
"""
import sys
import pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
out = sys.argv[1]
kind = sys.argv[2] if len(sys.argv) > 2 else "phone"
query = sys.argv[3] if len(sys.argv) > 3 else ""
js = sys.argv[4] if len(sys.argv) > 4 else ""
wait = float(sys.argv[5]) if len(sys.argv) > 5 else 3
vp = {"phone": (412, 915, 2), "laptop": (1280, 760, 1), "land": (915, 412, 2)}[kind]
url = (ROOT / "builds/mech-arena.html").as_uri() + "?dev" + ("&" + query if query else "")
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", headless=True,
                          args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": vp[0], "height": vp[1]}, device_scale_factor=vp[2], has_touch=kind != "laptop")
    pg = ctx.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(f"{m.type}: {m.text}") if m.type == "error" or (m.type == "warning" and "GL Driver" not in m.text) else None)
    pg.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
    pg.goto(url)
    pg.wait_for_function("window.__rmd && window.__rmd.info().ready", timeout=120000)
    if js:
        pg.evaluate(js)
    pg.wait_for_timeout(int(wait * 1000))
    pg.screenshot(path=out, timeout=180000)
    print(pg.evaluate("JSON.stringify(window.__rmd.info())"))
    for e in errs[:20]:
        print(e)
    b.close()
