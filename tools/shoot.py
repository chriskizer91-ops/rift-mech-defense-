"""Screenshot a built page with no screen (headless Chrome, software WebGL).

    python3 -I tools/shoot.py builds/swarm-viewer.html out.png "#host" 14 [phone|laptop] [js-to-run-after-load]

Prints console errors and the measured frame rate. Software WebGL is far slower than a phone's GPU,
so the frame rate here is only a floor.
"""
import sys
import pathlib
from playwright.sync_api import sync_playwright

page_path, out, hash_, wait = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
kind = sys.argv[5] if len(sys.argv) > 5 else "phone"
js = sys.argv[6] if len(sys.argv) > 6 else ""
vp = {"phone": (412, 915, 2), "laptop": (1280, 760, 1)}[kind]
url = pathlib.Path(page_path).resolve().as_uri() + hash_
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", headless=True,
                          args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": vp[0], "height": vp[1]}, device_scale_factor=vp[2])
    pg = ctx.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    pg.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
    pg.goto(url)
    pg.wait_for_timeout(500)
    if js:
        pg.evaluate(js)
    pg.evaluate("window.__f=0;(function c(){window.__f++;requestAnimationFrame(c)})()")
    pg.wait_for_timeout(int(wait * 1000))
    f = pg.evaluate("window.__f")
    pg.screenshot(path=out, timeout=180000)
    print(f"frames/s ~ {f / wait:.1f}")
    for e in errs[:20]:
        print(e)
    b.close()
