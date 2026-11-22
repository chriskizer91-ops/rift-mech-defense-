"""Stills of the Signal's reveal at chosen times, with no screen (headless Chrome, software WebGL).

    python3 -I game/cinematic/film/shots_film.py OUTDIR film-m1-first-light.html 2.5 8 15 ...      # times in seconds; writes OUTDIR/t02.5.png ...

Opens builds/signal-reveal.html?rec=1280x640, waits for it to load, then draws each time with CIN.at(t).
"""
import pathlib
import sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
out = pathlib.Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
times = [float(a) for a in sys.argv[3:]] or [2.5]
url = (ROOT / "builds" / sys.argv[2]).as_uri() + "?rec=1280x640"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", headless=True,
                          args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1280, "height": 640})
    errs = []
    pg.on("console", lambda m: errs.append(f"{m.type}: {m.text}") if m.type in ("error", "warning") else None)
    pg.on("pageerror", lambda e: errs.append(f"pageerror: {e}"))
    pg.goto(url)
    pg.wait_for_function("window.CIN && window.CIN.ready", timeout=180000)
    for t in times:
        pg.evaluate(f"window.CIN.at({max(0,t-.3)});window.CIN.at({max(0,t-.15)});window.CIN.at({t})")   # warm up: some state (the swarm's thermal brightness) is written during the sim step
        pg.wait_for_timeout(150)
        pg.screenshot(path=str(out / f"t{t:04.1f}.png"))
        print("shot", t)
    for e in errs[:20]:
        print(e)
    b.close()
