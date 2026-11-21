# Board: who is doing what

Update your own line when you finish something. Pull before you edit this file.

| Session | Job | Owns | Brief | Status |
|---|---|---|---|---|
| **A: Creatures** | the swarm creatures: the viewer, small-creature rigs, the Host's real model from the concept art | `concept/`, `art/`, `game/creatures/` | `sessions/A_creatures.md` | Viewer: 1 to 50,000 plus the Host (20 Nov). Host: a heap of clumps with 12 tentacles, drifting between three forms; TITAN tendrilling out. Lore/boss proposal written for D: https://claude.ai/artifact/Jm2YjnGsapnnm7d2BLBGo3 |
| **B: World** | Mud Lab's soil and water in a top-down test: the Wraith wading, tearing up ground, sensor/thermal toggle, a rift caved in by artillery | `game/world/` | `sessions/B_world.md` | Working (20 Nov): soil and water lifted into plain three.js (proposal in the brief) |
| **C: Mech** | Ironhowl 4's Wraith, controls, weapons, upgrades and HUD, taken out of Ironhowl 4 and made to fight dot clusters | `game/mech/`, `game/systems/` | `sessions/C_mech.md` | **Arena works (20 Nov):** `builds/mech-arena.html`. The Wraith walks, hops, hovers; autocannon (heat, vent), Lance, Arc, missiles, SALVO; twin-stick touch, mouse, keys, pad; top-down camera leaning ahead of the aim; A's creatures (`game/creatures/`) shrink as dots come off; squads can be lost (they become dots); scrap buys the six upgrade tracks and sets the arms; sensor / thermal, interference, dropped frames; a 170 m stand-in field. Proposals: `sessions/C_mech.md`. Next: B's map |
| **D: Story** | chapter 1 (about an hour): missions, waves, the radio script, the ally beats, the Host fight, the lore | `docs/story/` and the design doc | `sessions/D_story.md` | Design doc written (20 Nov), a proposal: https://claude.ai/artifact/V1djsBJe18UKgnxKdYQEmR. 8 missions, ~64 min; every wave in `docs/story/waves.md` (+ JSON), full radio script in `docs/story/radio.md`. 12 open questions for Christopher at the end of the doc |

Later, when B and C have something running: one session joins them into `game/` (the first playable mission).

## Shared pieces (agree before changing)
- **The dot look** is in `concept/swarm-viewer.src.html`: the dot shader, the bloom, the sensor and thermal colours, interference
  and dropped frames. B and C copy it; A keeps it the reference. If you improve it, tell A in "Asks".
- **A creature's dot count is its hit points and its size.** (A proposal shared by A, C and D until Christopher decides.)

## Asks
(one line each: who asks, who for, what)
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

## Waiting on Christopher
- Session C's proposals for the mech (aiming on a phone, shots through the gaps, bites and scrap): `sessions/C_mech.md`, end.
- Chapter 1 design doc (session D): 12 open questions at the end of https://claude.ai/artifact/V1djsBJe18UKgnxKdYQEmR
  (length, the IRMD's tone, a silent pilot, the mission 5 choice, the cost of winning, a SENSOR track, and more).
- Nothing blocking. The lore and boss proposal is approved (20 Nov): https://claude.ai/artifact/Jm2YjnGsapnnm7d2BLBGo3.
  The calamity is **the Static**; the big one is **the Signal**.
- The ChatGPT image requests (`docs/art-requests/`) are on hold; session A designs the creatures.
