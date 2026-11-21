# Chapter 1 radio script

Made by `docs/story/voice/build.py` from `docs/story/voice/lines.txt`: edit that file, not this one.
Voices and ElevenLabs prompts: `docs/story/voice/voice-script.html`.
Design doc: https://claude.ai/artifact/V1djsBJe18UKgnxKdYQEmR

## Intel Brief 00
*the 75-second film before mission 1*

- *Black. A hiss. Card: IRMD INTEL BRIEF 00.*
- *A city at night, every window, phone and billboard showing static.*
- `BRIEF_01_OW` **OVERWATCH:** "One night, every screen on Earth showed static for nine minutes. People call that night... the Static."  (narration, close and calm)
- *The sea from high above. Cracks glowing orange under the water.*
- `BRIEF_02_OW` **OVERWATCH:** "When the pictures came back, the seafloor had cracked open. Something came up through the cracks."
- *Real view of a beach. A truck sags into grey grit. Nothing else there.*
- `BRIEF_03_OW` **OVERWATCH:** "Cameras don't see them. Eyes don't see them. You'll see what they leave behind."
- *The same beach on the sensor: red dots everywhere.*
- `BRIEF_04_OW` **OVERWATCH:** "I see them. Not well. One dot for every place they touch our world. That's the best I can do."
- *The drone log plays as text with beeps (not voiced).*
- *The sensor view of Greywater Strand at dawn, the Wraith's green marker on the sand.*
- `BRIEF_05_OW` **OVERWATCH:** "That's everything we have. It isn't much. But we can see them... and nobody else can. So we start there."  (hopeful on the last four words)
- *The IRMD badge. WE SEE THEM. NOW WE FIGHT.*

## Any mission
*lines the game plays when they happen*

- `GEN_01_OW` **OVERWATCH:** "New size on the board. Card's up."
- `GEN_02_OW` **OVERWATCH:** "Wraith, you're hurting. Back off, let the shield come up."
- `GEN_03_OW` **OVERWATCH:** "It's eating. The count's going up."
- `GEN_04_OW` **OVERWATCH:** "Board's clear. Breathe."
- `GEN_05_OW` **OVERWATCH:** "Okay. Okay. We can do this."
- `GEN_06_OW` **OVERWATCH:** "I hear you."  (reply to a PING, now and then)
- `GEN_07_ANVIL` **ANVIL:** "ANVIL, guns up. Give me a mark."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- `GEN_08_ANVIL` **ANVIL:** "Shot, over! Twenty seconds! Don't stand there!"  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- `GEN_09_ANVIL` **ANVIL:** "Splash."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- `GEN_10_ANVIL` **ANVIL:** "That's a hole in the ground now. Rift's closed."
- `GEN_11_ANVIL` **ANVIL:** "That's the last of them. You're on your own, son."
- `GEN_12_LANTERN` **LANTERN:** "Painting it. Send it!"  (squad marks a target; generate once per squad voice)
- `GEN_13_TERN` **TERN:** "Painting it. Send it!"
- `GEN_14_PIKE` **PIKE:** "Painting it. Send it!"
- `GEN_15_REED` **REED:** "Painting it. Send it."

## The pilot's PING answers
*the radio button; the game picks one*

- `PING_01_PILOT` **PILOT:** "Copy."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- `PING_02_PILOT` **PILOT:** "Still here."
- `PING_03_PILOT` **PILOT:** "On it."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- `PING_04_PILOT` **PILOT:** "Moving."
- `PING_05_PILOT` **PILOT:** "Heard you."
- `PING_06_PILOT` **PILOT:** "We're okay."

## First Light
*Greywater Strand, dawn*

- *Opens in the REAL view: a grey beach, sand churning toward the pier.*
- `M1_01_OW` **OVERWATCH:** "Morning, Wraith. Gull's loading the last boats off the pier."
- `M1_02_OW` **OVERWATCH:** "Something's coming up the beach. You won't see them with your eyes."
- `M1_03_OW` **OVERWATCH:** "Switching you to mine."
- *SENSOR view. The beach is full of red dots.*
- `M1_04_OW` **OVERWATCH:** "There. Red is them. Green is us. Keep the red off the green."
- `M1_05_OW` **OVERWATCH:** "See it shrink? Ten dots, ten hits. That's the whole trick."  (first KNOT hit)
- `M1_06_GULL` **GULL:** "Gull to whoever's out there! Two boats left. Buy us three minutes!"
- `M1_07_OW` **OVERWATCH:** "Bigger ones. Twenties. They're going for the pier."
- `M1_08_GULL` **GULL:** "Last boat's off! Go, go, go!"
- `M1_09_OW` **OVERWATCH:** "Gull's away. Every boat. Good morning, Wraith."
- `M1_10_PILOT` **PILOT:** "Morning."  (the pilot's first word in the game; small, almost shy)

## High Water
*Port Arlen low town, morning*

- `M2_01_OW` **OVERWATCH:** "The low town flooded overnight. Someone's still in it."
- `M2_02_LANTERN` **LANTERN:** "Any IRMD unit, this is Lantern. Six of us on the cannery roof. The water's at the second floor and there's something in it."
- `M2_03_OW` **OVERWATCH:** "Lantern, OVERWATCH. I see you. Six green. Help's coming... and it's big."  (warm, a smile on "big")
- `M2_04_OW` **OVERWATCH:** "Wraith, the street's flooded. Wade the shallow parts. The canal's too deep: jets."
- `M2_05_OW` **OVERWATCH:** "That's past your hips. Hover, or you're swimming."
- `M2_06_OW` **OVERWATCH:** "Fifties. Fast. They go for whatever's slowest."  (RUNNER card)
- *The Wraith reaches the cannery.*
- `M2_07_LANTERN` **LANTERN:** "That's a mech. That's an actual MECH."
- `M2_08_PILOT` **PILOT:** "Climb down. I've got you."
- `M2_09_OW` **OVERWATCH:** "Contacts closing on the cannery. Hold them while Lantern climbs down."
- `M2_10_LANTERN` **LANTERN:** "Two down. Four. Everyone's down! Where do we go?"
- `M2_11_OW` **OVERWATCH:** "High street. Stay behind the big thing."
- `M2_12_OW` **OVERWATCH:** "Stay with them. Runners go for whoever's slowest."
- `M2_13_LANTERN` **LANTERN:** "High street. All six of us. Wraith... whoever's in there, we owe you."
- `M2_14_OW` **OVERWATCH:** "Six green. Six. That's the best number I've seen all day."
- `M2_15_LANTERN` **LANTERN:** "Point us at something. We'll paint it."
- `M2_16_OW` **OVERWATCH:** "They're sending you a Lance. For the big ones. They didn't say which big ones."  (salvage screen)

## The Dig
*Kessel Cut quarry, midday*

- `M3_01_OW` **OVERWATCH:** "Kessel Cut. The quarry wall opened up last night. It's a rift."
- `M3_02_ANVIL` **ANVIL:** "ANVIL. Six guns behind the ridge, every one older than me. Find me the hole."
- `M3_03_TERN` **TERN:** "Tern on the lip! We can see the mouth. Keep them off us and we'll mark it."
- `M3_04_OW` **OVERWATCH:** "It's pouring out of there. It won't stop until the mouth caves in."
- `M3_05_TERN` **TERN:** "Marked! Send it!"
- `M3_06_ANVIL` **ANVIL:** "Shot, over. Twenty seconds."
- `M3_07_ANVIL` **ANVIL:** "Splash. That's a hole in the ground now. Rift's closed."
- `M3_08_OW` **OVERWATCH:** "Stream's stopped. Nothing else is coming out of that one."
- `M3_09_OW` **OVERWATCH:** "A hundred. It doesn't rush. It waits."  (STALKER card)
- `M3_10_SLATE` **SLATE:** "Slate, quarry crew. Something's moving under the dump trucks."
- `M3_11_OW` **OVERWATCH:** "Five hundred. That's bigger than you, Wraith."
- `M3_12_OW` **OVERWATCH:** "It's eating the trucks. Five-forty. Six hundred."
- `M3_13_OW` **OVERWATCH:** "Kill it before it finishes the yard."
- `M3_14_OW` **OVERWATCH:** "Thermal. Look for the hot part."
- `M3_15_PILOT` **PILOT:** "I see it."
- `M3_16_OW` **OVERWATCH:** "There. The core. Hit that and it really hurts."
- `M3_17_OW` **OVERWATCH:** "Gone. It's just grit now."
- `M3_18_SLATE` **SLATE:** "Never thought I'd be glad to see a quarry full of gravel."

## Landfall
*Port Arlen, dusk*

- `M4_01_OW` **OVERWATCH:** "Something big has been sitting off Port Arlen since dark. It's coming in."
- `M4_02_PIKE` **PIKE:** "Pike on the high street. We held it this morning. We'll hold it again."
- `M4_03_OW` **OVERWATCH:** "It's sending things ahead of it. Stalkers in the alleys."
- `M4_04_OW` **OVERWATCH:** "There's a rift in the harbour, out in the shallows. That's what's feeding it."
- `M4_05_OW` **OVERWATCH:** "Ten thousand and climbing. Close that rift, Wraith."
- `M4_06_ANVIL` **ANVIL:** "Give me a mark on the harbour and I'll fill it in."
- `M4_07_ANVIL` **ANVIL:** "Rift's closed."
- `M4_08_OW` **OVERWATCH:** "It's stopped growing. It's losing dots. It can be killed."
- *The BEHEMOTH comes ashore through the cannery.*
- `M4_09_OW` **OVERWATCH:** "It's been eating the wrecks all night."
- `M4_10_PIKE` **PIKE:** "It's at the cannery. It's... the cannery's going grey."
- `M4_11_OW` **OVERWATCH:** "Thermal. The core's moving around inside it. Follow it."
- `M4_12_OW` **OVERWATCH:** "Five thousand. We're winning. I think we're winning."
- `M4_13_OW` **OVERWATCH:** "It's down. Ten thousand dots, and it's down. I need a minute."
- `M4_14_PILOT` **PILOT:** "Take it."
- `M4_15_OW` **OVERWATCH:** "They're fitting you a Watcher pod. Better eyes for both of us."  (salvage)

## Night Shift
*the Saltpans, night*

- `M5_01_OW` **OVERWATCH:** "The saltworks. People are still coming out. Copper's on the east side, Reed's on the west."
- `M5_02_OW` **OVERWATCH:** "It's night. Thermal will be clearer than the sensor."
- `M5_03_COPPER` **COPPER:** "Copper. Eight of us, bringing out the last of the night shift."
- `M5_04_REED` **REED:** "Reed. Out the west gate. Moving."
- `M5_05_OW` **OVERWATCH:** "Wait. Both of them. Both squads have contacts."
- `M5_06_COPPER` **COPPER:** "OVERWATCH, Copper. Contacts on the east pans. A lot of them."
- `M5_07_REED` **REED:** "Reed, west side. Movement here too. We've got the civilians."
- `M5_08_OW` **OVERWATCH:** "Wraith, Reed has the civilians and Copper's across the channel. It's too wide for your jets. Go west."
- `M5_09_COPPER` **COPPER:** "Copper to Wraith. She's right. You can't get to us. We'll hold. Go."
- *The Wraith fights at Reed. Across the channel, Copper's eight green dots hold for about a minute.*
- `M5_10_COPPER` **COPPER:** "We can't see anything, it's just the ground moving, it's..."  (the game cuts this into static)
- `M5_11_OW` **OVERWATCH:** "Copper, come in. Their dots are changing colour. Two. Five. All of them."
- `M5_12_OW` **OVERWATCH:** "They've gone red. They're part of it now. Wraith... that pack just got bigger."
- `M5_13_OW` **OVERWATCH:** "The pack's coming for you. And my picture's breaking up."
- `M5_14_OW` **OVERWATCH:** "Don't fire into the static. Wait for me to lock. Then fire."
- `M5_15_OW` **OVERWATCH:** "Now."  (a clear window; generate 3 takes)
- `M5_16_REED` **REED:** "Reed to Wraith. Copper bought us that minute. Don't forget them."
- `M5_17_PILOT` **PILOT:** "I won't."
- `M5_18_OW` **OVERWATCH:** "I'm logging Copper as lost. Eight names. I'll remember them... even if nobody else does."
- `M5_19_OW` **OVERWATCH:** "They're sending an Arc. Lightning, for the crowded ones."  (salvage)

## The Shelf
*the Drowned Shelf, before dawn*

- `M6_01_OW` **OVERWATCH:** "The sea pulled back off the shelf before dawn. Three rifts, out in the open."
- `M6_02_BRAMBLE` **BRAMBLE:** "Bramble, survey. The tide turns in eight minutes. Then all of this is underwater again."
- `M6_03_OW` **OVERWATCH:** "A thousand. Slow. Wide. Hit it with the Arc."  (DRAG card)
- `M6_04_OW` **OVERWATCH:** "Everything, all at once. You've seen all of this before. Just not together."
- `M6_05_ANVIL` **ANVIL:** "Two holes left. I've got the shells if you've got the marks."
- *The lull before wave 3.*
- `M6_06_OW` **OVERWATCH:** "Wraith. Do you think they built me for this?"
- `M6_07_OW` **OVERWATCH:** "Not traffic. Not weather. This."
- `M6_08_PILOT` **PILOT:** "Maybe. I'm glad they did."
- `M6_09_OW` **OVERWATCH:** "...Thank you. Water's coming."
- `M6_10_OW` **OVERWATCH:** "Five thousand. It's rising out of rift C."  (HULK card)
- `M6_11_BRAMBLE` **BRAMBLE:** "Tide's in. Water's at our knees and climbing."
- `M6_12_OW` **OVERWATCH:** "Seal C under it. Then the core."
- `M6_13_OW` **OVERWATCH:** "Shelf's clear. Three rifts closed. The sea can have it back."
- `M6_14_OW` **OVERWATCH:** "You're getting a drone. It fixes things. I asked if it could fix me. That was a joke."  (salvage)

## The Ridge
*Hollin Ridge, grey day*

- `M7_01_OW` **OVERWATCH:** "Something huge is walking up from the coast. Alder, Birch and Cedar are dug in on Hollin Ridge."
- `M7_02_ALDER` **ALDER:** "Alder, west end. Ready as we'll be."
- `M7_03_BIRCH` **BIRCH:** "Birch, in the middle."
- `M7_04_CEDAR` **CEDAR:** "Cedar, east end. Is it true it's fifty thousand?"
- `M7_05_OW` **OVERWATCH:** "It's true."
- `M7_06_PILOT` **PILOT:** "Then we hold."
- `M7_07_OW` **OVERWATCH:** "Fifty thousand. The sensor drops frames just looking at it."  (TITAN card)
- `M7_08_OW` **OVERWATCH:** "Fire when I lock. Every shot in the static is wasted."
- `M7_09_OW` **OVERWATCH:** "It's coming apart. No. It's reaching."
- `M7_10_OW` **OVERWATCH:** "The count doesn't match its size. There's more of it than there are dots."
- `M7_11_OW` **OVERWATCH:** "Four of them. Tendrils. They're going for the squads."
- `M7_12_BIRCH` **BIRCH:** "Something's coming up the slope at us!"
- `M7_13_OW` **OVERWATCH:** "That one's gone. It's not coming back."
- `M7_14_OW` **OVERWATCH:** "It's pulling itself back together. Thermal. Find the core."
- `M7_15_OW` **OVERWATCH:** "It's down. Wraith, I've been counting dots my whole life. That was the first time the count was wrong."
- `M7_16_OW` **OVERWATCH:** "They're giving your jets a long hover. Somebody knows what's next. I wish they'd tell me."  (salvage)

## The Signal
*Arlen Bay, night*

- `M8_01_OW` **OVERWATCH:** "Arlen Bay. Every contact on the coast is moving that way."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- `M8_02_HARROW` **HARROW:** "Harrow, harbour wall."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- `M8_03_MILLER` **MILLER:** "Miller, slipway."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- `M8_04_WREN` **WREN:** "Wren, lighthouse. It's very quiet out there."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)

## The reveal (cinematic, 56 s)
*Arlen Bay, night*

- *0:00 Low behind the Wraith on the harbour wall. Wind, water, servos.*
- `C1_01_OW` **OVERWATCH:** "New contact. Bearing zero-four-one, range two point four."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- *0:05 Over the shoulder into the sensor feed. The count climbs.*
- `C1_02_OW` **OVERWATCH:** "Count is climbing... forty thousand... two hundred thousand..."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened. let the numbers rise in pitch)
- *0:12 High aerial over the bay. Red pours up from four points.*
- `C1_03_OW` **OVERWATCH:** "That's more than I've ever seen on one screen."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- *0:18 The picture fails: static, tearing, held frames.*
- `C1_04_OW` **OVERWATCH:** "Sensor's choking! It can't resolve them!"  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- *0:25 Stutter cuts. The dots move together.*
- `C1_05_OW` **OVERWATCH:** "Wait. They're not moving like a swarm."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- *0:31 Hard cut. Everything still. One shape rises.*
- `C1_06_OW` **OVERWATCH:** "It's one mass."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- *0:36 Three seconds perfectly clear.*
- `C1_07_OW` **OVERWATCH:** "Wraith. It's coming through clear. Nothing's ever come through clear."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- *0:42 The ridge: ANVIL's guns, a young crew lit red.*
- `C1_08_ANVIL` **ANVIL:** "OVERWATCH, ANVIL. What am I looking at?"  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- *0:47 The mass turns toward the harbour.*
- `C1_09_OW` **OVERWATCH:** "The Signal."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- *0:52 It rears and slams. The camera swoops back into the game.*
- `C1_10_PILOT` **PILOT:** "Here it comes."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)

## The Signal fight
*phases 1 to 4*

- `M8F_01_OW` **OVERWATCH:** "Four rifts feeding it. Close them and it gets smaller."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- `M8F_02_ANVIL` **ANVIL:** "Four holes. All my shells. Mark them."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- `M8F_03_OW` **OVERWATCH:** "A hundred thousand, gone."  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened. each sealed rift)
- `M8F_04_OW` **OVERWATCH:** "The last one's across the channel. Long hover."
- `M8F_05_OW` **OVERWATCH:** "It's coming ashore. And it's changing!"  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened.)
- `M8F_06_OW` **OVERWATCH:** "It's standing up! Stay low, stay out of the air!"  (FILM RE-TAKE: generate 3 on Creative stability, keep the most frightened. risen)
- `M8F_07_OW` **OVERWATCH:** "It's spreading out. The arms are crawling for the squads."  (spread)
- `M8F_08_OW` **OVERWATCH:** "Hunched. The core's in the hump. Thermal, now."  (hunched)
- `M8F_09_WREN` **WREN:** "Something's coming up the lighthouse steps."
- `M8F_10_OW` **OVERWATCH:** "It's too close. I can't hold the picture."
- `M8F_11_OW` **OVERWATCH:** "I'll give you what I can. Listen for the thud."
- `M8F_12_OW` **OVERWATCH:** "Now."  (a clear window; generate 3 takes, each more tired)
- `M8F_13_OW` **OVERWATCH:** "I can hold it still for you. A long one. It's going to cost me."
- `M8F_14_OW` **OVERWATCH:** "Charge the Lance. Tell me when."
- `M8F_15_PILOT` **PILOT:** "Now."
- `M8F_16_OW` **OVERWATCH:** "Holding... holding..."
- `M8F_17_OW` **OVERWATCH:** "It's pulling back. Give me twenty seconds."  (after a miss; generate 3 takes, each more broken)

## The ending (cinematic, about 30 s)
*Arlen Bay*

- *The Lance goes in. Grit pours into the bay like rain. Silence.*
- *The last dots drift into one point and turn toward the sensor. One second of static on every screen.*
- `C2_01_OW` **OVERWATCH:** "Wraith. It wasn't looking at you."
- `C2_02_OW` **OVERWATCH:** "It was looking at me."
- `C2_03_OW` **OVERWATCH:** "...Are you still there?"
- *The player presses PING.*
- `C2_04_PILOT` **PILOT:** "I'm here."
- `C2_05_OW` **OVERWATCH:** "Good. Stay."
- *Over black, a sensor log line (text only): New contacts: 6. Bearing: every direction.*

## Hints after a death
*one per death, never the whole answer*

- `HINT_01_OW` **OVERWATCH:** "Kill it before it eats the yard."  (BRUTE)
- `HINT_02_OW` **OVERWATCH:** "The rift in the harbour is still feeding it."  (BEHEMOTH)
- `HINT_03_OW` **OVERWATCH:** "Wait for the lock."  (STALKERs at night)
- `HINT_04_OW` **OVERWATCH:** "Seal C first."  (HULK)
- `HINT_05_OW` **OVERWATCH:** "Cut the tendrils before they reach the squads."  (TITAN)
- `HINT_06_OW` **OVERWATCH:** "The rifts are still feeding it."  (Signal phase 1)
- `HINT_07_OW` **OVERWATCH:** "Watch the hump. It's hottest when it's hunched."  (Signal phase 2)
- `HINT_08_OW` **OVERWATCH:** "Wait for the thud. Then fire."  (Signal phase 3)
- `HINT_09_OW` **OVERWATCH:** "Start the charge before I open the window."  (Signal phase 4)
