# Rift Mech Defense

Christopher's top-down mech game: an alternate-universe Ironhowl (not a sequel). You pilot the Wraith for the
**International Rift Mech Defense** (IRMD) on an Earth-like world that is no real place. The calamity is called **the Static**:
the seafloor has cracked open, magma glows under the water, and swarms pour up out of the rifts. The end of chapter 1 is **the Signal**. You never see them directly: on your threat overlay
they are dots.

**Open first:** `builds/swarm-viewer.html` (one self-contained file, works offline, made for a phone; also at
https://claude.ai/artifact/TTjCztKET9MYQkawNMNBAX): the threat library.
Every creature in it is made of dots: MOTE 1, KNOT 10, SKEIN 20, RUNNER 50, STALKER 100, BRUTE 500, DRAG 1,000,
HULK 5,000, BEHEMOTH 10,000, TITAN 50,000, then THE SIGNAL 1,000,000 with its contact sequence, and INTEL BRIEF 00. IDLE or AGGRO, SENSOR or THERMAL; get close and the sensor
breaks up. A link with `#host`, `#brute,aggro`, `#stalker,thermal` and so on opens a creature directly.

## Where it stands
- **Concept 1 is built: the swarm creatures** (`concept/swarm-viewer.src.html`). The Host is a placeholder: a hunched heap of
  about 2,000 brute-sized clumps. Its real design comes from one of the five open directions (`docs/art-requests/RMD_HOST_DIRECTIONS.html`).
- The assets from Mud Lab and Ironhowl 4 are copied in (`borrowed/`, see `borrowed/INDEX.md`). Nothing is built from them yet.
- `docs/BOARD.md` has the jobs and which session owns each; `docs/PLAN.md` has what Christopher has decided.

## Start here (every session)
1. `CLAUDE.md`: the rules.
2. `docs/BOARD.md`: who is doing what.
3. `docs/PLAN.md`: the decisions so far, and the open questions.
4. Your session's brief in `docs/sessions/`.

## How the repo is laid out
| Folder or file | What it holds |
|---|---|
| `concept/` | concept pages (source). `swarm-viewer.src.html` is the creature viewer |
| `builds/` | built, self-contained pages to open on a phone |
| `tools/` | `build_viewer.py` (inlines three.js into a concept page), `shoot.py` (screenshots with no screen), `build_request.py` (turns an image request into a page) |
| `docs/` | `PLAN.md`, `BOARD.md`, `sessions/` (one brief per session), `art-requests/` |
| `art/` | reference pictures and, later, the concept art that comes back from ChatGPT |
| `borrowed/` | copies from Mud Lab and Ironhowl 4. Read-only: copy what you need into `game/` before changing it |
| `game/` | the game itself (not started) |

```
python3 tools/build_viewer.py                                   # concept/swarm-viewer.src.html -> builds/swarm-viewer.html
python3 -I tools/shoot.py builds/swarm-viewer.html out.png "#host" 12 phone "contact.t0=simT-17"
python3 tools/build_request.py docs/art-requests/RMD_ROUND1_IMAGE_REQUEST.md
```
