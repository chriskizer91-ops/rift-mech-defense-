# Session A: the creatures

The session that built `concept/swarm-viewer.src.html` (20 Nov 2026). If this chat is gone, start a new one with:
"You're session A on Rift Mech Defense. Read `CLAUDE.md`, `README.md`, `docs/PLAN.md`, `docs/BOARD.md`, then
`docs/sessions/A_creatures.md`."

## Owns
`concept/`, `art/`, `game/creatures/`, `docs/art-requests/`, and its line on `docs/BOARD.md`.

## Done
- **The threat library viewer** (`builds/swarm-viewer.html`):
  - MOTE (1): a single dot that splits into 16, 256 and 4,096 as you zoom in. These are dots made of dots, turning through four dimensions.
  - KNOT 10, SKEIN 20, RUNNER 50, STALKER 100, BRUTE 500: CPU rigs. Each dot springs toward its place on a simple skeleton, so
    the dots lag and smear when the creature lunges. Faint lines join neighbouring dots: the sensor's best-fit skeleton. IDLE
    breathes and paces. AGGRO stalks, coils, lunges at a squad of green dots and mauls it; the squad's dots flicker, turn red and
    join the count.
  - THE HOST, 1,000,000 dots, all moved on the GPU. A placeholder body built from capsules and ellipsoids (crown, skull, open
    ribcage with a core, long arms on claws, small chest arms). Its lower half is a funnel still pouring up out of the rift.
    The contact sequence: the count climbs, the sensor chokes (static, pixelation, real dropped frames), the dots resolve into
    the shape, "It's one mass." AGGRO: it raises an arm and slams, with a roar and a core pulse.
  - INTEL BRIEF 00: 1,048,576 dots unfolding from one dot, five levels, turning through four dimensions, with the drone's log.
  - SENSOR and THERMAL looks; interference grows as you get close.
- **Round-1 image request:** `docs/art-requests/RMD_ROUND1_IMAGE_REQUEST.html`.

## Next
1. When the round-1 art comes back: build the Host's real model the Ironhowl 4 way (trace H01 to H03 → shape → fill it with a
   million dots by sampling its surface), and keep the funnel, the core and the eyes as they are now.
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
