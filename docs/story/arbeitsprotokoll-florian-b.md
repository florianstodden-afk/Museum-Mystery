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
- **Commit:** `a63e050 Document story logic and integration plan` (`node --test` → 73 / 73 bestanden)

## Stretch 1 – CI-Workflow

- `.github/workflows/story-tests.yml`: führt bei jedem Pull Request `node --test` in `web/` aus (Node 22). YAML lokal mit Python geparst; auf GitHub selbst noch **nicht** gelaufen (wird beim ersten PR sichtbar).
- **Commit:** `433500d Run node tests on every pull request`

## Stretch 2 – Story-Check

- Ergebnisse in `docs/story/story-check.md`. Zwei Lücken geschlossen: Warum ist „M“ Voss (*mécène*), warum lockt er die Spielerfigur zum Safe. Neuer Test für die Erklärung.
- **Prüfung:** `node --test` → **74 / 74 bestanden**.
- **Commit:** `061efd2 Close story gaps: explain M and the lure to the safe`

## Stretch 3 – Barrierefreiheit

- **Kontraste** (WCAG-Formel, per Skript berechnet): Text auf Panel 11.2:1, gedämpfter Text 6.7:1, Gold 9.3:1, Schrift auf Buttons 9.6:1 – alle über AA (4.5:1). Gesperrte Raumkarten von 72 % auf 85 % Deckkraft angehoben.
- **Tastatur** (im Browser getestet): Tab erreicht alle Knöpfe, goldener Fokus-Rahmen sichtbar, Enter öffnet, Escape schließt (natives `<dialog>`, Fokus bleibt im Dialog).
- **Gefundener Fehler:** Nach dem Schließen blieb der Fokus auf dem unsichtbaren ✕. Jetzt springt er zum auslösenden Knopf zurück (auch wenn der Knopf inzwischen neu gezeichnet wurde). Erneut getestet: Fokus kehrt zurück.
- Bereits vorhanden: echte `<button>`/`<label>`, `aria-live` für Rückmeldungen, `aria-label` für Buchstabenplätze, Alt-Texte für Bilder, Security Office zusätzlich mit Knöpfen statt nur Canvas-Klicks.
- **Commit:** `ffc889f Return keyboard focus after closing preview dialogs`

## Merge-Check – 12.11.2026

1. `git fetch origin`; `git log 9beaf57..origin/main` → **keine neuen Commits** auf `main` seit dem Start.
2. `git merge origin/main` → „Already up to date.“ (kein Merge-Commit nötig, kein Konflikt).
3. Tests nach dem Merge: `cd web && node --test` → **74 Tests, 74 bestanden** (17 alte + 57 neue). `uv run pytest` → **6 bestanden**.
4. `git diff --name-status origin/main...HEAD`: ausschließlich **neue** Dateien (Status `A`), keine bestehende Datei geändert.
5. Browser: `web/index.html` (Hauptspiel) und `web/dev/story.html` laden ohne fehlgeschlagene Ressourcen (Screenshots 13, 14).
6. Merge-Check-Dokumentation committet: `1f05d73 Record merge check and prepare pull request text`.

## Zusatz A – Hinweis-System (`web/story/hints.js`)

- **Ziel:** Konzept „Niemand kann dauerhaft feststecken“ auch außerhalb der Stationen erfüllen.
- **Entscheidungen:** `hintFor(state, level)` ist eine reine Funktion. Stufe 1 gibt einen sanften Hinweis, Stufe 2 einen konkreten. Story-Hinweise kosten **keine** Punkte; die Hinweise innerhalb einer Station kosten dort weiterhin −5, das regelt die Station selbst. Nach zwei falschen Safe-Wörtern bzw. zwei falschen Anklagen ist schon Stufe 1 konkret (nennt B – I – L – D bzw. das Rahmenetikett). Hinweise kommen von Imani.
- **Prüfung:** 6 neue Tests (für jeden Story-Schritt ein Hinweis, Sicherheitsnetz nach zwei Fehlversuchen, Zustand und Punkte bleiben unverändert). `node --test` → **80 / 80 bestanden**.
- **Commit:** `fc5eaac Add story hints so nobody stays stuck`

## Zusatz B – Story-Host (`web/story/host.js`)

- **Ziel:** Die Integration ins Hauptspiel vereinfachen und ihr Risiko senken.
- **Entscheidungen:** `createStoryHost({ openPanel, closePanel, onChange, stations, storage, storageKey })` bündelt Laden/Speichern (immer mit try/catch, gesperrter Speicher → Spiel läuft trotzdem), Stationen über den Adapter, Gespräche, Security-Office-Punkte, Safe → Schlussfrage → Entscheidung → Abspann (`openVault()` wählt den passenden Schritt), Hinweise und „New game“ mit Bestätigung. Die Seite leiht dem Host nur einen Dialog. Der Speicher ist austauschbar (`memoryStorage()` für Tests). Das Safe-Eingabefeld bekommt jetzt automatisch den Fokus, auch nach einem falschen Wort.
- **Prüfung:** 8 neue Tests in `host.test.js`, u. a. ein komplettes Spiel über den Host (falsches Wort, falsche Anklage, Ende B, **87 / 100**), Laden in einem neuen Host, kaputter und gesperrter Speicher. `node --test` → **88 / 88 bestanden**.
- **Commit:** `624ec55 Add story host that wires the story into any page`

## Zusatz C – Vorschau auf den Host umgestellt

- `web/dev/story-preview.js` nutzt jetzt `createStoryHost` und zeichnet nur noch die Raumkarten (deutlich kürzer). Neuer Knopf „💡 Hint“. Speicherschlüssel und Format unverändert, alte Vorschau-Stände bleiben gültig.
- **Browserprüfung:** New game mit Bestätigung → Auftrag → Hinweis und „Tell me more“ → echte Station 1 (1× falsch, dann richtig, 17 Punkte) → drei Platzhalter → Safe-Feld hat Fokus → zwei falsche Wörter → Hinweis nennt B – I – L – D → `b i l d` → falsche Anklage Dr. Vale (Beweiskette bleibt verborgen) → Voss (Erklärung „mécène“) → Ende A, **87 / 100**. Seite neu geladen: Stand und Punkte erhalten. Tastatur: Hint mit Enter geöffnet, Escape, Fokus zurück auf „💡 Hint“. Konsole ohne Fehler, keine fehlgeschlagenen Ressourcen. Screenshot 15.
- **Doku:** Integrationsplan mit „Kurzer Weg“ über den Host (Aufwand ca. 2–3 h statt 5–6 h), README und Minispiel-Vertrag angepasst.
- **Erneuter Abgleich:** `git fetch origin` → weiterhin keine neuen Commits auf `main`. `node --test` → **88 / 88**, `uv run pytest` → **6 bestanden**.
