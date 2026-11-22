# Rift Mech Defense: what Christopher has decided

Only Christopher's decisions go here (20 Nov 2026 unless dated). Proposals live in `BOARD.md` and the session briefs.

## The game
- **Not a sequel.** An alternate-universe Ironhowl. Working name **Rift Mech Defense**; the player's side is the
  **International Rift Mech Defense** (IRMD). The name is loose and may change.
- **Top-down** (high three-quarter camera), over-the-top arcade, a visually rich, rewarding 3D world.
- **The combat camera is not straight down (22 Nov).** It sits lower and behind the Wraith and looks ahead, so you can see what's
  coming across the fields; it can be turned. There is a **minimap** showing what's nearby.
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
- **Green dots are allies.** Rescuing them, or watching one succumb, carries the story. *(Changed 20 Nov, night: see "The team and the artillery". In the fights your allies are now three other Wraiths; green dots are friendly Wraith teams seen on the long-range map.)*
- **The big bad (end of chapter 1):** a huge mass of dots (100,000 to a million) that resolves into a shape. It's the first time
  the sensor ever resolves one, only because it is so big and far away: "something else is on the sensor… more than I've ever
  seen… wait, it's one mass." It needs a **detailed model**. In the fight the camera struggles: stutter and dropped frames, as if
  the game can't render it, because of what they are.

## Art and models
- Models are made the Ironhowl 4 way (concept sheet from ChatGPT → trace → model), shown alone in a void where they can be turned.
- First thing built: the creatures as single clusters, still and attacking.
- **The ladder of sizes** (20 Nov): 1, 10, 20, 50, 100, 500, 1,000, 5,000, 10,000, 50,000, then a jump to 1,000,000 (the Host).
- **The look to keep:** the 10 is an amorphous blob; the 500 BRUTE on thermal is frightening, a mass walking. They aren't dots:
  they're a hive creature we render as dots. That look carries all the way up to the Host.
- **The Host:** the reveal, the static, the glitches and the shifting are right. The first body was too pointy and not frightening:
  it should be a blob, a mass, not spikes.
- **The Host as reworked is the direction** (20 Nov, evening): lumps instead of spikes; a crawling, undulating, pulsating mass with
  tentacles going in every direction, as massive as it is. **It is not always the same shape.** Claude designs the models freely.
  (The five ChatGPT directions didn't produce useful pictures; not needed for now.)
- **The 50K gives the first taste of that shapelessness:** a BRUTE that is tendrilling out.

## Bosses and difficulty (20 Nov)
- **10K is the light (first) boss, 50K the mid boss**, the Host the end of chapter 1. Each should be an interesting story reveal.
- Focus on balancing combat difficulty. **Anyone should be able to reach the end**, but beating the Host should be hard and
  **require understanding one or more mechanics** that the game develops and presents along the way, so a player will have learned them.
- The Wraith has to be **heavily upgraded** by the time it faces the Host.

## Where the fights happen (20 Nov, evening)
- **The combat happens on large 3D world maps: big open fields.** Not a small arena: wide, real 3D ground the swarms come
  across, the Wraith fighting over it from the top-down camera.

## Lore direction (20 Nov)
- **Cosmic horror:** something beyond time and space, multidimensional, geometry that isn't Euclidean. Lovecraft's own lore isn't
  needed; the concept is what matters.
- **The AI thread:** the only reason we can fight this is that we developed AI. Lean into fate or a conscious-universe idea: we were
  destined to reach this point.
- **Christopher said yes to the whole lore and boss proposal** (20 Nov): https://claude.ai/artifact/Jm2YjnGsapnnm7d2BLBGo3. His answers:
  - **The name** names the event: a calamity across the planet. The big one is named through that experience.
    **Picked: the Static** (every screen on Earth showed static the night it began; people call the swarms static too), and the
    big one is **the Signal** (the first thing that ever came through clear).
  - **The AI is the reason we can stand a chance.**
  - **OVERWATCH** is a warm voice, living through the threat alongside the player.
  - **Squads** are fresh each mission.
  - **Chapter 1** is at least 30 minutes of play; each combat wave is 2 to 5 minutes. (Proposal in the doc: 8 missions of 2 to 4 waves.)
  - **Difficulty:** Easy, Medium and Hard.
  - **Creature names** MOTE to TITAN stay; "the Host" goes.

## Chapter 1 (20 Nov, evening): answers to session D's design doc
Design doc: https://claude.ai/artifact/V1djsBJe18UKgnxKdYQEmR
- **Length:** keep it as written (8 missions, about 64 minutes).
- **Tone:** heavy and dark, but positive, with young-adult overtones. Entertainment first.
- **The pilot:** mostly silent, with a few short phrases.
- **The loss in mission 5 is fixed** (no choice between squads).
- **The cost of winning carries into chapter 2** (OVERWATCH scarred, forgets the squads lost in mission 5).
- **The sensor is there from the beginning:** its upgrades aren't opened later by the Watcher.
- **Kit arrives with the story** (Lance, Watcher, Arc, drone, long hover), not with pilot levels.
- **Taken squads add dots** (+200 in missions, +25,000 to the Signal): yes.
- **Artillery limits** may vary by mission.
- **The Signal's reveal is a fully rendered cinematic, 45 to 60 seconds.**
- **Place names** stay as written (the Ember Coast, Port Arlen, Greywater Strand, Kessel Cut, the Saltpans, the Drowned
  Shelf, Hollin Ridge, Arlen Bay).
- **Radio is voiced.** Christopher makes the dialogue in ElevenLabs from a voice-acting sheet (each voice described, every line).

- **Voices** (20 Nov, night): the pilot is a **young man**; OVERWATCH's voice (a young woman) is good. **Static is added to the
  voices** in the game (a radio chain over the clean ElevenLabs takes).
- **One cinematic only: the Signal's reveal**, about 45 to 60 seconds, and it should be epic. It is **its own page**: the game cuts
  to it and back (an experiment with GitHub Pages). Size is no worry (15 MB or more for the one shot is fine). The ending of
  chapter 1 plays in the game, not as a second cinematic.

## The team and the artillery (20 Nov, night; Christopher to session C)
- **You fight as a team of four Wraiths:** the player and three others. You still have to help keep your allies alive. This makes
  more sense than the green-dot squads in the fights.
- **Artillery as a separate level of the waves:** once your area is cleared, you set up heavy long-distance artillery to support
  Wraith teams nearby. A battleship-style map of red and green dots: you aim so as not to hit your own (friendly fire).
- **Keep the current top-down perspective.**

## The film (21 Nov; Christopher to session D)
- **Make chapter 1 into a 30-minute film.** Every piece is a scene in the game (cutscenes between levels, and battle clips), and
  played in order they make one film that works on its own. Watched as a film, the battle clips stand in for the levels.
- **All rendered 3D and filmed the same way as the reveal.** Battles may be staged with the real game pieces.
- Session D coordinates it. The plan: `docs/story/film.md`.
- **No clips from video generators (21 Nov).** Christopher tried a Gemini clip and dropped it: it clashes with the art style. Every
  shot of the film is rendered by the scene kit, the way the reveal and the four test scenes are.

## Open questions (not decided)
- Creature names. The viewer uses placeholders: MOTE, KNOT, SKEIN, RUNNER, STALKER, BRUTE, THE HOST.
- How damage works on a cluster (proposal: shots knock dots off, so a 100-dot creature shrinks as it's hurt).
- What the real-world view shows of a swarm (proposal: nothing directly, only heat shimmer, churned ground and the wreckage).
- The repo name has a trailing dash (`rift-mech-defense-`); rename it if you like, GitHub redirects.
- Which Ironhowl 4 light build is the newest: the one sent as "the most updated" says it was built 9 Nov; the other says 17 Nov.
  Both are in `borrowed/ironhowl4/`.
