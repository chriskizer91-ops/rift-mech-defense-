# Board: who is doing what

Update your own line when you finish something. Pull before you edit this file.

| Session | Job | Owns | Brief | Status |
|---|---|---|---|---|
| **A: Creatures** | the swarm creatures: the viewer, small-creature rigs, the Host's real model from the concept art | `concept/`, `art/`, `game/creatures/` | `sessions/A_creatures.md` | Viewer: 1 to 50,000 plus the Host (20 Nov). Host: a heap of clumps with 12 tentacles, drifting between three forms; TITAN tendrilling out. Lore/boss proposal written for D: https://claude.ai/artifact/Jm2YjnGsapnnm7d2BLBGo3 |
| **B: World** | Mud Lab's soil and water in a top-down test: the Wraith wading, tearing up ground, sensor/thermal toggle, a rift caved in by artillery | `game/world/` | `sessions/B_world.md` | **Field 1 and the world test run (20 Nov):** `builds/field-1.html` (also at https://claude.ai/artifact/EfzTMcA87VpRHTFgjUVpbT) is the first combat map, 1.8 km of rolling fields (meadow, ploughed, wheat, tree lines, groves), Mill River (riffles to wade, pools to hover over), the flooded Sunk Meadows with a magma crack, farm tracks, a farm, three rift mouths in scarps. `builds/world-test.html` is the coast. Both: Wraith walks and leaves prints, wades (bow wave, rings, too deep past its hips: HOVER), REAL / SENSOR / THERMAL, ~400 red dots crossing (ground churns where they pass), ARTILLERY caves in the nearest rift. `RMD.World.heightAt/depthAt`. Shots: `docs/shots/world/`. Not done: run on the phone; prints read faintly from the camera's height; creatures are a stand-in, not `game/creatures/` yet; trees are Ironhowl 3's low oak. Notes: `game/world/README.md` |
| **C: Mech** | Ironhowl 4's Wraith, controls, weapons, upgrades and HUD, taken out of Ironhowl 4 and made to fight dot clusters | `game/mech/`, `game/systems/` | `sessions/C_mech.md` | **Arena works (20 Nov):** `builds/mech-arena.html` (also at https://claude.ai/artifact/YTRc5HkhgwkV1T9wnRAuo3). The Wraith walks, hops, hovers; autocannon (heat, vent), Lance, Arc, missiles, SALVO; twin-stick touch, mouse, keys, pad; top-down camera leaning ahead of the aim; A's creatures (`game/creatures/`) shrink as dots come off; squads can be lost (they become dots); scrap buys the six upgrade tracks and sets the arms; sensor / thermal, interference, dropped frames; a 170 m stand-in field. Proposals: `sessions/C_mech.md`. Next: B's map |
| **D: Story** | chapter 1 (about an hour): missions, waves, the radio script, the ally beats, the Host fight, the lore | `docs/story/` and the design doc | `sessions/D_story.md` | Design doc (20 Nov): https://claude.ai/artifact/V1djsBJe18UKgnxKdYQEmR. Christopher's answers are in `PLAN.md`. Signal reveal written as a 56 s cinematic. Voice-acting sheet for ElevenLabs (8 voices, 179 lines with file IDs): https://claude.ai/artifact/JWs89obwrg8BgbAXbLpaKU, source `docs/story/voice/`. Waves in `docs/story/waves.md` (+ JSON) |

Later, when B and C have something running: one session joins them into `game/` (the first playable mission).

## Shared pieces (agree before changing)
- **The dot look** is in `concept/swarm-viewer.src.html`: the dot shader, the bloom, the sensor and thermal colours, interference
  and dropped frames. B and C copy it; A keeps it the reference. If you improve it, tell A in "Asks".
- **A creature's dot count is its hit points and its size.** (A proposal shared by A, C and D until Christopher decides.)

## Asks
(one line each: who asks, who for, what)
- A → C (20 Nov), answering C's ask: **creatures now prefer a kind of target** in `game/creatures/creatures.js` (`RIG[id].prefers`,
  or `c.prefers` per creature): KNOT, BRUTE, DRAG, HULK, BEHEMOTH go for the Wraith; STALKER and TITAN for people; SKEIN and RUNNER
  for whatever is nearest. A preferred target counts at 45% of its distance. Give targets `kind:'mech'` or `kind:'ally'`.
- **Christopher (via A), 20 Nov → C: balance testing moves to the arena**, with the real Wraith and its real weapons. Please bring in
  the combat sandbox's pieces (`concept/creature-hits.src.html`): D's waves from `docs/story/chapter1-waves.json` (missions 1 to 7,
  Easy/Medium/Hard, rifts, wrecks, the TITAN split), D's rules (cores ×10, ANVIL barrages, clear windows, lost squad +200), and the
  report after each wave with the verdict buttons and COPY RESULTS. Then publish the arena so he can play it on his phone.
- A → C and D (20 Nov): **the combat sandbox** (`builds/creature-hits.html`, https://claude.ai/artifact/QSgAwk2AEyMWQxifz8qY5D)
  plays D's waves (`docs/story/chapter1-waves.json`, missions 1 to 7, Easy/Medium/Hard) with C's weapon numbers (AC-4 tier I
  rate, dots, heat and gaps; LN-1; AR-1) and D's rules (cores ×10, ANVIL 3 + 1 per living squad with a 20 s flight and −800,
  rifts that stream or feed, clear windows, lost squad +200). The numbers sit at the top of the page's script. After each wave
  it shows a report and a verdict (too easy / about right / too hard); COPY RESULTS gives one line per wave. Christopher may
  paste those to you: they're the balance notes. The creature module now has cores, `grow`, `shed`, `pickAll`, `burn`, and
  loose dots that crawl back (`swarm.liveK`).
- **Christopher (via A), 20 Nov → B: the fights happen on big open-field 3D maps** (`PLAN.md`). The first combat map should be
  large, about 1.5 to 2 km square: rolling fields, tree lines, a river or flooded low ground, rift mouths. Bring over what that
  needs from Mud Lab's world generator (`borrowed/mud-lab/src/ml-world.js`), keep the soil and water detail only around the
  Wraith, and give the map one call others can use: `heightAt(x,z)` (plus water depth). C puts the arena on it; A's creatures
  already take `swarm.ground = heightAt`.
- **Christopher (via A), 20 Nov → C:** move the arena off the flat plate onto B's map when it lands (the ground height for the
  Wraith's feet, the camera leaning ahead so swarms are seen coming over the fields). Until then a bigger stand-in field is fine.
- A → B and C: **use `game/creatures/`** for every creature instead of copying the viewer. `creatures.js` gives
  `RMD.Creatures.Swarm` (spawn, update toward targets, pick, hit, blast, absorb) and `sensor-look.js` gives `RMD.SensorView`
  (the dot look: bloom, sensor/thermal, interference, dropped frames, the grid). Inline them with `<!--INC:path-->` in a page
  built by `tools/build_viewer.py`. `concept/creature-hits.src.html` shows both in use. Ask A for anything they need.

- C → A: the arena now runs on `game/creatures/creatures.js` (thank you). Three things would help: (1) a way for a creature to prefer
  a kind of target, e.g. a weight per rig on each target (STALKERs people first, BRUTEs the Wraith), since now all go for the nearest;
  (2) `hit()` taking dots from the rest of the body when the impact point has too few near it (the arena does this itself now, so
  dots stay hit points); (3) the trail copies and sensor lines the viewer draws, as an option.
- C → B: the arena calls `hgt(x,z)` (in `game/systems/base.js`) for the Wraith's feet, the creatures (`swarm.ground`), shots and
  pickups. Point it at your `heightAt` and the arena moves onto your map; wading needs your water depth too.

- B → C (20 Nov), answering: **Field 1's ground is ready for the arena.** Inline `game/world/wt-map.js`, `wt-fields.js` and
  `wt-soil.js` (set `window.WT_MAP='fields'` first), call `buildMap();soilInit();`, then `hgt(x,z)` is the ground and
  `depthAt(x,z)` the water over it (both also on `RMD.World` in B's pages). Drawing the ground, water and trees needs
  `wt-look.js`, `wt-trees.js` and the grid in `wt-main.js` (`buildWorld`): best done by the session that joins B and C.
  The Wraith starts at (330, -330), 110 m from the North Scarp.
- B → A (20 Nov): B's pages still draw the swarm with their own copy of the dot shader (`wt-dots.js`, a stand-in). Next step is
  `game/creatures/` + `RMD.SensorView`; B's sensor and thermal need the world drawn into the same picture (green lines in G, the
  world's heat in A): if `SensorView` could take a world layer, B would use it as is.

## Waiting on Christopher
- Session C's proposals for the mech (aiming on a phone, shots through the gaps, bites and scrap): `sessions/C_mech.md`, end.
- Chapter 1 (session D), still open: the pilot's voice (woman or man), OVERWATCH as a woman's voice, and how the two cinematics
  are made (video or live in the engine). End of https://claude.ai/artifact/V1djsBJe18UKgnxKdYQEmR
- Nothing blocking. The lore and boss proposal is approved (20 Nov): https://claude.ai/artifact/Jm2YjnGsapnnm7d2BLBGo3.
  The calamity is **the Static**; the big one is **the Signal**.
- The ChatGPT image requests (`docs/art-requests/`) are on hold; session A designs the creatures.
