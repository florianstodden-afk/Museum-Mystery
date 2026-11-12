# Arbeitsprotokoll

### 2026-11-12 – Bestehenden Rundgang als Ausgangspunkt übernehmen

- **Beteiligte:** Nutzerauftrag; Codex. Menschliche Durchsicht steht aus.
- **Ausgangslage:** Der gemeinsame Branch `feature/museum-walk` enthält einen begehbaren Prototyp; das neuere Nocturne-Konzept mit vier Stationen ist dort noch nicht umgesetzt.
- **Entscheidung:** Der bestehende Branch wurde in einen neuen Arbeitszweig von `main` übernommen, damit seine Geschichte erhalten bleibt. Die Spielregeln des neuen Konzepts müssen noch umgesetzt werden.
- **Umsetzung:** `web/main.js` lässt Tastatureingaben in geöffneten Dialogen beim Dialog, statt sie für die Spielfigur abzufangen.
- **Prüfung:** Der vorhandene Testlauf mit Node `--test` meldete 6 bestandene Tests. Ein manueller Browsertest dieser Änderung steht aus.

Hier steht nach jeder Aufgabe, was tatsächlich geschah. Die Vorlage und die Regeln stehen in der [README](../README.md). Fehlende Fakten werden nicht ergänzt, bis sie geprüft sind.

### 2026-11-09 – Erster lokaler Museum-Mystery-Fall

- **Beteiligte:** Nutzerauftrag; Umsetzung und Textvorschlag durch Codex. Eine menschliche Durchsicht des Codes und der Oberfläche steht noch aus.
- **Ausgangslage und Ziel:** Nach PR #2 enthielt das Repository nur die README. Gewünscht waren eine eigenständig formulierte Einschätzung der Anforderungen, eine Nachricht an das Team sowie ein dokumentierter und umgesetzter erster Fall.
- **Entscheidung und Grund:** Die offizielle Bewertungsseite fordert eine Live-Demo und Code-Erklärung durch alle Mitglieder. Login und API wurden im geteilten Ideenchat als Bewertungskriterien genannt, sind auf der öffentlich erreichbaren Bewertungsseite aber nicht ausdrücklich aufgeführt. Für den ersten vertikalen Spielweg wurden deshalb Met-API, feste sechs Werke, einfache Regeln, Streamlit und lokales SQLite gewählt. Echte Online-Konten und Bestenliste bleiben getrennte Aufgaben.
- **Datenprüfung und Korrektur:** Die anfänglich ausgewählten IDs 437133 (*Garden at Sainte-Adresse*) und 10393 (*Lydia Crocheting in the Garden at Marly*) hatten entgegen der ersten Dokumentationsbehauptung `isPublicDomain=false` und kein `primaryImageSmall`. Ein Nutzer meldete deshalb den sichtbaren App-Fehler bei 437133. Die sechs nun verwendeten IDs 436535, 459193, 436121, 12127, 435882 und 435876 wurden am 09.11.2026 einzeln per Objekt-API geprüft: alle lieferten `isPublicDomain=true`, ein kleines Primärbild sowie Titel, Künstler, Datum und Medium. Ziel-ID 436535 lieferte zusätzlich in einem Python-API-Test *Wheat Field with Cypresses* und eine Bildadresse. Die frühere Aussage „alle sechs geprüft“ war falsch und wurde korrigiert.
- **Umsetzung:** `specs/first-case.md` legt den Fall fest; `game.py` enthält Punkte und gültige Aktionen; `storage.py` speichert den Versuch in einer ignorierten SQLite-Datei; `app.py` zeigt Met-Werke, Hinweise und Tipps; `tests/` prüft Regeln und Speicherung. `pyproject.toml`, `uv.lock` und `.gitignore` richten das Projekt ein. Branch/PR/Commit nach Veröffentlichung ergänzen.
- **Prüfung:** `uv sync` installierte die Pakete. Der erste Testlauf scheiterte beim Import von `game`; die `pythonpath`-Einstellung in `pyproject.toml` behob das. Danach: `uv run pytest -q` → **6 passed**. Python rief die Met-API für Ziel-ID 436535 erfolgreich ab. Die direkte Streamlit-Startdatei wurde lokal durch die Windows-Anwendungssteuerung blockiert; mit dem verwalteten Python und `PYTHONPATH` startete der Server, und der Health-Endpunkt lieferte `ok`. Eine vollständige manuelle Klickprüfung und ein echter App-Neustart mit Spielstand stehen noch aus.
- **Verständnis/Review:** Noch keine zweite Person hat Code und Regeln gegengeprüft. Offene Fragen: Sind Login und API echte Kurs-Pflichten? Welche Online-Speicherung und welches Hosting verwenden wir? Ist der Hinweisweg für Spieler fair?

### 2026-11-09 – Fehler bei zwei Kunstwerken behoben

- **Meldung:** Beim Öffnen der App erschien „Met-Werk 437133 hat kein verwendbares öffentliches Bild“.
- **Ursache:** Die ursprüngliche Datenprüfung hatte `isPublicDomain` und `primaryImageSmall` für 437133 und 10393 falsch als vorhanden dokumentiert. Beide API-Einträge lieferten tatsächlich `false` beziehungsweise kein Bild.
- **Änderung:** 437133 wurde durch 459193 (*Road in Etten*) und 10393 durch 435882 (*Still Life with Apples and a Pot of Primroses*) ersetzt. Der kostenlose Hinweis beschreibt nun eine Landschaft im Freien; der erste bezahlte Hinweis grenzt das Ziel gegenüber *Road in Etten* zeitlich ab. Betroffene Dateien: `game.py`, `specs/first-case.md`, `tests/test_storage.py`, `app.py` und dieses Protokoll. Die Bilddarstellung wurde zugleich auf die aktuelle Streamlit-Option `width="stretch"` umgestellt.
- **Prüfung:** Alle sechs verwendeten Met-IDs lieferten bei erneuter API-Abfrage `isPublicDomain=true` und `primaryImageSmall`. `uv run pytest -q` → **6 passed**. Der neu gestartete lokale Server meldete `ok`. Ein Streamlit-App-Test mit echten API-Antworten endete ohne App-Ausnahme (`exceptions: 0`). Die Person, die den Fehler meldete, sollte die Seite neu laden und den Spielweg selbst durchklicken.
- **Review:** Menschliche Spiel- und Verständniskontrolle steht noch aus. Commit/PR nach Veröffentlichung ergänzen.

### 2026-11-09 – Richtungswechsel zum begehbaren Museum

- **Beteiligte:** Nutzerfeedback: Das erste Bilderrätsel war zu langweilig und zu einfach. Wunsch: 2D-Draufsicht mit Bewegung ähnlich dem Spielgefühl von Harvest Moon/Pokémon, Mystery-Quest und mindestens zwei Enden. Konzept und Umsetzung dieses neuen Prototyps durch Codex.
- **Entscheidung:** Die aktive Spieloberfläche wird ein eigenständiges Browser-Spiel unter `web/`. Der alte Streamlit-Fall bleibt als nachvollziehbarer Zwischenstand erhalten. Die neue Quest verwendet einfache selbst gezeichnete Pixelgrafik statt fremder Spielgrafiken. Browser-JavaScript verarbeitet Bewegung unmittelbar; Python/Streamlit waren dafür im ersten Prototyp weniger geeignet.
- **Spielweg:** Empfang → Besucherprotokoll → Wachmann/Ausweis → Galerie/Gemäldefälschung → Restaurierungsnotiz → Zahlencode aus dem Protokoll an der Depottür → Original → stille Rückgabe oder öffentliche Aufdeckung. Details und Ausschlüsse stehen in `specs/museum-walk.md`.
- **Umsetzung:** `web/engine.js` trennt Regeln und Zustand; `web/main.js` zeichnet Karte/Figur und verarbeitet Tasten, Dialog, Met-API und lokalen Browser-Spielstand; `web/index.html` und `web/style.css` enthalten Oberfläche und Gestaltung. `web/engine.test.js` prüft Regeln. README und Spezifikation wurden an die neue Richtung angepasst.
- **Prüfung:** `node --test` → 6 Tests bestanden, darunter ein Weg durch die Quest bis zu beiden Enden. `node --check main.js` und `node --check engine.js` → keine Syntaxfehler. Der lokale Webserver lieferte `index.html`, JavaScript und CSS jeweils mit HTTP 200. Eine Browseransicht zeigte Karte, Journal und Dialog. Die alten Python-Tests bestanden ebenfalls (6/6) mit dem verwalteten Python-Interpreter; `uv run pytest` wurde auf diesem Windows-Rechner zeitweise von der Anwendungssteuerung blockiert. Der alte lokale Streamlit-Demoserver wurde beendet; der Browser-Prototyp bleibt auf Port 8000 erreichbar. Ein vollständiger manueller Spieldurchlauf durch ein Teammitglied steht noch aus.
- **Nachtrag:** Ein vierstelliger Türcode aus der Protokoll-Uhrzeit wurde als eigener Schlussfolgerungsschritt ergänzt. Falscher Code bleibt ohne Zustandsänderung; richtige Lösung öffnet die Tür erst nach Belegen und Ausweis. `node --test` und Syntaxprüfung erneut erfolgreich. Die Karte und Story müssen vom Team gespielt und beurteilt werden. Online-Konten, gemeinsame Speicherung, öffentliche Bereitstellung und zusätzliche Fälle sind nicht umgesetzt. Branch/Commit/PR nach Veröffentlichung ergänzen.

### 2026-11-12 – Landschaftsgalerie als erste Station

- **Beteiligte:** Nutzerauftrag und Codex; Teamreview steht aus.
- **Ziel:** Erste Station des Nocturne-Konzepts in den vorhandenen Rundgang einhängen.
- **Umsetzung:** `web/minigames/landscape.js` enthält die Katalogvergleich-Station B mit Fehler- und Hinweisabzügen. Met-Bilder werden über die API geladen, lokale Katalogdaten und Quellenlinks bleiben bei API-Ausfall sichtbar. Der Browser speichert den Fortschritt lokal. `web/main.js` öffnet die Station am Gemälde.
- **Prüfung:** Node `--test`: 8 Tests bestanden. Im lokalen Browser wurde die Station erreicht und mit 1889 und Öl auf Leinwand gelöst; beide API-Bilder erschienen. Die Prüfung deckt noch keinen API-Ausfall oder einen vollständigen Neustart ab.
- **Offen:** Drei weitere Stationen, neues Journal, BILD-Safe, Voss-Schlussfrage, die vorgesehenen Enden und Offline-Bilddateien fehlen. Der restliche Rundgang verwendet vorläufig die alten Regeln; Punkte dieser Station sind noch keine Gesamtwertung.

### 2026-11-12 – Bewegung und erste Halle

- **Beteiligte:** Nutzerauftrag und Codex; Teamreview steht aus.
- **Ziel:** Flüssigere Bewegung und ein erster an die Met angelehnter Museumsraum mit sichtbarer Wand und Kunst.
- **Entscheidung:** Der Rasterzustand und seine Kollisionsregeln bleiben erhalten; die Darstellung interpoliert zwischen Feldern. Gedrückte Tasten bewegen wiederholt, Loslassen, Fokusverlust und Dialoge stoppen die Bewegung. Die Eingangshalle verwendet helle Steinbögen, Säulen und einen Marmorboden; Architekturvorbild: https://www.metmuseum.org/press-releases/the-great-hall-of-the-metropolitan-museum-of-art-2010-general-information. Die Figur erhielt blaues Haar und einen weißen Kittel nach Nutzerwunsch.
- **Umsetzung:** `web/main.js` zeichnet Halle, Met-Werk und Figur und steuert Bewegung; `web/engine.js` sperrt die sichtbare Rückwand.
- **Prüfung:** Node `--test`: 9 Tests bestanden, darunter die Wandkollision. Browser: Raum visuell geprüft; eine 600 ms gehaltene Pfeiltaste bewegte vier Felder. Menschlicher Review und Touch-Langdruck stehen noch aus.

### 2026-11-12 – Vollbild und detaillierte Eingangshalle

- **Beteiligte:** Nutzerauftrag; Bild und Umsetzung mit Codex und ImageGen; Teamreview steht aus.
- **Ziel und Entscheidung:** Eingangshalle bildschirmfüllend und detailreicher darstellen. Die generierte Illustration orientiert sich an der beschriebenen Great Hall der Met; sie ist keine maßstabsgetreue Darstellung. Der helle Boden orientiert sich am beschriebenen Marmoraggregat ohne Schachbrettmuster. Das Met-Werk wird weiterhin aus der API in den mittleren Rahmen geladen.
- **Umsetzung:** `web/assets/great-hall.png` ist der generierte Hintergrund; `web/main.js` zeichnet größere Figuren und den Saal, `web/style.css` macht das Spielfeld bildschirmfüllend und das Journal aufklappbar. Andere Räume verwenden noch die frühere Darstellung.
- **Prüfung:** Node `--test`: 9 Tests bestanden. Browser: Vollbildhalle, Laden des Kunstwerks, Journal und Bewegung überprüft. Ein manueller Durchlauf aller Räume und ein mobiler Gerätetest stehen noch aus.

### 2026-11-12 – Kunst in allen Rahmen

- **Beteiligte:** Nutzerauftrag und Codex; Teamreview steht aus.
- **Umsetzung:** Alle drei Rahmen der Eingangshalle zeigen gemeinfreie Met-Werke. Die Met-API meldete für die Objekte 436121, 436535 und 12127 `isPublicDomain=true`; ihre kleinen Originalbilder wurden als lokale Dateien gespeichert. Quellenlinks stehen im Journal. So erscheinen sie auch ohne API-Verbindung.
- **Prüfung:** Node `--test`: 9 Tests bestanden. Im Browser wurden alle drei gefüllten Rahmen sichtbar geprüft. Ein vollständiger manueller Offline-Test steht noch aus.
