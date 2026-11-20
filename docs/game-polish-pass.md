# Polish pass on the existing game · 19.11.2026

**Historical status before Station B “Curator’s Catalogue” (PR #32).** The following notes on two landscape works, the live API, answer deductions and 85 possible points describe the state at that time. The game now uses four Met works in the [Curator’s Catalogue](story/curators-catalogue.md) and at most 80 points. This entry is kept so the development can be followed.

Assignment from Florian Stodden: improve the existing parts, without a new story or more mini-games. The phone view is explicitly for **later**.

## What changed

| Area | Before | Now |
| --- | --- | --- |
| Station B / Met | The second work appeared only if the live API delivered its image. On an error it was missing. | Both real Met works are stored in the project as public art images. The API still checks the catalogue data live. If it fails, the image and stored facts are ready; a short status names the source. The fixed solution stays the same for everyone. |
| Explanations | The time scoring was sometimes described only in general terms. | The start views of I, L and D name their time limits and points. B names the deductions for wrong answers and hints. The detailed help of I uses the same limits as the scoring function. |
| Interaction at the safe | If another object lay close to the closed safe door, the E hint could show its name even though E opens the safe. | The visible hint says “Enter vault code” when the locked door has priority. After opening, E is free for nearby objects; you still walk through the door. |
| Scoreboard | Old best runs with 90 possible points stood next to new ones with 85, without explanation; a direct comparison of numbers was unfair to the old or the new scale. | Old values are marked as earlier scoring. The comparison uses the share of reachable points; on a tie, time decides. A short line explains where points come from. |
| Ending images | The two large PNG backgrounds loaded about 3.8 MB together. | The text-free backgrounds are JPGs and load about 0.46 MB together. The visible story text stays real HTML. |

## Where this happens in the code

- `web/minigames/landscape.js`: Station B, local images and live catalogue data. `web/assets/met-459193-source.md` documents the new Met image.
- `web/minigames/portrait-timeline.js`, `picture-puzzle.js`, `spot-the-forgery.js`, `station-ui.js`: hints of the four existing puzzles.
- `web/gallery.js` and `web/main.js`: E hint and interaction priority at the safe door.
- `web/story/scoring.js` and `scoreboard-view.js`: best run comparison and display.
- `web/story/story.css`, `web/assets/ending-*.jpg`: closing images. `web/index.html` loads updated CSS and game versions.

## Checks

- `cd web && node --test`: **279 passed, 0 failed** (including the already prepared change to Leon and Imani).
- In a local browser, M’s message, B, I, L and D, the code word BILD, the evidence question and both possible endings were played through. Both ending backgrounds loaded. For the second ending, the saved state right before the decision was opened again.
- `git diff --check`: no formatting errors.

## Later

- Check the phone view on narrow screens and improve it if needed. It was explicitly not part of this work package.
