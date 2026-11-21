# Session B: the world test (wade and tear)

**Paste this to start the session:** "You're session B on Rift Mech Defense (repo `chriskizer91-ops/rift-mech-defense-`).
Read `CLAUDE.md`, `README.md`, `docs/PLAN.md`, `docs/BOARD.md`, then do `docs/sessions/B_world.md`."

## Goal
One page, `builds/world-test.html`, that proves the world: Mud Lab's ground and water under a **top-down** camera, with the
**Wraith wading** through water and tearing up the ground, a **real view / sensor / thermal** toggle, a swarm of red dots
crossing the ground, and **a rift caved in by an artillery strike**.

## You own
`game/world/` (sources), `builds/world-test.html`, and your line on `docs/BOARD.md`. Read anything; change nothing else.

## Read first
- `borrowed/mud-lab/README-mud-lab.md`: its file table says what each source does. Mud Lab is built on its own frozen copy of
  the Salt & Sand engine (`borrowed/mud-lab/base/engine-salt-and-sand.html`); `borrowed/mud-lab/src/build.py` shows how the
  page is put together. `borrowed/mud-lab/builds/mud-lab-21.html` is the latest Mud Lab to look at.
- The soil and water: `borrowed/mud-lab/src/ml-soil.js` (`mlRut`, `mlWake`, `mlWater`, `mlWaterBuild`), `ml-world.js` (the ground),
  `ml-look.glsl` / `ml-look.js` (how it's drawn), `ml-bog.js`. `borrowed/mud-lab/tools/world/` runs the ground generator in Node.
- The Wraith: `borrowed/ironhowl4/m4/wraith-v2-hd/wraith_v2_combat.glb.json` and its textures; how Ironhowl 4 loads and walks it:
  `borrowed/ironhowl4/js/ironhowl4.js`, parts `05_mech_common.js` and `05_wraith.js` (search for `/* ---- 05_wraith.js ---- */`).
- The dot look: `concept/swarm-viewer.src.html` (dot shader, bloom, sensor and thermal colours, interference, dropped frames).

## Steps
1. **Decide how to carry Mud Lab's soil and water over**, and write the choice in "Proposals" below before building: either
   build on the Salt & Sand engine copy as Mud Lab does, or lift the soil and water out into plain three.js r187 modules. Lifting
   them out is cleaner for the game (Ironhowl 4 is plain three.js); building on the engine is faster. Say which and why.
2. **A coastal test map:** a few hundred metres of shore: beach, a flooded street or two (simple blocks are fine for now), shallow
   water and deeper water. Earth-like, no real place. A glowing magma crack under the water (the cracks are decided).
3. **Top-down camera** (high three-quarter, following the mech), touch-first: left thumb moves (as in Ironhowl 4).
4. **The Wraith walking** on the ground with Ironhowl 4's walk, leaving footprints and ruts in the soil.
5. **Wading** (new, decided): water slows the Wraith by depth; it pushes a bow wave and a wake (Mud Lab's `mlWake`); over about
   hip depth (the Wraith is 6.6 m) it can't walk, and its jet hover is the way across (stub it: hold a button to hover).
6. **Views:** a button switches REAL / SENSOR / THERMAL. Sensor draws the world dark with a faint green grid and the creatures
   as red dots (copy the viewer's look). Thermal: the viewer's ironbow colours over the world's heat (magma hot, water cold).
7. **A swarm crossing:** a few hundred red dots (instanced points, the viewer's shader) pouring out of the sea onto the shore.
   In the real view they're invisible, but the ground churns where they pass.
8. **A rift and an artillery strike:** a cave mouth in a bank. A button calls a barrage: shells land, the soil craters, and the
   mouth collapses and fills. The dots stop coming out of it.
9. Screenshots of each with `tools/shoot.py` (phone size), and a frame-rate note from the laptop if you can.

## Done when
`builds/world-test.html` opens on the phone and shows all of steps 3 to 8; screenshots are in `docs/shots/world/`; your line on
`docs/BOARD.md` says what works and what doesn't.

## Proposals
(write here; Christopher decides)

### 1. How Mud Lab's soil and water come over (session B, 20 Nov): lift them out into plain three.js

**Lifted out, not built on the engine.** `game/world/` has the soil and water as plain three.js r187 code, the same
bundle Ironhowl 4 and the viewer use.

Why:
- **The engine is a car game.** Mud Lab's soil is wired into Salt & Sand's own renderer (raw WebGL, its own shaders, its
  own `GAME.car`, tyres, contact patches). The Wraith, its walk and its weapons are three.js (Ironhowl 4). On the engine
  we'd have two renderers in one page, and session C's mech could never join session B's world without a rewrite.
- **What we need from Mud Lab is the soil's rules, not its car.** Those rules are short and they come across as they are:
  the ground kept as a height per cell in squares made only when something touches them; a press sinks until the soil
  bears it, and a share of what sinks is squeezed up beside it as a berm (`mlStamp`); wet soft soil slumps back into
  its ruts (`mlSettle`); thrown clods land as soft lumps (`mlLand`); water drags by depth and speed (`mlWater`); rings
  through standing water and a bow wave, drawn as slopes on the water's surface (`mlWake` and its shader lines).
- **The numbers are Mud Lab's.** Each soil's sink, floor, berm and slump (`ML_SOIL`: sand, mud, loam) are copied, then
  scaled for a 30-tonne foot instead of a tyre.

What is not carried over: the car physics, the trucks, the 3 km world generator and its trails, the engine's sound.
What changes: cells are 25 cm (Mud Lab's are 8 cm; a Wraith foot is about 1.5 m long); the soil is a texture over the
whole test map instead of a window that follows a truck.

Cost: it's a rewrite of the parts we use, so it looks like Mud Lab, not identical to it. Building on the engine copy
would have been faster for this one page and a dead end for the game.
