# Work log Florian B. – story logic (`feature/story-logic`)

A separate file, so there is no conflict with the shared `docs/work-log.md`.
**People involved:** Assignment and concept: Florian Baumgartl / team. Implementation: Claude Code (Claude Opus 5.5) following a written assignment. All checks below were actually run.

## Preparation – 12.11.2026

- **Starting point:** `main` at commit `9beaf57`, clean working directory. Branch `feature/story-logic` created from `main`.
- **Tool:** **Node.js was not installed** on the Mac (`node: command not found`). For the tests, the Node runtime built into Cursor.app (v24.15.0) was used via `ELECTRON_RUN_AS_NODE=1`; nothing was installed and no project file was changed. **Open point:** install Node.js ≥ 20 properly (e.g. from nodejs.org) so that `cd web && node --test` runs directly.
- **Check:** `cd web && node --test` → **17 tests, 17 passed** (starting point).
- **Met API:** All six works requested from `collectionapi.metmuseum.org`; all `isPublicDomain: true`. Differences see M1.

## M1 – Story engine, points, case data, saving

- **Goal:** The whole story as pure functions, without DOM and without `web/engine.js`.
- **Decisions:**
  - Every action returns `{ state, ok, message }`. **Not allowed** actions (e.g. the safe before all stations, anything after the ending) return the unchanged state. **Wrong answers** at the safe and the final question are allowed attempts: `ok: false`, but `attempts + 1` (otherwise the points rule “5 after a wrong try” could not be implemented).
  - `safe.attempts` and `accusation.attempts` count **only wrong** attempts.
  - Empty safe input does not count as an attempt.
  - Stations can be solved only after the mission has been read (story order). Notes work at any time.
  - `letters` is an array with four fixed slots (`null` or a letter), `evidence` a list of evidence ids in the order they were found.
  - `deserialize` also checks the story order (e.g. safe open without all stations → `null`).
  - Works assigned to stations 2–4 (an assumption; the concept only names the list): Portrait Hall 12127 + 435876, Conservation Studio 435882, Frame Archive 436121.
  - `case-1.js` stores the full Met title (`title`) and the short title from the concept (`shortTitle`). Check date `2026-11-10` as in the assignment; checked against the API again on 12.11.2026.
- **Differences Met API ↔ concept:** Long titles for 436121 (“… (Madame Paul Valpinçon?)”), 12127 (“… (Virginie Amélie Avegno Gautreau)”), 435876 (“Madame Cézanne (Hortense Fiquet, 1850–1922) in a Red Dress”). *Road in Etten* (459193): Met medium “Chalk, pencil, pastel, watercolor. Underdrawing in pen and brown ink.” – `web/minigames/landscape.js` shows the shortened “Chalk, pastel and watercolor” (not changed, as it is an existing file). Years and all other details match.
- **Files:** `web/story/case-1.js`, `engine.js`, `scoring.js`, `save.js`, `web/story/tests/engine.test.js`, `scoring.test.js`, `save-and-case.test.js`, `docs/game-concept.md` (the concept was not in the repo).
- **Check:** `node --test` → **45 tests, 45 passed**.
- **Commit:** `baf0ec3 Add Nocturne story engine, scoring and case data`

## M2 – Station adapter, placeholder, contract

- **Goal:** Every station can be connected the same way; the engine hands out letter, evidence and points.
- **Decisions:** When solved, `landscape.js` only reports `{ letter, evidence, points }`. So the adapter remembers the last progress from `caseData.onChange` and takes `mistakes`/`hints` from it. A second `onSolved` is ignored. For DOM tests without a browser there is a small test helper `fake-dom.js`.
- **Files:** `web/story/stations.js`, `placeholder-station.js`, `dom.js`, `tests/stations.test.js`, `tests/fake-dom.js`, `docs/story/minigame-contract.md`.
- **Check:** `node --test` → **51 / 51 passed**. One test uses the real rules from `landscape.js` (`answer`, `hint`).
- **Commit:** `81d7d02 Add station adapter, placeholder station and contract`

## M3 – Dialogues, journal, safe, final question, endings

- **Goal:** Content as data + small render building blocks for any container.
- **Decisions:** In `case-1.js`, one sentence `pointsToVoss` per station for the chain of evidence. Dr. Vale is “not there” before the safe is open. The ending images come from `web/assets/met-436535.jpg` (read only, path via `import.meta.url`, works from any page). Text only via `textContent`, never `innerHTML`.
- **Files:** `web/story/dialogues.js`, `journal.js`, `safe-ui.js`, `accusation-ui.js`, `endings.js`, `story.css`, `tests/content.test.js`.
- **Check:** `node --test` → **64 / 64 passed**.
- **Commit:** `33ab6e6 Add story dialogues, journal, safe, accusation and ending components`

## M4 – Playable story preview

- **Goal:** The story can be shown today already, without the map.
- **Browser check carried out** (built-in browser, `python3 -m http.server 8000 --directory web`):
  - Mission accepted; Landscape Gallery with the real `landscape.js`: once wrong (1881/Oil) → “−3 points”, then right → 17 points, B in the journal.
  - Page reloaded → progress restored from `localStorage` (`museum-nocturne-story-preview-v1`).
  - Placeholders for Portrait Hall, Frame Archive, Conservation Studio. Leon after the Portrait Hall: clearing lines.
  - Safe: `DLIB` → “The lock does not move. Check the order in your journal.”, then `bild` → open.
  - Final question: Leon → feedback night-shift log; Dr. Vale → feedback frame label; Voss → right.
  - Ending B “The Open File”: **87 / 100** (17+20+20+20, safe 5, question 5) – matches the rules.
  - “New game” with confirmation, second run without mistakes → ending A “The Heist”: **100 / 100**.
  - Console: no errors. Phone width 375 px: no horizontal scrolling.
- **Bugs found and fixed:**
  1. The dialog window sat too high, because `body > * { position: relative }` also hit the `<dialog>` → rule limited to `:not(dialog)`.
  2. After a **wrong** accusation the chain of evidence already showed the solution (“… Voss is the patron”) → the chain of evidence now appears only after the right answer (new test).
- **Files:** `web/dev/story.html`, `story-preview.js`, `story-preview.css`, screenshots `docs/story/screenshots/00–10`.
- **Check:** `node --test` → **65 / 65 passed**.
- **Commit:** `8438be9 Add playable story preview page`

## M5 – Security office

- **Goal:** A standalone story room with a monitor wall for Fabian’s map.
- **Decisions:** One layout table `LAYOUT` (relative coordinates) for the drawing **and** the click areas. PNG background optional (still missing → code drawing). Screens flicker at about 12 fps through deterministic noise (same time → same image, easy to test). The camera clock starts at 21:12.
- **Bug found:** The new test “areas do not overlap” failed – the radio lay in the click area of the monitor wall. Moved the radio to the right end of the desk.
- **Browser check:** Room with 9 screens (7 sample feeds, 2× NO SIGNAL), hover frame, click on the monitor wall → note in the journal; second click → “This note is already in your journal.” Console: only the expected 404 for the missing `security-office.png`.
- **Files:** `web/story/security-office/security-office.js`, `interactions.js`, `web/dev/security-office.html`, `security-office-preview.js`, `docs/story/security-office.md`, `tests/security-office.test.js`, screenshots 11–12.
- **Check:** `node --test` → **73 / 73 passed**.
- **Commit:** `edcc87b Add standalone security office with monitor wall`

## M6 – Integration plan and documentation

- **Goal:** A plan for taking it into the main game, an overview, this log.
- **Decision:** Old saves are not converted during the integration (the old story does not fit the new one); only the player position is taken over.
- **Files:** `docs/story/integration-plan.md`, `docs/story/README.md`, this log; a small link from the story preview to the security office preview.
- **Check:** `node --test` → see commit.
- **Open points:** install Node.js; create `security-office.png`; stations 2–4 from teammates; integration after agreement with Fabian.
- **Commit:** `a63e050 Document story logic and integration plan` (`node --test` → 73 / 73 passed)

## Stretch 1 – CI workflow

- `.github/workflows/story-tests.yml`: runs `node --test` in `web/` on every pull request (Node 22). YAML parsed locally with Python; **not** yet run on GitHub itself (will show with the first PR).
- **Commit:** `433500d Run node tests on every pull request`

## Stretch 2 – Story check

- Results in `docs/story/story-check.md`. Two gaps closed: why “M” is Voss (*mécène*), and why he lures the player character to the safe. New test for the explanation.
- **Check:** `node --test` → **74 / 74 passed**.
- **Commit:** `061efd2 Close story gaps: explain M and the lure to the safe`

## Stretch 3 – Accessibility

- **Contrast** (WCAG formula, computed by a script): text on panel 11.2:1, muted text 6.7:1, gold 9.3:1, text on buttons 9.6:1 – all above AA (4.5:1). Locked room cards raised from 72 % to 85 % opacity.
- **Keyboard** (tested in the browser): Tab reaches all buttons, golden focus ring visible, Enter opens, Escape closes (native `<dialog>`, focus stays in the dialog).
- **Bug found:** After closing, the focus stayed on the invisible ✕. Now it jumps back to the button that opened it (even if the button has been redrawn meanwhile). Tested again: focus returns.
- Already present: real `<button>`/`<label>`, `aria-live` for feedback, `aria-label` for letter slots, alt texts for images, security office also with buttons instead of only canvas clicks.
- **Commit:** `ffc889f Return keyboard focus after closing preview dialogs`

## Merge check – 12.11.2026

1. `git fetch origin`; `git log 9beaf57..origin/main` → **no new commits** on `main` since the start.
2. `git merge origin/main` → “Already up to date.” (no merge commit needed, no conflict).
3. Tests after the merge: `cd web && node --test` → **74 tests, 74 passed** (17 old + 57 new). `uv run pytest` → **6 passed**.
4. `git diff --name-status origin/main...HEAD`: only **new** files (status `A`), no existing file changed.
5. Browser: `web/index.html` (main game) and `web/dev/story.html` load without failed resources (screenshots 13, 14).
6. Merge check documentation committed: `1f05d73 Record merge check and prepare pull request text`.

## Extra A – Hint system (`web/story/hints.js`)

- **Goal:** Fulfil the concept “nobody can get stuck for good” outside the stations too.
- **Decisions:** `hintFor(state, level)` is a pure function. Level 1 gives a gentle hint, level 2 a concrete one. Story hints cost **no** points; hints inside a station still cost −5 there, which the station handles itself. After two wrong safe words or two wrong accusations, level 1 is already concrete (names B – I – L – D or the frame label). Hints come from Imani.
- **Check:** 6 new tests (a hint for every story step, safety net after two wrong tries, state and points stay unchanged). `node --test` → **80 / 80 passed**.
- **Commit:** `fc5eaac Add story hints so nobody stays stuck`

## Extra B – Story host (`web/story/host.js`)

- **Goal:** Simplify the integration into the main game and lower its risk.
- **Decisions:** `createStoryHost({ openPanel, closePanel, onChange, stations, storage, storageKey })` bundles loading/saving (always with try/catch; blocked storage → the game still runs), stations through the adapter, conversations, security office points, safe → final question → decision → closing screen (`openVault()` picks the matching step), hints and “New game” with confirmation. The page only lends the host a dialog. The storage can be swapped (`memoryStorage()` for tests). The safe input now gets focus automatically, also after a wrong word.
- **Check:** 8 new tests in `host.test.js`, among them a complete game through the host (wrong word, wrong accusation, ending B, **87 / 100**), loading in a new host, broken and blocked storage. `node --test` → **88 / 88 passed**.
- **Commit:** `624ec55 Add story host that wires the story into any page`

## Extra C – Preview switched to the host

- `web/dev/story-preview.js` now uses `createStoryHost` and only draws the room cards (much shorter). New button “💡 Hint”. Storage key and format unchanged, old preview saves stay valid.
- **Browser check:** New game with confirmation → mission → hint and “Tell me more” → real Station 1 (1× wrong, then right, 17 points) → three placeholders → safe field has focus → two wrong words → hint names B – I – L – D → `b i l d` → wrong accusation Dr. Vale (chain of evidence stays hidden) → Voss (explanation “mécène”) → ending A, **87 / 100**. Page reloaded: state and points kept. Keyboard: Hint opened with Enter, Escape, focus back on “💡 Hint”. Console without errors, no failed resources. Screenshot 15.
- **Docs:** Integration plan with the “short way” through the host (effort about 2–3 h instead of 5–6 h), README and mini-game contract updated.
- **Sync again:** `git fetch origin` → still no new commits on `main`. `node --test` → **88 / 88**, `uv run pytest` → **6 passed**.

## Integration into the main game (branch `feature/story-integration`)

- **Assignment:** Florian, after agreement with Fabian. Checked before: no new commits or branches from Fabian on GitHub.
- **Implementation:**
  - `web/engine.js` now holds only the map and movement. Every object has a `story` field (`station`, `talk`, `examine` or `vault`). New objects: frame rack (Station D), security monitors, shift schedule, Dr. Vale in the storage room. `doorOpen` in the map state mirrors `safe.open` from the story. `restoreState` takes only position and steps from old saves and places the character in front of the storage room if it stood in a storage room that is now locked.
  - `web/main.js`: `createStoryHost` with the existing dialog; `handleInteract` calls the matching host function depending on the `story` field. Old story functions (`interact`, `openVault`, `end`, `showArtwork`, landscape storage) removed. “New Game” runs through the host, which with the new `onReset` also resets the character and the guard.
  - `web/index.html`: `story/story.css`, Hint button, new mission text with “Read M’s message”, journal building block in the sidebar, note “Fictional museum and characters”.
  - `web/story/story.css`: dark variant of the paper dialog (`.story-dark-card`) for story scenes.
  - Old prototype story moved unchanged to `web/legacy/prototype-engine.js` (with a header comment), its tests to `web/legacy/prototype-engine.test.js`.
  - `README.md` (section “Current prototype”) and `docs/work-log.md` brought up to date.
- **Bug found while proofreading:** `atVaultDoor` got the position instead of the state in `draw()` → fixed before it ran in the browser.
- **Tests:** `engine.test.js` new (among others: each station exactly once on the map, every object action exists in the story, all gallery objects reachable on foot, storage room only with an open door, old saves). `guard.test.js` adjusted to new labels. `node --test` → **98 / 98 passed**, `uv run pytest` → **6 passed**.
- **Browser check in the main game** (save deleted before): M’s message on the first start → Station B with the real `landscape.js` (1 mistake, 17 points) → stations I, L, D (placeholders) → security monitors (note) → vault door: `DLIB` rejected, `bild` opens, door lights up → walked through the door into the storage room with the arrow key held → Dr. Vale talks → original: Leon wrong, Voss right → ending B, **87 / 100** → “New Game” with confirmation resets story, door and character → hint and conversation with Leon in the Great Hall. No console errors, no failed resources. Screenshots 16–20.
- **Note on testing:** Short key presses barely move the character, because the game expects held keys; for the test, held keys were simulated and the character was placed next to objects through the save.
- **Open:** Ending A checked in the main game only through tests and the preview, not again in the main game. `specs/museum-walk.md` still describes the old rules (not changed). Fabian builds separate rooms for stations 2–4.
