# Integration plan: story engine into the main game

> **Status 15.11.2026:** The integration is on `main` (PR #6). Since then Fabian has added a walkable security room and new positions on the map; Station I is finished as a real mini-game (branch `feature/portrait-timeline`). The map objects and their story actions are in `web/engine.js` (field `story`). The plan below is the record of how the integration was done.
>
> **Status 12.11.2026: implemented** on branch `feature/story-integration` (after agreement with Fabian), via the “short way” with `host.js`. Differences from the plan: the map objects carry their story action as data (`story` field in `web/engine.js`) instead of a table in `main.js`. The storage door is the safe. Stations 2–4 sit at existing map points for now (night-shift log in the Great Hall, transport slip and a new frame rack in the gallery). Details in the work log.

**Status:** 12.11.2026, branch `feature/story-logic`. **Who:** Florian B. with Fabian, **after** Fabian’s merge of graphics and rooms.
**Goal:** The main game (`web/index.html` + `web/main.js`) uses the new story from `web/story/` instead of the old prototype story in `web/engine.js`.

So far **no existing file has been changed**. All steps below change existing files and may therefore happen only after agreement with Fabian – ideally in a separate branch `feature/story-integration`, when nobody else is working on `main.js`.

## Basic idea: who does what?

| Area | Today | After the integration |
|---|---|---|
| Movement, collision, map, guard | `web/engine.js` (`canEnter`, `move`, `nearbyObject`), `motion.js`, `guard.js` | **stays with Fabian**, unchanged |
| Story (evidence, badge, code 2114, endings) | `web/engine.js` (`interact`, `openVault`, `chooseEnding`, `clues`, `pass`, `vaultOpen`, `ending`) | `web/story/engine.js` |
| Journal, dialogues, safe, final question, endings (display) | `updateSidebar()`, `showDialog()`, `end()` in `main.js` | Building blocks from `web/story/*.js` in Fabian’s sidebar/dialog |
| Saving | `localStorage` in `main.js` (`museum-mystery-walk-v1`, `museum-nocturne-landscape-v1`) | `main.js` saves the player position **and** `serialize(storyState)` |

Important: the map stays the “host”. It decides **where** something happens (which object is nearby). The story engine decides **what** happens.

## Short way: with `web/story/host.js` (recommended)

Since 12.11.2026 there is `createStoryHost` in `web/story/host.js`. The host takes care of loading/saving, stations, conversations, safe → final question → decision → closing screen, hints and “New game”. `main.js` only has to lend it a dialog. This is the whole story part in `main.js`:

```js
import { createStoryHost } from './story/host.js';
import { journalModel, renderJournal } from './story/journal.js';
import * as landscape from './minigames/landscape.js';

const story = createStoryHost({
  openPanel(title) { showDialog(title, ''); return document.querySelector('#dialog-body'); },
  closePanel: closeDialog,
  onChange() { renderJournal(document.querySelector('#journal'), journalModel(story.state)); },
  stations: { landscape },                      // later: portraits, restoration, archive
  storageKey: 'museum-nocturne-story-v1',
});
story.start();                                  // shows the message from M on the first visit

// in handleInteract(), depending on the object nearby:
const STORY_OBJECTS = {
  painting:   () => story.openStation('landscape'),
  portraitLog:() => story.openStation('portraits'),
  workbench:  () => story.openStation('restoration'),
  frameRack:  () => story.openStation('archive'),
  vault:      () => story.openVault(),
  guard:      () => story.talkTo('leon'),
  restorer:   () => story.talkTo('imani'),
  curator:    () => story.talkTo('vale'),
  monitors:   () => story.examine('monitor-wall'),
};
STORY_OBJECTS[object.id]?.();

// Buttons at the top right:
//   "New Game" → story.confirmNewGame()     "Hint" → story.showHint()
```

The story building blocks draw their own buttons. So `#dialog-actions` stays empty for story scenes. The object ids are suggestions; Fabian decides them.

**The proof that this works:** `web/dev/story-preview.js` uses exactly this host (with a `<dialog>` instead of `#dialog`), and `web/story/tests/host.test.js` plays a whole game through the host.

With the host, steps 2, 4 and 5 below shrink to the lines above. Steps 1, 3, 6 and 7 are still needed. **Estimated effort with the host: about 2–3 hours instead of 5–6.**

The detailed steps below describe what the host does internally. They help if you deliberately want to integrate without the host.

## Step by step (detailed)

### Step 1 – Secure the old story logic (about 30 min)
1. Create a new folder `web/legacy/`.
2. Copy the story parts of the old `web/engine.js` to `web/legacy/prototype-story.js`: `EVIDENCE`, `interact` (story texts), `openVault`, `chooseEnding`, `hasAllEvidence`, the fields `clues`, `pass`, `vaultOpen`, `ending` from `initialState`/`validState`.
3. Move the matching tests from `web/engine.test.js` to `web/legacy/prototype-story.test.js`, so that `node --test` still checks everything.
4. Only map and movement stay in `web/engine.js`: `WIDTH`, `HEIGHT`, `START`, `OBJECTS` (positions), `canEnter`, `move`, `nearbyObject`, `interactionDistance`, plus a smaller `initialState`/`validState` with `player` and `steps`.
5. All tests green → commit “Move prototype story into legacy”.

**Risk:** `canEnter` today uses `state.vaultOpen` for the storage door (`x === 18 && y === 9`). → Step 3.

### Step 2 – Two states side by side in `main.js` (about 1 h)
```js
import { newGame, readMission, solveStation, addNote, tryOpenSafe, accuse, chooseEnding, canOpenSafe } from './story/engine.js';
import { serialize, deserialize } from './story/save.js';

let world = …;                 // as today: { player, steps } from engine.js
let story = loadStory();       // new

function loadStory() {
  try { return deserialize(localStorage.getItem('museum-nocturne-story-v1')) ?? newGame(); }
  catch { return newGame(); }
}
function saveStory() {
  try { localStorage.setItem('museum-nocturne-story-v1', serialize(story)); } catch {}
}
```
- Every story action follows the same pattern: `const r = action(story, …); story = r.state; saveStory(); showMessage(r.message);`
- On the first start (`!story.missionRead`) show the dialog from “M” (`dialogueFor('m', story)` + `renderDialogue`), button “Accept the mission” → `readMission`.

### Step 3 – Couple the door/safe to the story (about 30 min)
- Instead of `state.vaultOpen`, `canEnter(state, x, y, guard)` gets an extra parameter `doorOpen` (or Fabian reads `story.safe.open`). Suggestion: `canEnter(world, x, y, guard, { vaultOpen: story.safe.open })`.
- At the safe object: `renderSafe(dialogBody, { state: story, message }, word => { … tryOpenSafe … })`.
- After `safe.open`: `renderAccusation(…)`, then `renderEndingChoice(…)` and `renderEnding(…, { onNewGame: reset })`.

### Step 4 – Hang the stations into rooms (about 1 h + 15 min per station)
In `handleInteract()` a table replaces today’s special cases (`object.id === 'painting'`):

```js
import { openStation } from './story/stations.js';
import * as placeholder from './story/placeholder-station.js';
import * as landscape from './minigames/landscape.js';

const STATION_AT_OBJECT = {          // object id on the map → station
  painting: { stationId: 'landscape', module: landscape },
  portraitLog: { stationId: 'portraits', module: placeholder },   // later ./minigames/portraits.js
  workbench: { stationId: 'restoration', module: placeholder },
  frameRack: { stationId: 'archive', module: placeholder },
};

const entry = STATION_AT_OBJECT[object.id];
if (entry) {
  showDialog(roomName, '');
  openStation(entry.module, dialogBody, {
    stationId: entry.stationId,
    savedProgress: stationProgress[entry.stationId],
    onProgress: p => { stationProgress[entry.stationId] = p; saveProgress(); },
    onSolved: result => { const r = solveStation(story, entry.stationId, result); story = r.state; saveStory(); showMessage(r.message); },
  });
  return;
}
```
- The object ids (`portraitLog`, `workbench`, `frameRack`) are suggestions; Fabian decides them in his rooms.
- Today’s key `museum-nocturne-landscape-v1` can be reused as `stationProgress.landscape`.

### Step 5 – Journal, dialogues, security office (about 1 h)
- Sidebar: `#journal` → `renderJournal(document.querySelector('#journal'), journalModel(story))` in `updateSidebar()`. `#progress` then shows `story.letters`, `#pass` goes away.
- Include `web/story/story.css` in `index.html` (`<link rel="stylesheet" href="story/story.css">`). Classes have the prefix `story-`, so there is no collision with `style.css`. Note: `story.css` sets variables on `:root` with its own prefix `--story-*`.
- People on the map: Leon (today `guard`), Imani (today `restorer`), Dr. Vale (new) → `renderDialogue(dialogBody, dialogueFor(id, story))`.
- Security office: see `docs/story/security-office.md`.
- Keep the note “Fictional museum and characters · Artworks: The Met, Open Access” visible (it is on the ending screen and should also be in the sidebar).

### Step 6 – Old saves (about 20 min)
- The old key `museum-mystery-walk-v1` holds the position **and** old story fields. On loading, take only `player` and `steps` (if valid) and ignore everything else.
- With an old save the story always starts with `newGame()`. There is deliberately **no** conversion “3 old pieces of evidence → new letters”, because the stories do not fit together.
- `deserialize` returns `null` for old/broken saves (`caseVersion` check). If we change the case data later, increase `CASE_VERSION` in `case-1.js`.
- “New Game” deletes both keys and all station progress.

### Step 7 – Checks (about 1 h)
- `cd web && node --test` (old movement tests, legacy tests, story tests).
- Play through completely as in `web/dev/story.html`: one wrong safe code, one wrong accusation, both endings.
- Restart test: close the browser, open it again, the state is still there.
- Screenshots into the PR.

## Effort and risks

| | Effort |
|---|---|
| Steps 1–7 without the host | **about 5–6 hours**, two people in one afternoon |
| With `host.js` (steps 1, 3, 6, 7 + short way) | **about 2–3 hours** |

| Risk | Countermeasure |
|---|---|
| Conflicts in `main.js` if Fabian works in parallel | Integration only after Fabian’s merge; small separate branch; Fabian reviews. |
| Door logic depends on the old `vaultOpen` | Step 3: pass the door state as a parameter. |
| Old saves lead to impossible states | Step 6: the story always starts fresh; validate the position. |
| Stations 2–4 are not finished yet | The placeholder stays connected; swapping is one line in `STATION_AT_OBJECT`. |
| CSS collision | All story classes have `story-`; in the main game only the dialog needs some room for longer content (the ending screen can scroll). |
| The dialog in `index.html` is light (paper look), the story building blocks are dark | Either add a dark dialog style for story scenes, or a variant `.dialog-card .story-*` with dark text in `story.css`. Decide with Fabian. |

## What has to change in existing files (list for the agreement)

- `web/engine.js`: remove the story parts (→ `web/legacy/`), door parameter for `canEnter`.
- `web/engine.test.js`: story tests to `web/legacy/`.
- `web/main.js`: story state, saving, `handleInteract`, `updateSidebar`, `end`, `reset`.
- `web/index.html`: include `story.css`, replace the mission text in the `.case` panel with the journal building block.
- `README.md` and `docs/work-log.md`: new state.
