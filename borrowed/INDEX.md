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
