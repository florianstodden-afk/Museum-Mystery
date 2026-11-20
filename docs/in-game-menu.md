# In-game menu: tidying up the game view

Status: 17.11.2026. Assignment from Florian Stodden; implemented with Codex on branch `codex/in-game-menu`. The image file `Gemini_Generated_Image_wqqnhqwqqnhqwqqn.jpg` was a **design reference**, not a finished layout. It was not copied as a game graphic.

## Wanted flow

After the guest entry and the home screen, the mission starts with M’s message. While playing you see the museum and only a gear icon at the top right. The title, the WASD text and the former Sound, Music, Hint and New Game buttons no longer sit above the scene. A click on the gear opens the in-game menu. It holds Sound, Music, Hint, Journal, Resume Game and Exit to Main Menu. Neither control instructions nor New Game are in this menu. A new game is still started from the home screen, with a confirmation if there is already progress.

## Which file does what?

| File | Change and reason |
|---|---|
| `web/index.html` | Removes the old text and button bar, places the gear button in front of the game scene and contains the new menu as real HTML buttons. The buttons keep their IDs; existing sound and story functions can keep using them. |
| `web/style.css` | Draws a dark, semi-transparent menu with a gold border. The running museum scene stays visible behind it. Size and spacing adapt to narrow screens. |
| `web/main.js` | Opens and closes the menu, stops the character meanwhile, pauses drawing movement and blocks movement keys. Hint and Journal close the menu first. Resume continues the game; Exit opens the home screen. The gear is hidden during dialogues and on the entry screens. |

The game controls keep working. On touch devices the actual movement buttons remain; only the permanent **explanation** of the controls in the game view and in the menu is gone. The artwork sources are still listed in the journal.

## How the group can follow it

1. Open the game → “Log In” or “Sign Up” → “Continue as guest” → “Start New Game” → accept M’s message.
2. Check: in the museum only the gear is visible. Title, WASD hint and old button bar are gone.
3. Open the gear → toggle Sound and Music. The states change immediately and are saved locally as before.
4. Open Hint → hint dialog; after closing, back to the scene. Open the menu again → Journal → the journal appears over the scene.
5. Gear → Resume Game → keep walking. Gear → Exit to Main Menu → home screen with Resume Game. A restart is still possible there.

## Checks during implementation

- `node --test` in the `web` folder: 217 passed, 0 failed.
- `node --check main.js` and `git diff --check`: no errors.
- Local browser: clicked through guest entry, home screen, M’s mission message, gear menu, sound and music toggles, hint, journal, Resume and Exit to Main Menu. The menu showed neither controls nor New Game.
- Still to be checked by the group: a complete playthrough to both endings and the view on a real smartphone.
