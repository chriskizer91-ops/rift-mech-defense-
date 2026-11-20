# Rules for every session on Rift Mech Defense

Several Claude sessions work on this repo at once. These rules keep them out of each other's way.

## Before you start
- Read `README.md`, `docs/BOARD.md`, `docs/PLAN.md` and your brief in `docs/sessions/`.
- Pull first (`git pull --rebase`), and pull again before every push. Push small commits often.

## Who owns what
- Each session works only in the folders its brief names. If you need a change in another session's folder, write it in
  `docs/BOARD.md` under "Asks" instead of making it.
- `borrowed/` is read-only. It holds copies from Mud Lab and Ironhowl 4. Copy what you need into your own folder under
  `game/` and change the copy. Note where it came from in `borrowed/INDEX.md` → "Used by".
- `docs/PLAN.md` holds **only what Christopher has decided**. Proposals go in your brief's "Proposals" section or in
  `docs/BOARD.md` until he says yes.
- Update your own line on `docs/BOARD.md` when you finish something.

## How things are built
- The game runs in the browser on a **phone first** (Pixel 7a, Chrome) and a laptop (MSI, Edge). Touch controls first.
- Every page ships as **one self-contained HTML file** in `builds/`, working offline. Sources live next to their work, and a
  build script inlines them (see `tools/build_viewer.py`, which inlines three.js r187 from `borrowed/ironhowl4/js/`).
- three.js r187 is the engine (the same bundle as Ironhowl 4: `window.THREE`, with GLTFLoader and the post passes).
- Check your work with screenshots made with no screen (`tools/shoot.py`, headless Chrome with software WebGL). Software
  WebGL is many times slower than the phone, so its frame rate is only a floor.

## The look (decided)
- The world is real, rich 3D: Mud Lab's soil and water, Earth-like but no real place, magma cracks under the sea.
- The swarm creatures are **only ever drawn as dots** (red), on a threat overlay. Allies are **green dots**. A creature's dot
  count is its size and its power. Close to the camera they break the sensor up (static, tearing, dropped frames).
- Follow `concept/swarm-viewer.src.html` for how dots, the sensor look, thermal and interference are drawn, so every part of the
  game looks like one thing.

## Writing
- Plain words. Say what a thing does, not how clever it is. Short sentences, numbers where they help.
- Christopher reads on a phone: keep notes and messages short, and lead with the result.
