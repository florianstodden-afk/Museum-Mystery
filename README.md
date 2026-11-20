# Museum Mystery – The Night of the Forgery

[![Story tests](https://github.com/florianstodden-afk/Museum-Mystery/actions/workflows/story-tests.yml/badge.svg)](https://github.com/florianstodden-afk/Museum-Mystery/actions/workflows/story-tests.yml)

A small top-down detective game in the browser: walk through a museum at night, solve four art stations with real works from The Met and decide what happens to a Van Gogh.

**Play it:** <https://florianstodden-afk.github.io/Museum-Mystery/>

## Team

| Name | Student number |
|---|---|
| Florian Baumgartl | 78086 |
| Florian Stodden | 78574 |
| Fabian Oscar Bergvall | 78922 |
| Leo Johannes Oskar Heppe | 79527 |

In the Git history, Fabian appears as `OliverMSchilz`, Florian Baumgartl as `FlorianBaumgartl78086`, Florian Stodden also as `florianstodden-afk` and Leo as `leomasterofcode`.

![The museum at night](docs/screenshots/readme-game.png)

## How to play

- On the first screen, choose **Sign Up** to create a local profile, **Log In** to return to one, or **Continue as guest**. Profiles and progress still exist only on this device. See [the login flow](docs/local-login.md).
- Move with **WASD** or the **arrow keys**. Press **E** next to a marked object or a person.
- Four numbered stations, in walking order: **1 · Portraits** (Portrait Hall), **2 · Puzzle**, **3 · Catalogue** and **4 · Forgery** (Gallery, left to right). Each gives a letter that stays hidden until you solve it. Rearrange the four letters to open the vault.
- **Station 3 — Curator’s Catalogue:** match four Met artwork labels with drag, click/tap, or Tab + Enter/Space. Labels can be moved, swapped, or returned to the tray. [Artwork credits, timing and save behavior](docs/story/curators-catalogue.md).
- In the vault, answer the final question: who planned it all? You have three tries. Up to 80 points (older completed saves retain their original rewards).
- Three endings: name the planner, then **Steal the artwork** or **Quit the mission**. Three wrong names end the night with **Case lost**. Each ending has its own result screen with the real Met painting, evidence and score ([ending flow](docs/ending-screens.md)).
- **J** opens the journal, **Esc** the menu. The hint button helps when you are stuck.
- The Home screen's **Scoreboard** shows your current run and the ten best finished runs (Won or Lost) of all local profiles and guests in this browser. Scoreboard is local to this browser; an online version is prepared in `server/leaderboard` but not deployed ([details](docs/leaderboard.md)). Lost runs never count as a best run.

## Run locally

JavaScript modules need a small web server (no build step, no packages):

```bash
python3 -m http.server 8000 --directory web
```

Then open <http://localhost:8000>.

## Run tests

```bash
cd web && node --test
```

GitHub Actions runs the same command for every pull request and after every merge to `main` (badge above). The folder `legacy/` holds code the game no longer uses: `legacy/python/` is the first Streamlit prototype with its tests (`cd legacy/python && uv run pytest`).

## Project structure

| Path | Purpose |
|---|---|
| `web/index.html`, `web/style.css`, `web/assets/investigation-journal-*.webp` | Page, home screen, menu and compact illustrated journal |
| `web/main.js` | Drawing, input, rooms, connects the game to the story |
| `web/local-auth.js` | Device-only username/password profiles and separate local saves |
| `web/story/local-runs.js` | Local scoreboard: finished runs of this browser |
| `web/leaderboard.js`, `server/leaderboard/` | Prepared online leaderboard (Cloudflare Worker/D1), hidden until deployed |
| `web/wall-plaque.js` | Brass name plaques above the Gallery stations |
| `web/engine.js` | Map and movement rules |
| `web/story/` | Story engine, save, scoring, dialogues, hints, endings, sound |
| `web/minigames/` | The station mini-games and their shared UI (`station-ui.js`) |
| `web/dev/` | Preview pages, screenshots and browser checks |
| `legacy/`, `web/legacy/` | Code the game no longer uses (first Python prototype, old prototype story) |
| `docs/` | Work log, concept, design notes, [project history](docs/project-history.md) |

## Known limits

- Profiles, saves and the scoreboard live only in this browser. Clearing site data removes them.
- Local accounts have no password reset.
- The online leaderboard is prepared in `server/leaderboard` but not deployed.
- Met data is a frozen snapshot in the repo; the game runs without the Met API.

## Credits

Artworks and data: [The Metropolitan Museum of Art Collection API](https://metmuseum.github.io/), Open Access (Public Domain). [Every artwork and direct collection link](docs/art-credits.md). The museum and all characters are fictional.

## Course context

Team project for *Introduction to Programming* at Nova SBE (2026/27). Earlier decisions, the old setup guide and the full history are in [docs/project-history.md](docs/project-history.md).
