# Work log

### 2026-11-12 – Take over the existing walk as the starting point

- **People involved:** user assignment; Codex. Human review pending.
- **Starting point:** The shared branch `feature/museum-walk` contains a walkable prototype; the newer Nocturne concept with four stations is not implemented there yet.
- **Decision:** The existing branch was taken into a new branch from `main` so that its history is kept. The game rules of the new concept still have to be implemented.
- **Implementation:** `web/main.js` leaves keyboard input in open dialogs to the dialog instead of catching it for the player character.
- **Check:** The existing test run with Node `--test` reported 6 passed tests. A manual browser test of this change is pending.

After every task, this file records what actually happened. The template and the rules are in the [README](project-history.md). Missing facts are not added until they are checked.

### 2026-11-09 – First local Museum Mystery case

- **People involved:** user assignment; implementation and text proposal by Codex. A human review of the code and the interface is still pending.
- **Starting point and goal:** After PR #2 the repository contained only the README. Wanted were an independently worded assessment of the requirements, a message to the team and a documented and implemented first case.
- **Decision and reason:** The official evaluation page requires a live demo and a code explanation by all members. Login and API were named as evaluation criteria in the shared idea chat, but are not listed explicitly on the publicly available evaluation page. So the Met API, a fixed set of six works, simple rules, Streamlit and local SQLite were chosen for the first vertical path through the game. Real online accounts and a leaderboard stay separate tasks.
- **Data check and correction:** Contrary to the first claim in the documentation, the initially chosen IDs 437133 (*Garden at Sainte-Adresse*) and 10393 (*Lydia Crocheting in the Garden at Marly*) had `isPublicDomain=false` and no `primaryImageSmall`. A user therefore reported the visible app error for 437133. The six IDs now used, 436535, 459193, 436121, 12127, 435882 and 435876, were checked one by one through the object API on 09.11.2026: all returned `isPublicDomain=true`, a small primary image and title, artist, date and medium. Target ID 436535 also returned *Wheat Field with Cypresses* and an image address in a Python API test. The earlier statement “all six checked” was wrong and has been corrected.
- **Implementation:** `specs/first-case.md` defines the case; `game.py` contains points and valid actions; `storage.py` stores the attempt in an ignored SQLite file; `app.py` shows Met works, clues and guesses; `tests/` checks rules and storage. `pyproject.toml`, `uv.lock` and `.gitignore` set up the project. Add branch/PR/commit after publication.
- **Check:** `uv sync` installed the packages. The first test run failed when importing `game`; the `pythonpath` setting in `pyproject.toml` fixed it. After that: `uv run pytest -q` → **6 passed**. Python called the Met API for target ID 436535 successfully. The direct Streamlit launcher was blocked locally by Windows application control; with the managed Python and `PYTHONPATH` the server started, and the health endpoint returned `ok`. A complete manual click-through and a real app restart with a save are still pending.
- **Understanding/review:** No second person has cross-checked code and rules yet. Open questions: Are login and API real course requirements? Which online storage and which hosting do we use? Is the clue path fair for players?

### 2026-11-09 – Error with two artworks fixed

- **Report:** On opening the app, “Met work 437133 has no usable public image” appeared.
- **Cause:** The original data check had wrongly documented `isPublicDomain` and `primaryImageSmall` as present for 437133 and 10393. Both API entries actually returned `false` and no image.
- **Change:** 437133 was replaced by 459193 (*Road in Etten*) and 10393 by 435882 (*Still Life with Apples and a Pot of Primroses*). The free clue now describes an outdoor landscape; the first paid clue separates the target from *Road in Etten* by date. Files affected: `game.py`, `specs/first-case.md`, `tests/test_storage.py`, `app.py` and this log. At the same time, the image display was switched to the current Streamlit option `width="stretch"`.
- **Check:** On a new API request all six Met IDs used returned `isPublicDomain=true` and `primaryImageSmall`. `uv run pytest -q` → **6 passed**. The restarted local server reported `ok`. A Streamlit app test with real API responses ended without an app exception (`exceptions: 0`). The person who reported the error should reload the page and click through the game themselves.
- **Review:** A human play and understanding check is still pending. Add commit/PR after publication.

### 2026-11-09 – Change of direction to the walkable museum

- **People involved:** user feedback: the first picture puzzle was too boring and too easy. Wish: a 2D top-down view with movement similar to the feel of Harvest Moon/Pokémon, a mystery quest and at least two endings. Concept and implementation of this new prototype by Codex.
- **Decision:** The active game interface becomes an original browser game under `web/`. The old Streamlit case is kept as a traceable intermediate stage. The new quest uses simple self-drawn pixel graphics instead of graphics from other games. Browser JavaScript handles movement directly; Python/Streamlit were less suited to this in the first prototype.
- **Route through the game:** Reception → visitor log → guard/badge → gallery/painting forgery → restoration note → number code from the log at the storage door → original → quiet return or public exposure. Details and exclusions are in `specs/museum-walk.md`.
- **Implementation:** `web/engine.js` separates rules and state; `web/main.js` draws map/character and handles keys, dialog, Met API and the local browser save; `web/index.html` and `web/style.css` contain interface and styling. `web/engine.test.js` checks the rules. README and specification were adapted to the new direction.
- **Check:** `node --test` → 6 tests passed, among them a route through the quest to both endings. `node --check main.js` and `node --check engine.js` → no syntax errors. The local web server served `index.html`, JavaScript and CSS each with HTTP 200. A browser view showed map, journal and dialog. The old Python tests passed too (6/6) with the managed Python interpreter; `uv run pytest` was at times blocked by application control on this Windows computer. The old local Streamlit demo server was stopped; the browser prototype stays reachable on port 8000. A complete manual playthrough by a team member is still pending.
- **Addendum:** A four-digit door code from the log time was added as a separate deduction step. A wrong code causes no state change; the right solution opens the door only after the evidence and the badge. `node --test` and the syntax check succeeded again. The map and story must be played and judged by the team. Online accounts, shared storage, public deployment and extra cases are not implemented. Add branch/commit/PR after publication.

### 2026-11-12 – Landscape gallery as the first station

- **People involved:** user assignment and Codex; team review pending.
- **Goal:** Connect the first station of the Nocturne concept to the existing walk.
- **Implementation:** `web/minigames/landscape.js` contains the catalogue comparison Station B with deductions for mistakes and hints. Met images are loaded through the API; local catalogue data and source links stay visible if the API fails. The browser saves the progress locally. `web/main.js` opens the station at the painting.
- **Check:** Node `--test`: 8 tests passed. In a local browser the station was reached and solved with 1889 and oil on canvas; both API images appeared. The check does not yet cover an API failure or a complete restart.
- **Open:** Three more stations, a new journal, the BILD safe, the Voss final question, the planned endings and offline image files are missing. The rest of the walk uses the old rules for now; points from this station are not yet a total score.

### 2026-11-12 – Movement and first hall

- **People involved:** user assignment and Codex; team review pending.
- **Goal:** Smoother movement and a first museum room modelled on the Met, with a visible wall and art.
- **Decision:** The grid state and its collision rules stay; the display interpolates between tiles. Held keys move repeatedly; releasing them, losing focus and dialogs stop the movement. The entrance hall uses light stone arches, columns and a marble floor; architectural model: https://www.metmuseum.org/press-releases/the-great-hall-of-the-metropolitan-museum-of-art-2010-general-information. The character got blue hair and a white coat at the user’s request.
- **Implementation:** `web/main.js` draws the hall, the Met work and the character and controls movement; `web/engine.js` blocks the visible back wall.
- **Check:** Node `--test`: 9 tests passed, among them the wall collision. Browser: room checked visually; an arrow key held for 600 ms moved four tiles. Human review and touch long-press are still pending.

### 2026-11-12 – Full screen and detailed entrance hall

- **People involved:** user assignment; image and implementation with Codex and ImageGen; team review pending.
- **Goal and decision:** Show the entrance hall full screen and in more detail. The generated illustration is modelled on the described Great Hall of the Met; it is not a true-to-scale depiction. The light floor follows the described marble aggregate without a checkerboard pattern. The Met work is still loaded from the API into the middle frame.
- **Implementation:** `web/assets/great-hall.png` is the generated background; `web/main.js` draws larger characters and the hall, `web/style.css` makes the play area full screen and the journal collapsible. Other rooms still use the earlier display.
- **Check:** Node `--test`: 9 tests passed. Browser: full-screen hall, loading of the artwork, journal and movement checked. A manual run through all rooms and a mobile device test are still pending.

### 2026-11-12 – Art in all frames

- **People involved:** user assignment and Codex; team review pending.
- **Implementation:** All three frames of the entrance hall show public-domain Met works. The Met API reported `isPublicDomain=true` for objects 436121, 436535 and 12127; their small original images were saved as local files. Source links are in the journal. So they appear even without an API connection.
- **Check:** Node `--test`: 9 tests passed. In the browser all three filled frames were checked visually. A complete manual offline test is still pending.

### 2026-11-12 – Direction of movement, speed and characters

- **People involved:** user assignment and Codex; team review pending.
- **Goal:** Even visible movement, recognisable boundaries and livelier characters.
- **Implementation:** `web/motion.js` computes the duration of a step from the actual screen distance, including the different scaling in the hall. `web/main.js` draws the player character’s facing direction and walking animation, a slight movement of the NPCs within their existing interaction area and the boundaries of the hall floor. UI accents were made stronger.
- **Check:** Node `--test`: 10 tests passed, among them a speed comparison on both axes. In the browser the hall, arrow keys and facing direction were checked. NPCs do not yet change position between tiles; mobile device test pending.

### 2026-11-12 – Rework wall collision and characters

- **People involved:** user assignment and Codex; team review pending.
- **Implementation:** The boundary of the picture wall blocks all tiles above the walkable hall; saves in this area are moved to the nearest walkable tile on loading. The player character has clearly swinging legs, the guard has eyes and a mouth. A proposed new cartoon background was not used, at the user’s explicit request.
- **Check:** Node `--test`: 10 tests passed, among them wall tiles between the pictures. In the browser the up arrow was held and the character stayed below the picture wall. The animations still need human feedback.

### 2026-11-12 – New York and characters

- **People involved:** user assignment, Codex and ImageGen; team review pending.
- **Implementation:** `web/assets/great-hall-nyc.png` is a new, generated version of the existing hall with the New York skyline in the windows; the rejected cartoon version was not built in. The player character got more distinct blue hair, bigger eyes, a blue shirt and an open white coat.
- **Check:** Node `--test`: 10 tests passed. Windows, picture frames and characters were checked visually in the browser.

### 2026-11-12 – Guard patrol and character reference

- **People involved:** user assignment and Codex; team review pending. Character reference: https://cdna.artstation.com/p/assets/images/images/025/720/998/large/manellopgar-manuel-lopez-manellopgar-manuel-lopez-rick-turnarround.jpg?1586723290
- **Implementation:** Following the reference, the player character got longer brown trouser legs, an open coat and narrow arms. The guard chooses walkable neighbouring tiles and pauses of different lengths, walks more slowly and looks in his walking direction. Collisions and interaction take his position into account; he pauses during a conversation.
- **Check:** Node `--test`: 12 tests passed, including the moving guard position and route choice. Browser: guard movement and change of position observed. A longer manual check of all four walking directions is still pending.

### 2026-11-12 – Continuous movement and higher-resolution hall

- **People involved:** user assignment and Codex; team review pending.
- **Starting point and goal:** Until now a grid step finished after release, and the canvas stretched the hall. Wanted were immediate stopping, clear character views and a sharp, undistorted display.
- **Implementation:** The player position is now continuous and is saved with fractional tile values. Keyboard and on-screen buttons move only while held; movement, walls and guard use the same current position. The guard avoids visible overlaps. The canvas renders at twice the resolution, the aspect ratio is kept and the camera follows in the hall. Characters have side and back views as well as moving arms and legs. Files: `web/main.js`, `web/motion.js`, `web/engine.js`, `web/guard.js`, `web/index.html`, `web/style.css` and `web/motion.test.js`.
- **Check:** `node --test` with the bundled Node runtime: 17 tests passed. Checked in the browser: held and released arrow key, held on-screen button, saved position after reload, facing direction, hall display, wall and conversation with the guard. In a first check characters overlapped visibly; the collision distance was adjusted and covered by a test. After the collision adjustment a conversation with the guard was opened in the browser again; the on-screen button was held and stopping after release was checked. A real mobile device test is still pending.
- **Limits:** The high-resolution canvas draws the existing illustration; it is not a newly taken photo, and the other rooms still use the older design.

### 2026-11-12 – Close dialogs with E

- **People involved:** user assignment and Codex; team review pending.
- **Implementation:** `E` closes open dialogs as long as no free text field is being edited. Numeric code fields can also be closed with `E`; `Escape` stays available. The hint in `web/index.html` explains both functions.
- **Check:** Node `--test`: 17 tests passed. In the browser the guard dialog was opened with `E` and closed with another `E`. Free text and safe code focus were not checked manually.

### 2026-11-12 – Switch game text to English

- **People involved:** user assignment and Codex; the user then wants the merge.
- **Implementation:** The existing playable storyline, the hints, endings, controls and the landscape gallery were translated into English. Game logic and saved IDs stay unchanged. Files: `web/index.html`, `web/main.js`, `web/engine.js`, `web/minigames/landscape.js` and `web/guard.test.js`.
- **Check:** `node --test`: 17 tests passed. `uv run pytest -q`: 6 tests passed. In the browser the title, mission description, journal, controls and a dialog were checked in English. The whole game flow was not played through manually after the translation.
- **Limit:** The existing storyline of the prototype was translated; the complete newer Nocturne concept is not implemented yet.

### 2026-11-12 – Nocturne story connected to the main game

- **People involved:** Florian Baumgartl (assignment, agreement with Fabian), Claude Code (implementation).
- **Implementation:** `web/main.js` uses the story host from `web/story/host.js`. `web/engine.js` now holds only the map and movement; every map object says as data which story action it triggers. The storage door is the safe (code word `BILD`). The old prototype story with its tests stays unchanged in `web/legacy/`. Details: `docs/story/work-log-florian-b.md`.
- **Check:** `node --test`: 98 tests passed. `uv run pytest -q`: 6 passed. Played through completely in the browser (see the story log).
- **Limit:** Stations 2–4 are placeholders at existing map points until their own rooms and mini-games exist.

### 2026-11-13 – Gallery, cameras and visible entrance

- **People involved:** user assignment and Codex with built-in image generation; human team review pending.
- **Goal:** The gallery should match the image concept chosen together, show a recognisable New York view and active cameras and be recognisable from the main room as a second room. The existing game flow stays.
- **Design:** `web/assets/gallery-nocturne-nyc.png` was developed from the generated concept: night gallery, paintings, red seating, vault on the right, two cameras and Manhattan in the window. `web/assets/great-hall-gallery-door.png` is an edited version of the existing hall image with an open, lit gallery arch on the right. The painted background images are fictional decoration; the real Met works and Met data stay in the existing puzzle. The images were made with the built-in image tool; starting prompt: “detailed pixel-art nighttime museum gallery, dark teal walls, gold-framed landscape paintings, parquet, burgundy benches, left passage, vault on right, New York skyline through window, two cameras”; for the hall: “add an open sandstone archway on the right with a glimpse into the adjoining teal gallery; preserve the hall and skyline”.
- **Implementation:** `web/gallery.js` draws the background image, the characters, tasks and blinking red camera lights; reduced motion stops the lights. `web/gallery-layout.js` describes the visible walls and furniture. `web/engine.js` and `web/motion.js` check the boundaries and translate the entrance between the two room views. Old saves inside new obstacles are moved safely; story progress is kept. `web/main.js` and `web/style.css` show the new arch and keep the room fully in the window. Stations and vault keep their original story actions. The cameras are only visual and have no alarm or detection function.
- **Check:** `node --test` in `web`: 105 tests passed, among them movement limits, both directions through the entrance, benches, vault door, old saves and camera blinking. In the browser both directions through the new entrance and opening the landscape puzzle were checked; the save survived a server restart. The gallery view and the main hall were checked visually. A complete new run of both endings and a test on a real mobile device are pending.
- **Limits:** The image generation was adapted to the existing grid; the decoration is not an exact Met gallery plan. Human review and a GitHub merge can only be shown after they have actually happened.

- **Addition at the user’s request:** The view through the left gallery arch now shows the light entrance hall with stone arches and marble floor. The image was reworked with the built-in image tool based on the existing hall; cameras, New York windows, furniture and room boundaries stay in their previous positions.

### 2026-11-13 – Make the gallery entrance easier to walk through

- **People involved:** the user reported the bug; Codex analysed and fixed it. Human team review pending.
- **Cause and implementation:** With continuous walking, the gallery entrance allowed only a very narrow position in the hall. `web/engine.js` and `web/motion.js` now allow access across the width of the visible opening, including the position directly at the back wall. The boundary in `web/main.js` was adjusted to the opening; the other walls and the locked vault door stay blocked.
- **Check:** `node --test` in `web`, including new tests for several access positions and a blocked wall position. In the browser the character walked from the hall to the back wall and then right into the gallery.

### 2026-11-13 – Put room changes at the visible doors

- **People involved:** user feedback; Codex. Human team review pending.
- **Problem and solution:** For a room change the character previously had to walk over the edge and arrived at the edge of the next scene. The room change now starts in the visible passage; the character appears in the passage of the target room. A short transition fades between the views. The hall view shows more of the gallery arch, and the three pictures were adjusted to the changed view.
- **Technique:** `web/gallery-layout.js` contains the entry and exit positions; `web/motion.js` uses them while walking without skipping the collision with the guard. `web/main.js` controls the short transition. The other collisions, the vault and existing saves stay.
- **Check:** In the browser both directions through the arch and the arrival in the gallery were checked; automated tests check the positions at both visible doors, a free gallery arrival, old game progress as well as walls and vault. A complete human run of both endings is pending.

### 2026-11-13 – Improve the room transition after a video

- **People involved:** user feedback and video; Codex. Human team review pending.
- **Problem:** The video showed that the character stood in front of the hall arch but had to walk sideways and, after the transition, appeared very close to the edge of the gallery arch.
- **Implementation:** `web/gallery-layout.js` now also recognises walking up into the hall arch. The arrival points lie on the floor in front of each passage, so the character stays visible and a change of direction does not lead straight back. `web/engine.js` keeps the grid navigation integer for the existing reach tests; the actual movement still uses exact positions. The existing fade and wall collision stay.
- **Check:** In the browser the arch was entered upwards and the gallery left to the left; each time the character appeared on the floor. Automated tests check both directions, the arrival position and a blocked wall spot. A complete human run is pending.


### 2026-11-13 – Separate security room

- **People involved:** user assignment, Codex and built-in image generation. Before the start, the previous state `84984dc` was merged on GitHub/main. Human team review pending.
- **Goal:** The security overview should be in its own room instead of appearing as small monitors and a duty roster on the gallery floor.
- **Implementation:** A labelled passage at the bottom right of the gallery leads into a separate walkable security room with nine monitors. Three show illustrative still previews of the hall, gallery and vault; six show “NO SIGNAL”. There is no live camera feed. The existing story actions for the monitor wall and duty roster, and the existing actions for the radio and key board, can be reached in the room with `E`. The exit at the bottom leads back. The separate room and the position are saved locally; existing saves stay valid. Files: `web/security-room.js`, `web/engine.js`, `web/motion.js`, `web/main.js`, `web/gallery.js`, `web/gallery-layout.js` and `web/style.css`.
- **Design:** `web/assets/security-office.png` was made with the built-in image tool for a walkable night-time security room with a monitor wall and floor area. `web/assets/gallery-security-door.png` is an edited version of the gallery with an additional security entrance. Existing camera LEDs and room boundaries were kept.
- **Check:** `node --test` checks among other things entrance and exit, room boundaries, actions, saves and the old story code. In the browser the entrance, the monitor wall dialog, local restore after reload and the exit were checked. A complete new run of both endings and a test on a real mobile device are pending.

### 2026-11-13 – Move the security room to the main entrance

- **People involved:** user feedback and screen video; Codex and built-in image generation. Human team review pending.
- **Problem:** The extra entrance on the gallery wall appeared visually above the floor, and the character could overlap with the painted arch. Also, the security centre should be located at the museum entrance.
- **Implementation:** The access is now a labelled arch, flush with the floor, on the left of the entrance hall. The room is entered there by walking upwards; at the bottom of the security room you go back into the hall. The earlier gallery illustration and its side wall including the plant collision are restored. The security room shows a view of the hall at the exit. The new hall illustration is shown completely and without distorted stretching; the walkable bottom and side edges keep the character inside the visible boundary. Existing security room saves and hints stay. `web/assets/great-hall-security-door.png` and `web/assets/security-office-hall-exit.png` were edited with the built-in image tool based on the existing room illustrations.
- **Check:** Automated tests check the passages, the boundaries, the guard, the saved position and existing story actions. In the browser both directions at the new entrance, the visible hall edges and the existing way to the gallery were checked. A complete human run of both endings and a real mobile device test are pending.


### 2026-11-13 – Remove the visible walking boundary in the entrance hall

- **People involved:** user assignment and Codex; human review pending.
- **Implementation:** `web/main.js` no longer draws the extra rectangular walking marker. The movement limits stay so the character does not walk over the edge of the hall. The image with its own marble floor is not changed. `web/motion.js` and `web/security-room.test.js` describe this invisible boundary accordingly.
- **Check:** The existing movement tests still check the sides and the bottom edge of the hall as well as the accesses to the gallery and the security room.


### 2026-11-13 – Room names in stone style

- **People involved:** user assignment and Codex; human review pending.
- **Implementation:** The black signs above the two hall arches were replaced with light sandstone plates. `web/main.js` draws the room names with a shadow and a light edge as carved lettering on the stone-coloured plates, centred above the passages. Room accesses and movement stay unchanged.
- **Check:** The game view was checked in the browser; all 115 existing automated tests pass.

### 2026-11-13 – Fit the room signs into the architecture

- **People involved:** user assignment and Codex; human review pending.
- **Implementation:** The signs centred above the passages now use a stone texture from the hall image, subtle recessed edges and readable lettering. The conspicuous dark frames were removed.
- **Check:** The hall view was checked in the browser; the existing automated tests were run.

### 2026-11-15 – Station I: portrait timeline (branch `feature/portrait-timeline`)

- **People involved:** Florian Baumgartl (assignment, concept requirements), Claude Code (implementation). Quality benchmark: Leopold’s Station L (branch `feature/renoir-picture-puzzle`, read only, not merged).
- **Goal:** Build Station I from the team concept: order three real Met portraits from the oldest to the newest work; with the right order the cards turn over and form the night-shift log (“Leon was elsewhere; booked as patron visit – A. V.”).
- **Decisions:**
  - Three files like Station L: `web/minigames/portrait-rules.js` (pure rules), `portrait-artwork.js` (Met API with a time limit and checks of ID, public domain, title, artist and image host; otherwise a local copy), `portrait-timeline.js` (interface, contract `start(container, caseData, onSolved)`, returns a cleanup function).
  - The right order comes from the frozen snapshot `objectBeginDate`/`objectEndDate` in `web/story/case-1.js` (check date 15.11.2026); for a range the start year counts. Live data only loads images.
  - Years are not on the card, not in the alt text and not in the source line, only in the expandable “Catalogue entry”. The backs with the times exist in the document only after the solution, so they do not give away the order.
  - `revealed` in the state = cards whose place a hint has revealed (1st hint oldest, 2nd newest work). The error message does not say how many cards are right. No clock (concept: no time scoring).
  - Own CSS file `portrait-timeline.css`, which the station includes itself, so no shared CSS file has to change.
  - Controls: click-click swaps, dragging with the mouse (native drag and drop like Station L), tap-tap on touch, keyboard (Enter/Space pick up/drop, arrow keys move).
  - Station D now uses 435882 instead of 436121 (Degas belongs to Station I). Label in the Great Hall: “Portrait timeline · Station I”.
- **Files:** new `web/minigames/portrait-rules.js`, `portrait-artwork.js`, `portrait-timeline.js`, `portrait-timeline.css`, `portrait-timeline.test.js`, `web/assets/met-435876.jpg`, `web/assets/met-435876-source.md`, `met-436121-source.md`, `met-12127-source.md`, `docs/screenshots/station-i-*.png`; changed `web/story/case-1.js` (Station I/D, Met data), one import and one entry each in `web/main.js` and `web/dev/story-preview.js`, the label in `web/engine.js`, data-dependent tests (`hints.test.js`, `stations.test.js`, `save-and-case.test.js`, `engine.test.js`), README, mini-game contract.
- **Checks (actually run):**
  - Met API requested for 436121, 12127, 435876, 435882: all public domain, dates 1865 / 1883–84 / 1888–90. The existing `met-436121.jpg` and `met-12127.jpg` are byte-identical to the current `primaryImageSmall` (SHA-256 compared); `met-435876.jpg` downloaded unchanged.
  - `cd web && node --test`: starting point 115 passed; after all milestones **136 passed, 0 failed** (18 new tests for Station I, plus data and label tests). Note: rules and tests were written together; there was no visible red phase.
  - Main game in the browser: character at the desk in the Great Hall, `E` → Station I → once wrong (“Not quite …”), one hint (Degas marked as “Oldest”), put in the right order with click-click → cards turn over, log appears, journal shows I and 12 points (20 − 3 − 5). Page reloaded: state kept. At 1440 × 900 the dialog fits without inner scrolling before and after the solution.
  - Preview `web/dev/story.html`: station solved with the keyboard only (single keys; on the first try, test keys sent in quick succession were lost). Escape closes, focus on the page.
  - Phone 390 × 844: cards stacked, tap-tap swaps, no sideways scrolling. Met API failure simulated with a blocked `fetch`: local copies + “Using the bundled Met images.”
  - Whole game in the preview up to the closing screen: line “Portrait Hall (I) · 1 mistake(s), 1 hint(s) · 12 / 20”, total 92 / 100. Console without errors.
- **Open points:** Reduced motion implemented only through a CSS rule, not emulated in the browser. In the main game the focus does not jump back after closing the dialog (focus return is planned in Leopold’s still open branch for `main.js`). Station L (Leopold) replaces the work 435882 in his branch → when merging, keep 435882 in `works`, otherwise Station D breaks.

### 2026-11-15 – Load faster and tidy up (branch `feature/faster-load-and-storage-room`)

- **People involved:** Florian Baumgartl (assignment), Claude Code (implementation). Images and `main.js` are Fabian’s area; agreement with Fabian before the merge.
- **Images:** The four PNG backgrounds in use were saved as JPG (quality 88, gallery 93). Difference from the original measured pixel by pixel: on average below 3 of 255, PSNR 34.9–40.6 dB (not visible to the naked eye). Seven PNGs no longer used were removed (they stay in the Git history). Initial download measured in the browser: **9.9 MB → 3.0 MB**. `web/assets`: about 22 MB → 4.8 MB.
- **`main.js`:** The journal is rebuilt only when the story state changes (before, several times per second while walking; measured: now 1 rebuild when accepting the mission, 0 while walking). The Met API request at startup is gone; the small Van Gogh image in the storage room comes from the local copy. Unused variables removed.
- **Dropped:** A storage room drawn in code was built, but it did not fit the painted rooms visually and was taken back. Better: a painted storage room image in the style of the other rooms.
- **Checks:** `cd web && node --test` and `uv run pytest` (result see commit); in the browser: Great Hall, gallery and security room look unchanged, console without errors.

### 2026-11-16 – Sounds for story moments (branch `feature/sound`)

- **People involved:** Florian Baumgartl (assignment), Claude Code (implementation).
- **Implementation:** The new file `web/story/sound.js` creates short sounds with the Web Audio API, without audio files: paper (mission, note), chord (new letter, right accusation), error tone, bolt and door (safe), bell (hint), card flip (Station I), one closing chord for each ending. Three parts: `soundFor()` chooses the sound for an engine action (wrong answer = state changed, rejected action = same state and silent), `recipe()` describes each sound as a list of tones, `createSoundPlayer()` plays them quietly and remembers “muted” in `localStorage`. The story host plays the sounds in `act()` and on a hint; stations can trigger their own small sounds through `caseData.playSound` (Station I: click, error, flip). Button “🔊 Sound / 🔇 Muted” in `web/index.html` and the preview.
- **Checks:** `cd web && node --test`: **144 passed** (8 new: mapping, silence for rejected actions, length/volume of all sounds, “muted” produces no tones, saving the choice, no crash without Web Audio, host flow, Station I). Counted in the browser: accept the mission → 1 tone, hint → 2 tones, muted → 0 tones; console without errors.
- **Limit:** Only a person can judge whether the sounds sound good; volume and tones are in `recipe()` and easy to adjust. Browsers play sound only after the first click or key press.
- **Addendum (same branch): steps and music.** Steps while walking, every 0.36 s, with a separate sound per floor (marble Great Hall, wood gallery, carpet security room, stone storage room). Music: research showed that large art museums usually play no background music in the galleries; music is more common in single exhibitions or as an option to switch on (e.g. LACMA). So the music is a quiet melody generated live by the browser in D minor pentatonic with a low root, **off by default**, with its own button “♪ Music”; the choice is saved. Tests: `node --test` **147 passed** (3 new: step sound per room, melody stays in the scale with small steps, music on/off/saved with a fake timer). Counted in the browser: music on → 2 notes in 4.5 s, off → no more tones. Steps could not be checked in the browser because the app window was hidden (no animation).
- **Addendum: steps reworked** (feedback from Florian: “doesn’t sound like real walking, too loud”). New: every step = a low heel strike (sine tone 80–115 Hz that falls off quickly) + a quiet roll of the sole (low noise); no more bright clicks. Each step varies slightly in pitch (±6 %) and volume (±15 %), the left and right foot sound a bit different. Steps run through their own channel at about a third of the volume, tempo 0.42 s. Tests: **150 passed** (3 new). Created in the browser with real Web Audio without errors; the sound has to be judged by a person.
- **Addendum: steps as heeled shoes** (feedback: “should sound like heels in a hall”). Every step is now a very short, hard “clack” (high-pass noise ≈ 12 ms + a bright, quickly fading tone around 1.4–1.7 kHz) with artificial room reverb (`ConvolverNode` with decaying noise as the room response): Great Hall 1.6 s, storage room 0.9 s, gallery (wood, lower “tock”) 0.6 s, security room (carpet) almost without clack and reverb. Tests: **150 passed** (step test adjusted to the new requirement). Created in the browser with real Web Audio without errors, including reverb.


## 2026-11-16: Integration of Renoir and updated main
Portrait timeline, sound and JPG backgrounds integrated. Both artworks (Station D Cézanne and L Renoir) are kept. Points are earned again: Renoir 15/10/5/0 at <=30/45/60/>60 seconds; total maximum 95. No reference image, hover zoom or slot markers; native keyboard controls. Browser playthrough completed successfully.

### 2026-11-17 – Status lights of the surveillance cameras

- **Assignment:** Active cameras should generally be recognisable by a blinking red light.
- **Implementation:** The gallery and the vault room use the same blinking logic; the camera views on the monitor wall use it as well. With reduced motion the light stays visible permanently. The requirement for new rooms is documented in the README.
- **Check:** Vault room viewed in the browser; automated checks for blink phases and reduced motion added.

### 2026-11-17 – Guard Leon talks in a speech box (branch `feature/guard-speech-box`)

- **People involved:** Florian Baumgartl (assignment `claude-code-guard-dialog-auftrag.md`), Claude Code (implementation). `main.js` is Fabian’s area: there only the distance check, pausing the character and Leon, and Leon’s facing direction during the conversation.
- **Goal:** The conversation with Leon starts by itself in an RPG speech box with two small-talk questions whose answers fit the game state and help without giving away solutions.
- **Decisions:** Text (`dialogues.js`), timing (`proximity.js`) and display (`speech-box.js`) are separate, so text and timing can be tested without a browser. Long answers are spread over several boxes (at most two sentences per box). Question 2 always names the first open station in the order B-I-L-D. Leon never mentions the safe, code, a year or Voss before the accusation. The conversation does not change the game state. Other characters still use the large window.
- **Files:** new `web/story/speech-box.js`, `web/story/proximity.js`, `docs/story/speech-box.md`, tests `conversation`, `proximity`, `speech-box`; changed `dialogues.js`, `host.js`, `story.css`, `main.js`, `index.html` (cache version only), `tests/fake-dom.js` (`classList`).
- **Checks:** `cd web && node --test`: **197 passed** (before 178; 19 new). In the browser (app window hidden, so animation driven by a timer): walked to Leon → box opens by itself; question 1 with key `1` with typewriter, Space, four boxes, back to the buttons; question 2 with arrow + Enter and with a mouse click; “Goodbye” → “Mind the cameras.” → closed; nearby it stays closed; after walking away and 8 s it opens again. Phone 390×844: box fits without scrolling, character visible. Console without errors. Screenshots `docs/screenshots/guard-speech-*.png`.
- **Not checked:** Box at the top when the character stands low only in the unit test (Leon walks randomly, the spot was hard to hit in the browser).
- **Addendum (feedback from Florian: “for everyone, opens nearby, closes when walking away, without E”):** Now applies to Leon, Imani and Dr. Vale (there is only one guard). The box opens below 1.2 and closes beyond 1.8 steps; the character may walk during the conversation; the 8 s waiting time was removed; no “E” sign and no `E` action for people any more. Found in the browser: in the Great Hall one tile downwards is only 14 px high, but 100 px to the right; so the distance is now measured on screen. Tests: `node --test` **198 passed**. Browser: walked to Leon → box open, stood for 3 s → stays open, walked away → closed after 10 short steps. Imani/Vale checked only through unit tests (the automated test did not find the way into the gallery).
- **Addendum:** On request, closer: now opens below 0.8 instead of 1.2 steps, closes beyond 1.3 instead of 1.8. Tests: 198 passed.

### 2026-11-17 – Station I as a speedrun (branch `feature/portrait-speedrun`)

- **Occasion:** The professor’s feedback on all mini-games: must fit in the frame (no scrolling), faster to understand (less text), faster to play (speedrun with a visible timer). Assignment `claude-code-station-I-speedrun-auftrag.md`.
- **Implementation:** New mechanic “Catalogue Flash”: “Start” starts the clock and shows all dates for 3 s; then sort (click-click, drag, keys 1/2/3, Enter checks). “Peek” shows one date for 1.5 s for +5 s, a wrong check +5 s. Reopening gives no second flash. After solving, the cards turn over (600 ms), each with a short log line, result “Solved in 0:08 · +15”, one button “Continue”. Best time in its own storage key. Sounds through `sound.js` (start, click, error, peek, flip).
- **Points:** `portraitSpeedPoints` 15/10/5/0 at ≤ 20/35/50 s. **The total maximum drops from 95 to 90** (Station I max 15 instead of 20, like L). Old saves without a time: 5 points. The closing screen shows “Portrait timeline time 0:22”.
- **Decisions:** The Station I rules stay free of DOM (`portrait-rules.js`); the view moved to `portrait-view.js`. The host button “Back to the museum” and the host note are hidden by CSS for Station I only; “Continue” presses the host button. So `host.js` stays unchanged. The engine calls `synchronizeScore` without progress; Station I times are set only when the host passes the progress along.
- **Measurements (story preview, `scrollHeight`/`clientHeight` of the dialog):** before 1280×720 **716/686 (scrolling)**, 1440×900 716/716; after 1280×720 539/539 (start, after a mistake, solved), 1440×900 562/562, 390×844 549/549 and 574/574 (solved). Visible words in the start state (without artist/title): **before 158, after 15**.
- **Pace:** Run in the browser by script (start, read the dates, one deliberately wrong check, 1–2 swaps, Enter): **0:08 on the clock including the 5 s penalty**, so about 3 s without mistakes.
- **Tests:** `cd web && node --test`: **206 passed** (before 198). Adjusted with reasons: points tests (Station I max 15, total 90), old UI tests replaced (the hint button and catalogue entries no longer exist).
- **Not checked / open:** The Playwright script `web/dev/e2e-station-i.mjs` is written but not run (Playwright and Node are not installed on this computer); the same steps ran by script in the built-in browser. Dialog in the main game not measured directly (game loop paused in the hidden browser window); room there 688 px, the station needs 539 px. No highlighting of the evidence in the journal (would change `journal.js`, outside the assignment). Accessibility checked by hand (roles `timer`/`status`, `aria-live`, labels on cards, peek and links, visible focus, dark text on gold); no Lighthouse/axe run.
- **Addendum (feedback from Florian):** The speech box opens a bit earlier again (below 1.0 instead of 0.8 steps, closes beyond 1.5). Station I: if an old save was already in the right order, “Start” shuffles the cards again. Tests: 207 passed.

### 2026-11-17 – Gallery boundaries and vault door

- **Assignment:** Improve the gallery boundaries shown in the video and take into account the different positions of the closed and the open vault door. Characters may be partly hidden behind plants and furniture.
- **Implementation:** Depending on the door state, the door boundary now follows the closed door leaf or the leaf swung into the room. The distance to the back wall was adjusted; plant bases stay obstacles, and the leaves are drawn in the foreground when characters are behind them.
- **Check:** Closed door and passage to the open vault checked in the browser; 209 Node tests passed, among them door states, passages and plant foreground.

### 2026-11-17 – Renoir picture puzzle: controls and display

- **Start and help:** Reduced start screen with a help popup. Shortcuts for Enter and Esc are shown as keys. The golden focus ring matches the other game dialogs.
- **Tray and controls:** Eight fixed tray slots sit in a 4×2 grid next to the picture. Pieces can be put back with the keyboard or drag and drop. The animated mouse pointer leads from a piece in the tray to an empty place in the picture frame.
- **Time and finish:** The time bar shows the points at 30, 45 and 60 seconds. After that it runs out until 70 seconds and shows +0 points without an extra time mark. After solving, the frame glows and the finish window shows the journal letter L and the points earned.
- **Check:** Based on `main` (`2aff91c`), all 214 JavaScript tests passed.

### 2026-11-17 – Plant outline and the way to the vault

- **Assignment:** Draw the plant outlines more precisely and remove the invisible barrier between the right plant and the vault.
- **Implementation:** The plants in the foreground are cut out along a traced outline. For continuous movement the gallery checks the visible floor shape and obstacles instead of extra rounded grid boundaries; the open vault can also be reached from the front right.
- **Check:** The way from the right plant to the door and then into the open vault checked in the browser; all 216 Node tests pass.

### 2026-11-17 - Home screen and two clear ending views (branch `codex/home-and-end-screen`)

- **Starting point:** After the professor’s feedback the existing game is being finished. On `main`, Leon with two questions (PR #13), Station I as a speedrun (PR #14), the Renoir interface (PR #15) and several fixes of the gallery edges were already present. A home screen was missing. Two endings were playable, but their texts and choice did not yet fit the team’s new wording.
- **Implementation with AI support:** A home screen before the game offers start/resume, a confirmed restart and saved switches for sounds and music. The game starts only after the start click; the world pauses in the menu. The existing end states `heist` and `open-file` stay saved, but are shown as “Steal the artwork / I am a thief” and “Quit the mission / I am not a thief”. The ending screen shows the artwork, a short consequence and the points; the chain of evidence and points details can be expanded. From the ending, a button leads back to the home screen. Affected: `web/index.html`, `web/main.js`, `web/style.css`, `web/story/endings.js`, `web/story/host.js` and `web/story/story.css`.
- **Check:** `node --test` in the `web` folder: 217 passed, 0 failed. The tests for ending texts and ending choice were updated to the new decision. A browser preview could not be opened in this session; so the visual run is still open before the merge.
- **Open:** A “speedrun” ending as its own game mode is not built by this; stealing stays the existing end decision after the case. Login and an online leaderboard are not part of this branch either. Another team member should check the menu, resume, restart and both endings in the browser and explain the code.

### 2026-11-17 - Home screen following the reference image

- **Reference:** Florian Stodden provided `Gemini_Generated_Image_lnvg82lnvg82lnvg - Copy.jpg` as the wanted home screen view. The file was copied into the project as `web/assets/home-screen-reference.jpg`; the illustration already contains the title and buttons in the image. The drawn works are decoration; artworks examined in the game stay real Met images.
- **Implementation:** Real HTML buttons with keyboard focus lie on top of the four drawn buttons. “Resume Game” is disabled without a saved case; “Start New Game” then starts directly and asks before resetting if there is progress. Settings toggles the existing saved sounds and music. Scoreboard explicitly shows only the save of this device; a shared online leaderboard with login does not exist yet. On narrow screens readable real buttons are shown in front of the image.
- **Check:** 217 Node tests passed; `node --check web/main.js` and `git diff --check` without errors. The desktop view was compared visually with the reference in local Chrome. Clicking through the menus could not be checked reliably through browser control and stays part of the team review before the merge.

### 2026-11-17 - Login idea paused; the public game stays without sign-in

- **Course of events:** Florian first wanted a login with username and password before the home screen. On the separate branch `codex/login-signup` an interface following his reference image was made for this; a real account service was not connected yet. After the question whether passwords could live in the GitHub project, it was explained and documented that the public repository and GitHub Pages offer no confidential sign-in server for this. Florian briefly chose GitHub sign-in, then explicitly wanted **no Clerk** and finally decided: **no login for now**.
- **Current decision:** The draft branch is not merged into `main`. The public game stays accessible directly through the home screen. There are neither player accounts nor a shared online leaderboard; the Scoreboard button shows only local results.
- **GitHub state:** `codex/login-signup` stays on GitHub as a separate, paused draft history. This documentation entry describes the current decision in `main`. No Clerk or GitHub OAuth app and no player accounts were created. The existing game implementation is not changed by this entry.
- **Source for the technical decision:** [GitHub Pages is static hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages); [passwords in the repository can remain in the Git history](https://docs.github.com/en/code-security/concepts/secret-security/secret-leakage-risks).

### 2026-11-17 – Station I with the look and feel of Station L (branch `feature/station-i-look-like-l`)

- **Assignment:** `claude-code-station-I-wie-L-auftrag.md`. Station I should feel like Leopold’s Station L; the “Catalogue Flash” mechanic stays.
- **Implementation:** New shared building blocks `web/minigames/station-ui.js` (`introPopup`, `speedBar`, `showPopup`, `successPopup`, `creditLine`, `shortcutButton`) with L’s CSS classes. The root of Station I also carries the class `picture-puzzle`, so L’s existing rules apply; only three extra rules in `station-ui.css` (own tick marks on the points bar). `picture-puzzle.js` and L’s CSS are unchanged.
- **Flow like L:** Intro (task, golden line “Points are given based on speed”, round “?”) → “Start ↵” → flash 3 s → sorting with a points bar +15/+10/+5/+0 at 0/20/35/50 s → success popup with the letter I “added to journal” and “+X points earned” → “Return to museum ↵ Esc”. Esc goes back to the museum at any time. Penalties (+5 s) and `portraitSpeedPoints` unchanged.
- **Cards:** three cards of equal size in a 3 px gold frame like the L board, image with `object-fit: cover`; the black edges of the Met photos are cut off by slight enlargement, and with Degas the face stays in the picture on the right. Drag arrow like L (`puzzle-drag-demo`): after the flash once from the last card to place 1, disappears on the first click/drag, does not come back on reopening; with reduced motion briefly without animation.
- **Decision:** The credit line of I shows no years (unlike L), because the years are the solution. The arrow starts at the last card instead of the first, because the first card already lies in place 1.
- **Measurements (story preview, content/room of the dialog):** 1280×720 intro 207/207, game 677/677, solved 640/640; 1440×900 intro 207/207, game 745/745, solved 707/707 (measured before the last card size reduction); 390×844 intro 221/221, game 686/686, solved 653/653. Visible words: intro 15, game 21–25.
- **Tests:** `cd web && node --test`: **226 passed** (6 new in `station-ui.test.js`, Station I UI tests rewritten for the new flow).
- **Comparison:** `web/dev/station-compare.html` shows L and I side by side in the game dialog; images in `web/dev/shots/` (overview `index.html`), taken in the built-in browser instead of with Playwright.
- **Open:** Playwright is not installed on this computer; `web/dev/e2e-station-i.mjs` is adapted to the new flow but not run. Main game dialog not measured directly.

### 2026-11-17 - Guest entry as preparation for a later login

- **Assignment:** Florian already wants the reference image as the first screen, then a click through a provisional sign-in view to the home screen, and only after that into the game with M’s mission message. The real sign-in should come later; he wants a finished pull request to merge.
- **Implementation with AI support:** The provided image file `Gemini_Generated_Image_keehk8keehk8keeh.jpg` was included as `web/assets/login-screen-reference.jpg`. “Log In” and “Sign Up” are real keyboard and mouse buttons on top of the image and open separate guest views. These explain that accounts are not available yet. **Continue as guest** opens the existing home screen; the game starts there as before. No account, password or online service was added. Details: `docs/guest-entry-flow.md`.
- **Check:** 217 Node tests passed, syntax and diff without errors. In a local browser both entries, Back, the transition to the home screen and **Start New Game → M’s message** were checked. First view and Sign Up view checked visually.
- **Open:** After the merge, click through the public GitHub Pages site once completely. A real sign-in and a shared leaderboard stay later decisions.

### 2026-11-17 - Calm game view with a gear menu

- **People involved:** Florian Stodden (assignment and image reference), Codex (implementation), branch `codex/in-game-menu`.
- **Starting point:** On `main`, the guest entry from PR #17 was already present. During the game, the title, control hints and several actions were shown permanently over the museum.
- **Decision:** The scene shows only a gear. Sound, Music, Hint, Journal, Resume Game and Exit to Main Menu are in the new menu. The control instructions and New Game are deliberately not in it; a restart stays on the home screen. The actual touch buttons stay for phones. The image file `Gemini_Generated_Image_wqqnhqwqqnhqwqqn.jpg` served only as a reference.
- **Implementation:** `web/index.html` contains the gear button and the menu, `web/style.css` styles both, `web/main.js` controls opening, closing, pausing, keyboard focus and transitions. [Details and click sequence](in-game-menu.md).
- **Check:** 217 Node tests passed. In a local browser the guest entry, mission start, gear, Sound/Music, Hint, Journal, Resume and Exit to the home screen were clicked through. Syntax and diff check without errors.
- **Open:** Merge by the group; then check the public GitHub Pages version and a real smartphone. A complete round to both endings was not played again for this interface change.
### 2026-11-17 – Addenda to Station I

- **Addendum (feedback from Florian):** Reading phase extended from 3 to 8 seconds so you can also read the task. The clock keeps running meanwhile. Tests: 226 passed.
- **Addendum:** 10 seconds of reading time after “Start” (task and years visible); the clock starts only afterwards. So that this is no loophole, sorting and checking are blocked during the reading time. Tests: 227 passed.

### 2026-11-17 – No more “Nothing nearby” dialog (branch `feature/remove-nothing-nearby`)

- The interaction key no longer opens a popup when no object is nearby. Instead the character wobbles by about 3 px for 200 ms (not with reduced motion) and a very quiet tone `nudge` plays (only when sound is on). New file `web/interaction.js` (pure logic), tests `web/interaction.test.js`; `main.js` and `story/sound.js` adjusted. The text appeared nowhere else.
- Check: `node --test` 231 passed. Browser: `E` without an object → no dialog; `E` next to Station I → the station opens as before; no console errors.

### 2026-11-17 - Menu, journal and Leon reworked

- **People involved:** Florian Stodden (assignment and two image references), Codex (implementation), branch `codex/menu-journal-leon` based on the merged PR #18.
- **Starting point:** The menu could only be reached through the gear, the journal only inside it and as a narrow sidebar in the game. Leon started talking by himself when approached. The design did not yet match the new references.
- **Decision:** `Esc` opens/closes the game menu. The journal has its own button at the top of the game and can be reached with `J`; it also works from the home screen without switching into game mode. Sound and music buttons show their state directly. Leon is addressed with `E`, and the speech box is transparent. The images were used as a reference; UI text stays a real HTML button.
- **Implementation:** `web/index.html`, `web/main.js`, `web/style.css`, `web/story/journal.js` and `web/story/story.css`. Simple flow and responsibilities of the files: [docs/menu-journal-leon.md](menu-journal-leon.md).
- **Check:** 217 Node tests passed; syntax and diff check without errors. In a local browser the home and game journals, `J`, `Esc`, menu texts and returning from reading M’s message to the home screen were checked; desktop views viewed.
- **Open:** Check Leon manually with `E` at his position, a complete round and a real smartphone. No GitHub merge by Codex.
- **Addendum before the merge:** PR #19 with Station I changes was merged into `main` in the meantime. This branch was set onto the new state; afterwards 227 tests passed.
- **Further addendum:** PR #21 removed the “Nothing nearby” dialog. On the next sync, this change and Leon’s E interaction were kept; 231 tests passed.

### 2026-11-17 – Background cleanup: CI, README, saves, scoreboard, text audit
- **People involved:** Florian Baumgartl; Claude Code (Opus 5.5).
- **Goal:** Tests after every merge too, a short English README for the presentation, a robust save, a meaningful scoreboard, consistent short texts.
- **Implementation (branch `feature/background-cleanup`):**
  - M1: `story-tests.yml` also runs on `push` to `main`. The Python tests belong to the dropped Streamlit prototype. They are only in the README and do not run in CI.
  - M2: New English `README.md` with a badge and a screenshot. The old README lies unchanged in `docs/project-history.md`; only the relative links were adjusted.
  - M3:
    - `save.js` rejects unknown stations.
    - `host.discardedSave` reports a discarded save.
    - The home screen then shows “Game updated. Your run starts fresh.” once.
    - All other `localStorage` accesses already had try/catch.
  - M4:
    - `scoreboard()`, `betterRun()` and `bestRunStore()` in `scoring.js` only read existing values.
    - The display lives in `story/scoreboard-view.js` and uses the look of `.puzzle-popup`.
  - M5:
    - `docs/text-audit.md` contains 313 texts.
    - Eight texts are shortened.
    - For Station B, Station L and the spoiler question there are suggestions for their owners.
- **Check:**
  - `cd web && node --test`: 257/257 green.
  - Headless Chrome through the DevTools protocol (Playwright is not installed):
    - Scoreboard empty, mid-game and after the end at 1440×900, 1280×720 and 390×844, each without scrolling.
    - The note for a discarded save appears.
    - No console errors.
  - `web/dev/e2e-station-i.mjs` did not run because Playwright is missing.

### 2026-11-18 – Station I: team feedback (focus, fourth portrait)
- **People involved:** Florian Baumgartl; Claude Code (Opus 5.5).
- **Focus:**
  - After a window opens, `main.js` focuses the first button, which so far was “?”.
  - Station I then takes the focus back (`queueMicrotask`) and puts it on “Start”. So Enter always starts the game.
  - After the help popup the focus is back on “Start” or on the first card.
  - `main.js` and Station L stayed unchanged. L very likely has the same problem: its start focus is overwritten too.
- **Fourth image:**
  - New is Ingres, *Madame Jacques-Louis Leblanc (Françoise Poncelle, 1788–1839)*, 1823, Met 436703.
  - I checked the data and public domain status through the Met API on 18.11. The local copy `web/assets/met-436703.jpg` is 96 KB; the source is in `met-436703-source.md`.
  - The new log entry reads “20:48 · Shift change – Leon on duty”.
  - Nothing in the code is fixed to three cards any more: places, number keys, axis and texts follow the number of cards.
  - Layout: on desktop one row with four cards, on the phone 2 × 2.
  - Points: 15 up to 25 s, 10 up to 40 s, 5 up to 55 s. The limits live only in `PORTRAIT_LIMITS_MS`; the points bar calculates with them.
- **Check:**
  - `cd web && node --test`: 260/260 green.
  - Played in the real game with headless Chrome at 1440×900, 1280×720 and 390×844: E, Enter right away, reading time, sorting, success. The focus was on Start, no help popup opened, there was no scrolling, four cards of equal size, all images loaded, no console errors.
  - I adapted `web/dev/e2e-station-i.mjs` to four images but did not run it, because Playwright is not installed.

## 2026-11-19 · All NPCs via E, Station I on the wall (`feature/npc-e-and-signs`)
- **M1:** Imani and Dr. Vale talk only after `E`, like Leon. `handleInteract` uses the same way for all people through `PEOPLE` and `talkPartner`. Auto-talk (`shouldOpenTalk`, `NEAR`, `talkWasNear`, `checkAutoTalk`) is removed. Walking away still closes the box (`checkTalkDistance`). Vale turns to the character while talking (`facingToward`). Imani does not, because `gallery.js` draws her.
- **M2:** The box and oval in the hall are gone. Station I is now the middle picture on the hall wall (Van Gogh, Florian’s wish), with a gold frame, the sign “I · PORTRAITS” (`drawStationSign`, style as in the gallery) and an E marker. `ledger` is at x 4, y 3. Leon never stops directly in front of a station (`frontOfStation` in `guard.js`).
- **Tests:** 269 passed. Screenshots `web/dev/shots/npc-*`.

## 2026-11-19 · Room names and art cards (`feature/room-names-art-cards`)
- **M1:** Stations now stand in real rooms: B, L and D in the “Gallery”, I in the “Portrait Hall”. New fields `spot` (“middle painting”, “left painting”, “frame rack”) and `ROOMS`/`stationPlace()` in `case-1.js`. The journal shows the place only while the station is open (mockup). Gone are “Landscape Gallery”, “Frame Archive”, “Gallery Picture Puzzle”, “Conservation Studio” and “Great Hall” in the hint.
- **M2:** The success popup of Station I has “Learn about the art A”. Enter stays on “Return to museum”. The cards (`artCards` in `station-ui.js`, reusable) show the image, artist, title, year and a text from the Met object page. ← → page through, Esc back to the museum. Points and time do not change.
- I left out “Collected art” in the journal: so far the journal knows no popups and no station images; that would be more than a small change.
- **Tests:** 273 passed. Screenshots `web/dev/shots/I-art-*`, `journal-room-names-1440x900.png`. `web/dev/e2e-station-i.mjs` extended (Playwright is missing locally; the same flow was checked with headless Chrome).

## 2026-11-19 · Smaller journal with a book graphic (`codex/journal-compact-backdrop`)
- **Assignment:** Florian Stodden wanted a nicer journal image, a centred window of about half the screen area and still the current home or game background around it.
- **Design:** Two text-free backgrounds were made with Codex ImageGen: an open book for wide screens (`web/assets/investigation-journal-book.png`) and a single journal page for narrow screens (`web/assets/investigation-journal-page.png`). Texts and buttons stay real HTML elements. The graphics were saved in the project; no outside image files are loaded.
- **Code:** `web/style.css` limits the journal to about 850 × 567 px at a screen size of 1280 × 720 px and lightens the veil around the book. The view stays centred; each book page can scroll for longer entries. On narrow screens the content appears stacked on its own portrait graphic. `web/story/journal.js` uses short visible station names in the small journal but keeps the full place names for screen readers. `web/index.html` updates the cache versions. Home and game use the same journal window; so the current background stays visible in each case.
- **Check:** 273 Node tests passed, `git diff --check` without errors. The home screen view was checked visually in a local browser at 1280 × 720; the book is centred and the museum illustration is visible around it. The browser could not actually be switched to 390 × 844 for the mobile preview; the phone view and opening over the running game should still be checked visually after the merge.

## 2026-11-19 · Local profiles with their own login images (`codex/local-login-screens`)

- **Assignment:** Florian Stodden wanted real username/password fields at the entry and the two images he provided for Log In and Sign Up. After clarification he explicitly confirmed: local accounts on this device for now.
- **Decision:** A static GitHub Pages site cannot store registrations in GitHub itself. So no credentials are written into the repository. The profiles and their password check values stay in the browser; a shared online login is not implemented with this.
- **Implementation:** `web/assets/login-form-reference.jpg` and `signup-screen-reference.jpg` form the form backgrounds. `web/index.html` and `web/style.css` place real, keyboard-usable fields and buttons on top. `web/local-auth.js` checks local accounts with a salted PBKDF2/SHA-256 check value. `web/main.js` leads from the choice and the form to the home screen and separates save, position and best run by profile. Guest access stays. The sign-in can be switched in the home settings through **Switch profile**.
- **Documentation:** The limits and the exact flow are in `docs/local-login.md`; `docs/guest-entry-flow.md` stays as a historical description.
- **Check:** In a local browser Sign Up → Home, profile switch → Log In, wrong password → error message, correct password → Home. Both images checked visually at desktop size. Automated tests and the CI result are in the related pull request.

## 2026-11-19 · Illustrated ending screens (`codex/ending-screen-art`)

- **Assignment:** Florian Stodden wanted the two ending images made earlier integrated into the current game, without changing the story, decisions or game flow.
- **Story check:** In the current case the player exposes Voss before the final decision. The sentence “The mystery remains” originally burned into the not-a-thief image was therefore wrong. Both images were edited as text-free versions for the game; the title and consequences of the decision now stand as real HTML text on the plaques.
- **Implementation:** For the theft, `web/story/endings.js` shows the handover to Voss and the forgery on the wall; for quitting, the return to Dr. Vale and the exposure of Voss. `web/story/story.css` shows the matching night sky or morning light. The real Met image 436535 with source, score, chain of evidence, Home and New Game stay reachable. The end decision, story states and saving were not changed.
- **Documentation:** `docs/ending-screens.md` explains the flow, files and image decision.
- **Check:** Both results and the evidence view checked visually in a local browser at 1280 × 720. 276 Node tests passed; `git diff --check` without errors. The phone view and a complete round remain to be checked.

## 2026-11-19 · Polish pass on the existing game (`codex/game-polish-pass`)

- **Assignment:** Florian Stodden wanted the improvements discussed earlier implemented without new games or story. The phone view explicitly has no priority and is noted for later.
- **Implementation:** Station B now has local images and readable catalogue data for both Met works, even if the API fails. The live API still checks the facts. I, L, D and B explain their points more clearly. The E hint at the safe matches the triggered action again. In the home scoreboard, old 90-point best runs are marked and compared with the current 85-point scoring by their share of reachable points. The ending backgrounds were saved as much smaller JPGs.
- **Files and flow:** `docs/game-polish-pass.md` explains the changes by area, the responsible code places and the checks. `web/assets/met-459193-source.md` names the image and the Met source; `docs/ending-screens.md` refers to the new file names.
- **Check:** `cd web && node --test`: 279 passed, 0 failed (with the following change to Leon and Imani). In a local browser M’s message, B, I, L and D, the code word BILD, the evidence question and both endings were checked. For the second ending, the save before the decision was opened again.

## 2026-11-19 · Conversations with Leon and Imani end (`codex/npc-conversation-once`)

- **Assignment:** Florian Stodden wanted Leon and Imani to stop automatically after all conversation content, and questions already asked to be available again only after addressing them anew.
- **Before:** Leon’s two questions both stayed clickable after every answer; Imani showed her lines and then waited for “Goodbye.”.
- **Implementation:** `web/story/speech-box.js` remembers answered questions only while the conversation is open. Leon’s answered question disappears; after his second answer the box closes on the next click. `web/story/dialogues.js` marks Imani’s conversation for an automatic end after the last line. The next **E** starts a new round with both. Dr. Vale’s conversation was not changed. `web/index.html`, `web/main.js` and `web/story/host.js` use new module versions for the browser cache.
- **Documentation and check:** `docs/story/speech-box.md` describes the flow and the keys. Tests in `web/story/tests/speech-box.test.js` check the end and addressing again. The complete number of tests and the GitHub check are in the pull request.

## 2026-11-20 · Journal fix and shared leaderboard (`codex/leaderboard-docs`)

- **Assignment:** Florian Stodden wanted the outdated points and art source details and the project documentation updated, and a shared leaderboard as a transparent board with the existing menu font. He will take care of connecting it to the login later.
- **Implementation:** The journal initially shows 0/80 instead of 0/90 and links a complete, current list of art sources including the four Met works of the new Station B. The home screen shows the player’s own points and below them a transparent shared board. After a finished current run the player can voluntarily publish points, ending and display name. Rankings depend on points; equal scores share a rank. The Cloudflare Worker/D1 interface stores the highest value per local player ID. The browser shows outages and keeps its local display.
- **Documentation:** `docs/art-credits.md` lists the active works and direct Met links. `docs/leaderboard.md` describes the structure, deployment, scoring and later login connection. Old documents are marked as historical states so that the earlier decisions stay traceable. Going live needs a Cloudflare account and the public Worker URL.
- **Limit:** Local profiles are not an online identity. Before the later verified sign-in, public names and results are not tamper-proof.
- **Check:** 300 browser game module tests and four Worker tests passed; `git diff --check` without formatting errors. A test across two real devices is only possible after the Worker is deployed.

## 2026-11-20 · Guest button, login messages, station numbers, credits (`feature/guest-rename-leaderboard`)
- **M1:** “Continue as guest” is on the start screen below Log In and Sign Up (subtle, outline). It is gone from the panel, so there is only one.
- **M2:** Form with `novalidate`. `checkEntryInput` in `local-auth.js` checks name and password; the message is in `#entry-message`, with focus and `aria-invalid` on the field.
- **M3:** Stations are called 1–4 in walking order: 1 Portraits (Hall), 2 Puzzle, 3 Catalogue, 4 Forgery (Gallery left → right). Letters appear only after solving. Journal and scoreboard show stations by number, not B-I-L-D. Internal IDs and save format unchanged.
- **M4:** Before solving, Station 3 shows only “Artwork 1 ↗” … as credits, afterwards the full line.
- **M5:** open. Node.js/npm are missing on the computer, so `npx wrangler login` does not work. A sentence about the limits was added to the README and `docs/leaderboard.md`.

## 2026-11-21 · GitHub sign-in, online save and verified leaderboard (`codex/github-login`)

- **Request:** Florian Stodden wanted GitHub to be the only account sign-in. Guests may still play but must not appear on or open the leaderboard. GitHub players should resume their save on another device and have their result added for others to see.
- **Decision:** The game no longer asks for a username or password. GitHub OAuth runs through the Cloudflare Worker, because the GitHub Pages client cannot keep an OAuth Client Secret. The Worker identifies players by GitHub's numeric user ID; a browser-supplied name or score is no longer trusted for the leaderboard. Guest saves remain local and separate. Earlier local accounts are historical and not migrated automatically.
- **Implementation:** `web/index.html`, `web/style.css` and `web/main.js` show GitHub/guest entry, a signed-in status and a disabled Scoreboard for guests. `web/github-auth.js` exchanges a one-use login ticket, loads and uploads the case snapshot, and signs out. The Worker checks OAuth state and PKCE, fetches the authenticated GitHub identity, stores hashed session tokens, saves a case per GitHub ID and calculates a winning score from the saved case. `0002_github_login.sql` adds the database tables. The old unauthenticated leaderboard rows stay in the database but are not shown. The existing local username/password code remains only as historical code and for its tests.
- **Documentation:** `README.md`, `docs/leaderboard.md` and `docs/local-login.md` explain the current flow, old flow, setup and limits. Live use needs a Cloudflare account, GitHub OAuth App, Worker URL and secret; these have not been supplied or deployed in this branch.
- **Verification:** 320 Node tests (including the Worker OAuth/save/ranking tests) pass. A local Chrome screenshot at 1280 × 720 showed the new entry layout and its guest fallback, with no JavaScript startup failure. A real GitHub login and cross-device save still require deployment.

## 2026-11-21 · Vercel instead of Cloudflare (continuation of PR #40)

- **Request:** Florian Stodden explicitly rejected Cloudflare. He connected `Museum-Mystery` to Vercel, but the first deployment failed with `PYTHON_ENTRYPOINT_NOT_FOUND` while importing `legacy/python` from `main` at `06072b5`.
- **Cause:** `legacy/python` is the old Streamlit prototype. It does not export a Vercel Python function and excludes the current game in `web/` and server code from the project root.
- **Decision:** Deploy from the repository root, serve the existing game from `web/`, and run GitHub OAuth/save/leaderboard on same-origin Vercel functions in `api/`. Use a Neon Postgres integration from Vercel Storage. No Cloudflare Worker, D1 or separate API domain is needed.
- **Implementation:** `vercel.json` selects the Other framework and `web` output; `package.json` installs the Neon driver. The OAuth and score logic moved to `api/_service.js`; the small `api/auth/`, `api/save.js` and `api/runs.js` entry points expose it. `api/_database.js` creates tables and adapts parameterized queries. `web/leaderboard-config.js` uses `/api` on Vercel and leaves GitHub Pages guest-only. The old Cloudflare files were removed. `README.md` and `docs/leaderboard.md` now describe Vercel setup, the failed import and remaining account steps. Both GitHub Actions workflows now test from the repository root so they include the API tests.
- **Limits:** A real login and cross-device run still require the user to change the Vercel Root Directory, connect Neon and register a GitHub OAuth App. Database credentials and the OAuth Client Secret must remain in Vercel environment variables, not GitHub. The first failed deployment alone cannot be turned into the new application without these settings.
- **Verification:** 322 Node tests pass, including the adapted OAuth flow and Postgres adapter. A live Vercel build and GitHub redirect cannot be checked until the Vercel Root Directory and account services are configured.
- **Owner's dashboard check:** The production domain is `museum-mystery.vercel.app`, but Vercel reports no production deployment. The latest deployment remains the failed Python build from `main` commit `06072b5`; no Storage database is connected. The deployment URLs shown in that failed build are temporary and must not be used as the GitHub OAuth callback. The setup guide now uses the confirmed production domain.
- **Neon setup choice:** For the first database connection, use Production only, leave Custom Prefix empty so Vercel injects `DATABASE_URL` with the name expected by `api/_runtime.js`, and leave automatic per-deployment branching off. Preview database branches are optional later; do not create a new branch for each Production deployment.
- **Neon resource access choice:** In the resource's **Allowed Environments** setting, the recommendation is **Production environment only**. Vercel then stores the integration credentials as non-readable Secrets. A team owner can reopen Preview access later and reconnect the project. For the separate GitHub OAuth variable, Vercel's current interface calls the protected type **Secret**.
- **Account setup report and live check:** Florian Stodden reports adding the GitHub OAuth environment variables in Vercel and seeing a redeploy notice. Their values were not sent to the chat or repository. A public check still returns `DEPLOYMENT_NOT_FOUND` for `museum-mystery.vercel.app` and `/api/auth/start`. GitHub `main` is still commit `06072b5` and PR #40 remains open; its `node-tests` check passes. The code and account settings cannot be verified together until the PR is merged and Vercel produces a successful Production deployment. The Root Directory setting and Neon connection still need confirmation in Vercel.

## 2026-11-21 · New illustrated GitHub entry (`codex/github-login`)

- **Request:** Florian Stodden noticed that the current GitHub login overlay still sat on the old illustrated Sign Up form. He asked for a proper new image and for it to replace the old login artwork.
- **Artwork:** The image generation tool edited the previous restoration-workshop illustration into `web/assets/github-login-background.png`. It preserves the night museum, framed paintings, easel and lamps, and removes the baked-in username/password form, Submit button and all text. The image has no live UI controls.
- **Implementation:** `web/index.html` now shows the new background and an HTML chapter title. `web/style.css` gives the GitHub/guest panel a matching brass and dark-teal design. The two real buttons and live status text remain HTML so they stay clickable, keyboard-accessible and update when the online service becomes available.
- **Verification:** A 1376 × 768 Chrome screenshot showed the title and both actions legibly over the new image with no old form visible. The full game test suite was run again. Live GitHub authentication remains dependent on a successful Vercel Production deployment.

## 2026-11-21 · Painted GitHub login and Pages handoff (`codex/github-login-polish`)

- **Request:** Florian Stodden asked for the GitHub login screen to use the original painted login typography and to be delivered as a complete image with its text. He also reported that GitHub login and the shared leaderboard did not work.
- **Live diagnosis:** PR #40 had since been merged; GitHub `main` was `a414cb6` after another team member's PR #41. `museum-mystery.vercel.app/` returned 200. `/api/auth/start` returned 302 to GitHub with the production callback, and anonymous `/api/auth/me`, `/api/save` and `/api/runs` returned 401. The user reported the exact message “GitHub login is not connected yet. You can play as a guest.” That message comes from the static GitHub Pages/local fallback where `LEADERBOARD_URL` is empty, not from the configured Vercel site. A full GitHub OAuth callback was not yet observed.
- **Artwork and interface:** The image generation tool edited the former illustrated `Log In` form into `web/assets/github-login-screen.png`, preserving the museum workshop and gold serif style while painting the exact new text “Log In”, “Continue with GitHub”, “Play as guest” and “Save your case. Join the leaderboard.” The prior intermediate `github-login-background.png` is removed. `web/index.html` shows the finished image; transparent real buttons sit over the two painted buttons, preserving pointer, keyboard and screen-reader access. A live status message appears only when needed.
- **Login handoff:** On the older GitHub Pages copy, Continue with GitHub now opens the Vercel game with `?github-login=1`; the Vercel page immediately starts OAuth and stores its one-use state on the correct origin. Existing guest saves on GitHub Pages are not deleted, but they are not transferred to a GitHub account. A plain local server remains guest-only.
- **Checks:** A 1376 × 768 Chrome screenshot confirmed the painted labels and click targets line up. All 333 Node tests on the updated `main` base pass, including a regression test for the Pages-to-Vercel handoff. The complete player-authorized GitHub login, cross-device save and winning leaderboard entry still require a live test after this change is deployed.
