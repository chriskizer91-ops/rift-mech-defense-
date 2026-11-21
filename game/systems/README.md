# Ironhowl 4's systems, mapped for Rift Mech Defense (session C, 20 Nov 2026)

Source: `borrowed/ironhowl4/js/ironhowl4.js` (one file in parts, each starting `/* ---- name ---- */`).
**Keep** = lifted nearly as it is. **Change** = lifted, then reworked for a top-down game that fights dots. **Drop** = not used.
"Now in" says where the lifted code lives in this repo.

| Part | What it does | Depends on | Verdict | Now in |
|---|---|---|---|---|
| `01_base` | maths helpers (clamp, damp, angD), settings in localStorage, arcade bridge | nothing | **Keep** the helpers. Drop the arcade bridge | `systems/base.js` |
| `02_input` | touch move stick (left 45 %), touch look drag, FIRE/JET/MSL/VENT/SALVO buttons, keys, pointer-locked mouse, gamepad | HUD, story, bay | **Change**: the look drag becomes a right **aim stick** (top-down twin-stick); the mouse aims at the ground under the cursor, no pointer lock. Gamepad kept | `systems/input.js` |
| `03_render` | renderer, auto quality, sky dome, sun and shadows, wind for plants, the world material hook | maps, textures | **Change**: one plain arena light and shadow box that follows the Wraith. Sky, wind, haze, horizon: dropped (B's world brings its own) | `systems/render.js` |
| `03b_post` | bloom, sharpen, normal maps, ground decals, shield flash | render | **Change**: replaced by the viewer's dot pass (dots → bloom → sensor or thermal look → interference) laid over the lit world. Shield flash kept | `systems/render.js` |
| `04_world` … `04j_life_foundry` | maps, terrain, trees, props, animals, docks, foundry | — | **Drop** (Ironhowl's maps; session B builds the world). The arena is a flat plate | — |
| `05_mech_common` | Ironhowl 3 materials, part merging, older leg IK | textures | **Drop** (FORGE machines only). `localBox` kept | `mech/wraith.js` |
| `05_wraith` | loads the Wraith V2 HD combat model and its kit onto mounts, finds muzzles, missile tubes, jet nozzles; walk with planted feet (2-link leg solve), torso aim, jet flames | GLTFLoader, `m4/` models | **Keep**. The ground height call is flat for now (B will give one) | `mech/wraith.js` |
| `06_player` | walk 7.5 m/s, jet hop (30 m tap, 55 m hold, fuel cells), hover 30 s, shield regen, landing stomp | input, collisions | **Change**: moves in world directions (stick up = north on screen); body turns to the aim, legs to the walk. Hop, hover and numbers kept | `mech/player.js` |
| `06b_weapons` | autocannon tiers I-IV, heat, overheat, VENT; missiles; SALVO (14 rounds all round); shots and hits | player, enemies, fx | **Keep** the numbers. Aim is a flat top-down line instead of a camera ray. Hits test against dot clusters | `mech/weapons.js` |
| `06c_enemies` | FORGE machines, path flow field, waves, damage, pickups (chip, repair, shield, missiles, fuel), score | world | **Change**: machines → session A's dot creatures (`game/creatures/creatures.js`); a creature's dots are its hit points. Pickups kept. Flow field dropped (open field; B's terrain may need it back) | `systems/swarm.js`, `mech/weapons.js` |
| `06d_missions` | missions, objectives, radio strip | maps, story | **Drop** (session D writes chapter 1). Waves kept in a simple form | `systems/swarm.js` |
| `06e_upgrades` | scrap buys six tracks × five levels (GUN, COOLING, SHIELD, MISSILES, JETS, HULL), costs 150/300/500/800/1,200 | save | **Keep** as it is | `systems/upgrades.js` |
| `06f_more` | spawner pods, the Lancer, rain, escort truck, the Thresher | machines | **Drop** | — |
| `06g_set7` | artillery marks, more FORGE machines | machines | **Drop**. The red artillery disc may come back for rift sealing (B) | — |
| `06h_endless` | endless waves, extra radio, attract demo | missions | **Drop** (the arena runs waves) | — |
| `06i_bay` | modification bay: full Wraith, swap kit on mounts, upgrade screen | kit, upgrades | **Change**: a simple screen between waves (upgrades + arm loadout). The full-detail bay can come back later | `systems/upgrades.js` |
| `06j_forge` | FORGE's machines and bosses | — | **Drop** | — |
| `06k_kit` | Lance (charge rail, pierce 3), Arc (chain lightning, 4 jumps), missile lock, Watcher radar and warnings, assist drone, beams | weapons, enemies | **Keep** Lance, Arc, beams, radar. **Change**: lock picks the biggest clusters. The drone is left for later | `mech/weapons.js`, `systems/hud.js` |
| `06l_brief` | intel cards before new machines | story | **Drop** here (D's intel brief, A's viewer) | — |
| `06m_pilot` | pilot XP, levels open kit and AI assists | save | **Drop** for now (could carry "the AI is why we stand a chance") | — |
| `06n_difficulty` | difficulty scales | — | **Change**: Easy / Medium / Hard (decided) scale creature speed and bite | `systems/swarm.js` |
| `06o_story`, `06p_story_text` | story scenes and text | — | **Drop** (session D) | — |
| `07_fx` | one instanced particle system (smoke, glow, rings, flashes); all sounds made on the fly | textures | **Keep** the particles (no textures: drawn round) and the sounds | `systems/fx.js` |
| `08_camera` | third-person follow cameras | player | **Replace** with a top-down follow camera that leans ahead of the aim | `systems/camera.js` |
| `09_hud` | shield, hull, fuel, gun tier, missiles, score, crosshair, heat, damage arcs, edge arrows, menu | DOM | **Change**: the same readouts, laid out for a phone held upright, plus dot count, allies, scrap, sensor confidence | `systems/hud.js` |
| `10_main` | game flow, loop, auto quality | everything | **Change**: arena flow (wave → clear → upgrades → next wave), the frame loop and the sensor's held frames | `systems/main.js` |

## Assets used
- The Wraith V2 HD combat model, the AC-4, LN-1 and AR-1 (left and right), the MP-9 pod, the WT-1 Watcher and the JP-2 jet
  pack: `borrowed/ironhowl4/m4/*/…_combat*`. The builder (`game/systems/build.py`) packs them into the page.
- three.js r187 bundle: `borrowed/ironhowl4/js/three-ih3.min.js`.
- The creatures: session A's module `game/creatures/creatures.js` (inlined as it is). The dot look of the final pass (bloom,
  sensor and thermal colours, interference) is copied from `concept/swarm-viewer.src.html` into `systems/render.js`, because the
  arena lays the dots over a lit 3D world (A's `sensor-look.js` draws dots on black).

## Build and test
```
python3 game/systems/build.py                                   # -> builds/mech-arena.html (one file, about 8 MB, works offline)
python3 -I game/systems/test_arena.py out.png phone "touch" "__rmd.startPlay();__rmd.ff(5)" 3
python3 -I tools/shoot.py builds/mech-arena.html out.png "#dev" 6 phone
```
`?dev` (or `#dev`) gives `window.__rmd`: `ff(t)` runs the game t seconds without drawing, `ctl({...})` holds controls,
`info()` reports the state. `?touch` forces the touch layout. `?solid` turns off the through-the-gaps hit chance.

## Files
| File | What it is |
|---|---|
| `systems/arena.src.html` | the page: HUD, touch buttons, title, upgrade screen, pause menu, CSS |
| `systems/base.js` | helpers, settings, `hgt(x,z)` (flat now: the one place B's `heightAt` goes), the field's size |
| `systems/input.js` | twin sticks, buttons, mouse aim on the ground, keys, gamepad |
| `systems/render.js` | renderer, light, the stand-in field and rift mouths, the dot layer, the sensor / thermal pass |
| `systems/fx.js` | particles and sounds |
| `systems/camera.js` | the top-down camera |
| `systems/hud.js` | HUD, radar, lock brackets, edge arrows, radio lines |
| `systems/swarm.js` | the arena's rules over A's creatures: targets, bites, allies, waves, scrap, interference |
| `systems/upgrades.js` | scrap, the six tracks, the upgrade screen and the arm loadout |
| `systems/main.js` | flow and the frame loop, the sensor's held frames |
| `mech/wraith.js` | the Wraith model, kit on mounts, leg solve, walk |
| `mech/player.js` | walk, hop, hover, shield and hull |
| `mech/weapons.js` | aim, autocannon, Lance, Arc, missiles, salvo, vent, shots, blasts, pickups |
| `mech/wingmates.js` | the three other Wraiths of the team: formation, fire, down and brought back up |
| `systems/artillery.js` | the artillery round: the red-and-green grid, shells, friendly fire |
| `systems/build.py`, `systems/test_arena.py` | the build and the headless test driver |

