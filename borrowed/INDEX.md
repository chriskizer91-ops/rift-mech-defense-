# borrowed/: what came from where (20 Nov 2026)

Read-only copies. Copy what you need into `game/` and change the copy; add a line under "Used by".

## mud-lab/  (from `chriskizer91-ops/mud-lab`, 18 Nov 2026)
| Path | What it is |
|---|---|
| `README-mud-lab.md` | Mud Lab's own README: its file table explains every source |
| `src/` | all of Mud Lab's code: soil (`ml-soil.js`: ruts, water, wake), the world (`ml-world.js`), the look (`ml-look.glsl/.js`), the bog, the climb, the GPU step-down, the menu, keys, sound, and the vehicles |
| `src/build.py` | how Mud Lab's page is put together from the engine copy, the base files and `src/` |
| `base/` | the frozen Salt & Sand engine copy Mud Lab is built on, his ground pictures (`texpack.js`, `textures/`), the trucks and the Heron |
| `tools/world/` | the ground generator run in Node (pictures, river profile, syntax check) |
| `tools/test/` | Mud Lab's headless tests |
| `builds/mud-lab-21.html` | the latest Mud Lab, to look at |

## ironhowl4/  (Ironhowl 4 as Christopher sent it, 20 Nov 2026; the same as HYPERDOT-ARCADE `backroom/games/ironhowl4`)
| Path | What it is |
|---|---|
| `index.html`, `js/ironhowl4.js` | the game. The source is in parts, each starting `/* ---- name ---- */` (`05_wraith`, `06b_weapons`, `09_hud`, …) |
| `js/three-ih3.min.js` | three.js r187 bundle (`window.THREE`, GLTFLoader, post passes). Every build here inlines it |
| `m4/` | the kit and the Wraith: full and combat models with textures. Kept: Wraith V2 HD, autocannon, Lance, Arc, missile pod, Watcher, jet pack, drone. Left out: FORGE's Gunner, Hound, Skitter and spawner pod (not in this game) |
| `models/` | Ironhowl 3's trees, bushes, grass, props and older mechs |
| `art/` | ground textures and the story pictures |
| `ironhowl4_game_light.html` | the one-file light build Christopher sent as the most up to date (its header says built 9 Nov 2026, commit 8fb4215) |
| `ironhowl4_game_light_2026-11-17.html` | the other light build he sent (its header says built 17 Nov 2026, commit e3fe25c) |

## Used by
(one line each: what, copied to where, by which session)
- `ironhowl4/js/three-ih3.min.js`: inlined by `tools/build_viewer.py` (session A).
- `ironhowl4/js/ironhowl4.js`: the Wraith, input, weapons, kit, pickups, upgrades, particles, sounds and HUD, copied and changed into
  `game/mech/` and `game/systems/` (session C; map in `game/systems/README.md`).
- `ironhowl4/js/three-ih3.min.js`, `ironhowl4/m4/*/…_combat*` (Wraith V2 HD, AC-4, LN-1, AR-1, MP-9, WT-1, JP-2) and
  `ironhowl4/art/06-dirt-and-gravel*.webp`: inlined by `game/systems/build.py` into `builds/mech-arena.html` (session C).
- `mud-lab/src/ml-soil.js` (mlStamp, mlSettle, mlLand, mlWake, mlWater's drag and bow wave, the soils' numbers) and
  `mud-lab/src/ml-look.glsl` (the rings and the bow wave on the water): rewritten as plain three.js in `game/world/wt-soil.js`,
  `wt-look.js` (session B).
- `mud-lab/src/ml-world.js` (mlRiver, the nearest-line buckets, the valley floor, the hills' shape, trees on a jittered grid):
  `game/world/wt-fields.js` (session B).
- `mud-lab/base/texpack.js` (DIRT2, MUD): the ground pictures in `builds/world-test.html` and `builds/field-1.html` (session B).
- `ironhowl4/m4/` (Wraith V2 HD, jet pack, autocannons: combat models and maps), `ironhowl4/js/ironhowl4.js` (05_wraith's
  walk: legSetup, legSolve, poseMech; 06_player's walk and hover numbers; the particle shader), `ironhowl4/art/` (asphalt,
  paving, rock, facades, roof, rusted steel, barn, meadow, ploughed, wheat, farm track, gravel, prairie, fx atlas, smoke),
  `ironhowl4/models/trees/tree_oak*`: `game/world/` (session B).
