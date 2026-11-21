# game/cinematic: the Signal's reveal (session D)

The one cinematic of chapter 1 (decided 20 Nov, night): 56 seconds, ten shots, rendered live in three.js and timed exactly.
It is its own page. The game cuts to it and gets control back at the end.

```
python3 game/cinematic/build.py                          # -> builds/signal-reveal.html (one file, works offline)
python3 -I game/cinematic/shots.py OUTDIR 2.5 33.5 38.5  # stills at those seconds (headless)
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
Put the ElevenLabs takes in `audio/voice/`, named by the ids on the voice-acting sheet, lower case:
`c1_01_ow.mp3` … `c1_10_pilot.mp3` (the reveal's ten lines). Run the build; it inlines whatever it finds and plays each one
through the radio chain at its time. Without them the film plays with captions.

## The radio (static on the voices, decided)
`RMD.RadioVoice(ctx, out)` in `cin-audio.js` puts a clean take on the radio: 300 Hz to 3.3 kHz, a little drive, squelch
clicks, a hiss bed, and with `strain` (0 to 1) dropouts and bursts of static. `radio.play(buffer, when, {strain})`. The game
can use the same chain for every radio line.

## Files
| File | What it does |
|---|---|
| `cin-main.js` | the film: shots, the tracks every number comes from, HUD and captions, held frames, sound cues, the hand-off, `?rec=` |
| `cin-signal.js` | the million-dot Signal (session A's viewer, copied and made scriptable), the rift columns, the team's green dots |
| `cin-world.js` | Arlen Bay at night: sky, water with magma under it, harbour wall, lamps, cranes, lighthouse, the ridge and ANVIL's guns, drizzle |
| `cin-wraith.js` | the four Wraiths (Ironhowl 4's model and kit; legs from session B's `wt-mech.js`) |
| `cin-look.js` | the feed: world + threat overlay, bloom, sensor/thermal, interference, the clear three seconds |
| `cin-audio.js` | the score and effects (all synthesised) and the radio chain |
| `signal-reveal.src.html` | the page: HUD, captions, start and end cards |

## Recording to video (next step, not done)
`?rec=1920x960` renders without a clock; `window.CIN.frame(i, 30)` draws frame i at 30 fps (held frames report `'held'`).
A recorder can step through 1,680 frames and encode them with ffmpeg if a video file is ever wanted.
