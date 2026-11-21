# Board: who is doing what

Update your own line when you finish something. Pull before you edit this file.

| Session | Job | Owns | Brief | Status |
|---|---|---|---|---|
| **A: Creatures** | the swarm creatures: the viewer, small-creature rigs, the Host's real model from the concept art | `concept/`, `art/`, `game/creatures/` | `sessions/A_creatures.md` | Viewer: 1 to 50,000 plus the Host (20 Nov). Host: a heap of clumps with 12 tentacles, drifting between three forms; TITAN tendrilling out. Lore/boss proposal written for D: https://claude.ai/artifact/Jm2YjnGsapnnm7d2BLBGo3 |
| **B: World** | Mud Lab's soil and water in a top-down test: the Wraith wading, tearing up ground, sensor/thermal toggle, a rift caved in by artillery | `game/world/` | `sessions/B_world.md` | Working (20 Nov): soil and water lifted into plain three.js (proposal in the brief) |
| **C: Mech** | Ironhowl 4's Wraith, controls, weapons, upgrades and HUD, taken out of Ironhowl 4 and made to fight dot clusters | `game/mech/`, `game/systems/` | `sessions/C_mech.md` | Not started |
| **D: Story** | chapter 1 (about an hour): missions, waves, the radio script, the ally beats, the Host fight, the lore | `docs/story/` and the design doc | `sessions/D_story.md` | Design doc written (20 Nov), a proposal: https://claude.ai/artifact/V1djsBJe18UKgnxKdYQEmR. 8 missions, ~64 min; every wave in `docs/story/waves.md` (+ JSON), full radio script in `docs/story/radio.md`. 12 open questions for Christopher at the end of the doc |

Later, when B and C have something running: one session joins them into `game/` (the first playable mission).

## Shared pieces (agree before changing)
- **The dot look** is in `concept/swarm-viewer.src.html`: the dot shader, the bloom, the sensor and thermal colours, interference
  and dropped frames. B and C copy it; A keeps it the reference. If you improve it, tell A in "Asks".
- **A creature's dot count is its hit points and its size.** (A proposal shared by A, C and D until Christopher decides.)

## Asks
(one line each: who asks, who for, what)
- A → B and C: **use `game/creatures/`** for every creature instead of copying the viewer. `creatures.js` gives
  `RMD.Creatures.Swarm` (spawn, update toward targets, pick, hit, blast, absorb) and `sensor-look.js` gives `RMD.SensorView`
  (the dot look: bloom, sensor/thermal, interference, dropped frames, the grid). Inline them with `<!--INC:path-->` in a page
  built by `tools/build_viewer.py`. `concept/creature-hits.src.html` shows both in use. Ask A for anything they need.

## Waiting on Christopher
- Chapter 1 design doc (session D): 12 open questions at the end of https://claude.ai/artifact/V1djsBJe18UKgnxKdYQEmR
  (length, the IRMD's tone, a silent pilot, the mission 5 choice, the cost of winning, a SENSOR track, and more).
- Nothing blocking. The lore and boss proposal is approved (20 Nov): https://claude.ai/artifact/Jm2YjnGsapnnm7d2BLBGo3.
  The calamity is **the Static**; the big one is **the Signal**.
- The ChatGPT image requests (`docs/art-requests/`) are on hold; session A designs the creatures.
