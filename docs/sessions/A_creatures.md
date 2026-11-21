# Session A: the creatures

The session that built `concept/swarm-viewer.src.html` (20 Nov 2026). If this chat is gone, start a new one with:
"You're session A on Rift Mech Defense. Read `CLAUDE.md`, `README.md`, `docs/PLAN.md`, `docs/BOARD.md`, then
`docs/sessions/A_creatures.md`."

## Owns
`concept/`, `art/`, `game/creatures/`, `docs/art-requests/`, and its line on `docs/BOARD.md`.

## Done
- **The threat library viewer** (`builds/swarm-viewer.html`):
  - MOTE (1): a single dot that splits into 16, 256 and 4,096 as you zoom in. These are dots made of dots, turning through four dimensions.
  - KNOT 10, SKEIN 20, RUNNER 50, STALKER 100, BRUTE 500, and (20 Nov) DRAG 1,000, HULK 5,000, BEHEMOTH 10,000, TITAN 50,000: CPU rigs.
    The big four are filled masses built from clumps of 16 to 60 dots that crawl together, with a slow crawl of the surface done on the GPU
    (`uBoil`). They have no trails or links. Thermal brightness scales with (500/n)^0.33. Each dot springs toward its place on a simple skeleton, so
    the dots lag and smear when the creature lunges. Faint lines join neighbouring dots: the sensor's best-fit skeleton. IDLE
    breathes and paces. AGGRO stalks, coils, lunges at a squad of green dots and mauls it; the squad's dots flicker, turn red and
    join the count.
  - THE SIGNAL (named 20 Nov; first called the Host), 1,000,000 dots, all moved on the GPU. Reworked 20 Nov after Christopher found the first body too pointy: now a hunched,
    lopsided heap of about 2,000 brute-sized clumps (220 to 740 dots each) that crawl over each other. A huge hump, the head sunk low
    in front, one arm heavier than the other, two tendrils trailing behind, a dim core, a throat that glows when the jaw opens.
    Moving parts lag (`uPartL`, the pose half a second ago) so motion smears; a few dots drip off and crawl back.
    Later the same evening: 12 tentacles (part 6, drawn in the shader from `uTB`/`uTD`, the table `TENT`) from all over the body,
    and three forms it drifts between about once a minute after the reveal (`hostForms`): hunched, risen (stands, arms and
    tentacles spread like a dead tree), spread (sinks into a low mound, tentacles crawl out flat).
    Its lower half is a funnel still pouring up out of the rift.
    The contact sequence: the count climbs, the sensor chokes (static, pixelation, real dropped frames), the dots resolve into
    the shape, "It's one mass." AGGRO: it raises an arm and slams, with a roar and a core pulse.
  - INTEL BRIEF 00: 1,048,576 dots unfolding from one dot, five levels, turning through four dimensions, with the drone's log.
  - SENSOR and THERMAL looks; interference grows as you get close.
- **Round-1 image request:** `docs/art-requests/RMD_ROUND1_IMAGE_REQUEST.html`.

- **The shared module** (20 Nov): `game/creatures/creatures.js` (all nine rigs from KNOT to TITAN, a `Swarm` that keeps every
  creature and knocked-off dot in one buffer; creatures walk at the nearest target, lunge, maul and back off; `hit` knocks dots
  off, size follows the cube root of the count, below 12% it comes apart; `absorb` adds dots, up to 30% past where it started),
  `game/creatures/sensor-look.js` (`SensorView`: the viewer's post pass and grid as a class). Demo: `builds/creature-hits.html`
  (8 waves up to the BEHEMOTH, cannon / arc / artillery, squad that can be lost, sensor/thermal; `#auto` fires by itself,
  `#wave5` starts at wave 5).

## Next
1. Christopher likes the Host as it is now and wants Claude to design freely (the ChatGPT directions were dropped). Keep pushing it:
   more forms, tentacles that reach for squads, the Host's look in each phase of the fight in the lore proposal.
2. Rework the small rigs from the S01 and S02 line-ups.
3. Make `game/creatures/`: one module the game uses for every cluster. Sessions B and C copy the viewer until then.
4. Proposal for C and D: dot count = hit points. A hit knocks dots off, so the creature shrinks.

## How the viewer works (for whoever touches it)
- One page, three dot systems: `dotMat` (CPU creatures and allies, with four trail copies), `hostMat` (the Host; part matrices
  `uPart[12]` posed each frame in `poseHost`; part 8 is the funnel, 9 the core, 11 the eyes), `fracMat` (the 4-D dots).
- Dots write red (hostile), green (grid) and blue (allies) into a half-float target. The final pass colours them (sensor or
  thermal) and adds bloom, then the interference: tearing, blocks, colour fringing, static, pixelation.
- Dropped frames are real: when the stutter is up, the loop skips rendering for 30 to 290 ms while the simulation runs on.
- Hash links: `#host`, `#brief`, `#mote`, `#knot` … plus `,aggro` and `,thermal`. In tests, `contact.t0=simT-17` jumps the
  Host's sequence to the end and `aggroT0=simT-3.3` jumps an attack to the lunge.
