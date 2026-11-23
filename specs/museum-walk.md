# Task: Walkable Museum Mystery

> **Historical specification for the first walkable prototype.** This records the move from a static picture puzzle to a museum the player could explore. See the [current README](../README.md) for the finished rooms, stations and endings.

## Why?

The first prototype was a static picture puzzle and too simple and boring for the group. The game feel we want is an original 2D top-down view with movement through a museum, a mystery quest and at least two different endings. Harvest Moon and Pokémon serve only as orientation for perspective and controls; we use no graphics or characters from these games.

## Smallest playable walk

The player character moves with WASD or the arrow keys through the reception, the gallery and the restoration room. `E` examines an object or talks to a nearby person. The journal shows the next goal. The player collects three pieces of evidence: a suspicious visitor log, an observation at the swapped painting and a restoration note. After the log, the guard hands over an access badge. The storage door needs three pieces of evidence, the badge and the four-digit code from the time of the suspicious log entry (21:14 → `2114`). The original is discovered there.

At the end the player chooses between two **different, reachable** outcomes: quietly return the original or publicly expose the forgery. The closing text names the consequence of the choice. A restart resets the case. A save is kept in the browser so that a reload does not erase everything.

The displayed painting and verifiable details come from the Met Collection API for object 436535, *Wheat Field with Cypresses*. Only publicly released image data is used. On network errors the game stays playable with a text display. The art source is named visibly.

## Rules and limits

- Movement only on walkable tiles; walls and the storage door block the way.
- Interaction only with an object directly next to the player character.
- Each piece of evidence counts only once; the guard hands over the badge after the log has been found.
- The storage door opens only with three pieces of evidence, the badge and the right number code. A wrong code keeps it locked.
- An ending can only be chosen at the original in the storage room.
- Both endings must be selectable in one complete run.
- No real accounts, shared online saves, enemies, fights or further rooms in this task.

## Done when …

- Movement, interaction, code and door rules are tested automatically.
- Both endings are reachable through tests.
- The browser shows the museum with player character, objects, dialogue and journal.
- Met data loads or an understandable offline replacement appears.
- A reload restores a running case and “New game” resets it.
- A person plays the whole route themselves and rates its readability.

## Path to understanding

`web/engine.js` contains pure rules and a savable state. `web/main.js` draws the museum, handles keys and calls the Met API. `web/index.html` and `web/style.css` are structure and styling. `web/engine.test.js` checks the rules with Node. This browser prototype is a change of direction; the earlier Streamlit version stays in the repository as an intermediate stage and is not the new start page.
