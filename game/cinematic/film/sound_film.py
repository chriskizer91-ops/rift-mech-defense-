"""Render the reveal's whole soundtrack offline (headless Chrome, OfflineAudioContext) to a WAV, for checking the mix.

    python3 -I game/cinematic/film/sound_film.py OUT.wav film-m1-first-light.html
"""
import base64
import pathlib
import sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
out = pathlib.Path(sys.argv[1])
url = (ROOT / "builds" / sys.argv[2]).as_uri() + "?rec=320x160"
JS = """async()=>{const b=await window.CIN_AUDIO();const n=b.length,L=b.getChannelData(0),R=b.getChannelData(1);
 const buf=new ArrayBuffer(44+n*4),v=new DataView(buf);const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
 w(0,'RIFF');v.setUint32(4,36+n*4,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);v.setUint32(24,44100,true);
 v.setUint32(28,44100*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*4,true);
 let peak=0;for(let i=0;i<n;i++){const l=L[i],r=R[i];peak=Math.max(peak,Math.abs(l),Math.abs(r));v.setInt16(44+i*4,Math.max(-1,Math.min(1,l))*32767,true);v.setInt16(46+i*4,Math.max(-1,Math.min(1,r))*32767,true);}
 const u=new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return {b64:btoa(s),peak};}"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", headless=True,
                          args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    pg = b.new_page()
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type in ("error", "warning") and "stall" not in m.text else None)
    pg.goto(url)
    pg.wait_for_function("window.CIN && window.CIN.ready", timeout=180000)
    r = pg.evaluate(JS)
    out.write_bytes(base64.b64decode(r["b64"]))
    print("peak", round(r["peak"], 3), out, out.stat().st_size // 1000, "kB")
    for e in errs[:10]:
        print(e)
    b.close()
