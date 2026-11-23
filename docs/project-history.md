# Museum Mystery – project history

> **Historical development record, not a current setup guide.** Entries below preserve what the team believed or planned on their dates; later decisions superseded them. For the finished game, read the [current README](../README.md) first, then the [login and leaderboard guide](leaderboard.md) and [security review](security-review.md). The current game has **four finished mini-games**, the safe word **`OILS`**, a maximum of **80 points**, and optional **GitHub login**. The primary live and presentation URL is [museum-mystery.vercel.app](https://museum-mystery.vercel.app/). Earlier references below to `BILD`, placeholder stations, 90/100 points, no login or GitHub Pages as the main game are historical.

> This file was moved from the former `README.md` on 17 November 2026 and translated into English on 20 November 2026.

A shared game project for **Introduction to Programming (Nova SBE, 2026/27)**. The [current README](../README.md) and code on `main` are the starting point for team members and new AI chats. This page explains how the project evolved; a chat does not know about later changes automatically.

**Historical status on 17 November 2026.** After positive feedback from the professor, the group was improving the walkable 2D game instead of building the earlier idea kit. At that time, the focus was clear rooms and interactions, short texts, a tidy journal, four mini-games, a home screen and two endings. **Decision at that time: no real sign-in yet.** The entry led to guest play; a shared online leaderboard had not been implemented. Later work changed this, as the current README explains.

**Login idea paused:** On 17.11., first username/password and then GitHub sign-in were discussed and prepared on the separate branch [`codex/login-signup`](https://github.com/florianstodden-afk/Museum-Mystery/tree/codex/login-signup). Florian then decided explicitly: no Clerk and **no login at all** for now. This branch is a paused draft, was **not** taken into `main` and is not part of the public game. No player accounts were created. [Why passwords cannot be stored in the GitHub repository](https://docs.github.com/en/code-security/concepts/secret-security/secret-leakage-risks).

**Guest entry:** [PR #17](https://github.com/florianstodden-afk/Museum-Mystery/pull/17) puts Florian’s login image in front of the home screen. “Log In” and “Sign Up” open only their own guest intermediate views for now; **Continue as guest** leads to the home screen and from there to the game. No accounts are created. The exact flow and the checks are in [docs/guest-entry-flow.md](guest-entry-flow.md).

**Game-menu work at that time:** While playing, the museum scene stayed free of the title, keyboard hints and the former buttons at the top. The gear at the top right opened a menu with Sound, Music, Hint, Journal, Resume Game and Exit to Main Menu. The implementation and checks are in [docs/in-game-menu.md](in-game-menu.md). A new game started only from the home screen.

**Next revision:** The menu opens and closes with `Esc`. The journal can be reached with a button at the top of the game and with `J`; it also opens from the home screen without starting the game. Both windows now use a tidy design following Florian’s reference images. Leon starts his conversation only on `E` near him; his speech box lets the museum scene shine through. [Flow and checks](menu-journal-leon.md).

Repository: <https://github.com/florianstodden-afk/Museum-Mystery>

Historical GitHub Pages guest copy: <https://florianstodden-afk.github.io/Museum-Mystery/>. The current presentation URL is <https://museum-mystery.vercel.app/>.

Current course requirements: <https://2477-introduction-programming.gitlab.io/wiki/team-project/>

Idea comparison: <https://chatgpt.com/share/6aedc9ea-ef64-83eb-9a0e-0dd42623f0f8>

## Our goal in the course

We develop a working app or game with AI support. What matters is that **every team member can explain the jointly submitted result**, including code that someone else or an AI wrote. So we keep the solution small, readable and checkable. Functions nobody understands are explained, simplified or removed before we take them over.

The [official evaluation page](https://nova-sbe-introduction-to-programming.github.io/intro-to-programming-2026/evaluation.html) names, for the team project, a presentation with a **live demo at a deployed URL and a code walkthrough** (40 % of the course grade). Every member can be asked about other people’s code. The criteria are function, design, scope/ambition, verification and explanation. The written exam (60 %) partly concerns the **own solo project** and reading code in general; we should not mix up these two parts. According to the course page, the work lives on GitHub, not as a Moodle file upload.

The [course overview](https://nova-sbe-introduction-to-programming.github.io/intro-to-programming-2026/index.html) describes the team project for weeks 8–10 and the presentations for weeks 11–12. It talks about developing the best of the solo projects further. **Museum Mystery is our chosen team topic.** Whether and which ideas from solo projects flow in is decided explicitly by the team. The separate solo repository **Plot Twist** is not used as a Git remote of this project.

## What we want to build

**Museum Mystery** should play like a small adventure in a 2D top-down view: walk around the museum, talk to people, examine objects, combine evidence and make a decision with consequences at the end. The [Collection API of the Metropolitan Museum of Art](https://metmuseum.github.io/) delivers a real work and verifiable art data. The design of the map and characters is original; Harvest Moon and Pokémon are only references for perspective and the feel of movement.

### Prototype as described on 17 November: The Night of the Forgery

Since 12.11.2026 the main game runs the **Nocturne story** (short version: [docs/game-concept.md](game-concept.md)). “M” sends the player character to take Van Gogh’s *Wheat Field with Cypresses* out of the safe. Four stations in any order give the letters B‑I‑L‑D; the vault door between gallery and storage opens with this word. In the storage room the final question and two endings follow (*The Heist* / *The Open File*), at most 90 points. Station B is the real landscape mini-game. **Station I (Portrait Hall)** is a speedrun: after “Start”, a catalogue scan shows the real Met data of three portraits (Degas, Sargent, Cézanne) for 3 seconds; then you sort them from oldest to newest (click, drag or keys 1/2/3, Enter checks). “Peek” and a wrong check cost 5 seconds each. Then the cards turn over and form the night-shift log, which clears the guard Leon (`web/minigames/portrait-*`). Station L is the Renoir picture puzzle (Tab, Enter/Space, click or drag and drop). Station D stays a placeholder. A hint button keeps anyone from getting stuck. Movement: WASD or arrow keys, interaction: `E`. The old prototype story (three pieces of evidence, badge, code 2114) stays unchanged in `web/legacy/`.

**Gallery and access:** The gallery shows a night-time, AI-designed museum scene with the New York skyline in the window, benches and two surveillance cameras. Their red lights blink as decoration; they do not detect the player. With the system setting for reduced motion turned on, they stay lit. The lit arch on the right of the entrance hall leads into the gallery. Walls and benches limit movement; existing tasks and the locked vault door stay playable. The landscapes in the generated background are decoration; the real Met data appears in the existing puzzles.

**Security room:** On the left of the main entrance, the arch labelled “SECURITY” leads into a separate walkable room. The monitor wall shows three illustrative camera previews (entrance hall, gallery, vault); the other six screens have no signal. The previews are not live surveillance. In the room, the monitor wall, duty roster, radio and key board can be examined with `E`. The exit at the bottom leads back to the entrance hall; position and story progress are saved locally.

**Start page at that time:** `web/index.html` through a local web server (instructions below). `web/engine.js` holds the map and movement, `web/story/` the story (overview: [docs/story/README.md](story/README.md)), `web/main.js` drawing, input and the connection to the story through `web/story/host.js`. `cd web && node --test` checks map, story, mini-game and legacy code. The earlier Python app and its SQLite file are **not** connected to this browser save.

The [shared idea comparison](https://chatgpt.com/share/6aedc9ea-ef64-83eb-9a0e-0dd42623f0f8) compared twelve game ideas and recommended Museum Mystery as a balance of a vivid demo, clear rules and a feasible build for beginners. It **only assumed 3–4 people, 4–6 weeks and almost no budget**. These numbers are not confirmed team data. A quiz was the lower-risk alternative; a weather festival the more ambitious one. We chose Museum Mystery as the topic.

### Earlier idea and first picture-puzzle prototype

- First **three carefully checked cases** with about 24 curated artworks; no unlimited random generator.
- A case shows six possible works, views of the works with verifiable details and a free starting clue.
- Start with 100 points. Up to three extra clues cost 15 points each. A first wrong guess costs 25 points and rules out the candidate. A second wrong guess ends the attempt. A right guess solves the case.
- Clues must lead to **exactly one solution** based on the visible work data. Missing API fields or images must not create an unsolvable case.
- Own accounts and saved games; later, case history and a leaderboard. Separate accounts do **not** automatically mean simultaneous multiplayer.
- For a fair leaderboard the idea comparison suggested **one scored attempt per account and case**, plus a practice mode.

These points led to the first, static Streamlit prototype in [specs/first-case.md](../specs/first-case.md). After playtesting it was dropped as too simple and boring; the walkable quest is now the direction. Three cases, 24 works, real accounts, scored attempts and a leaderboard remain suggestions from the idea comparison, not a confirmed course requirement. The old local save uses SQLite; a shared online sign-in and hosting solution are open.

Deliberately out of scope at first: a 3D museum, live multiplayer, free text input as an accusation, unchecked AI-generated puzzles and arbitrary API searches for works. First three reliable cases, then possible extras.

## How we work on every task

1. **Read the state:** check the README, relevant files, `git status` and recent commits. In new chats, name this README and narrow down the concrete task.
2. **Describe the task:** write down in a few sentences: *Why? What exactly? What explicitly not? How do we know it is done?* Formulate at least one allowed case, one rejected case and, if relevant, a restart case.
3. **Understand first, then build:** AI may propose files, data flow, rules and tests. A person checks the expected results. Wrong tests are corrected against the agreed rules, not merely weakened to get green output.
4. **Implement in small steps:** one manageable task per branch. Separate game logic from screen and storage, so we can test rules without clicking. Do not introduce unnecessary services or complicated abstractions.
5. **Check yourself:** run the tests, click through the app, try an invalid move and check saved progress after a real app restart. A browser refresh alone is not a restart test.
6. **Explain and document:** before the commit, write down which files changed, what each change does, who delivered the idea/implementation, which AI was involved, which tests actually ran and what their result was. Make claims verifiable through a commit, pull request, test output or screenshot.
7. **Review together:** push the branch, open a pull request to `main`, let another person read the code and the explanation, clear up questions, then merge. Afterwards update `main` locally and extend the README if decisions changed.

**Understanding check for every member:** Where does the action start? Which input is checked? Which rule decides? Which data changes? Where is it stored? What happens with invalid input or a missing API response? Which test proves it? If we cannot answer this in simple words, the task is not finished yet.

## Documentation rule: make every relevant action traceable

Git records **which files** changed when through a commit. It does not automatically explain **why**, what an AI suggested, which alternatives were dropped or how a manual test went. So we document decisions and checks in addition. For every task, a short note belongs permanently in the repository in `docs/work-log.md` (create the file with the first implementation task). A link to a chat is an additional source, not a replacement for the summary: links can become inaccessible or may not contain later messages.

Template for an entry:

```markdown
### YYYY-MM-DD – Short title
- People involved: names/initials; AI tool and chat link, if used
- Starting point and goal: What existed before? What should change?
- Decision and reason: Which rule, technique or design was chosen? What was dropped?
- Implementation: branch/PR/commit and files affected; what happens there in simple words?
- Checks: exact command or click sequence, actual result, error and fix
- Understanding: Who explained or cross-checked the change? Open questions?
```

Also document GitHub actions (repository created, branch pushed, PR reviewed/merged), contributions from other team members, data sources and licences, hosting changes and help from AI. **Never invent anything after the fact.** Mark unknown times, people or test results as “not documented” and ask. Before every merge, check whether the note and the README match the actual state. Short notes after every task are more reliable than an attempt at reconstruction at the end of the semester.

### Project history traceable so far

| Time/evidence | What happened | What we know from it |
|---|---|---|
| [Idea comparison](https://chatgpt.com/share/6aedc9ea-ef64-83eb-9a0e-0dd42623f0f8) | Twelve concepts compared; Museum Mystery recommended. | Game rules, Met API and login were suggestions, not implemented code. |
| 09.11.2026 · [Initial commit](https://github.com/florianstodden-afk/Museum-Mystery/commit/aaf0940) | The GitHub repository `Museum-Mystery` was created with a short README. | The exact setup by the person who created it is not documented further here. |
| 09.11.2026 · [Documentation commit](https://github.com/florianstodden-afk/Museum-Mystery/commit/070fe3c) | This local group folder was connected to the existing repository over **HTTPS**; a detailed German setup README was written on the branch `docs/project-readme`. | SSH was not set up because no public key was stored; `gh` was not installed locally. Normal Git over HTTPS worked. |
| 09.11.2026 · [Pull Request #1](https://github.com/florianstodden-afk/Museum-Mystery/pull/1) / [merge commit](https://github.com/florianstodden-afk/Museum-Mystery/commit/0c4cf0a) | The README was taken into `main`; then `main` was updated locally and the finished **local** documentation branch was deleted. | The remote branch still existed at the last check. Whether it was deleted later has to be checked now. |
| 09.11.2026 · [Pull Request #2](https://github.com/florianstodden-afk/Museum-Mystery/pull/2) | Course goal, Museum Mystery draft and documentation workflow were added to this README and merged into `main`. | This README now serves as the shared starting point. |
| 09.11.2026 · [Pull Request #3](https://github.com/florianstodden-afk/Museum-Mystery/pull/3) | A curated picture-puzzle case, rules, local storage and six tests were created and merged into `main`. | In playtesting this prototype turned out to be too static. The later image fix is taken over in a new PR together with the walkable game. |
| 09.11.2026 · Change of direction | After user feedback the first case was judged too static. A walkable 2D quest with two endings was made as a new prototype. | See the [task](../specs/museum-walk.md) and the [work log](work-log.md); a complete human playthrough is still pending. |

The shared chat is a snapshot of the **choice of idea**. It does not document any implementation done afterwards. For new changes, the current state of the repository always applies.

## Git and GitHub in simple words

`main` is the shared main version. A **branch** is a separate line of work for one task. A **commit** saves a named state, at first locally. **Push** uploads commits to GitHub. **Pull** downloads new changes from GitHub. A **pull request (PR)** proposes to take the branch into `main` after review; **merge** actually combines it there. A push alone does not change `main`.

```text
GitHub/main → pull → own computer → branch → change and test
                                              → commit → push → PR → review → merge into main
```

In the project folder before a new task:

```powershell
git switch main
git pull --ff-only origin main
git switch -c feature/kurzer-name
```

After changes:

```powershell
git status
git diff
git add README.md
git commit -m "Explain project workflow"
git push -u origin feature/kurzer-name
```

`git add README.md` is only an example: always choose the **files that actually changed**. On GitHub, open the PR from this branch to `main`, explain the change and the checks and merge after review. Afterwards:

```powershell
git switch main
git pull --ff-only origin main
```

In a conflict, do not overwrite blindly or use `--force`; clear up the affected lines and intentions together. Before the first push, check `git remote -v`: `origin` must be `https://github.com/florianstodden-afk/Museum-Mystery.git`.

Further team members clone over HTTPS:

```powershell
git clone https://github.com/florianstodden-afk/Museum-Mystery.git
cd Museum-Mystery
```

The existing repository is not started again with `git init`. `gh repo clone ...` would only be needed with the GitHub CLI installed and signed in; a normal `git clone` is enough. An SSH address (`git@github.com:...`) requires an SSH key stored in the GitHub account.

## Technical start and state at that time

### Start the walkable game

Start a local server in the project folder (Node is only needed for the tests):

```powershell
$projectPython = uv python find --no-project --managed-python --system 3.14
& $projectPython -m http.server 8000 --directory web
```

Then open <http://localhost:8000> in the browser. Stop it in the terminal with `Ctrl+C`. The Python version `3.14` matches the uv version used locally so far; it can be adjusted on another computer. Please do not just double-click `web/index.html` as a file: JavaScript modules need a local web server.

Rule tests for the walkable game (Node.js is needed for them, not for playing):

```powershell
cd web
node --test
```

The browser prototype needs no extra JavaScript packages. Its API request works online; on a network error you can keep playing with the text replacement. The browser saves the local state in `localStorage`. It is neither an online account nor a save that works across devices.

### Check the older Streamlit prototype

The [course setup](https://nova-sbe-introduction-to-programming.github.io/intro-to-programming-2026/setup.html) uses **uv, Python, Codex and Streamlit**. The [solo project guide](https://nova-sbe-introduction-to-programming.github.io/intro-to-programming-2026/weeks/week-05/index.html) names Python, Streamlit, SQLite and pytest for a first app, and the separation of interface, rules, storage and tests. We can take this familiar structure as a starting point, as long as it fits our team project.

**Present:** `app.py` (interface and Met API), `game.py` (rules), `storage.py` (SQLite), `tests/`, `pyproject.toml`, `uv.lock`, `.gitignore` and the first [task specification](../specs/first-case.md). The local database is created only on the first game start. **Not present yet:** online login, leaderboard and deployment. Install dependencies and test:

```powershell
uv sync
uv run pytest
uv run python -m streamlit run app.py
```

On this Windows computer the direct Streamlit launcher was blocked by application control. The server started with the managed Python interpreter and the installed packages like this (adjust the Python version to the one used by `uv sync`):

```powershell
$env:PYTHONPATH = (Join-Path (Get-Location) '.venv\Lib\site-packages')
$projectPython = uv python find --no-project --managed-python --system 3.14
& $projectPython -m streamlit run app.py
```

The `.gitignore` excludes `.venv/`, Python caches, local SQLite files and secrets. `pyproject.toml` and `uv.lock` belong in the repository. Personal or local databases are not committed. API images and metadata must be checked for suitability, attribution and usage rights. The six concrete object IDs were checked through the Met API on 09.11.2026 for public images and necessary data; the [official Met documentation](https://metmuseum.github.io/) describes the API without registration or a key. Check the current terms again before a public deployment.

**Correction of 09.11.2026:** Contrary to the first check, two works chosen first had no usable public image. After the error message on opening they were replaced and all six current IDs were checked again. The error and the tests are in the [work log](work-log.md).

## Next shared decisions proposed at that time (historical)

1. Play the walkable game completely together, test both endings and rate movement, dialogues and puzzle fun.
2. Confirm team size, schedule and the teacher’s exact requirements; in particular clarify whether API integration is required or comes from our own idea concept. The publicly available evaluation page does not explicitly name login or an API. The group has paused login for now.
3. Check the existing game and its public demo URL. A later shared leaderboard would again need a decision about online storage and sign-in.
4. After reviewing the quest, improve the map, characters, hints and further cases; only then consider extra systems.
5. After **every** task, update the log, README and PR explanation. Before the presentation, every member explains someone else’s function and the whole route through the game.

## Prompt proposed for new AI chats at that time (historical)

Copy as the task: “First read the README and the current state of the Museum Mystery repository. Tell me in simple words what is already implemented and what is only planned. Then work only on **[concrete task]** on its own branch. Explain every change, check it and extend the documentation so that every team member can explain it later.”

**Rule for AI and team:** Back up claims about finished work only with a file, commit, PR or actual check result. If a source is not accessible, name the gap. Do not call a feature finished just because it appears as an idea in this README.

Renoir: up to and including 30 seconds 15 points, up to 45 seconds 10, up to 60 seconds 5, after that 0. Station I: up to 20 seconds 15 points, up to 35 seconds 10, up to 50 seconds 5, after that 0 (penalty time included; old saves without a time: 5). The time keeps running when you leave and stops when solved. The game starts at 0 points.

### Active surveillance cameras

Active cameras show a blinking red status light. New rooms and camera views should use the shared display in `web/camera-lights.js` for this. With the operating system setting for reduced motion turned on, the light stays lit instead of blinking.

### Browser checks

`web/dev/e2e-*.mjs` check the game in a real browser: Station 1 (`e2e-station-1.mjs`: wrong check, sorting, letter I, art cards, no scrolling at 1440×900, 1280×720, 390×844, images with the Met API blocked), Station 3 (`e2e-station-3.mjs`), the story dialogues, the journal page "People" and the accusation. They drive Chrome or Edge over the DevTools protocol (`web/dev/cdp.mjs`); Playwright is not needed. One command starts a small server and runs all of them:

```bash
node web/dev/run-e2e.mjs
```
