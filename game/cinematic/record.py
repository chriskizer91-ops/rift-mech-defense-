"""Record the Signal's reveal to a video file with its soundtrack, with no screen (headless Chrome, software WebGL).

    python3 -I game/cinematic/record.py OUT.mp4 [WxH] [FPS] [FROM_FRAME] [TO_FRAME]

Draws every frame with CIN.frame(i, fps) (held frames stay held, as in the live film), screenshots the stage with its
HUD, then muxes the offline soundtrack (CIN_AUDIO, same as sound.py). FROM/TO let two processes share the work:
a part is written as OUT.partN.mp4 with no sound; run again with no range to join the parts and add the sound.
Other pages: PAGE=film-m1-first-light.html DUR=140 python3 -I game/cinematic/record.py OUT.mp4
"""
import base64
import os
import pathlib
import subprocess
import sys
import tempfile
import time
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
out = pathlib.Path(sys.argv[1])
size = sys.argv[2] if len(sys.argv) > 2 else "1280x640"
fps = int(sys.argv[3]) if len(sys.argv) > 3 else 24
w, h = map(int, size.split("x"))
rng = (int(sys.argv[4]), int(sys.argv[5])) if len(sys.argv) > 5 else None
PAGE = os.environ.get("PAGE", "signal-reveal.html")   # any scene page in builds/ (PAGE=film-m1-first-light.html)
ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
        "--autoplay-policy=no-user-gesture-required"]


def page(p):
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", headless=True, args=ARGS)
    pg = b.new_page(viewport={"width": w, "height": h})
    pg.goto((ROOT / "builds" / PAGE).as_uri() + f"?rec={size}")
    pg.wait_for_function("window.CIN && window.CIN.ready", timeout=180000)
    return b, pg


def frames(a, z, dst):
    """Frames a..z-1 as one silent mp4 (piped straight to ffmpeg as JPEGs)."""
    ff = subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", str(fps), "-c:v", "mjpeg",
                           "-i", "-", "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", str(dst)],
                          stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b, pg = page(p)
        pg.evaluate(f"window.CIN.seek({a},{fps})")
        last, t0 = None, time.time()
        for i in range(a, z):
            r = pg.evaluate(f"window.CIN.frame({i},{fps})")
            if r != "held" or last is None:
                last = pg.screenshot(type="jpeg", quality=92)
            ff.stdin.write(last)
            if i % 120 == 0:
                print(f"frame {i}/{z}  {(i - a + 1) / (time.time() - t0):.2f} fps", flush=True)
        b.close()
    ff.stdin.close()
    ff.wait()


def sound(dst):
    with sync_playwright() as p:
        b, pg = page(p)
        data = pg.evaluate("""async()=>{const buf=await window.CIN_AUDIO();const n=buf.length,L=buf.getChannelData(0),R=buf.getChannelData(1);
          const pcm=new Int16Array(n*2);for(let i=0;i<n;i++){pcm[2*i]=Math.max(-1,Math.min(1,L[i]))*32767;pcm[2*i+1]=Math.max(-1,Math.min(1,R[i]))*32767;}
          let s='';const u=new Uint8Array(pcm.buffer);for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s);}""")
        b.close()
    dst.write_bytes(base64.b64decode(data))


DUR = float(os.environ.get("DUR", "164"))
N = int(round(DUR * fps))
if rng:
    frames(rng[0], min(rng[1], N), out.with_suffix(f".part{rng[0]}.mp4"))
    sys.exit()
parts = sorted(out.parent.glob(out.stem + ".part*.mp4"), key=lambda q: int(q.suffixes[-2][5:]))
with tempfile.TemporaryDirectory() as td:
    td = pathlib.Path(td)
    if not parts:
        frames(0, N, td / "v.mp4")
        parts = [td / "v.mp4"]
    (td / "list.txt").write_text("".join(f"file '{q.resolve()}'\n" for q in parts))
    sound(td / "a.raw")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(td / "list.txt"),
                    "-f", "s16le", "-ar", "44100", "-ac", "2", "-i", str(td / "a.raw"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
                    "-movflags", "+faststart", str(out)], check=True)
print("wrote", out)
