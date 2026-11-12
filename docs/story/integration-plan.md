# Integrationsplan: Story-Engine ins Hauptspiel

**Stand:** 12.11.2026, Branch `feature/story-logic`. **Wer:** Florian B. mit Fabian, **nach** Fabians Merge von Grafik und Räumen.
**Ziel:** Das Hauptspiel (`web/index.html` + `web/main.js`) nutzt die neue Story aus `web/story/` statt der alten Prototyp-Story in `web/engine.js`.

Bis jetzt wurde **keine bestehende Datei geändert**. Alle Schritte unten ändern bestehende Dateien und dürfen deshalb erst nach Absprache mit Fabian passieren – am besten in einem eigenen Branch `feature/story-integration`, wenn niemand sonst an `main.js` arbeitet.

## Grundidee: Wer macht was?

| Bereich | Heute | Nach der Integration |
|---|---|---|
| Bewegung, Kollision, Karte, Wachmann | `web/engine.js` (`canEnter`, `move`, `nearbyObject`), `motion.js`, `guard.js` | **bleibt bei Fabian**, unverändert |
| Story (Belege, Ausweis, Code 2114, Enden) | `web/engine.js` (`interact`, `openVault`, `chooseEnding`, `clues`, `pass`, `vaultOpen`, `ending`) | `web/story/engine.js` |
| Journal, Dialoge, Safe, Schlussfrage, Enden (Anzeige) | `updateSidebar()`, `showDialog()`, `end()` in `main.js` | Bausteine aus `web/story/*.js` in Fabians Seitenleiste/Dialog |
| Speichern | `localStorage` in `main.js` (`museum-mystery-walk-v1`, `museum-nocturne-landscape-v1`) | `main.js` speichert Spielerposition **und** `serialize(storyState)` |

Wichtig: Die Karte bleibt der „Host“. Sie entscheidet, **wo** etwas passiert (welches Objekt in der Nähe ist). Die Story-Engine entscheidet, **was** passiert.

## Schritt für Schritt

### Schritt 1 – Alte Story-Logik sichern (ca. 30 min)
1. Neuen Ordner `web/legacy/` anlegen.
2. Die Story-Teile der alten `web/engine.js` nach `web/legacy/prototype-story.js` kopieren: `EVIDENCE`, `interact` (Story-Texte), `openVault`, `chooseEnding`, `hasAllEvidence`, die Felder `clues`, `pass`, `vaultOpen`, `ending` aus `initialState`/`validState`.
3. Die passenden Tests aus `web/engine.test.js` nach `web/legacy/prototype-story.test.js` verschieben, damit `node --test` weiter alles prüft.
4. In `web/engine.js` bleiben nur Karte und Bewegung: `WIDTH`, `HEIGHT`, `START`, `OBJECTS` (Positionen), `canEnter`, `move`, `nearbyObject`, `interactionDistance`, plus ein verkleinertes `initialState`/`validState` mit `player` und `steps`.
5. Alle Tests grün → Commit „Move prototype story into legacy“.

**Risiko:** `canEnter` nutzt heute `state.vaultOpen` für die Depottür (`x === 18 && y === 9`). → Schritt 3.

### Schritt 2 – Zwei Zustände nebeneinander in `main.js` (ca. 1 h)
```js
import { newGame, readMission, solveStation, addNote, tryOpenSafe, accuse, chooseEnding, canOpenSafe } from './story/engine.js';
import { serialize, deserialize } from './story/save.js';

let world = …;                 // wie heute: { player, steps } aus engine.js
let story = loadStory();       // neu

function loadStory() {
  try { return deserialize(localStorage.getItem('museum-nocturne-story-v1')) ?? newGame(); }
  catch { return newGame(); }
}
function saveStory() {
  try { localStorage.setItem('museum-nocturne-story-v1', serialize(story)); } catch {}
}
```
- Jede Story-Aktion folgt demselben Muster: `const r = action(story, …); story = r.state; saveStory(); showMessage(r.message);`
- Beim ersten Start (`!story.missionRead`) den Dialog von „M“ zeigen (`dialogueFor('m', story)` + `renderDialogue`), Knopf „Accept the mission“ → `readMission`.

### Schritt 3 – Tür/Safe an die Story koppeln (ca. 30 min)
- `canEnter(state, x, y, guard)` bekommt statt `state.vaultOpen` einen zusätzlichen Parameter `doorOpen` (oder Fabian liest `story.safe.open`). Vorschlag: `canEnter(world, x, y, guard, { vaultOpen: story.safe.open })`.
- Am Safe-Objekt: `renderSafe(dialogBody, { state: story, message }, word => { … tryOpenSafe … })`.
- Nach `safe.open`: `renderAccusation(…)`, danach `renderEndingChoice(…)` und `renderEnding(…, { onNewGame: reset })`.

### Schritt 4 – Stationen in Räume hängen (ca. 1 h + je Station 15 min)
In `handleInteract()` ersetzt eine Tabelle die heutigen Sonderfälle (`object.id === 'painting'`):

```js
import { openStation } from './story/stations.js';
import * as placeholder from './story/placeholder-station.js';
import * as landscape from './minigames/landscape.js';

const STATION_AT_OBJECT = {          // Objekt-id auf der Karte → Station
  painting: { stationId: 'landscape', module: landscape },
  portraitLog: { stationId: 'portraits', module: placeholder },   // später ./minigames/portraits.js
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
- Die Objekt-ids (`portraitLog`, `workbench`, `frameRack`) sind Vorschläge; Fabian legt sie in seinen Räumen fest.
- Der heutige Schlüssel `museum-nocturne-landscape-v1` kann als `stationProgress.landscape` weiterverwendet werden.

### Schritt 5 – Journal, Dialoge, Security Office (ca. 1 h)
- Seitenleiste: `#journal` → `renderJournal(document.querySelector('#journal'), journalModel(story))` in `updateSidebar()`. `#progress` zeigt dann `story.letters`, `#pass` entfällt.
- `web/story/story.css` in `index.html` einbinden (`<link rel="stylesheet" href="story/story.css">`). Klassen haben das Präfix `story-`, es gibt keine Kollision mit `style.css`. Achtung: `story.css` setzt Variablen auf `:root` mit eigenem Präfix `--story-*`.
- Personen auf der Karte: Leon (heute `guard`), Imani (heute `restorer`), Dr. Vale (neu) → `renderDialogue(dialogBody, dialogueFor(id, story))`.
- Security Office: siehe `docs/story/security-office.md`.
- Hinweis „Fictional museum and characters · Artworks: The Met, Open Access“ sichtbar lassen (steht im Ende-Bildschirm und sollte auch in der Seitenleiste stehen).

### Schritt 6 – Alte Spielstände (ca. 20 min)
- Alter Schlüssel `museum-mystery-walk-v1` enthält Position **und** alte Story-Felder. Beim Laden nur `player` und `steps` übernehmen (wenn gültig), alles andere ignorieren.
- Story startet bei altem Stand immer mit `newGame()`. Es gibt bewusst **keine** Umrechnung „3 alte Belege → neue Buchstaben“, weil die Stories nicht zusammenpassen.
- `deserialize` liefert `null` für alte/kaputte Stände (`caseVersion`-Prüfung). Wenn wir die Falldaten später ändern, `CASE_VERSION` in `case-1.js` erhöhen.
- „New Game“ löscht beide Schlüssel und alle Stationsfortschritte.

### Schritt 7 – Prüfen (ca. 1 h)
- `cd web && node --test` (alte Bewegungs-Tests, Legacy-Tests, Story-Tests).
- Komplett durchspielen wie in `web/dev/story.html`: ein falscher Safe-Code, eine falsche Anklage, beide Enden.
- Neustart-Test: Browser schließen, wieder öffnen, Stand ist noch da.
- Screenshots in den PR.

## Aufwand und Risiken

| | Aufwand |
|---|---|
| Schritte 1–7 zusammen | **ca. 5–6 Stunden**, zu zweit an einem Nachmittag |

| Risiko | Gegenmaßnahme |
|---|---|
| Konflikte in `main.js`, wenn Fabian parallel arbeitet | Integration erst nach Fabians Merge; kleiner eigener Branch; Fabian reviewt. |
| Tür-Logik hängt an altem `vaultOpen` | Schritt 3: Tür-Status als Parameter übergeben. |
| Alte Spielstände führen zu unmöglichen Zuständen | Schritt 6: Story immer frisch; Position validieren. |
| Stationen 2–4 sind noch nicht fertig | Platzhalter bleibt eingehängt; Austausch ist eine Zeile in `STATION_AT_OBJECT`. |
| CSS-Kollision | Alle Story-Klassen haben `story-`; im Hauptspiel braucht nur der Dialog etwas Platz für längere Inhalte (Ende-Bildschirm ist scrollbar). |
| Dialog in `index.html` ist hell (Papier-Look), Story-Bausteine sind dunkel | Entweder einen dunklen Dialog-Stil für Story-Szenen ergänzen oder in `story.css` eine Variante `.dialog-card .story-*` mit dunkler Schrift. Mit Fabian entscheiden. |

## Was dafür an bestehenden Dateien geändert werden muss (Liste für die Absprache)

- `web/engine.js`: Story-Teile entfernen (→ `web/legacy/`), `canEnter` Tür-Parameter.
- `web/engine.test.js`: Story-Tests nach `web/legacy/`.
- `web/main.js`: Story-Zustand, Speichern, `handleInteract`, `updateSidebar`, `end`, `reset`.
- `web/index.html`: `story.css` einbinden, Missionstext im `.case`-Panel durch Journal-Baustein ersetzen.
- `README.md` und `docs/arbeitsprotokoll.md`: neuer Stand.
