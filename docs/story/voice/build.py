#!/usr/bin/env python3
"""Build the voice-acting sheet and the radio script from one source.

    python3 docs/story/voice/build.py

Reads  docs/story/voice/lines.txt and docs/story/voice/cast.json
Writes docs/story/voice/voice-script.html (one self-contained page, phone first)
       docs/story/radio.md                (the same lines as plain text)
"""
import html, json, re, pathlib

HERE = pathlib.Path(__file__).resolve().parent
STORY = HERE.parent

# Which designed voice speaks for each character in lines.txt
VOICE_OF = {
    'OVERWATCH': 'OW', 'PILOT': 'PILOT', 'ANVIL': 'ANVIL',
    'GULL': 'SQ1', 'TERN': 'SQ1', 'ALDER': 'SQ1', 'WREN': 'SQ1',
    'LANTERN': 'SQ2', 'BIRCH': 'SQ2', 'MILLER': 'SQ2',
    'SLATE': 'SQ3', 'REED': 'SQ3', 'BRAMBLE': 'SQ3',
    'PIKE': 'SQ4', 'CEDAR': 'SQ4', 'HARROW': 'SQ4',
    'COPPER': 'SQ5',
}
SHORT = {'OVERWATCH': 'OW'}


def parse():
    sections, cur = [], None
    for raw in (HERE / 'lines.txt').read_text(encoding='utf-8').splitlines():
        line = raw.rstrip()
        if not line or line.startswith('#') and not line.startswith('##'):
            continue
        if line.startswith('## '):
            sid, title, where = [p.strip() for p in line[3:].split('|')]
            cur = {'id': sid, 'title': title, 'where': where, 'items': [], 'n': 0}
            sections.append(cur)
        elif line.startswith('> '):
            cur['items'].append({'dir': line[2:].strip()})
        else:
            m = re.match(r'([A-Z]+):\s*(.*)$', line)
            if not m:
                raise SystemExit(f'cannot read: {raw!r}')
            who, rest = m.groups()
            text, _, note = rest.partition('  // ')
            if who not in VOICE_OF:
                raise SystemExit(f'no voice for {who}')
            cur['n'] += 1
            lid = f"{cur['id']}_{cur['n']:02d}_{SHORT.get(who, who)}"
            cur['items'].append({'id': lid, 'who': who, 'voice': VOICE_OF[who], 'text': text.strip(), 'note': note.strip()})
    return sections


def spoken(text):
    """The words without the [tags], for the plain radio script."""
    return re.sub(r'\s*\[[^\]]+\]\s*', ' ', text).strip()


def write_radio(sections):
    out = ['# Chapter 1 radio script', '',
           'Made by `docs/story/voice/build.py` from `docs/story/voice/lines.txt`: edit that file, not this one.',
           'Voices and ElevenLabs prompts: `docs/story/voice/voice-script.html`.',
           'Design doc: https://claude.ai/artifact/V1djsBJe18UKgnxKdYQEmR', '']
    for s in sections:
        out += [f"## {s['title']}", f"*{s['where']}*", '']
        for it in s['items']:
            if 'dir' in it:
                out.append(f"- *{it['dir']}*")
            else:
                note = f"  ({it['note']})" if it['note'] else ''
                out.append(f"- `{it['id']}` **{it['who']}:** \"{spoken(it['text'])}\"{note}")
        out.append('')
    (STORY / 'radio.md').write_text('\n'.join(out), encoding='utf-8')


def esc(s):
    return html.escape(s, quote=True)


def tagged(text):
    return re.sub(r'(\[[^\]]+\])', r'<span class="tag">\1</span>', esc(text))


def write_html(sections, cast):
    lines = [it for s in sections for it in s['items'] if 'id' in it]
    count = {}
    for it in lines:
        count[it['voice']] = count.get(it['voice'], 0) + 1
    chars_of = {}
    for who, v in VOICE_OF.items():
        chars_of.setdefault(v, []).append(who.title())

    cards = []
    for key, c in cast.items():
        vkey = 'PILOT' if key=='PILOT' else key
        n = count.get(vkey, 0)
        cards.append(f'''<section class="card" data-voice="{vkey}">
<h3>{esc(c['name'])} <span class="n">{n} lines</span></h3>
<p class="role">{esc(c['role'])}</p>
<div class="lab">Voice Design prompt <button class="cp" data-t="{esc(c['prompt'])}">Copy</button></div>
<p class="box">{esc(c['prompt'])}</p>
<div class="lab">Preview text <button class="cp" data-t="{esc(c['preview'])}">Copy</button></div>
<p class="box">{esc(c['preview'])}</p>
<p class="meta">Guidance scale: {esc(c['guidance'])}. Save as: <b>RMD {esc(c['name'].split(' (')[0].title() if not key.startswith('SQ') else 'Squad ' + key[2:])}</b></p>
{f'<p class="meta">{esc(c["notes"])}</p>' if c['notes'] else ''}
</section>''')

    rows = []
    for s in sections:
        rows.append(f'<h2 id="{s["id"]}">{esc(s["title"])}<small>{esc(s["where"])}</small></h2><div class="lines">')
        for it in s['items']:
            if 'dir' in it:
                rows.append(f'<div class="dir">{esc(it["dir"])}</div>')
            else:
                note = f'<div class="note">{esc(it["note"])}</div>' if it['note'] else ''
                rows.append(f'''<div class="ln" data-voice="{it['voice']}"><div class="hd"><code>{it['id']}</code><b class="v-{it['voice']}">{esc(it['who'])}</b>
<button class="cp" data-t="{esc(it['text'])}">Copy</button></div><div class="tx">{tagged(it['text'])}</div>{note}</div>''')
        rows.append('</div>')

    chips = ''.join(f'<button class="chip" data-f="{v}">{esc(lbl)} <span>{count.get(v, 0)}</span></button>'
                    for v, lbl in [('OW', 'OVERWATCH'), ('PILOT', 'Pilot'), ('ANVIL', 'ANVIL'), ('SQ1', 'Squad 1'),
                                   ('SQ2', 'Squad 2'), ('SQ3', 'Squad 3'), ('SQ4', 'Squad 4'), ('SQ5', 'Squad 5')])
    toc = ' · '.join(f'<a href="#{s["id"]}">{esc(s["title"])}</a>' for s in sections)

    page = f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rift Mech Defense: voice-acting sheet, chapter 1</title>
<style>
:root{{--bg:#0b0f0d;--panel:#131a16;--line:#24312a;--ink:#e6efe9;--quiet:#93a69a;--green:#4fe08a;--red:#ff5a4e;--amber:#f2b84b}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}}
main{{max-width:860px;margin:0 auto;padding:16px 14px 80px}}
h1{{font-size:22px;margin:8px 0 4px}}h2{{scroll-margin-top:150px;font-size:18px;margin:34px 0 10px;padding-top:8px;border-top:1px solid var(--line)}}
h2 small{{display:block;font-size:13px;font-weight:400;color:var(--quiet)}}h3{{font-size:16px;margin:0 0 4px}}
.lead{{color:var(--quiet);margin:0 0 14px}}a{{color:var(--green)}}
ol.steps{{padding-left:20px;margin:8px 0}}ol.steps li{{margin:6px 0}}
.panel{{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin:12px 0}}
.panel h3{{color:var(--green)}}.panel ul{{margin:6px 0;padding-left:18px}}
.card{{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin:10px 0}}
.card .n{{font-size:12px;font-weight:400;color:var(--quiet);margin-left:6px}}.role{{color:var(--quiet);margin:0 0 8px}}
.lab{{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--quiet);display:flex;align-items:center;gap:8px;margin-top:8px}}
.box{{background:#0e1411;border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin:4px 0}}
.meta{{font-size:13px;color:var(--quiet);margin:6px 0 0}}
.filters{{position:sticky;top:0;background:var(--bg);padding:8px 0;z-index:2;display:flex;flex-wrap:wrap;gap:6px;border-bottom:1px solid var(--line)}}
.chip{{background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:999px;padding:6px 10px;font:inherit;font-size:13px}}
.chip span{{color:var(--quiet)}}.chip.on{{border-color:var(--green);color:var(--green)}}
.ln{{border-bottom:1px solid var(--line);padding:9px 0}}.hd{{display:flex;align-items:center;gap:8px;flex-wrap:wrap}}
.hd code{{font-size:12px;color:var(--quiet)}}.hd b{{font-size:13px;letter-spacing:.04em}}.hd .cp{{margin-left:auto}}
.tx{{margin:3px 0 0;font-size:16px}}.tag{{color:var(--amber)}}.note{{font-size:13px;color:var(--quiet);font-style:italic}}
.dir{{color:var(--quiet);font-style:italic;font-size:14px;padding:8px 0 4px}}
.cp{{background:transparent;color:var(--green);border:1px solid var(--line);border-radius:6px;padding:3px 9px;font:inherit;font-size:12px}}
.cp.ok{{color:var(--ink);border-color:var(--green)}}
.v-OW{{color:var(--green)}}.v-PILOT{{color:#8fd3ff}}.v-ANVIL{{color:var(--amber)}}
.v-SQ1,.v-SQ2,.v-SQ3,.v-SQ4,.v-SQ5{{color:#c7e6d2}}
.hide{{display:none}}.toc{{font-size:13px;color:var(--quiet)}}
</style></head><body><main>
<h1>Voice-acting sheet: chapter 1</h1>
<p class="lead">Rift Mech Defense. {len(lines)} lines, 8 designed voices. Every line has an ID: name its audio file after it.</p>

<div class="panel"><h3>How to make it in ElevenLabs</h3><ol class="steps">
<li><b>Design each voice once.</b> Voices → My Voices → Add a new voice → Voice Design. Paste the voice's prompt, paste its preview text, set the guidance scale shown, generate, and save the best of the three.</li>
<li><b>Generate the lines</b> in Text to Speech with <b>Eleven v4</b> (or v3). Paste each line exactly as written, [tags] included: they set the delivery and aren't spoken. Ellipses add pauses; CAPITALS add stress.</li>
<li><b>Keep every take dry and clean.</b> No radio, crackle or echo in ElevenLabs: the game puts the radio sound and the static over every line itself (decided). Leave about half a second of silence at each end.</li>
<li><b>Save each file as its ID</b>, lower case, MP3 44.1 kHz: <code>m5_09_copper.mp3</code>. Lines marked "3 takes" get <code>_a</code>, <code>_b</code>, <code>_c</code>.</li>
<li><b>Work one voice at a time:</b> tap a voice below to show only its lines.</li>
</ol>
<ul class="meta"><li>Stability: use Creative or Natural so the tags work; Robust follows them less.</li>
<li>Speed: leave at 1.0. OVERWATCH's fast lines are fast in the writing.</li>
<li>If a tag gets spoken aloud, cut it in editing or try the take again.</li>
<li>Squads are fresh each mission, so five squad voices cover all fourteen squads.</li></ul></div>

<h2 id="cast">The voices<small>What each one sounds like</small></h2>
{''.join(cards)}

<h2 id="lines">The lines<small class="toc">{toc}</small></h2>
<div class="filters"><button class="chip on" data-f="ALL">All <span>{len(lines)}</span></button>{chips}</div>
{''.join(rows)}
<p class="meta">Built from <code>docs/story/voice/lines.txt</code> by <code>build.py</code>. Design doc: <a href="https://claude.ai/artifact/V1djsBJe18UKgnxKdYQEmR">chapter 1</a>.</p>
</main>
<script>
document.addEventListener('click',e=>{{const b=e.target.closest('.cp');if(b){{const t=b.dataset.t;
 const ok=()=>{{b.classList.add('ok');b.textContent='Copied';setTimeout(()=>{{b.classList.remove('ok');b.textContent='Copy'}},1200)}};
 try{{navigator.clipboard.writeText(t).then(ok,()=>fall(t,ok))}}catch(_){{fall(t,ok)}}return}}
 const c=e.target.closest('.chip');if(c){{const f=c.dataset.f;document.querySelectorAll('.chip').forEach(x=>x.classList.toggle('on',x===c));
 document.querySelectorAll('.ln').forEach(l=>l.classList.toggle('hide',f!=='ALL'&&l.dataset.voice!==f));
 document.querySelectorAll('.dir').forEach(d=>d.classList.toggle('hide',f!=='ALL'));}}}});
function fall(t,ok){{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{{document.execCommand('copy');ok()}}catch(_){{}}a.remove()}}
</script></body></html>'''
    (HERE / 'voice-script.html').write_text(page, encoding='utf-8')
    return len(lines), count


if __name__ == '__main__':
    secs = parse()
    write_radio(secs)
    n, count = write_html(secs, json.loads((HERE / 'cast.json').read_text(encoding='utf-8')))
    print(n, 'lines', count)
