# docs/story: chapter 1 working notes (session D)

**The design document is the Claude Doc:** https://claude.ai/artifact/V1djsBJe18UKgnxKdYQEmR
(lore, cast, the loop, the eight missions, the ally beats, the Signal fight, Intel Brief 00, upgrades, open questions).
Christopher answered its open questions on 20 Nov, evening (`docs/PLAN.md`). New proposals still go in the doc first.

| File | What it holds |
|---|---|
| `waves.md` | Every wave of chapter 1 as a table: creature counts, dots, minutes, special rules. For session C to balance. |
| `chapter1-waves.json` | The same waves as data, so a mission runner can load them. |
| `voice/lines.txt` | **The source of every voiced line** (179). Edit this, then run `python3 docs/story/voice/build.py`. |
| `voice/cast.json` | The 8 voices: ElevenLabs Voice Design prompts, preview text, notes. |
| `voice/voice-script.html` | The voice-acting sheet Christopher uses in ElevenLabs (built; also at https://claude.ai/artifact/JWs89obwrg8BgbAXbLpaKU). |
| `radio.md` | The same lines as plain text, with file IDs (built: don't edit by hand). |

## In one screen
- 8 missions, about 64 minutes on Medium. Waves of 2 to 5 minutes, a checkpoint at every wave and boss phase.
- Bosses: BRUTE 500 (mission 3), BEHEMOTH 10,000 (4), TITAN 50,000 (7), the Signal 1,000,000 (8).
- Kit by story: Lance after 2, ANVIL from 3, Watcher after 4, Arc after 5, drone after 6, long hover after 7.
- Lantern is rescued in mission 2. In mission 5 Copper is cut off across a salt channel and turns red (fixed loss, decided).
- The Signal: seal 4 rifts (−100,000 each), survive its forms, fire in the sensor's clear windows, then a full Lance
  charge into the core in a 4-second window OVERWATCH holds open at a cost to itself.

## Numbers other sessions will need (targets, C sets the real ones)
- Core hits do 10× damage. A rift takes 2 barrages on Medium (Easy 1, Hard 3); shells land 20 s after the call.
- Barrages vary by mission (decided); start from 3 a mission, +1 per living squad. Holding aim 1.5 s marks a target; a squad within 40 m marks at once.
- A lost squad adds +200 dots to the nearest cluster (+25,000 in the Signal fight).
- Clear windows near big clusters: 1.0 s every ~3.5 s, +0.15 s per SENSOR level (the SENSOR track is there from the start); Easy ×1.4, Hard ×0.8.
- Audio: line files are named by ID, lower case (`m5_09_copper.mp3`), recorded dry; the game adds the radio sound and static.
- Scrap targets by mission: 300, 600, 1,000, 2,500, 1,200, 2,000, 3,500, +150 per squad brought home (12,600 by the bay).
