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

### Session C, 20 Nov: what the arena tests (`builds/mech-arena.html`)
Screenshots: `docs/shots/mech/`. Numbers below come from headless runs and a bot pilot, not from a person playing yet.

1. **Aiming on a phone, top-down (built this way).** Twin sticks. The left thumb's stick moves (up = north on screen). The right
   thumb's stick appears wherever that thumb lands and aims; pushed past a quarter it fires. The Lance charges while you hold and
   fires when you let go or when full. Aim assist bends the aim onto the creature nearest the line, within 0.2 rad and 48 m (about
   what the screen shows). JET, SALVO, MSL and VENT sit on the right edge above the aim stick; you lift the thumb to press them.
   Mouse: the shot goes where the cursor points on the ground. Other ways, if this feels wrong: (b) fire by itself at whatever is
   under the aim, with the right thumb only steering; (c) the Wraith picks the nearest creature and the right thumb only changes it.
2. **Dots are hit points (tested): it reads.** A 100-dot STALKER visibly thins and shrinks, the knocked-off dots scatter and fade.
   With Ironhowl 4's gun numbers a KNOT dies to one round (11 damage), a STALKER to about 10, a BRUTE to about 45.
3. **New, to test: shots go through the gaps.** With 2 alone, the autocannon killed every small creature before it could bite. Now a
   gun round that crosses a cluster hits with a chance of dots ÷ (dots + 22), never below 30 %: KNOT 31 %, STALKER 82 %, BRUTE 96 %.
   The Lance, the Arc and blasts always hit. That gives each weapon a job: the autocannon for big dense ones, the Arc for swarms,
   the Lance for a line of them, SALVO and missiles go to the biggest. `?solid` in the address turns it off to compare.
4. **The arena's other rules (proposals):** a bite is 1.2 + 0.8 × √dots (KNOT 3.7, STALKER 9.2, BRUTE 19), × 0.6 / 1 / 1.4 for
   Easy / Medium / Hard; a mauling creature hangs on to a Wraith walking away. A bitten ally flickers 1.25 s; kill the creature in
   time and it is saved, otherwise it turns red and becomes one more dot of it. Scrap = half a creature's starting dots, plus 15 for
   each ally alive at the end of a wave. Interference is held under 0.7 and frames start dropping at 0.3, so a fight stays playable.
5. **What the bot found (six test waves, Medium).** Autocannon only, no upgrades: it clears them, but loses nearly every squad.
   Autocannon + Arc and buying upgrades: keeps 2 to 14 of the 15 allies a wave. The Wraith itself is rarely hurt, because every
   creature goes for the nearest target and the squads are nearer. Proposal: let each creature prefer a kind of target (STALKERs
   people, BRUTEs the Wraith, KNOTs the Wraith in swarms). Asked of session A on the board.
6. **Left for later:** the DR-1 drone, the full-detail modification bay, pilot levels. The missile pod still has to be fitted for
   missiles (Ironhowl 4's rule).

### Session C, 20 Nov night: the team and the artillery (Christopher's direction, in `PLAN.md`)
Built in the arena, with these choices of mine (proposals):
1. **The team:** KESTREL, VESPER and HALE (placeholder names) keep a loose formation round you, fire autocannons (3.2 rounds a second,
   8 each, 36 m: weaker than you), back off from anything close, and are targets for the swarm like you. Shield 30, hull 100. A downed
   one stays down until you stand within 7 m of it for 3 s; it gets up at 40 %. They are repaired between waves; each one standing at
   the end of a wave is worth 40 scrap. Green rings under them, names over them, green on the radar.
2. **Waves are 2.2 times as big** for four Wraiths, and creatures 35 % faster than A's walking speeds (so a pack can catch a Wraith).
   Even so the bot pilot takes no damage: the team of four is too strong against these waves for now. Needs tuning with you playing.
3. **The artillery round, after every second wave:** an 8 × 8 grid (A–H, 1–8, 20 m squares) seen from 500 m up. Two Wraith teams,
   BRAVO and CHARLIE, are four green dots each in the south rows; they hold and fire back. Red packs come from the north rows. Tap a
   square: a shell lands 3.2 s later and hits everything within 14 m. Green inside it is lost: "CHECK FIRE". 8 shells plus one every
   two waves, 90 s. Scrap: half the red dots destroyed, plus 20 for each green alive, minus 60 for each one you hit.
4. The green-dot squads are gone from the ground fight.
