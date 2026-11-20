"""Turn a 'directions' prompt file (.md with a '## Shared part' and '## A: …' sections) into one phone page:
one card per direction with COPY PROMPT (shared part + that direction) and COPY THERMAL FOLLOW-UP, plus reference pictures.

    python3 tools/build_directions.py docs/art-requests/RMD_HOST_DIRECTIONS.md
"""
import base64
import html
import io
import pathlib
import re
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
REFS = [("art/reference/placeholder/brute_th.jpg", "The 500 BRUTE on thermal: the look to carry up to the Host."),
        ("art/reference/placeholder/brute_ag_th.jpg", "The BRUTE attacking, thermal."),
        ("art/reference/placeholder/host_thermal.jpg", "The Host as reworked on 20 Nov: a heap of brute-sized clumps. A placeholder until a direction is picked.")]


def jpg64(p, maxw=900):
    im = Image.open(p).convert("RGB")
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, "JPEG", quality=84)
    return base64.b64encode(b.getvalue()).decode()


def paras(t):
    t = re.sub(r"\n(?!\n)", " ", t.strip())
    return "".join(f"<p>{html.escape(x.strip())}</p>" for x in t.split("\n\n") if x.strip())


def build(md_path):
    md = md_path.read_text(encoding="utf-8")
    title = md.splitlines()[0].lstrip("# ").strip()
    secs = re.split(r"^## ", md, flags=re.M)
    how = next(s for s in secs if s.startswith("For Christopher"))
    shared = next(s for s in secs if s.startswith("Shared part")).split("\n", 1)[1].split("\n---")[0].strip()
    dirs = [s for s in secs if re.match(r"^[A-Z]: ", s)]
    def inl(t):
        t = html.escape(re.sub(r"\s+", " ", t))
        return re.sub(r"`(.+?)`", r"<code>\1</code>", re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t))
    how_items = "".join(f"<li>{inl(m)}</li>" for m in re.findall(r"^\d+\. (.+(?:\n   .+)*)", how, flags=re.M))
    how_items = re.sub(r"\s+", " ", how_items)
    cards, data = [], {}
    for d in dirs:
        head, body = d.split("\n", 1)
        letter = head[0]
        body = body.split("\n---")[0].strip()
        thermal = ""
        m = re.search(r'Thermal: "(.+)"', body, flags=re.S)
        if m:
            thermal = re.sub(r"\s+", " ", m.group(1)).strip()
            body = body[:m.start()].strip()
        prompt = re.sub(r"\n(?!\n)", " ", shared) + "\n\n" + re.sub(r"\n(?!\n)", " ", body)
        data[letter] = {"p": prompt, "t": thermal}
        cards.append(f'<section><h2>{html.escape(head)}</h2>{paras(body)}'
                     f'<div class="b"><button data-k="{letter}" data-w="p">Copy prompt {letter}</button>'
                     f'<button class="alt" data-k="{letter}" data-w="t">Copy thermal follow-up</button><span class="ok"></span></div></section>')
    refs = "".join(f'<figure><img src="data:image/jpeg;base64,{jpg64(ROOT / p)}" alt=""><figcaption>{html.escape(c)}</figcaption></figure>'
                   for p, c in REFS if (ROOT / p).exists())
    import json
    page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title><style>
body{{margin:0;background:#0b0f0f;color:#dfe9e6;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
main{{max-width:760px;margin:0 auto;padding:18px 16px 60px}} h1{{font-size:21px;color:#ff5a3c;line-height:1.25}}
h2{{font-size:18px;color:#ffb29a;margin:0 0 6px}} section{{background:#121a19;border:1px solid #23302e;border-radius:8px;padding:14px;margin:14px 0}}
.b{{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px}}
button{{font:700 14px system-ui,sans-serif;color:#fff;background:#8a1d0e;border:1px solid #ff5a3c;border-radius:6px;padding:10px 14px}}
button.alt{{background:#0a2c24;border-color:#4fe0b8}} .ok{{color:#7fd6c2;font-size:13px}}
.refs{{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}} figure{{margin:0}} figure img{{width:100%;display:block;border-radius:6px}}
figcaption{{font-size:11px;color:#a9bdb8;margin-top:4px}} details{{margin:10px 0;color:#a9bdb8}} summary{{color:#7fd6c2}}
ol{{padding-left:20px}} code{{background:#16201f;padding:1px 4px;border-radius:3px;font-size:13px}}
</style></head><body><main><h1>{html.escape(title)}</h1>
<ol>{how_items}</ol>
<div class="refs">{refs}</div>
<details><summary>The shared part (included in every Copy prompt)</summary>{paras(shared)}</details>
{''.join(cards)}
</main><script>
const D={json.dumps(data)};
document.querySelectorAll('button[data-k]').forEach(b=>b.onclick=async()=>{{const t=D[b.dataset.k][b.dataset.w];const ok=b.parentNode.querySelector('.ok');
 try{{await navigator.clipboard.writeText(t);ok.textContent='Copied';}}catch(e){{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();
 let r=false;try{{r=document.execCommand('copy');}}catch(e2){{}}a.remove();ok.textContent=r?'Copied':'Copy blocked: long-press the text instead';}}}});
</script></body></html>"""
    out = md_path.with_suffix(".html")
    out.write_text(page, encoding="utf-8")
    return out


if __name__ == "__main__":
    for a in sys.argv[1:]:
        o = build(pathlib.Path(a).resolve())
        print(o.relative_to(ROOT), f"{o.stat().st_size / 1e6:.2f} MB")
