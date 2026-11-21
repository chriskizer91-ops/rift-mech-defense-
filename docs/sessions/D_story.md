# Session D: chapter 1 (story, waves, the Host fight)

**Paste this to start the session:** "You're session D on Rift Mech Defense (repo `chriskizer91-ops/rift-mech-defense-`).
Read `CLAUDE.md`, `README.md`, `docs/PLAN.md`, `docs/BOARD.md`, then do `docs/sessions/D_story.md`."

## Goal
Design chapter 1: about **an hour of play**, consecutive waves that grow more intense, a little story between them, ending
with the Host. Write it as the game's **design document** (a Claude Doc, like Ironhowl 4's:
https://claude.ai/artifact/C1P4JdkPFbZLWw1S7kvfJG), with working notes in `docs/story/`.

## You own
`docs/story/`, the design document, and your line on `docs/BOARD.md`. Read anything; change nothing else.

## Start from
Christopher's lore and boss direction is in `docs/PLAN.md` (20 Nov). Session A wrote a proposal on it: the lore (pieces of a
thing from more dimensions; why dots, why shapes change, why they take people), the AI-and-fate thread, the boss ladder
(BRUTE 500 → BEHEMOTH 10K, light boss → TITAN 50K, mid boss → THE HOST 1M), the six mechanics the Host fight needs, the fight
in four phases, difficulty, and the Wraith's upgrades: https://claude.ai/artifact/Jm2YjnGsapnnm7d2BLBGo3. Christopher said yes to all of it, with answers recorded in `docs/PLAN.md` (chapter 1 at least 30 minutes, waves of 2 to 5
minutes, squads fresh each mission, a warm OVERWATCH, the AI as the reason we stand a chance, Easy/Medium/Hard). The calamity is **the Static** and the big one is **the Signal**. Build the design
document from it.

## Read first
- `docs/PLAN.md` (every decision so far, with Christopher's own words about the Host's reveal).
- `builds/swarm-viewer.html`: open it. Play THE HOST (its contact sequence and the OVERWATCH lines) and INTEL BRIEF 00. These
  are first drafts of the reveal and the brief; take them further or change them.
- Ironhowl 4's design doc (above) for the shape of the loop: intel brief → mission → salvage → upgrade bay.

## What to write
1. **The lore, short:** the IRMD (loose and a bit goofy, Christopher says: lean into it lightly or play it straight, propose one);
   the rifts and the magma under the sea; what the swarm is (the swarm made one; geometry that can't be measured, which is why
   sensors fail); the wreckage they leave (grey goo); why you only see them as dots.
2. **The cast:** the pilot, the voice on the radio (the viewer calls it OVERWATCH as a placeholder), squads in the field (the green
   dots). Few people, clear voices.
3. **Chapter 1, mission by mission** (aim for 8 to 10 missions of 5 to 8 minutes): place, goal, waves (which creature sizes, how
   many), the story beat, the new thing the player learns (wading, the thermal toggle, sealing a rift with artillery, rescuing a
   squad, losing one). Escalate the cluster sizes: 10s and 20s first, 100s mid-chapter, the first 500 as a mini-boss.
4. **The ally beats:** at least one rescue that works and one where you watch a squad's dots turn red. Write the radio lines.
5. **The Host fight**, end of chapter 1: the reveal (Christopher's words in `PLAN.md`), then the fight. The stutter and dropped
   frames are part of the fiction: design them into the fight (for example, the sensor can only resolve the Host in bursts, and the
   player has to fire in those windows). What the player does to win; what it costs; how chapter 1 ends.
6. **The intel brief** before chapter 1: the script for the short "this is everything we have" film.
7. A list of **open questions** for Christopher.

## Done when
The design document exists with all of the above, linked from `docs/BOARD.md`, and the open questions are in it.

## Proposals (waiting on Christopher)

### Chapter 1 as a 30-minute film (21 Nov): **approved the same day; the plan is now `docs/story/film.md`**
- Every piece is a game scene. The cutscenes and combat clips play in the game between levels, and played in order they make one film.
- Shape: a 1:30 opening; missions 1 to 7 each get a ~1:00 arrival, a ~1:45 battle and a ~0:30 aftermath; mission 8 gets the
  reveal (2:44), the Signal fight (3:00) and the ending (1:30). About 31 minutes.
- Battles are staged with the real game pieces (B's maps, C's Wraith and weapons, A's creatures), driven by a script, filmed with
  the reveal's look. Later the same scripts can replay real play.
- Needs first: one shared scene format (the reveal's engine split out of `cin-main.js`), a 30-minute script and shot list, a
  voice sheet for the new lines (~100), and a "director mode" from A/B/C (script the Wraith and the swarm, same result every run).
- Render: about 22 min of headless rendering per film minute on one session (about 11 h in all), so split it across sessions.
  Videos stay out of git (100 MB limit).
