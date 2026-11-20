# Menu, journal and Leon – revision of 17.11.2026

Assignment: Florian Stodden. Implemented with Codex on `codex/menu-journal-leon`, starting from the merged PR #18. The two Gemini images were used as **design ideas**, not as a fixed background with button text burned in. That way “Sound on/off” and “Music on/off” can change live.

## Controls

| Place | Action | Result |
|---|---|---|
| Game | `Esc` or gear | Open the game menu; movement pauses. `Esc` again closes it. |
| Game | `J` or the Journal button at the top | Open the journal over the museum. `J`, `Esc` or × closes it. |
| Home screen | Journal button or `J` | Open the journal and return to the home screen without starting the mission. “Read M’s message” also returns to the home screen after closing. |
| Game near Leon | `E` | Open a transparent conversation with Leon. He no longer starts talking by himself when you come close. Since `feature/npc-e-and-signs` this also applies to Imani and Dr. Vale. |

## Where does what happen?

- `web/index.html`: Journal buttons for the game and the home screen, and the two-column journal window with mission, evidence, notes, four letters, statistics and Met sources. The window lies outside the game scene so it can also be reached from the home screen.
- `web/main.js`: keyboard shortcuts, opening/closing the windows, pausing, focus and returning to the right screen. Leon’s E interaction uses the same existing story and the same two questions as before.
- `web/style.css`: brass frames and dark cards following the references, with real HTML buttons and a responsive layout.
- `web/story/journal.js`: existing journal data is shown split across the two book pages. The data rules stay unchanged.
- `web/story/story.css`: Leon’s speech box gets a translucent background with light text.

Saves, scoring rules and the four mini-games were not changed. A new game still starts only on the home screen.

## Checks

- `node --test` in the `web` folder: 217 passed, 0 failed.
- `node --check main.js` and `git diff --check`: no errors.
- Local browser: home screen → Journal → close → home screen; `J` on the home screen; in the game `Esc` → menu with dynamic sound/music labels; menu → Journal; `J` in the game; home journal → “Read M’s message” → close → home screen. Menu and journal were compared visually with the references as desktop views.
- Still to be played by the group: conversation with Leon via `E` at his position, a complete round and the view on a real smartphone.

**Addendum before the merge:** In the meantime PR #19 with further changes to Station I was merged into `main`. This branch was updated onto it; afterwards **227 tests** passed. The features from PR #19 remain.

After that, PR #21 (no more “Nothing nearby” dialogue) was merged as well. The branch contains both changes; after the next sync **231 tests** passed.
