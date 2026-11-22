# Museum Mystery – The Night of the Forgery

[![Story tests](https://github.com/florianstodden-afk/Museum-Mystery/actions/workflows/story-tests.yml/badge.svg)](https://github.com/florianstodden-afk/Museum-Mystery/actions/workflows/story-tests.yml)

A small top-down detective game in the browser: walk through a museum at night, solve four art stations with real works from The Met and decide what happens to a Van Gogh.

**Play it:** [museum-mystery.vercel.app](https://museum-mystery.vercel.app/) is the online game, with guest play and GitHub login. The older [GitHub Pages copy](https://florianstodden-afk.github.io/Museum-Mystery/) keeps guest play; its GitHub button opens the Vercel game and starts sign-in there.

## Team

| Name | Student number |
|---|---|
| Florian Baumgartl | 78086 |
| Florian Stodden | 78574 |
| Fabian Oscar Bergvall | 78922 |
| Leo Johannes Oskar Heppe | 79527 |

In the Git history, Fabian appears as `OliverMSchilz`, Florian Baumgartl as `FlorianBaumgartl78086`, Florian Stodden also as `florianstodden-afk` and Leo as `leomasterofcode`.

![The museum at night](docs/screenshots/readme-game.png)

## About the project

*Museum Mystery* is a short detective game that runs in any modern browser, made for casual players and anyone curious about art. You are the new temp in a fictional New York museum at night. You walk through the halls, talk to the staff and solve four quick stations built around real works from The Metropolitan Museum of Art. Their letters open a safe; then you make one accusation and choose between three endings.

## Objectives

- Build a complete, playable browser game as a team and deploy it online.
- Teach a little art history through real works from The Metropolitan Museum of Art (Open Access).
- Reward speed: short mini-games scored by time, like a speedrun.
- Keep the game logic separate from the display, so it can be tested automatically.
- Handle invalid input and broken saves without crashing.
- Offer guest play and an optional GitHub login with online saves and a shared leaderboard.

## How to play

- On the first screen, choose **Continue with GitHub** or **Play as guest**. GitHub players use their GitHub identity for an online save and shared leaderboard. Guests save locally and cannot open the leaderboard. If you opened the old GitHub Pages link, its GitHub button takes you to the online Vercel game first ([login details](docs/leaderboard.md)); [earlier local username/password profiles](docs/local-login.md) are historical.
- Move with **WASD** or the **arrow keys**. Press **E** next to a marked object or a person.
- Four numbered stations, in walking order: **1 · Portraits** (Portrait Hall), **2 · Puzzle**, **3 · Catalogue** and **4 · Forgery** (Gallery, left to right). Each gives a letter that stays hidden until you solve it. The journal shows the four letters in the order of the code word; enter it at the vault.
- **Station 3 — Curator’s Catalogue:** match four Met artwork labels with drag, click/tap, or Tab + Enter/Space. Labels can be moved, swapped, or returned to the tray. [Artwork credits, timing and save behavior](docs/story/curators-catalogue.md).
- In the vault, answer the final question: who planned it all? You have **one accusation**: pick a name, confirm it, and it counts. Up to 80 points (older completed saves retain their original rewards).
- Three endings: name the planner, then **Steal the artwork** or **Quit the mission**. A wrong name ends the night at once with **Case lost**: the planner is warned and gets away, and the end screen explains why the person you named was innocent. Each ending has its own result screen with the real Met painting, evidence and score ([ending flow](docs/ending-screens.md)).
- **J** opens the journal, **Esc** the menu. The hint button helps when you are stuck.
- The Home screen's **Scoreboard** is for GitHub players. It shows the current run and shared results. A winning finish is submitted automatically; the highest score for each GitHub account appears. Lost runs never enter the shared leaderboard ([details](docs/leaderboard.md)).

## Installation

Requirements:

- [Git](https://git-scm.com/)
- [Python 3](https://www.python.org/) – only for the small local web server; any other static file server works too
- [Node.js](https://nodejs.org/) 18 or newer – only for the tests

The game and the tests need no `npm install` and no build step. Get the code:

```bash
git clone https://github.com/florianstodden-afk/Museum-Mystery.git
cd Museum-Mystery
```

**Optional – online features (GitHub login, online saves, shared leaderboard).** These run only on Vercel. You need a Vercel project for this repository, a Neon Postgres database and a GitHub OAuth app, and these environment variables in Vercel (names as read in `api/_runtime.js`; never commit their values):

| Variable | What it is |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `GITHUB_CLIENT_ID` | Client ID of the GitHub OAuth app |
| `GITHUB_CLIENT_SECRET` | Client secret of the GitHub OAuth app |

One runtime dependency (Neon driver), pinned in package-lock.json. Vercel installs it from the lockfile itself. Setup details and the OAuth callback URL: [docs/leaderboard.md](docs/leaderboard.md).

## Run the application

From the repository folder, serve the browser files:

```bash
python3 -m http.server 8000 --directory web
```

Then open <http://localhost:8000> and choose **Play as guest**. Locally only guest mode works: GitHub sign-in, online saves and the shared leaderboard need the Vercel deployment, because the small local server does not run `api/`.

## Run the tests

```bash
node --test
```

Run it from the repository folder. GitHub Actions runs the same command for every pull request and after every merge to `main` (badge above). The folder `legacy/` holds code the game no longer uses: `legacy/python/` is the first Streamlit prototype with its tests (`cd legacy/python && uv run pytest`).

## Project structure

| Path | Purpose |
|---|---|
| `web/index.html`, `web/style.css`, `web/assets/github-login-screen.png`, `web/assets/investigation-journal-*.webp` | Page, illustrated GitHub entry, home screen, menu and compact journal |
| `web/main.js` | Drawing, input, rooms, connects the game to the story |
| `web/github-auth.js`, `web/leaderboard.js` | GitHub sign-in, online saves and shared scoreboard |
| `api/` | Vercel functions for GitHub OAuth, Postgres saves and the shared leaderboard |
| `vercel.json`, `package.json`, `package-lock.json` | Vercel serves `web/` and installs the pinned database driver |
| `web/storage-keys.js` | Storage keys per player (guest or GitHub account) |
| `web/wall-plaque.js` | Brass name plaques above the Gallery stations |
| `web/engine.js` | Map and movement rules |
| `web/story/` | Story engine, save, scoring, dialogues, hints, endings, sound |
| `web/minigames/` | The station mini-games and their shared UI (`station-ui.js`) |
| `web/dev/` | Preview pages, screenshots and browser checks |
| `legacy/`, `web/legacy/` | Code the game no longer uses (first Python prototype, old prototype story) |
| `docs/` | Work log, concept, design notes, [project history](docs/project-history.md) |

## Known limits

- GitHub sign-in, cross-device saves and the shared leaderboard use Vercel and Neon ([details](docs/leaderboard.md)). A real player confirmed sign-in, online save, resuming on a second device and opening the shared board. Publishing a new winning result has automated coverage but still awaits the first live successful ending. Guest play remains available.
- Guests use a local save only. Clearing browser data removes it. Earlier local username/password saves are not automatically moved to a GitHub account.
- A GitHub account proves the player's name; it does not prove that a browser-side score was earned honestly.
- Met data is a frozen snapshot in the repo; the game runs without the Met API.

## Credits

Artworks and data: [The Metropolitan Museum of Art Collection API](https://metmuseum.github.io/), Open Access (Public Domain). [Every artwork and direct collection link](docs/art-credits.md). The museum and all characters are fictional.

## Course context

Team project for *Introduction to Programming* at Nova SBE (2026/27). Earlier decisions, the old setup guide and the full history are in [docs/project-history.md](docs/project-history.md).
