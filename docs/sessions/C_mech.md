# Session C: the mech (Ironhowl 4's systems, fighting dots)

**Paste this to start the session:** "You're session C on Rift Mech Defense (repo `chriskizer91-ops/rift-mech-defense-`).
Read `CLAUDE.md`, `README.md`, `docs/PLAN.md`, `docs/BOARD.md`, then do `docs/sessions/C_mech.md`."

## Goal
Take the Wraith and its systems out of Ironhowl 4 (decided: same mech, same mechanics, weapons and controls) and make them
fight **dot clusters** in a plain test arena, with a **top-down** camera: `builds/mech-arena.html`.

## You own
`game/mech/`, `game/systems/`, `builds/mech-arena.html`, and your line on `docs/BOARD.md`. Read anything; change nothing else.

## Read first
- Ironhowl 4's source: `borrowed/ironhowl4/js/ironhowl4.js` (the arcade copy, the same file as the zip Christopher sent). It is
  in parts, each starting `/* ---- name ---- */`: `01_base`, `02_input` (touch sticks, buttons), `03_render`, `03b_post`,
  `05_mech_common`, `05_wraith`, `06_player`, `06b_weapons`, `06c_enemies` (spawning, damage), `06e_upgrades`, `06i_bay` (the
  upgrade bay), `06k_kit`, `06l_brief`, `06m_pilot`, `07_fx`, `08_camera`, `09_hud`, `10_main`. `borrowed/ironhowl4/index.html`
  runs it. The one-file builds `borrowed/ironhowl4/ironhowl4_game_light*.html` carry the same source at the end.
- The design doc for Ironhowl 4 (Wraith numbers, the kit, the upgrade costs): https://claude.ai/artifact/C1P4JdkPFbZLWw1S7kvfJG
- The creatures: `concept/swarm-viewer.src.html`. Its CPU rigs (KNOT to BRUTE) are the enemies for the arena.

## Steps
1. **Map Ironhowl 4's systems**: for each part above, one line in `game/systems/README.md`: what it does, what it depends on, and
   keep / change / drop for this game. FORGE's machines, Ironhowl's maps and story are dropped.
2. **Lift out** the Wraith (combat model, walk, jet hop and hover), the input (touch sticks, JET, SALVO; mouse and keys), the
   weapons (autocannon with heat, Lance charge shot, Arc chain lightning, missile salvo), pickups and the HUD, into modules
   under `game/mech/` and `game/systems/`, plain three.js r187.
3. **Top-down camera** that follows the Wraith and leans ahead of where you aim (Ironhowl 4 is third-person; this game is
   top-down, decided). Aiming with the right thumb on a top-down view needs care: propose it in "Proposals".
4. **Dot clusters as enemies.** Copy the viewer's creature rigs into `game/creatures-test/` (session A will later give you the
   proper module: ask in "Asks"). Proposal to test (not decided): **a creature's dots are its hit points**. Shots knock dots
   off, so a 100-dot STALKER visibly shrinks; at 0 it's gone. The Arc chains through dense clusters. The missile salvo picks
   the biggest clusters.
5. **Allies as green dots** that the swarm goes for; one that's reached flickers and turns red (the viewer does this in AGGRO).
6. **Sensor interference** when clusters get close to the Wraith (the viewer's look), and the dropped frames when it's heavy.
7. **Salvage and upgrades**: scrap from cleared clusters, Ironhowl 4's five-level upgrade tracks, a simple upgrade screen.
8. Screenshots with `tools/shoot.py`.

## Done when
`builds/mech-arena.html` opens on the phone: the Wraith walks, hops, hovers and fires every weapon at waves of dot clusters
that shrink as they're hit; allies can be lost; scrap buys upgrades. Your line on `docs/BOARD.md` says what works.

## Proposals
(write here; Christopher decides)
