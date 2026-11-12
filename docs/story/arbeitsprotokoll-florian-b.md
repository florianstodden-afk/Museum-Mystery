# Arbeitsprotokoll Florian B. – Story-Logik (`feature/story-logic`)

Eigene Datei, damit es keinen Konflikt mit dem gemeinsamen `docs/arbeitsprotokoll.md` gibt.
**Beteiligte:** Auftrag und Konzept: Florian Baumgartl / Team. Umsetzung: Claude Code (Claude Opus 5.5) nach schriftlichem Auftrag. Alle Prüfungen unten wurden tatsächlich ausgeführt.

## Vorbereitung – 12.11.2026

- **Ausgangslage:** `main` auf Commit `9beaf57`, Arbeitsverzeichnis sauber. Branch `feature/story-logic` von `main` angelegt.
- **Werkzeug:** Auf dem Mac war **kein Node.js installiert** (`node: command not found`). Für die Tests wurde die in Cursor.app eingebaute Node-Laufzeit (v24.15.0) über `ELECTRON_RUN_AS_NODE=1` verwendet; nichts wurde installiert und keine Projektdatei geändert. **Offener Punkt:** Node.js ≥ 20 regulär installieren (z. B. von nodejs.org), damit `cd web && node --test` direkt läuft.
- **Prüfung:** `cd web && node --test` → **17 Tests, 17 bestanden** (Ausgangslage).
- **Met-API:** Alle sechs Werke über `collectionapi.metmuseum.org` abgefragt; alle `isPublicDomain: true`. Abweichungen siehe M1.

## M1 – Story-Engine, Punkte, Falldaten, Speichern

- **Ziel:** Die ganze Story als reine Funktionen, ohne DOM und ohne `web/engine.js`.
- **Entscheidungen:**
  - Jede Aktion gibt `{ state, ok, message }` zurück. **Nicht erlaubte** Aktionen (z. B. Safe vor allen Stationen, alles nach dem Ende) geben den unveränderten Zustand zurück. **Falsche Antworten** am Safe und bei der Schlussfrage sind erlaubte Versuche: `ok: false`, aber `attempts + 1` (sonst könnte man die Punktregel „nach Fehlversuch 5“ nicht umsetzen).
  - `safe.attempts` und `accusation.attempts` zählen **nur falsche** Versuche.
  - Leere Safe-Eingabe zählt nicht als Versuch.
  - Stationen können erst nach dem Lesen des Auftrags gelöst werden (Story-Reihenfolge). Notizen gehen jederzeit.
  - `letters` ist ein Array mit vier festen Plätzen (`null` oder Buchstabe), `evidence` eine Liste von Beleg-ids in Fundreihenfolge.
  - `deserialize` prüft auch die Story-Reihenfolge (z. B. Safe offen ohne alle Stationen → `null`).
  - Werke für Stationen 2–4 zugeordnet (Annahme, das Konzept nennt nur die Liste): Portrait Hall 12127 + 435876, Conservation Studio 435882, Frame Archive 436121.
  - `case-1.js` speichert den vollständigen Met-Titel (`title`) und den Kurztitel aus dem Konzept (`shortTitle`). Prüfdatum `2026-11-10` laut Auftrag; am 12.11.2026 erneut gegen die API geprüft.
- **Abweichungen Met-API ↔ Konzept:** Langtitel bei 436121 („… (Madame Paul Valpinçon?)“), 12127 („… (Virginie Amélie Avegno Gautreau)“), 435876 („Madame Cézanne (Hortense Fiquet, 1850–1922) in a Red Dress“). *Road in Etten* (459193): Met-Medium „Chalk, pencil, pastel, watercolor. Underdrawing in pen and brown ink.“ – `web/minigames/landscape.js` zeigt verkürzt „Chalk, pastel and watercolor“ (nicht geändert, da bestehende Datei). Jahre und alle anderen Angaben stimmen.
- **Dateien:** `web/story/case-1.js`, `engine.js`, `scoring.js`, `save.js`, `web/story/tests/engine.test.js`, `scoring.test.js`, `save-and-case.test.js`, `docs/spielkonzept-kurz.md` (Konzept lag nicht im Repo).
- **Prüfung:** `node --test` → **45 Tests, 45 bestanden**.
- **Commit:** `baf0ec3 Add Nocturne story engine, scoring and case data`

## M2 – Stations-Adapter, Platzhalter, Vertrag

- **Ziel:** Jede Station lässt sich gleich anhängen; die Engine vergibt Buchstabe, Beleg und Punkte.
- **Entscheidungen:** `landscape.js` meldet beim Lösen nur `{ letter, evidence, points }`. Der Adapter merkt sich deshalb den letzten Fortschritt aus `caseData.onChange` und nimmt `mistakes`/`hints` daraus. Ein zweites `onSolved` wird ignoriert. Für DOM-Tests ohne Browser gibt es einen kleinen Test-Helfer `fake-dom.js`.
- **Dateien:** `web/story/stations.js`, `placeholder-station.js`, `dom.js`, `tests/stations.test.js`, `tests/fake-dom.js`, `docs/story/minigame-contract.md`.
- **Prüfung:** `node --test` → **51 / 51 bestanden**. Ein Test nutzt die echten Regeln aus `landscape.js` (`answer`, `hint`).
- **Commit:** `81d7d02 Add station adapter, placeholder station and contract`

## M3 – Dialoge, Journal, Safe, Schlussfrage, Enden

- **Ziel:** Inhalte als Daten + kleine Render-Bausteine für jeden Container.
- **Entscheidungen:** In `case-1.js` pro Station ein Satz `pointsToVoss` für die Beweiskette. Dr. Vale ist vor dem offenen Safe „nicht da“. Die Endbilder kommen aus `web/assets/met-436535.jpg` (nur gelesen, Pfad über `import.meta.url`, funktioniert von jeder Seite). Texte nur per `textContent`, nie `innerHTML`.
- **Dateien:** `web/story/dialogues.js`, `journal.js`, `safe-ui.js`, `accusation-ui.js`, `endings.js`, `story.css`, `tests/content.test.js`.
- **Prüfung:** `node --test` → **64 / 64 bestanden**.
- **Commit:** `33ab6e6 Add story dialogues, journal, safe, accusation and ending components`

## M4 – Spielbare Story-Vorschau

- **Ziel:** Story heute schon vorführbar, ohne Karte.
- **Durchgeführte Browserprüfung** (eingebauter Browser, `python3 -m http.server 8000 --directory web`):
  - Auftrag angenommen; Landscape Gallery mit echter `landscape.js`: einmal falsch (1881/Oil) → „−3 points“, dann richtig → 17 Punkte, im Journal B.
  - Seite neu geladen → Fortschritt aus `localStorage` (`museum-nocturne-story-preview-v1`) wiederhergestellt.
  - Platzhalter für Portrait Hall, Frame Archive, Conservation Studio. Leon nach Portrait Hall: entlastende Zeilen.
  - Safe: `DLIB` → „The lock does not move. Check the order in your journal.“, dann `bild` → offen.
  - Schlussfrage: Leon → Feedback Night-shift log; Dr. Vale → Feedback Frame label; Voss → richtig.
  - Ende B „The Open File“: **87 / 100** (17+20+20+20, Safe 5, Frage 5) – stimmt mit den Regeln.
  - „New game“ mit Bestätigung, zweiter Durchlauf ohne Fehler → Ende A „The Heist“: **100 / 100**.
  - Konsole: keine Fehler. Handy-Breite 375 px: kein horizontales Scrollen.
- **Gefundene und behobene Fehler:**
  1. Das Dialogfenster saß zu hoch, weil `body > * { position: relative }` auch das `<dialog>` traf → Regel auf `:not(dialog)` beschränkt.
  2. Nach einer **falschen** Anklage zeigte die Beweiskette schon die Lösung („… Voss is the patron“) → Beweiskette erscheint jetzt erst nach der richtigen Antwort (neuer Test).
- **Dateien:** `web/dev/story.html`, `story-preview.js`, `story-preview.css`, Screenshots `docs/story/screenshots/00–10`.
- **Prüfung:** `node --test` → **65 / 65 bestanden**.
- **Commit:** `8438be9 Add playable story preview page`

## M5 – Security Office

- **Ziel:** Eigenständiger Story-Raum mit Monitorwand für Fabians Karte.
- **Entscheidungen:** Eine Layout-Tabelle `LAYOUT` (relative Koordinaten) für Zeichnung **und** Klickbereiche. PNG-Hintergrund optional (fehlt noch → Code-Zeichnung). Bildschirme flackern mit ca. 12 fps über deterministisches Rauschen (gleiche Zeit → gleiches Bild, gut testbar). Die Kamera-Uhr startet bei 21:12.
- **Gefundener Fehler:** Der neue Test „Bereiche überlappen nicht“ schlug fehl – das Funkgerät lag im Klickbereich der Monitorwand. Funkgerät ans rechte Tischende verschoben.
- **Browserprüfung:** Raum mit 9 Bildschirmen (7 Beispiel-Feeds, 2× NO SIGNAL), Hover-Rahmen, Klick auf Monitorwand → Notiz im Journal; zweiter Klick → „This note is already in your journal.“ Konsole: nur der erwartete 404 für das fehlende `security-office.png`.
- **Dateien:** `web/story/security-office/security-office.js`, `interactions.js`, `web/dev/security-office.html`, `security-office-preview.js`, `docs/story/security-office.md`, `tests/security-office.test.js`, Screenshots 11–12.
- **Prüfung:** `node --test` → **73 / 73 bestanden**.
- **Commit:** `edcc87b Add standalone security office with monitor wall`

## M6 – Integrationsplan und Dokumentation

- **Ziel:** Plan für die Übernahme ins Hauptspiel, Überblick, dieses Protokoll.
- **Entscheidung:** Alte Spielstände werden bei der Integration nicht umgerechnet (die alte Story passt nicht zur neuen), nur die Spielerposition wird übernommen.
- **Dateien:** `docs/story/integration-plan.md`, `docs/story/README.md`, dieses Protokoll; kleiner Link von der Story-Vorschau zur Security-Office-Vorschau.
- **Prüfung:** `node --test` → siehe Commit.
- **Offene Punkte:** Node.js installieren; `security-office.png` erzeugen; Stationen 2–4 von den Teamkollegen; Integration nach Absprache mit Fabian.
