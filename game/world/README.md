# game/world: the ground, the water, the views (session B)

Two pages, one set of sources:

| Page | Map | What it shows |
|---|---|---|
| `builds/field-1.html` | **Field 1**, the first combat map: 1,792 m square | rolling fields (meadow, ploughed, wheat) with tree lines, groves, Mill River in its valley, the Sunk Meadows (flooded, a magma crack in the floor), farm tracks, a farm, three rift mouths in scarps |
| `builds/world-test.html` | **Coast 1**, the world test: 320 m square | beach, flooded streets, a drowned quarter, the sea shelf, magma cracks under the sea, one rift in a bluff |

Both: the Wraith walking (Ironhowl 4's walk) and leaving prints; wading (slower by depth, bow wave, rings; past its hips
it can't walk on, hold HOVER); REAL / SENSOR / THERMAL; a swarm of about 400 red dots; ARTILLERY on the nearest open rift
(craters, then the face caves in and the mouth fills; nothing comes out of it after).

```
python3 game/world/build.py                 # both pages (or: build.py field-1)
python3 -I game/world/shots.py OUT builds/field-1.html phone      # the screenshots in docs/shots/world/
python3 -I game/world/shots.py OUT phone                          # the coast's
```

## For other sessions: the ground

`window.RMD.World` (set by `wt-main.js`):

| Call | Gives |
|---|---|
| `heightAt(x,z)` | the ground's height in metres, soil and all (prints, craters, rubble) |
| `depthAt(x,z)` | water over the ground there (0 where it's dry) |
| `waterAt(x,z)` | the water's level (lies under the ground where there's no water) |
| `size`, `x0` | the map's side and its west/north edge (Field 1: 1792 and -896) |

x runs east, z south, y up. The camera looks north.

## Files

| File | What it does |
|---|---|
| `wt-map.js` | shared map code, and Coast 1 |
| `wt-fields.js` | Field 1. The river is laid out as Mud Lab's River (`mlRiver`: waypoints with width, riffle and pool depth, cut bank, bars; how bent it is at each point), with Mud Lab's nearest-line lookup in 32 m buckets and its flat valley floor |
| `wt-soil.js` | Mud Lab's soil lifted out of its engine: prints sink until the soil bears them, berms, slumping, clods landing, craters, rubble, heat. Kept wherever it was touched; the graphics card holds only the 256 m round the Wraith |
| `wt-look.js` | how the ground, the water and everything else is drawn in each view; the dot shader and the sensor/thermal finish copied from `concept/swarm-viewer.src.html` |
| `wt-mech.js` | the Wraith (Ironhowl 4's combat model and kit, its walk), wading |
| `wt-fx.js` | clods, dust, spray, smoke, fire; the rifts and the barrage |
| `wt-dots.js` | the swarm crossing (a stand-in for `game/creatures/`) |
| `wt-trees.js` | Ironhowl 3's oak as instances |
| `wt-main.js` | renderer, camera, touch controls, HUD, the frame, test hooks (`WT.place`, `WT.sim`, `WT.setView`, `WT.barrage`) |
