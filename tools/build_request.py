"""Turn an image request (.md) into one self-contained HTML page: the reference pictures to attach (each downloadable),
a button that copies the whole request for ChatGPT, and the request itself, readable on a phone.

    python3 tools/build_request.py docs/art-requests/RMD_ROUND1_IMAGE_REQUEST.md
"""
import base64
import html
import io
import pathlib
import re
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
REFS = [  # (file, label, what it is for)
    ("art/reference/wraith/hd_front.png", "wraith_front.jpg", "Wraith, front. Attach for M05."),
    ("art/reference/wraith/hd_side.png", "wraith_side.jpg", "Wraith, side. Attach for M05."),
    ("art/reference/wraith/hd_rear.png", "wraith_rear.jpg", "Wraith, back. Attach for M05."),
    ("art/reference/placeholder/host_sensor.jpg", "host_sensor_now.jpg", "The Host as the placeholder draws it now (sensor view)."),
    ("art/reference/placeholder/host_thermal.jpg", "host_thermal_now.jpg", "The same, thermal view."),
    ("art/reference/placeholder/host_resolving.jpg", "host_resolving_now.jpg", "The reveal: the shape coming through the static."),
]


def b64jpg(path: pathlib.Path, maxw=1400) -> str:
    im = Image.open(path).convert("RGB")
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=86)
    return base64.b64encode(buf.getvalue()).decode()


def inline(t: str) -> str:
    t = html.escape(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"`(.+?)`", r"<code>\1</code>", t)
    return t


def md_to_html(md: str) -> str:
    # join wrapped lines: a non-blank line that is not a new block continues the line before it
    lines, merged, fence = md.splitlines(), [], False
    for ln in lines:
        if ln.startswith("```"):
            fence = not fence
            merged.append(ln)
            continue
        new_block = (not ln.strip() or ln.startswith("#") or ln.strip() == "---"
                     or re.match(r"^\s*(- |\d+\. )", ln))
        if not fence and not new_block and merged and merged[-1].strip() and not merged[-1].startswith(("#", "```")) \
                and merged[-1].strip() != "---":
            merged[-1] = merged[-1].rstrip() + " " + ln.strip()
        else:
            merged.append(ln)
    out, lst, code = [], None, None
    for line in merged:
        if line.startswith("```"):
            if code is None:
                code = []
            else:
                out.append("<pre>" + html.escape("\n".join(code)) + "</pre>")
                code = None
            continue
        if code is not None:
            code.append(line)
            continue
        m = re.match(r"^(\s*)(- \[ \] |- |\d+\. )(.*)", line)
        if m:
            kind = "ol" if m.group(2)[0].isdigit() else "ul"
            if lst != kind:
                if lst:
                    out.append(f"</{lst}>")
                out.append(f"<{kind}>")
                lst = kind
            box = "☐ " if "[ ]" in m.group(2) else ""
            out.append("<li>" + box + inline(m.group(3)) + "</li>")
            continue
        if lst:
            out.append(f"</{lst}>")
            lst = None
        if line.startswith("#"):
            n = len(line) - len(line.lstrip("#"))
            out.append(f"<h{n}>" + inline(line[n:].strip()) + f"</h{n}>")
        elif line.strip() == "---":
            out.append("<hr>")
        elif line.strip():
            out.append("<p>" + inline(line) + "</p>")
    if lst:
        out.append(f"</{lst}>")
    return "\n".join(out)


def build(md_path: pathlib.Path) -> pathlib.Path:
    md = md_path.read_text(encoding="utf-8")
    title = md.splitlines()[0].lstrip("# ").strip()
    cards = []
    for src, name, label in REFS:
        p = ROOT / src
        if not p.exists():
            continue
        data = b64jpg(p)
        cards.append(f'<figure><img src="data:image/jpeg;base64,{data}" alt="{html.escape(label)}">'
                     f'<figcaption>{html.escape(label)}<br><a download="{name}" href="data:image/jpeg;base64,{data}">Save {name}</a></figcaption></figure>')
    page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)}</title>
<style>
body{{margin:0;background:#0b0f0f;color:#dfe9e6;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
main{{max-width:860px;margin:0 auto;padding:18px 16px 60px}}
h1{{font-size:22px;color:#ff5a3c;line-height:1.25}} h2{{font-size:18px;color:#ffb29a;margin-top:30px;border-top:1px solid #23302e;padding-top:16px}}
h3{{font-size:15px;color:#7fd6c2}} code{{background:#16201f;padding:1px 5px;border-radius:3px;font-size:13px}}
pre{{background:#16201f;padding:12px;border-radius:6px;overflow-x:auto;font-size:12px}} hr{{border:0;border-top:1px solid #23302e;margin:26px 0}}
.copy{{position:sticky;top:0;z-index:2;background:#0b0f0fee;padding:10px 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap}}
button{{font:700 14px system-ui,sans-serif;color:#fff;background:#8a1d0e;border:1px solid #ff5a3c;border-radius:6px;padding:11px 16px}}
#ok{{color:#7fd6c2;font-size:13px}}
.refs{{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}}
figure{{margin:0;background:#121a19;border-radius:6px;overflow:hidden}} figure img{{width:100%;display:block;aspect-ratio:1;object-fit:contain;background:#c8c8ca}}
figcaption{{font-size:12px;padding:8px;color:#a9bdb8}} figcaption a{{color:#7fd6c2}}
textarea{{position:absolute;left:-9999px}}
</style></head><body><main>
<div class="copy"><button id="cp">Copy the whole request for ChatGPT</button><span id="ok"></span></div>
<h2 style="border:0;margin-top:6px;padding:0">Reference pictures to attach</h2>
<div class="refs">{''.join(cards)}</div>
{md_to_html(md)}
<textarea id="src">{html.escape(md)}</textarea>
</main><script>
document.getElementById('cp').onclick=async()=>{{const t=document.getElementById('src');let ok=false;
 try{{await navigator.clipboard.writeText(t.value);ok=true;}}catch(e){{t.select();try{{ok=document.execCommand('copy');}}catch(e2){{}}}}
 document.getElementById('ok').textContent=ok?'Copied. Paste it into ChatGPT.':'Copy blocked here: select the text below instead.';}};
</script></body></html>"""
    out = md_path.with_suffix(".html")
    out.write_text(page, encoding="utf-8")
    return out


if __name__ == "__main__":
    for a in sys.argv[1:]:
        o = build(pathlib.Path(a).resolve())
        print(o.relative_to(ROOT), f"{o.stat().st_size / 1e6:.2f} MB")
