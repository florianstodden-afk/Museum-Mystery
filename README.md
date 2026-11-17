# Museum Mystery – The Night of the Forgery

[![Story tests](https://github.com/florianstodden-afk/Museum-Mystery/actions/workflows/story-tests.yml/badge.svg)](https://github.com/florianstodden-afk/Museum-Mystery/actions/workflows/story-tests.yml)

A small top-down detective game in the browser: walk through a museum at night, solve four art stations with real works from The Met and decide what happens to a Van Gogh.

**Play it:** <https://florianstodden-afk.github.io/Museum-Mystery/>

![The museum at night](docs/screenshots/readme-game.png)

## How to play

- Move with **WASD** or the **arrow keys**. Press **E** next to a marked object or a person.
- Four stations (B, I, L, D) each give one letter. Together they open the vault.
- In the vault, answer the final question. There are two endings and up to 90 points.
- **J** opens the journal, **Esc** the menu. The hint button helps when you are stuck.

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

GitHub Actions runs the same command for every pull request and after every merge to `main` (badge above). The Python files (`app.py`, `game.py`, `storage.py`, `tests/`) belong to the first Streamlit prototype. They are legacy and not part of the game; `uv run pytest` still runs them.

## Project structure

| Path | Purpose |
|---|---|
| `web/index.html`, `web/style.css` | Page, home screen, menu, journal |
| `web/main.js` | Drawing, input, rooms, connects the game to the story |
| `web/engine.js` | Map and movement rules |
| `web/story/` | Story engine, save, scoring, dialogues, hints, endings, sound |
| `web/minigames/` | The station mini-games and their shared UI (`station-ui.js`) |
| `web/dev/` | Preview pages, screenshots and browser checks |
| `docs/` | Work log, concept, design notes, [project history](docs/project-history.md) |

## Stations and owners

| Part | Owner |
|---|---|
| Station B – Landscape Gallery | Fabian Bergvall |
| Station I – Portrait Hall | Florian Baumgartl |
| Station L – Renoir picture puzzle | Leopold Heppe |
| Station D – Frame Archive | open (placeholder) |
| Story engine | Florian Baumgartl |
| Rooms and graphics | Fabian Bergvall |
| Repository and setup | Florian Stodden |

## Credits

Artworks and data: [The Metropolitan Museum of Art Collection API](https://metmuseum.github.io/), Open Access (Public Domain). The museum and all characters are fictional.

## Course context

Team project for *Introduction to Programming* at Nova SBE (2026/27). Earlier decisions, the old setup guide and the full history are in [docs/project-history.md](docs/project-history.md).
