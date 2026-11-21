# game/cinematic: the Signal's reveal (session D)

The one cinematic of chapter 1 (decided 20 Nov, night): 2 min 30, three acts, twenty shots, rendered live in three.js and
timed exactly, with Christopher's ElevenLabs takes on the radio.

| Act | Time | What happens |
|---|---|---|
| Arrival | 0:00–0:38 | down through the rain onto Arlen Bay; the team walks the harbour wall; Harrow, Miller, Wren and ANVIL check in on the tactical map; "Copy." |
| The reveal | 0:38–1:39 | the count climbs, the sensor chokes, "It's one mass", three clear seconds, ANVIL, "The Signal." |
| First contact | 1:39–2:30 | four rifts feed it; ANVIL's barrage seals rift 4 (−100,000); it rises, comes ashore, slams the water; "Here it comes." |

The fight that follows starts at **900,000 dots with three rifts left**.
It is its own page. The game cuts to it and gets control back at the end.

```
python3 game/cinematic/build.py                          # -> builds/signal-reveal.html (one file, works offline)
python3 -I game/cinematic/shots.py OUTDIR 24 83 121.5   # stills at those seconds (headless)
python3 -I game/cinematic/sound.py OUT.wav               # the whole soundtrack, rendered offline (to check the mix)
```

## The hand-off (for whoever builds mission 8)
```js
// in the game, when the Wraith reaches the harbour wall:
location.href = 'signal-reveal.html?back=' + encodeURIComponent(location.pathname + '#m8-fight');
// the page plays (tap to start: browsers need a tap before sound), then goes to `back`. SKIP goes there too.
// on load the game reads its hash (#m8-fight) and starts phase 1 of the Signal fight.
```
On GitHub Pages both pages sit in `builds/`, so `back` can be a plain relative path. Without `?back=` the end card offers REPLAY.

## The voices
All 189 takes are in `audio/voice/` (20 Nov). The film uses 24 of them (`LINES` in `cin-main.js`, timed to each take: every
file starts with about 0.5 s of silence). The build inlines the ones `LINES` names and plays each through the radio.

## The mix
Three buses (music, effects, voices) into a glue compressor, a brick-wall limiter and a soft clip. The music and effects
duck under every line. Checked offline: no clipping, peaks at 0.85, quiet arrival and reveal, loudest in the drums before the slam.

## The radio (static on the voices, decided)
`RMD.RadioVoice(ctx, out)` in `cin-audio.js` puts a clean take on the radio: 300 Hz to 3.3 kHz, a little drive, squelch
clicks, a hiss bed, and with `strain` (0 to 1) dropouts and bursts of static. `radio.play(buffer, when, {strain})`. The game
can use the same chain for every radio line.

## Files
| File | What it does |
|---|---|
| `cin-main.js` | the film: shots, the tracks every number comes from, HUD and captions, held frames, sound cues, the hand-off, `?rec=` |
| `cin-signal.js` | the million-dot Signal (session A's viewer, copied and made scriptable), the rift columns, the team's green dots |
| `cin-fx.js` | ANVIL's muzzle flashes and smoke, the shells' tracers, blasts and spray on the water, the slam's shock ring |
| `cin-world.js` | Arlen Bay at night: sky, water with magma under it, harbour wall, lamps, cranes, lighthouse, the ridge and ANVIL's guns, drizzle |
| `cin-wraith.js` | the four Wraiths (Ironhowl 4's model and kit; legs from session B's `wt-mech.js`) |
| `cin-look.js` | the feed: world + threat overlay, bloom, sensor/thermal, interference, the clear three seconds |
| `cin-audio.js` | the score and effects (all synthesised) and the radio chain |
| `signal-reveal.src.html` | the page: HUD, captions, start and end cards |

## Recording to video (next step, not done)
`?rec=1920x960` renders without a clock; `window.CIN.frame(i, 30)` draws frame i at 30 fps (held frames report `'held'`).
A recorder can step through 4,500 frames and encode them with ffmpeg if a video file is ever wanted.
