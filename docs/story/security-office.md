# Security office – what of it is in the game

**Status 15.11.2026.** Fabian built the walkable security room in the main game (`web/security-room.js`, background image `web/assets/security-office-hall-exit.png`, entrance on the left of the Great Hall). From the story logic, the room uses **the interactions**, not the drawing.

## Used in the game: `web/story/security-office/interactions.js`

Every object in Fabian’s room has a `story` field like the objects on the map, e.g. `{ examine: 'monitor-wall' }`. When **E** is pressed, `main.js` calls the story host (`story.examine(id)`), and the host uses `examine(state, id)` from `interactions.js`.

| Object in Fabian’s room | id | Effect |
|---|---|---|
| Camera overview | `monitor-wall` | Leon saw a transport cart at the delivery exit at 21:14, contents not visible → note `transport-cart` |
| Shift schedule | `shift-schedule` | Who was on duty, “21:00 – patron visit” → note `duty-roster` (does **not** solve Station I) |
| Walkie-talkie | `radio` | atmosphere only |
| Key cabinet | `key-cabinet` | atmosphere only (the key to the delivery exit is missing) |

A note is unlocked exactly once; examining again shows the same text and “This note is already in your journal.” Tests: `web/story/tests/security-office.test.js`.

## Prototype only: `web/story/security-office/security-office.js`

`drawSecurityOffice(ctx, …)` draws a room with a 3×3 monitor wall entirely in code. That was the draft before there was a painted image. **The main game does not use this drawing**; it runs only in the preview `web/dev/security-office.html`. The click areas in `interactions.js` (`LAYOUT`) come from this file, which is why it is still in the project.

If the team later wants to put live camera images on Fabian’s monitors, `monitorLayout()` and the “NO SIGNAL” noise can be taken from it. Otherwise the drawing (and the preview page) can be removed after agreement; then the areas from `LAYOUT` would have to live directly in `interactions.js`.
