# Story-Logik „Museum Nocturne“ (`web/story/`)

Die Story des Spiels als eigenständige, getestete Bausteine. Sie hängen **nicht** von der Karte ab und ändern keine bestehende Datei. Wie sie ins Hauptspiel kommen: [integration-plan.md](integration-plan.md).

## Dateien

**Logik (reine Funktionen, kein DOM, kein localStorage)**

| Datei | Inhalt |
|---|---|
| `web/story/case-1.js` | Falldaten (eingefroren): Auftrag, vier Stationen, Notizen, Verdächtige, sechs Met-Werke. |
| `web/story/engine.js` | Spielregeln: `newGame`, `readMission`, `solveStation`, `addNote`, `canOpenSafe`, `tryOpenSafe`, `accuse`, `chooseEnding`, `nextStep`, `isComplete`. Jede Aktion gibt `{ state, ok, message }` zurück. |
| `web/story/scoring.js` | Punkte: `stationPoints`, `safePoints`, `accusationPoints`, `scoreBreakdown`, `totalScore` (max. 100). |
| `web/story/save.js` | `serialize` / `deserialize` mit Prüfung (kaputt, alte Version, unmögliche Zustände → `null`). |
| `web/story/stations.js` | Adapter `openStation`: hängt jede Station gleich an, übersetzt die Rückmeldung in `{ mistakes, hints }`. |
| `web/story/security-office/interactions.js` | Interaktionspunkte des Security Office und `examine(state, id)`. |

**Oberfläche (rendern in jeden Container)**

| Datei | Inhalt |
|---|---|
| `web/story/dom.js` | Kleine Helfer `el()` und `button()`, Bild-URL der Met-Werke. |
| `web/story/placeholder-station.js` | Platzhalter für noch nicht gebaute Stationen. |
| `web/story/dialogues.js` | `dialogueFor(characterId, state)` und `renderDialogue`. |
| `web/story/journal.js` | `journalModel`, `renderJournal`, `evidenceChain`. |
| `web/story/safe-ui.js` | Codewort-Eingabe für den Safe. |
| `web/story/accusation-ui.js` | Schlussfrage mit drei Antworten und Beweiskette. |
| `web/story/endings.js` | Entscheidung und Abspann der beiden Enden mit Punkte-Aufschlüsselung. |
| `web/story/story.css` | Stil aller Bausteine (nur Klassen mit Präfix `story-`). |
| `web/story/security-office/security-office.js` | Zeichnet das Security Office auf ein Canvas. |

**Vorschau-Seiten (nur zum Ausprobieren)**

| Datei | Inhalt |
|---|---|
| `web/dev/story.html` + `story-preview.js` + `story-preview.css` | Ganze Story spielbar, ohne Karte. |
| `web/dev/security-office.html` + `security-office-preview.js` | Security Office mit Beispiel-Kameras. |

**Tests:** `web/story/tests/*.test.js` (`fake-dom.js` ist ein Test-Helfer, kein Test).

**Doku:** [minigame-contract.md](minigame-contract.md) (für Stationen 2–4), [security-office.md](security-office.md) (für Fabian), [integration-plan.md](integration-plan.md), [story-check.md](story-check.md), [arbeitsprotokoll-florian-b.md](arbeitsprotokoll-florian-b.md), Screenshots in `screenshots/`.

## Vorschau starten

```bash
python3 -m http.server 8000 --directory web
```

Dann im Browser öffnen:
- <http://localhost:8000/dev/story.html> – Story-Vorschau
- <http://localhost:8000/dev/security-office.html> – Security Office

**Durchklicken (ca. 3 Minuten):**
1. Nachricht von M lesen, „Accept the mission“.
2. Security Office: Monitorwand und Schichtplan ansehen (Notizen im Journal).
3. „Talk to Leon“ – dann Portrait Hall lösen – noch einmal mit Leon sprechen (er ist entlastet).
4. Landscape Gallery: echte Station 1. Einmal falsch (1881 + Oil), dann richtig (1889 + Oil).
5. Die drei anderen Stationen mit dem Platzhalter lösen. Im Journal stehen B‑I‑L‑D an festen Plätzen.
6. Safe: erst `DLIB` (Fehlermeldung), dann `bild`.
7. „Look at the documents“: erst Leon oder Dr. Vale wählen (Feedback, welcher Beleg dagegen spricht), dann Adrien Voss.
8. Ein Ende wählen, Punkte ansehen, „New game“ → bestätigen, zweites Ende spielen.

Der Spielstand der Vorschau liegt in `localStorage` unter `museum-nocturne-story-preview-v1` (getrennt vom Hauptspiel).

## Tests starten

```bash
cd web && node --test
```

Läuft ohne Browser. Node.js ab Version 20 nötig.
