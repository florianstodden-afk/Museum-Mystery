# Pull Request: `feature/story-logic` → `main`

**Titel:** Story-Logik „Museum Nocturne“: Engine, Stationen-Adapter, Bausteine und Vorschau

## Was

Die neue Story nach dem Team-Konzept als eigenständige, getestete Bausteine in `web/story/`:

- **Story-Engine** (`engine.js`, `scoring.js`, `case-1.js`, `save.js`): reine Funktionen ohne DOM/localStorage. Vier Stationen in beliebiger Reihenfolge → Buchstaben fest B‑I‑L‑D, Safe mit `BILD`, Schlussfrage (Voss), zwei Enden, Punkte max. 100.
- **Stationen-Adapter** (`stations.js`) + allgemeiner **Platzhalter** für Stationen 2–4; Vertrag für die Teamkollegen in `docs/story/minigame-contract.md`. Station 1 (`landscape.js`) funktioniert unverändert.
- **Oberflächen-Bausteine**: Dialoge (Leon, Imani, Dr. Vale, M – abhängig vom Fortschritt), Journal, Safe, Schlussfrage mit Beweiskette, Abspann beider Enden mit Punkte-Aufschlüsselung, `story.css` (nur Klassen `story-*`).
- **Security Office** (`web/story/security-office/`): Canvas-Raum mit 3×3-Monitorwand und Interaktionspunkten.
- **Vorschau-Seiten**: `web/dev/story.html` (ganze Story spielbar) und `web/dev/security-office.html`.
- **CI**: `.github/workflows/story-tests.yml` führt `node --test` bei jedem PR aus.
- **Doku**: `docs/story/` (README, Integrationsplan, Vertrag, Security Office, Story-Check, Arbeitsprotokoll), `docs/spielkonzept-kurz.md`.

## Warum

Fabian arbeitet parallel an Grafik und Räumen in `main.js`/`engine.js`. Damit wir uns nicht in die Quere kommen, ist die Story komplett getrennt gebaut und **schon heute** spielbar und vorführbar. Die Integration ins Hauptspiel folgt nach Absprache (`docs/story/integration-plan.md`).

## Ändert keine bestehenden Dateien

`git diff --name-status origin/main...feature/story-logic` zeigt nur neue Dateien (`A`). Daher kein Merge-Konflikt mit Fabians Arbeit möglich.

## Testergebnis nach dem Merge-Check (12.11.2026)

- `origin/main` hatte seit Start (`9beaf57`) keine neuen Commits; `git merge origin/main` → „Already up to date.“
- `cd web && node --test` → **74 Tests, 74 bestanden, 0 fehlgeschlagen** (17 bestehende + 57 neue)
- `uv run pytest` → **6 bestanden**
- Browser: Hauptspiel `web/index.html` und `web/dev/story.html` laden ohne Fehler.
- Komplett durchgespielt: ein falscher Safe-Code, zwei falsche Anklagen, beide Enden, „New game“, Neuladen mit gespeichertem Stand.

## Screenshots

| | |
|---|---|
| Übersicht | `docs/story/screenshots/00-overview-after-mission.jpg` |
| Station 1 (echt) | `docs/story/screenshots/02-landscape-station-wrong-answer.jpg` |
| Safe, falsches Wort | `docs/story/screenshots/04-safe-wrong-word.jpg` |
| Falsche Anklage | `docs/story/screenshots/06-wrong-accusation-feedback.jpg` |
| Ende B | `docs/story/screenshots/07-ending-open-file.jpg` |
| Ende A | `docs/story/screenshots/09-ending-heist.jpg` |
| Security Office | `docs/story/screenshots/11-security-office-monitor-wall.jpg` |

## So prüfen

```bash
cd web && node --test
python3 -m http.server 8000 --directory web
```
Dann `http://localhost:8000/dev/story.html` öffnen und den Ablauf aus `docs/story/README.md` durchklicken.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
