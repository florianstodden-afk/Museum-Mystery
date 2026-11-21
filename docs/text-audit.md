# Text audit

**Historical audit of the former Station B (`landscape.js`).** The current game uses `curators-catalogue.js`; see [Curator’s Catalogue](story/curators-catalogue.md) for current text and art sources.

All visible game texts (English) with word count, collected on 17 Nov 2026 with a small script over `web/story/`, `web/index.html`, `web/main.js` and the station files. Goal: ≤ 25 words per visible block, one calm voice (museum at night, slightly mysterious), no spoilers (safe code, years, Voss) before the final question, and everyone treats the player as the new restoration assistant.

## Changed in this branch (my files: story, home screen, Station I)

| File | Before (words) | After (words) |
|---|---|---|
| `story/case-1.js` mission | 42 | 25 |
| `story/case-1.js` Station L task | 31 | 22 |
| `story/case-1.js` shift schedule note | 31 | 20 |
| `story/security-office/interactions.js` monitor wall | 33 | 22 |
| `story/security-office/interactions.js` shift schedule | 32 | 21 |
| `story/engine.js` right answer (after the final question) | 36 | 29, keeps who “M” is (tested) |
| `minigames/portrait-timeline.js` task | 41 | 24 |
| `minigames/portrait-timeline.js` points | 26 | 23 |
| `index.html` / `main.js` home notice (new) | – | 6: “Game updated. Your run starts fresh.” |

## Suggestions for other owners (not changed)

**Station L – Leopold (`minigames/picture-puzzle.js`)**

| Old | New |
|---|---|
| Drag a piece to an empty slot, or select it with a click or Enter. Use Tab to reach a destination, then Enter or Space to place it. Select a placed piece and an empty tray slot to return it. Wrong placements are free. (44) | Drag a piece to a slot, or select it and press Enter on a slot. Click a placed piece to send it back. Wrong placements are free. (25) |
| The clock starts with Start puzzle and keeps running when you leave or open help. Finish within 30s: +15 points; within 45s: +10; within 60s: +5; over 60s: 0. Points are awarded on completion. (34) | The clock starts with Start and keeps running when you leave. Within 30 s: +15 points, 45 s: +10, 60 s: +5, later: 0. (22) |

**Station B – Fabian (`minigames/landscape.js`)**

| Old | New |
|---|---|
| Solved: B. Voss approved the false label. Station deduction: −… points. | Solved: B. Someone approved the false label in a hurry. (names no suspect before the final question) |
| Voss approved the false wall label. (evidence line) | The false wall label was approved from the top. |
| Not quite. Check the year and medium again. −3 points. | Not quite. Check the year and the material again. |

**Station D – open (placeholder, `story/case-1.js` evidence texts)**

The four evidence lines in `story/case-1.js` (`evidence`, `pointsToVoss`) name Voss in the journal as soon as a station is solved. That gives the answer away before the final question. Changing it touches the accusation and its tests, so the team should decide: keep it (the chain is the deduction) or name Voss only after the accusation.

**Decided 21.11.2026:** the evidence no longer names Voss (“approved by a patron – not by museum staff”, “Ordered by: A. V.”). `pointsToVoss` still names him, but is shown only after the right accusation. There is one accusation only, and M’s message no longer says “before sunrise”.

## Full list

| File | Text | Words |
|---|---|---|
| `index.html` | Museum Mystery – The Night of the Forgery | 8 |
| `index.html` | The Night of the Forgery | 5 |
| `index.html` | Accounts coming soon · play as guest | 7 |
| `index.html` | Accounts are coming later. You can play the complete game as a guest now. | 14 |
| `index.html` | Continue as guest | 3 |
| `index.html` | Progress is saved on this device only. | 7 |
| `index.html` | The Night of the Forgery | 5 |
| `index.html` | Start New Game | 3 |
| `index.html` | Move with WASD or arrow keys. Press E to inspect. | 10 |
| `index.html` | This device only. Online leaderboard is coming later. | 8 |
| `index.html` | Start a new game? | 4 |
| `index.html` | Your current case progress will be erased. | 7 |
| `index.html` | Start new game | 3 |
| `index.html` | Fictional museum and characters. Artwork data and image: | 8 |
| `index.html` | The Metropolitan Museum of Art, Open Access | 7 |
| `index.html` | Bring the Van Gogh painting out tonight. | 7 |
| `index.html` | Read M’s message | 3 |
| `index.html` | Evidence &amp; Notes | 3 |
| `index.html` | Stats &amp; Credit | 3 |
| `index.html` | (The Metropolitan Museum of Art, Open Access) | 7 |
| `index.html` | The Night of the Forgery | 5 |
| `index.html` | Exit to Main Menu | 4 |
| `main.js` | Math.abs(dy)?(dx | 1 |
| `main.js` | guardMotion.from.x?'right':guardMotion.to.y | 1 |
| `main.js` | bold 12px Georgia, serif | 4 |
| `main.js` | Opening the vault… | 3 |
| `main.js` | Walk right through the open doorway. | 6 |
| `main.js` | guardMotion.from.x?'right':guardMotion.to.y | 1 |
| `main.js` | Sound off. Turn sound on | 5 |
| `main.js` | Sound on. Turn sound off | 5 |
| `main.js` | Close in-game menu | 3 |
| `main.js` | Open in-game menu | 3 |
| `main.js` | Game updated. Your run starts fresh. | 6 |
| `main.js` | Resume Game - view ending | 5 |
| `minigames/landscape.js` | Wheat Field with Cypresses | 4 |
| `minigames/landscape.js` | Vincent van Gogh | 3 |
| `minigames/landscape.js` | Oil on canvas | 3 |
| `minigames/landscape.js` | Road in Etten | 3 |
| `minigames/landscape.js` | Vincent van Gogh | 3 |
| `minigames/landscape.js` | Chalk, pastel and watercolor | 4 |
| `minigames/landscape.js` | The fictional wall label claims “1881, watercolor.” Compare the Met catalogue data and correct it. | 15 |
| `minigames/landscape.js` | View in the Met catalogue | 5 |
| `minigames/landscape.js` | Solved: B. Voss approved the false label. Station deduction: −${20 - stationScore(state)} points. | 13 |
| `minigames/landscape.js` | Incorrect attempts: ${state.mistakes} · Hints: ${state.hints}. | 6 |
| `minigames/landscape.js` | Please choose both answers. | 4 |
| `minigames/landscape.js` | Voss approved the false wall label. | 6 |
| `minigames/landscape.js` | Not quite. Check the year and medium again. −3 points. | 10 |
| `minigames/landscape.js` | Hint: Compare the year and medium of Wheat Field with Cypresses. | 11 |
| `minigames/picture-artwork.js` | Sea and Cliffs | 3 |
| `minigames/picture-artwork.js` | Unexpected image source | 3 |
| `minigames/picture-artwork.js` | Met API unavailable | 3 |
| `minigames/picture-artwork.js` | The painting could not be loaded online or from the bundled copy. Please retry. | 14 |
| `minigames/picture-puzzle.js` | Restore Renoir’s picture to uncover the hidden mark on the transport slip. | 12 |
| `minigames/picture-puzzle.js` | Points are given based on speed | 6 |
| `minigames/picture-puzzle.js` | Back to museum | 3 |
| `minigames/picture-puzzle.js` | Picture board: two rows, four columns | 6 |
| `minigames/picture-puzzle.js` | ${ARTWORK.artist}, ${ARTWORK.title}, ${ARTWORK.date}. Public domain · | 6 |
| `minigames/picture-puzzle.js` | The Metropolitan Museum of Art | 5 |
| `minigames/picture-puzzle.js` | Restore the picture | 3 |
| `minigames/picture-puzzle.js` | Drag a piece to an empty slot, or select it with a click or Enter. Use Tab to reach a destination, then Enter or Space to place it. Select a placed piece and an empty tray slot to return it. Wrong placements are free. | 44 |
| `minigames/picture-puzzle.js` | The clock starts with Start puzzle and keeps running when you leave or open help. Finish within 30s: +15 points; within 45s: +10; within 60s: +5; over 60s: 0. Points are awarded on completion. | 34 |
| `minigames/picture-puzzle.js` | Back to puzzle | 3 |
| `minigames/picture-puzzle.js` | Restored! The transport slip reveals a hidden “V”. You receive: | 10 |
| `minigames/picture-puzzle.js` | +${pictureSpeedPoints(elapsedMs(state, now()))} points earned | 4 |
| `minigames/picture-puzzle.js` | Return to museum | 3 |
| `minigames/picture-puzzle.js` | ${Math.min(100, elapsed / 700)}% | 4 |
| `minigames/picture-puzzle.js` | ${Math.floor(elapsed / 1000)} seconds; ${pictureSpeedPoints(elapsed)} points on completion | 8 |
| `minigames/picture-puzzle.js` | Choose an empty slot. | 4 |
| `minigames/picture-puzzle.js` | Tray slot ${index + 1}: empty | 6 |
| `minigames/picture-puzzle.js` | ${label(selected)} selected. Choose an empty slot. | 6 |
| `minigames/picture-puzzle.js` | Loading the painting… | 3 |
| `minigames/portrait-artwork.js` | Unexpected image source | 3 |
| `minigames/portrait-artwork.js` | Met API unavailable | 3 |
| `minigames/portrait-rules.js` | 21:02 · Leon – east wing round | 7 |
| `minigames/portrait-rules.js` | 21:14 · Cart out – “patron visit, A. V.” | 9 |
| `minigames/portrait-rules.js` | 21:20 · Leon – back at the desk | 8 |
| `minigames/portrait-timeline.js` | Memorise the dates, then sort oldest to newest. | 8 |
| `minigames/portrait-timeline.js` | Portraits, oldest on the left | 5 |
| `minigames/portrait-timeline.js` | ).join(', ')}. | 2 |
| `minigames/portrait-timeline.js` | Not yet. +5 s | 4 |
| `minigames/portrait-timeline.js` | state.flashUntil !== null && now() | 5 |
| `minigames/portrait-timeline.js` | ${cards[id].artwork.shortTitle} picked up. | 3 |
| `minigames/portrait-timeline.js` | Return to museum | 3 |
| `minigames/portrait-timeline.js` | Sorted! The night-shift log clears Leon. You receive: | 8 |
| `minigames/portrait-timeline.js` | Time ${formatClock(time)}${record === time ? ' · New best!' : | 10 |
| `minigames/portrait-timeline.js` | Back to station | 3 |
| `minigames/portrait-timeline.js` | Sort the portraits | 3 |
| `minigames/portrait-timeline.js` | The dates show for 4 seconds, then the clock runs. Sort oldest to newest: drag, click two cards or press 1, 2, 3. Enter checks. | 25 |
| `minigames/portrait-timeline.js` | Peek shows one date (+5 s). A wrong check adds 5 s. Within 20 s: +15 points, 35 s: +10, 50 s: +5, later: 0. | 25 |
| `minigames/portrait-timeline.js` | Back to museum | 3 |
| `minigames/portrait-timeline.js` | Dates vanish in ${Math.ceil((state.flashUntil - t) / 1000)} s | 9 |
| `minigames/portrait-view.js` | Peek at the date of ${artwork.shortTitle} (+5 seconds) | 8 |
| `minigames/station-ui.js` | Back to museum Esc | 4 |
| `minigames/station-ui.js` | Points are given based on speed | 6 |
| `minigames/station-ui.js` | Back to museum | 3 |
| `minigames/station-ui.js` | Artist, Title, date · …. Public domain · The Metropolitan Museum of Art | 13 |
| `minigames/station-ui.js` | The Metropolitan Museum of Art | 5 |
| `minigames/station-ui.js` | ${parts}. Public domain · | 4 |
| `minigames/station-ui.js` | ${w.toFixed(2)}fr | 1 |
| `minigames/station-ui.js` | ${marks[i].toFixed(3)}% | 1 |
| `minigames/station-ui.js` | ${Math.min(100, (ms / 10) / scale)}% | 6 |
| `minigames/station-ui.js` | ${seconds} seconds; ${tierPoints(tiers, ms)} points on completion | 7 |
| `story/case-1.js` | The Night of the Forgery | 5 |
| `story/case-1.js` | Museum Nocturne, New York | 4 |
| `story/case-1.js` | Fictional museum and characters · Artworks: The Met, Open Access | 10 |
| `story/case-1.js` | A message from M | 4 |
| `story/case-1.js` | The Van Gogh in the Gallery is a copy. The real ‘Wheat Field with Cypresses’ is locked in the curator’s safe. She hid four clues in the museum – together they open it. Everyone thinks you are the new conservation temp. Bring me the painting tonight. – M | 48 |
| `story/case-1.js` | Voss approved the false wall label. | 6 |
| `story/case-1.js` | The false label went up with Voss’s approval – he wanted the swap to look official. | 16 |
| `story/case-1.js` | Compare the wall label with the Met catalogue and correct the year and the material. | 15 |
| `story/case-1.js` | Night-shift log: Leon was on the east stairs at 21:14, when the cart left. The cart was booked as a ‘patron visit’. | 22 |
| `story/case-1.js` | Leon was on his round; the cart was booked as a “patron visit” – and Voss is the patron. | 19 |
| `story/case-1.js` | Put the three portraits in the order they were painted, oldest first – their backs hold the night-shift log. | 19 |
| `story/case-1.js` | Gallery Picture Puzzle | 3 |
| `story/case-1.js` | Hidden mark “V” on the fake transport slip. | 8 |
| `story/case-1.js` | Someone marked the fake slip with a hidden “V” to recognise their own paperwork. | 14 |
| `story/case-1.js` | Station L hangs left of the wall label in the Gallery. Restore Renoir’s eight-piece picture to reveal a mark on the transport slip. | 23 |
| `story/case-1.js` | Frame label: “Ordered by: A. Voss”. | 6 |
| `story/case-1.js` | The frame for the forgery was ordered by A. Voss – so the “V” is his, not Vale’s. | 18 |
| `story/case-1.js` | Find the empty frame that matches the forgery and read who ordered it. | 13 |
| `story/case-1.js` | A covered transport cart left the delivery exit at 21:14. No delivery was announced. | 14 |
| `story/case-1.js` | Leon on the night round, Imani in the studio until 22:00. One line says only “21:00 – patron visit”. The Portrait Hall log should say more. | 26 |
| `story/case-1.js` | Night guard. Saw a covered cart leave at 21:14 – and was on duty all night. | 16 |
| `story/case-1.js` | The night-shift log puts Leon on the east stairs at 21:14, and a guard cannot book a patron visit. | 19 |
| `story/case-1.js` | Dr. Mara Vale | 3 |
| `story/case-1.js` | Locked the original in the safe and left four clues. Her initial is also a “V”. | 16 |
| `story/case-1.js` | The ‘V’ is not Vale. The frame label names ‘A. V.’, not M. V. – and Vale hid the original to protect it. | 21 |
| `story/case-1.js` | Generous donor of the museum. Signs his messages with a single letter. | 12 |
| `story/case-1.js` | Who planned the false label and the transport slip, and lured you to the safe? | 15 |
| `story/case-1.js` | Wheat Field with Cypresses | 4 |
| `story/case-1.js` | Wheat Field with Cypresses | 4 |
| `story/case-1.js` | Vincent van Gogh | 3 |
| `story/case-1.js` | Oil on canvas | 3 |
| `story/case-1.js` | Road in Etten | 3 |
| `story/case-1.js` | Road in Etten | 3 |
| `story/case-1.js` | Vincent van Gogh | 3 |
| `story/case-1.js` | Chalk, pencil, pastel, watercolor. Underdrawing in pen and brown ink. | 10 |
| `story/case-1.js` | A Woman Seated beside a Vase of Flowers | 8 |
| `story/case-1.js` | A Woman Seated beside a Vase of Flowers (Madame Paul Valpinçon?) | 11 |
| `story/case-1.js` | Oil on canvas | 3 |
| `story/case-1.js` | Madame X (Virginie Amélie Avegno Gautreau) | 6 |
| `story/case-1.js` | John Singer Sargent | 3 |
| `story/case-1.js` | Oil on canvas | 3 |
| `story/case-1.js` | Madame Cézanne in a Red Dress | 6 |
| `story/case-1.js` | Madame Cézanne (Hortense Fiquet, 1850–1922) in a Red Dress | 9 |
| `story/case-1.js` | Paul Cézanne | 2 |
| `story/case-1.js` | Oil on canvas | 3 |
| `story/case-1.js` | Still Life with Apples and a Pot of Primroses | 9 |
| `story/case-1.js` | Still Life with Apples and a Pot of Primroses | 9 |
| `story/case-1.js` | Paul Cézanne | 2 |
| `story/case-1.js` | Oil on canvas | 3 |
| `story/case-1.js` | Sea and Cliffs | 3 |
| `story/case-1.js` | Sea and Cliffs | 3 |
| `story/case-1.js` | Oil on canvas | 3 |
| `story/dialogues.js` | Dr. Mara Vale | 3 |
| `story/dialogues.js` | Pleasure doing business. The car is already gone. | 8 |
| `story/dialogues.js` | No one will ever know you were here. | 8 |
| `story/dialogues.js` | You dial the number from M’s message. | 7 |
| `story/dialogues.js` | “The number you have called is no longer in service.” | 10 |
| `story/dialogues.js` | You found it? Good. | 4 |
| `story/dialogues.js` | Bring it to the loading dock. Come alone, and do not talk to the curator. | 15 |
| `story/dialogues.js` | Four stations, four letters. Put them together and the safe is yours. | 12 |
| `story/dialogues.js` | Voss? He shook my hand at the gala and called me “our loyal Leon”. | 14 |
| `story/dialogues.js` | Thank you for checking the log before you checked me. | 10 |
| `story/dialogues.js` | The log proves it, doesn’t it? I was on the east stairs at 21:14. | 14 |
| `story/dialogues.js` | Someone booked that cart as a “patron visit”. Not me – guards cannot book anything. | 15 |
| `story/dialogues.js` | At 21:14 a covered transport cart left the delivery exit. | 10 |
| `story/dialogues.js` | At 21:14 I saw a transport cart at the delivery exit. I never saw what was inside. | 17 |
| `story/dialogues.js` | If you don’t believe me, look at the monitor wall in the security office. | 14 |
| `story/dialogues.js` | The night-shift log is in the Portrait Hall. It will show where I really was. | 15 |
| `story/dialogues.js` | The original was in the safe all along? Then the one on the wall … | 15 |
| `story/dialogues.js` | The original was in the safe? Then Dr. Vale had doubts too. | 12 |
| `story/dialogues.js` | That “V” was written in an ink that only shows under the lamp. | 13 |
| `story/dialogues.js` | Someone wanted to recognise their own paperwork. A “V” – that could be more than one person here. | 18 |
| `story/dialogues.js` | Between us – have you looked at the Van Gogh in the Gallery? The varnish is still sticky. | 18 |
| `story/dialogues.js` | Restore Renoir’s Sea and Cliffs at Station L. I will then use the lamp to reveal the mark on the transport slip. | 22 |
| `story/dialogues.js` | Dr. Vale’s office is dark. | 5 |
| `story/dialogues.js` | A card on the door: “Back after the gala. – M. V.” | 12 |
| `story/dialogues.js` | The file is open. Tomorrow the painting goes back on its wall – the real one. | 16 |
| `story/dialogues.js` | Dr. Vale stands in front of the empty safe. | 9 |
| `story/dialogues.js` | She says nothing. She only starts writing a new report. | 10 |
| `story/dialogues.js` | Voss. That label had his taste all over it – but I needed proof that wasn’t mine. | 17 |
| `story/dialogues.js` | He signs his private letters with “M” – for mécène, the old word for patron. Everyone here thinks it means Mara. | 21 |
| `story/dialogues.js` | He could not open my safe, so he needed someone who would follow my clues. You. | 16 |
| `story/dialogues.js` | You hold the painting and the evidence. The choice is yours now. | 12 |
| `story/dialogues.js` | You opened it. That new wall label in the Gallery never looked right to me – so I locked the original in here, just in case. | 26 |
| `story/dialogues.js` | I could not tell anyone – not even Leon. So I left four clues and hoped the right person would follow them. | 22 |
| `story/dialogues.js` | Now tell me: who is behind this? | 7 |
| `story/dialogues.js` | Rough night so far? | 4 |
| `story/dialogues.js` | Quiet in here, isn’t it? | 5 |
| `story/dialogues.js` | I’ll let you get back to it. | 7 |
| `story/dialogues.js` | Gloves on before you touch anything. | 6 |
| `story/dialogues.js` | There you are. The whole building is talking. | 8 |
| `story/dialogues.js` | The vault was open? Nobody tells me anything. | 8 |
| `story/dialogues.js` | Ah. You again. I suppose you’ve read the log. | 9 |
| `story/dialogues.js` | Evening. You must be the new conservation temp. Quiet night – mostly. | 12 |
| `story/dialogues.js` | East stairs at 21:14. It’s in the log now, black on white. | 12 |
| `story/dialogues.js` | And the cart? Booked as a “patron visit”. | 8 |
| `story/dialogues.js` | I can’t book a coffee, let alone a cart. | 9 |
| `story/dialogues.js` | So you’ve seen the footage. A cart, nothing more. | 9 |
| `story/dialogues.js` | Everyone looks at the guard first. | 6 |
| `story/dialogues.js` | Funny – nobody asks where the guard actually was. | 9 |
| `story/dialogues.js` | Somebody keeps the night-shift log by the portraits. | 8 |
| `story/dialogues.js` | Neat handwriting, terrible coffee. | 4 |
| `story/dialogues.js` | Rough? A cart rolled out of the delivery exit at 21:14. | 11 |
| `story/dialogues.js` | Covered. Didn’t see what was under the sheet. | 8 |
| `story/dialogues.js` | The monitors in the security office caught it. | 8 |
| `story/dialogues.js` | If you don’t believe me, look for yourself. | 8 |
| `story/dialogues.js` | Too quiet. That new wall label in the gallery – someone hung it in a hurry. | 16 |
| `story/dialogues.js` | The year looked wrong to me. | 6 |
| `story/dialogues.js` | Quiet, until you count the portraits. | 6 |
| `story/dialogues.js` | Three ladies, and the cards beside them are all shuffled. | 10 |
| `story/dialogues.js` | Imani’s been muttering about a puzzle of Renoir’s cliffs. | 9 |
| `story/dialogues.js` | Says it hides something on the back of a slip. | 10 |
| `story/dialogues.js` | The frame archive door was ajar on my last round. | 10 |
| `story/dialogues.js` | Archives don’t open themselves. | 4 |
| `story/dialogues.js` | Dr. Vale went down to the vault earlier. | 8 |
| `story/dialogues.js` | Came back pale as a sheet. | 6 |
| `story/dialogues.js` | Whoever planned this didn’t wear a uniform. | 7 |
| `story/dialogues.js` | Think about who signs things around here. | 7 |
| `story/dialogues.js` | Quiet again, finally. | 3 |
| `story/dialogues.js` | I might even finish my coffee tonight. | 7 |
| `story/endings.js` | I am a thief | 4 |
| `story/endings.js` | Steal the artwork | 3 |
| `story/endings.js` | You take the original out of the museum and deliver it to Voss. The money is yours, but the forgery stays on the wall. | 24 |
| `story/endings.js` | I am not a thief | 5 |
| `story/endings.js` | Quit the mission | 3 |
| `story/endings.js` | You return the original to Dr. Vale and leave the evidence with the museum. Voss loses his cover; the painting stays where it belongs. | 24 |
| `story/endings.js` | ${PAINTING.artist}, ${PAINTING.shortTitle}, ${PAINTING.date}. ${PAINTING.medium}. | 4 |
| `story/endings.js` | You have the original. What do you do? | 8 |
| `story/endings.js` | ${ENDINGS.heist.choiceLabel} · I am a thief | 6 |
| `story/endings.js` | ${ENDINGS['open-file'].choiceLabel} · I am not a thief | 7 |
| `story/endings.js` | Points per part | 3 |
| `story/endings.js` | View evidence and score details | 5 |
| `story/endings.js` | Back to home | 3 |
| `story/engine.js` | The case is closed. Start a new game to play again. | 11 |
| `story/engine.js` | You have already read the message from M. | 8 |
| `story/engine.js` | Mission accepted. Explore the museum and find the four stations. | 10 |
| `story/engine.js` | Unknown station: ${stationId}. | 3 |
| `story/engine.js` | Read the message from M first. | 6 |
| `story/engine.js` | ${station.room} is already solved. | 4 |
| `story/engine.js` | Unknown note: ${noteId}. | 3 |
| `story/engine.js` | This note is already in your journal. | 7 |
| `story/engine.js` | New note in your journal: ${note.title}. | 6 |
| `story/engine.js` | The safe is already open. | 5 |
| `story/engine.js` | The safe stays locked. You need proof from all four stations first. | 12 |
| `story/engine.js` | Enter a word first. | 4 |
| `story/engine.js` | The lock does not move. Check the order in your journal. | 11 |
| `story/engine.js` | The safe opens. Inside: the original painting and a folder of documents. | 12 |
| `story/engine.js` | Open the safe first – the documents inside are part of the answer. | 13 |
| `story/engine.js` | You have already answered the final question. | 7 |
| `story/engine.js` | Unknown suspect: ${suspectId}. | 3 |
| `story/engine.js` | Not ${suspect.name}. ${suspect.counterText} Try again. | 5 |
| `story/engine.js` | Adrien Voss. Label, patron visit, “V” and frame order all lead to him. “M” is for mécène, patron. He could not open Dr. Vale’s safe, so he sent you. | 29 |
| `story/engine.js` | Answer the final question before you decide. | 7 |
| `story/engine.js` | Unknown ending: ${endingId}. | 3 |
| `story/engine.js` | You hand the painting to Voss. The Heist. | 8 |
| `story/engine.js` | You bring the painting and the evidence to Dr. Vale. The Open File. | 13 |
| `story/engine.js` | Case closed. Start a new game to play again. | 9 |
| `story/engine.js` | Read the message from M. | 5 |
| `story/engine.js` | Find the remaining stations: ${open.join(', ')}. | 6 |
| `story/engine.js` | All four letters found. Open the safe with the word in your journal. | 13 |
| `story/engine.js` | Answer the final question: who planned all of this? | 9 |
| `story/engine.js` | Decide what happens to the painting. | 6 |
| `story/hints.js` | The case is closed. Start a new game if you want to see the other ending. | 16 |
| `story/hints.js` | Your phone buzzed in the Great Hall. Read the message from M first. | 13 |
| `story/hints.js` | There is no wrong choice now – only two different stories. Who should get the painting: Voss or Dr. Vale? | 20 |
| `story/hints.js` | Before the Portrait Hall, read the shift schedule in the security office. Then: | 13 |
| `story/hints.js` | The dial wants one word. Your journal keeps the four letters in a fixed order – not in the order you found them. | 23 |
| `story/hints.js` | Look at the frame label from the archive: whose name is on it? And who would book a “patron visit”? | 20 |
| `story/hints.js` | Line up the four pieces of evidence. One name keeps coming back – and the “V” is not who you might think. | 22 |
| `story/host.js` | Puzzle score updated. | 3 |
| `story/host.js` | Accept the mission | 3 |
| `story/host.js` | Back to the museum | 4 |
| `story/host.js` | Read the message from M first. | 6 |
| `story/host.js` | Station progress saved. | 3 |
| `story/host.js` | Letter ${station.letter} is now in your journal. | 7 |
| `story/host.js` | Return to the gallery | 4 |
| `story/host.js` | Look at the documents | 4 |
| `story/host.js` | The final question | 3 |
| `story/host.js` | Decide what happens | 3 |
| `story/host.js` | Hints from Imani cost no points. | 6 |
| `story/host.js` | Tell me more | 3 |
| `story/host.js` | Start a new game? | 4 |
| `story/host.js` | Your progress in this case will be reset. | 8 |
| `story/host.js` | New game started. | 3 |
| `story/journal.js` | Letters in fixed order | 4 |
| `story/journal.js` | No evidence yet. | 3 |
| `story/journal.js` | No notes yet. | 3 |
| `story/placeholder-station.js` | Solve station (placeholder) | 3 |
| `story/placeholder-station.js` | Placeholder solved. A teammate’s mini-game will replace this screen. | 9 |
| `story/placeholder-station.js` | ${model.room.toUpperCase()} · PLACEHOLDER | 3 |
| `story/safe-ui.js` | The safe stands open. The original painting and a folder of documents are inside. | 14 |
| `story/safe-ui.js` | Collect proof from all four stations before the code can unlock the door. | 13 |
| `story/safe-ui.js` | Select letter A | 3 |
| `story/safe-ui.js` | Remove last letter | 3 |
| `story/safe-ui.js` | Try the lock | 3 |
| `story/safe-ui.js` | Drag the wheel to a letter, then press the centre. Repeat for all four letters. | 15 |
| `story/scoreboard-view.js` | ${board.finished ? 'Finished run' : 'Current run'}: ${board.points} / ${board.max} points | 11 |
| `story/scoreboard-view.js` | Best run: finish a run to set one. | 8 |
| `story/scoring.js` | Portrait timeline time: not recorded | 5 |
| `story/security-office/interactions.js` | Monitor wall · CAM 07, 21:14 | 6 |
| `story/security-office/interactions.js` | Leon rewinds the delivery-exit camera. 21:14: two people in grey coats push a covered cart past the loading door. The camera cannot see inside. | 24 |
| `story/security-office/interactions.js` | Leon: night round. Imani: studio until 22:00. In different ink: “21:00 – patron visit, delivery exit.” The Portrait Hall log should say who booked it. | 25 |
| `story/security-office/interactions.js` | Static, then Leon’s voice from somewhere in the east wing: “Round two, all doors closed.” The red light keeps blinking. | 20 |
| `story/security-office/interactions.js` | Brass hooks, numbered by wing. One hook is empty: the key to the delivery exit. | 15 |
| `story/security-office/interactions.js` | Unknown point: ${pointId}. | 3 |
| `story/security-office/security-office.js` | rgba(233,223,202,${alpha.toFixed(2)}) | 1 |
| `story/security-office/security-office.js` | 700 ${Math.max(9, screen.h * 0.13)}px "DM Sans", sans-serif | 8 |
| `story/security-office/security-office.js` | rgba(160,210,255,${flicker.toFixed(3)}) | 1 |
| `story/security-office/security-office.js` | 600 ${Math.max(8, screen.h * 0.09)}px ui-monospace, Menlo, monospace | 8 |
| `story/security-office/security-office.js` | rgba(127,182,216,${pulse.toFixed(3)}) | 1 |


## Story clarity update (21.11.2026)

The texts above now tell one story without prior knowledge: the Van Gogh in the Gallery is a copy, Dr. Vale locked the original in her safe out of caution, the 21:14 cart left empty, Leon is an honest guard, Imani quietly spots the fake, and only the player and M know about the theft. Changed in `story/case-1.js` and `story/dialogues.js` (full old → new table in the PR):

- M’s message and M’s line while the safe is closed; hint “Four stations, four letters.”
- Leon: greeting, goodbye, his three story stages (also used for “Rough night so far?”), suspect description and counter text.
- Imani: before Station 2 she notices the sticky varnish; after Station 2 the hidden ‘V’; after the safe “Then Dr. Vale had doubts too.”
- Dr. Vale: her lines at the open safe, the first line after the right accusation, description and counter text. On the lost ending the original is still in the safe.
- Note “Monitor wall, 21:14” and the Station 1 evidence (Leon on the east stairs when the cart left).
- Removed leftovers: “a painting is missing”, “Nervous since the alarm”, “the cameras have ears”.
