# Rift Mech Defense: what Christopher has decided

Only Christopher's decisions go here (20 Nov 2026 unless dated). Proposals live in `BOARD.md` and the session briefs.

## The game
- **Not a sequel.** An alternate-universe Ironhowl. Working name **Rift Mech Defense**; the player's side is the
  **International Rift Mech Defense** (IRMD). The name is loose and may change.
- **Top-down** (high three-quarter camera), over-the-top arcade, a visually rich, rewarding 3D world.
- **The mech is Ironhowl 4's Wraith**, with Ironhowl 4's mech mechanics, weapon systems and controls. Other Ironhowl 4
  systems can be pulled across where they fit.
- **Chapter 1 is about an hour of play:** consecutive, more and more intense waves, a little story between them, building to
  the big boss at the end of the chapter.

## The world
- Earth-like, but no real continent or place. Magma cracks beneath the ocean; flooded coasts.
- **Mud Lab's soil and water** are copied in, so the ground tears up and the water behaves as in Mud Lab. The Wraith has to
  **wade** through water: that needs adding.
- **Rifts** are openings like cave mouths. Heavy artillery collapses them to seal them.
- Where a swarm has been, what is left is ordinary wreckage: machinery broken down, almost like grey goo.

## The enemies
- **The swarm made one:** each creature is itself a swarm. It is drawn as a cluster of dots, and the dot count is literally its
  size and its power (10, 20, 100, 500 dots…).
- You only see them on the **threat overlay**: rough renderings at a distance. A toggle switches between the real view and a
  heat map. When they come close, the sensor fogs and breaks up.
- **Lore for why the sensor fails:** their geometry can't be measured (dots made of dots). A short intel brief before combat
  can show "the only information we have".
- **Green dots are allies.** Rescuing them, or watching one succumb, carries the story.
- **The big bad (end of chapter 1):** a huge mass of dots (100,000 to a million) that resolves into a shape. It's the first time
  the sensor ever resolves one, only because it is so big and far away: "something else is on the sensor… more than I've ever
  seen… wait, it's one mass." It needs a **detailed model**. In the fight the camera struggles: stutter and dropped frames, as if
  the game can't render it, because of what they are.

## Art and models
- Models are made the Ironhowl 4 way (concept sheet from ChatGPT → trace → model), shown alone in a void where they can be turned.
- First thing built: the creatures as single clusters (1, 10, 20, 50, 100, 500) and the million-dot one, still and attacking.

## Open questions (not decided)
- Creature names. The viewer uses placeholders: MOTE, KNOT, SKEIN, RUNNER, STALKER, BRUTE, THE HOST.
- How damage works on a cluster (proposal: shots knock dots off, so a 100-dot creature shrinks as it's hurt).
- What the real-world view shows of a swarm (proposal: nothing directly, only heat shimmer, churned ground and the wreckage).
- The repo name has a trailing dash (`rift-mech-defense-`); rename it if you like, GitHub redirects.
- Which Ironhowl 4 light build is the newest: the one sent as "the most updated" says it was built 9 Nov; the other says 17 Nov.
  Both are in `borrowed/ironhowl4/`.
