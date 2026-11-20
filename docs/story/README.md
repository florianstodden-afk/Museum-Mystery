# Story-Logik „Museum Nocturne“ (`web/story/`)

**Historischer Architekturüberblick vom November 2026.** Die Tabellen unten nennen teilweise frühere Platzhalter und Punktwerte. Für den aktuellen Stand gelten [README](../../README.md), [Station B](curators-catalogue.md) und [Leaderboard](../leaderboard.md). Die alten Angaben bleiben als Entwicklungsgeschichte stehen.

Die Story des Spiels als eigenständige, getestete Bausteine. Sie hängen **nicht** von der Karte ab. Seit dem 12.11.2026 sind sie im Hauptspiel eingebunden (`web/main.js` nutzt `createStoryHost`); wie das gemacht wurde: [integration-plan.md](integration-plan.md).

## Dateien

**Logik (reine Funktionen, kein DOM, kein localStorage)**

| Datei | Inhalt |
|---|---|
| `web/story/case-1.js` | Falldaten (eingefroren): Auftrag, vier Stationen, Notizen, Verdächtige, sechs Met-Werke. |
| `web/story/engine.js` | Spielregeln: `newGame`, `readMission`, `solveStation`, `addNote`, `canOpenSafe`, `tryOpenSafe`, `accuse`, `chooseEnding`, `nextStep`, `isComplete`. Jede Aktion gibt `{ state, ok, message }` zurück. |
| `web/story/scoring.js` | Start bei 100, gespeicherte Abzüge und Puzzle-Zeitstufen: `synchronizeScore`, `scoreBreakdown`, `totalScore`. Alte Punktefunktionen bleiben für Spielstand-Kompatibilität. |
| `web/story/save.js` | `serialize` / `deserialize` mit Prüfung (kaputt, alte Version, unmögliche Zustände → `null`). |
| `web/story/stations.js` | Adapter `openStation`: hängt jede Station gleich an, übersetzt die Rückmeldung in `{ mistakes, hints }`. |
| `web/story/hints.js` | `hintFor(state, level)`: Hinweis passend zum Fortschritt (kostet keine Punkte, nach zwei Fehlversuchen konkret). |
| `web/story/security-office/interactions.js` | Texte und Notizen der Objekte im Sicherheitsraum, `examine(state, id)`. Wird von Fabians Raum im Spiel benutzt. |

**Oberfläche (rendern in jeden Container)**

| Datei | Inhalt |
|---|---|
| `web/story/host.js` | `createStoryHost(...)`: verbindet die Story mit jeder Seite (Speichern, Stationen, Gespräche, Safe bis Abspann, Hinweise). Hauptspiel und Vorschau benutzen ihn. |
| `web/story/dom.js` | Kleine Helfer `el()` und `button()`, Bild-URL der Met-Werke. |
| `web/story/placeholder-station.js` | Platzhalter für noch nicht gebaute Stationen (zurzeit L und D). |
| `web/story/dialogues.js` | `dialogueFor(characterId, state)` und `renderDialogue`. |
| `web/story/journal.js` | `journalModel`, `renderJournal`, `evidenceChain`. |
| `web/story/safe-ui.js` | Codewort-Eingabe für den Safe. |
| `web/story/accusation-ui.js` | Schlussfrage mit drei Antworten und Beweiskette. |
| `web/story/endings.js` | Entscheidung und Abspann der beiden Enden mit Punkte-Aufschlüsselung. |
| `web/story/story.css` | Stil aller Bausteine (nur Klassen mit Präfix `story-`). |
| `web/story/security-office/security-office.js` | **Prototyp:** zeichnet ein Security Office per Code. Im Spiel nicht benutzt, nur in der Vorschau (siehe [security-office.md](security-office.md)). |

**Stationen (Minispiele, in `web/minigames/`)**

| Station | Dateien | Stand |
|---|---|---|
| B · Landscape Gallery | `landscape.js` | fertig (Fabian) |
| I · Portrait Hall | `portrait-rules.js`, `portrait-artwork.js`, `portrait-timeline.js`, `portrait-timeline.css`, `portrait-timeline.test.js` | fertig (Florian B.) |
| L · Restoration | Leopolds Branch `feature/renoir-picture-puzzle` | noch nicht gemergt |
| D · Frame Archive | – | Platzhalter |

**Vorschau-Seiten (nur zum Ausprobieren)**

| Datei | Inhalt |
|---|---|
| `web/dev/story.html` + `story-preview.js` + `story-preview.css` | Ganze Story spielbar, ohne Karte. |
| `web/dev/security-office.html` + `security-office-preview.js` | Prototyp-Zeichnung des Security Office mit Beispiel-Kameras. |

**Tests:** `web/story/tests/*.test.js` (`fake-dom.js` ist ein Test-Helfer, kein Test).

**Doku:** [minigame-contract.md](minigame-contract.md) (Vertrag für Stationen), [security-office.md](security-office.md) (was vom Security Office im Spiel steckt), [integration-plan.md](integration-plan.md), [story-check.md](story-check.md), [arbeitsprotokoll-florian-b.md](arbeitsprotokoll-florian-b.md), Screenshots in `screenshots/`.

## Vorschau starten

```bash
python3 -m http.server 8000 --directory web
```

Dann im Browser öffnen:
- <http://localhost:8000/dev/story.html> – Story-Vorschau
- <http://localhost:8000/dev/security-office.html> – Security Office

**Durchklicken (ca. 3 Minuten):**
1. Nachricht von M lesen, „Accept the mission“. Oben rechts „💡 Hint“ ausprobieren, dann „Tell me more“.
2. Security Office: Monitorwand und Schichtplan ansehen (Notizen im Journal).
3. „Talk to Leon“ – dann Portrait Hall lösen – noch einmal mit Leon sprechen (er ist entlastet).
4. Landscape Gallery: echte Station 1. Einmal falsch (1881 + Oil), dann richtig (1889 + Oil).
5. Das Bilderpuzzle L lösen; I und D verwenden noch Platzhalter. Im Journal stehen B‑I‑L‑D an festen Plätzen.
6. Safe: zweimal ein falsches Wort (z. B. `SLIO`, `LIOS`), dann „💡 Hint“ (nennt jetzt die Buchstaben), dann `oils`.
7. „Look at the documents“: erst Leon oder Dr. Vale wählen (Feedback, welcher Beleg dagegen spricht), dann Adrien Voss.
8. Ein Ende wählen, Punkte ansehen, „New game“ → bestätigen, zweites Ende spielen.

Der Spielstand der Vorschau liegt in `localStorage` unter `museum-nocturne-story-preview-v1` (getrennt vom Hauptspiel).

## Tests starten

```bash
cd web && node --test
```

Läuft ohne Browser. Node.js ab Version 20 nötig.
