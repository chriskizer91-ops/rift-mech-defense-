# Chapter 1 as a 30-minute film: the groundwork

Christopher said yes on 21 Nov. Session D coordinates the film. This file is the plan; a copy sits in the claude.ai project
("Rift Mech Defense: the film").

## The idea in four lines
- Every piece of the film is a scene in the game: cutscenes between levels, and battle clips.
- Played in order, the pieces make one film of about 31 minutes that makes sense on its own.
- In the game you play the level where a battle clip sits. In the film the clip stands in for it, so the film has the fighting too.
- Everything is rendered 3D in the reveal's look (OVERWATCH's feed: optical, sensor, thermal, the dots, the static). No images needed.
- No clips from video generators: Christopher tested a Gemini clip on 21 Nov and dropped it (it clashes with the style).

## The pieces (target times)
| # | Piece | Where | What happens | Time |
|---|---|---|---|---|
| 00 | Intel Brief 00 **(built, 1:20)** | the feed | what the Static is, what the rifts are, the team of four (lines `BRIEF`) | 1:15 |
| 1a | First Light: arrival | Greywater Strand, dawn | the team lands in REAL view; OVERWATCH switches them to SENSOR | 0:50 |
| 1a–c | First Light **(built as one piece, 2:20)** |
| 1b | First Light: battle | | KNOTs out of the surf; SKEINs go for Gull's boats on the pier | 1:40 |
| 1c | First Light: after | | the beach quiet; the first count goes to zero | 0:20 |
| 2a | High Water: arrival | Port Arlen low town, morning | flooded streets; Lantern's distress call from the cannery | 0:45 |
| 2b | High Water: battle | | wade, hover the canal, hold the roof, escort Lantern out | 2:00 |
| 2c | High Water: after | | Lantern safe; the Lance arrives | 0:30 |
| 3a | The Dig: arrival | Kessel Cut quarry, midday | a rift in the quarry floor; ANVIL comes on the radio for the first time | 0:45 |
| 3b | The Dig: battle | | the rift streams, Tern marks it, ANVIL seals it; the first STALKER; BRUTE eats the wrecks; Lance to the core | 2:00 |
| 3c | The Dig: after | | the quarry steams; BRUTE's dots crawl back to nothing | 0:30 |
| 4a | Landfall: arrival | Port Arlen, dusk | something huge waits offshore | 0:40 |
| 4b | Landfall: battle | | seal the harbour rift; BEHEMOTH, 10,000 dots, comes ashore | 2:15 |
| 4c | Landfall: after | | the Watcher; the harbour burning | 0:30 |
| 5a | Night Shift: arrival | the Saltpans, night | thermal is the only clear view | 0:40 |
| 5b | Night Shift: battle | | STALKER packs at both squads | 1:45 |
| 5c | Night Shift: Copper | | Copper, cut off across the salt channel, turns red (fixed loss) | 0:45 |
| 5d | Night Shift: after | | Reed holds; the team says nothing | 0:30 |
| 6a | The Shelf: arrival | the Drowned Shelf, before dawn | the tide is out; eight minutes | 0:40 |
| 6b | The Shelf: battle | | the Arc's first test; seal rifts A and B; HULK from rift C; the tide comes back | 2:00 |
| 6c | The Shelf: after | | hovering out over the water | 0:20 |
| 7a | The Ridge: arrival | Hollin Ridge, grey day | squads Alder, Birch, Cedar on the crest | 0:45 |
| 7b | The Ridge: battle | | TITAN, 50,000; it splits into four tendrils, reforms; Lance | 2:15 |
| 7c | The Ridge: after | | every contact on the coast turns toward the bay | 0:30 |
| 8a | The Signal's reveal | Arlen Bay, night | **done** (`builds/signal-reveal.html`, 2:44) | 2:44 |
| 8b | The Signal: battle | | the four phases, the clear windows, the last Lance charge | 3:00 |
| 8c | The ending | Arlen Bay | the cost of winning; into chapter 2 (lines `C2`) | 1:15 |
| | | | **Total** (about 17 min of battle, 14 of story) | **31:09** |

## How it's built
- **One scene kit** (session D, before Sunday). The reveal's engine split out of `game/cinematic/cin-main.js`: the timeline,
  shots and cuts, tracks, captions and tags, the radio, the score, held frames, `?rec`, `CIN.seek`, the hand-off back to the
  game. A scene is then one data file: its lines, shots, tracks and sound cues.
- **Each scene is its own page** (`builds/film-<piece>.html`, one self-contained file, offline), like the reveal. The game cuts to
  it and gets control back with `?back=`.
- **Battles are staged** with the real game pieces: B's maps (Field 1, the coast), C's Wraiths, weapons and squads, A's creatures
  as dots. A script drives them, and they're filmed like the reveal. Later the same scripts can replay real play.
- **The film** is every piece recorded with `game/cinematic/record.py` and joined in order, with title cards between missions.

## The scene kit (built 21 Nov)
`game/cinematic/film/`. A scene is one file, `scene-<name>.js`, that hands `FILM.run()` its lines, shots, tracks, sound cues
and a set. `build_film.py <name>` makes `builds/film-<name>.html`. Stills: `shots_film.py`. Sound alone: `sound_film.py`.
Video with sound: `PAGE=<page> DUR=<s> python3 -I game/cinematic/record.py OUT.mp4`.
- **Sets:** `set-strand.js` (Greywater Strand at dawn: beach, surf, pier, boats, the sunk truck), `set-city.js` (a city in
  static; the cracked seafloor from orbit), `set-saltpans.js` (the Saltpans at night, the channel). The reveal's Arlen Bay is
  `cin-world.js`.
- **Battles:** A's creature module drives the swarm (seeded, stepped at 1/60 s, so every run is the same). The Wraiths fire
  by script; every round is logged, and the log drives the tracers, the sand, and the sound.
- **Sound:** `film-sfx.js` adds surf, gulls, boat motors, the autocannon, the dot-shatter fizz, the Lance, the Arc, the view
  switch, and chord instruments (strings, brass, choir, piano) with a battle pulse. Sounds are built about a second before
  they play (Chrome processes every scheduled node, so a battle scheduled up front was 4× too slow to play live).
- **Gotchas found the hard way:** A's swarm writes each dot's brightness for thermal during the sim step, so a still made
  by jumping to a time can look different from the recorded frame (stills now warm up through a few frames first). Thermal
  gain stays at the swarm's own level (1 to 1.6); don't scale it by dot count. A re-rendered stretch goes into a finished
  video with `splice.py` (frames N..M, sound untouched). Keep buildings off the line between a camera and the boss.
- **Test scenes:** `brief` (Intel Brief 00, 1:20, narrated montage), `m1` (First Light, 2:20, battle), `m5c` (Copper, 1:02,
  the quiet loss; the dots turn red on OVERWATCH's words "Two. Five. All of them.").
  `m3` (The Dig, 2:52, boss fight: the rift streams until ANVIL caves it in, BRUTE eats the trucks, thermal finds the core,
  the Lance). Sets: `set-quarry.js` (Kessel Cut).
  `m4` (Landfall, 2:55: BEHEMOTH fed by the harbour rift, comes ashore through the cannery; set `set-portarlen.js`),
  `m7` (The Ridge, 3:00: TITAN, 50,000, fire only on the lock, four tendrils go for the squads; set `set-ridge.js`).

## What each session needs to give (asks on the board)
- **A (creatures):** spawn a creature at a point with a goal or a path, and step it by a fixed time step with a seed, so a run
  is the same every time.
- **B (world):** load Field 1 or the coast into a scene the kit owns, with `heightAt` and `depthAt`, and no live input.
- **C (mech):** drive the Wraiths and squads from a script: walk to, aim at, fire weapon X at time t, hover, go down, revive;
  same result every run. ANVIL barrages on a cue.

## Voices
- The 189 takes cover the radio in the battles and the reveal.
- New lines for the arrivals, afters and the ending: about 100, written into `docs/story/voice/lines.txt` (ids `F1A_OW_01` and so
  on), marked FILM on the voice sheet, with the frightened tags that worked for the re-takes.
- Order: D writes the script → Christopher approves → the voice sheet → Christopher records → the scenes are built.

## Sunday: the crew
| Session | Pieces | Owns |
|---|---|---|
| D | the kit, 8b, 8c, title cards, the edit and the final mix | `game/cinematic/`, `docs/story/` |
| F1 | 00, 1a–1c, 2a–2c | `game/cinematic/scenes/m1/`, `m2/` |
| F2 | 3a–3c, 4a–4c | `game/cinematic/scenes/m3/`, `m4/` |
| F3 | 5a–5d, 6a–6c | `game/cinematic/scenes/m5/`, `m6/` |
| F4 | 7a–7c | `game/cinematic/scenes/m7/` |
Briefs go in `docs/sessions/F1_film.md` to `F4_film.md` once the kit exists. Each session renders its own pieces.

## Time and cost (honest numbers from the reveal)
- Rendering: about 22 minutes per film minute on one session (2 cores, software WebGL). 31 minutes ≈ 11.5 hours, about
  2.5 hours each across five sessions. Rendering is cheap: it's mostly waiting.
- Writing and fixing scenes is the expensive part. The 2:44 reveal took most of two days. A rough cut of all 31 minutes on
  Sunday is a stretch goal. Two or three days is more likely for a finished film.
- Videos stay out of git (100 MB a file). Each piece is about 25 MB a minute at the reveal's quality; the full film is about
  750 MB. They're delivered in the chat, mission by mission, or through Google Drive.

## Before Sunday (in order)
1. D: the film script, scene by scene (who speaks, what we see), for Christopher to approve.
2. D: the new lines on the voice sheet.
3. D: the scene kit, with the reveal moved onto it to prove it.
4. A, B, C: director mode (asks on the board).
5. D: the four F briefs.
