# Mission 1: First Light (session B, 22 Nov)

`builds/mission-1.html` is the first playable mission: C's Wraith and weapons on B's Greywater Strand, with D's radio.

## What happens
1. Title, then DEPLOY. Dawn on the beach. You and three Wraiths (KESTREL, VESPER, HALE).
2. REAL view for about 12 s: an empty beach, and something hits you that you can't see.
3. The sensor comes on with static. Red dots come up out of the surf. Wave 1: 12 KNOT in fours.
4. Gull (6 people, green dots) is on the pier head, loading two boats. "HOLD THE PIER" for 3:00.
   Wave 2: 16 KNOT and 6 SKEIN over 2:30. Some SKEIN go for Gull.
5. At 1:30 the first boat leaves with 3 of Gull. At 0:00 the second takes the rest.
6. End screen: time, Gull saved, creatures cleared, team standing, scrap. AGAIN or TITLE.
   You lose if every Gull member is taken before a boat leaves.

## How it plays
- The water slows you; past your hips you can't wade (jet, then hold JET to hover). The pier head is in 3 m of water: you can wade beside it.
- The pier is solid. It is cut away where it hides the Wraith.
- Gull fire rifles: 1 dot every 0.8 s each, out to 30 m. They can't hold alone.
- Minimap top right: the pier ring, rifts, contacts, allies. Tap it for range.
- A test player that wades to the pier head and shoots the nearest creature saves all 6 on MEDIUM with full hull. It is a gentle first mission; HARD is there.

## How it's built
`build.py` takes C's arena (`game/systems/build.py`: its files, page and assets) and B's world (`game/world/`), and puts them in one
page with `mission.js` (the join) and `m1.js` (the mission). Nothing in C's folders is changed. The build renames a few of C's
functions (`updPlayer` → `updPlayerC`, and so on) and swaps a few constants (`hgt`, `ARENA_R`, the camera's far plane); each
swap must match exactly once or the build stops. `mission.js` then wraps those functions.

Radio: D's takes `audio/voice/m1_*.mp3`, played through `RMD.RadioVoice`.

```
python3 game/world/build.py      # the world pages
python3 game/mission/build.py    # builds/mission-1.html (15 MB)
python3 -I game/mission/shots.py /tmp/m phone          # screenshots and a played-through run
```

## Not done
- Not yet run on the phone. Software WebGL here gives about 1 frame a second, which says nothing about the Pixel.
- Creatures walk through the pier's piles; the pier has no walkable deck for the Wraith.
- The boats leave on a timer; nothing yet on screen counts Gull boarding.
- The camera's swing-behind can leave you looking out to sea; turn it with the right thumb or the top strip.
