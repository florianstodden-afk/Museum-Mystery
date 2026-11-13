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

### 2026-11-12 – Bewegungsrichtung, Geschwindigkeit und Figuren

- **Beteiligte:** Nutzerauftrag und Codex; Teamreview steht aus.
- **Ziel:** Gleichmäßige sichtbare Bewegung, erkennbare Begrenzungen und lebendigere Figuren.
- **Umsetzung:** `web/motion.js` berechnet die Dauer eines Schritts anhand der tatsächlichen Bildschirmdistanz, einschließlich der unterschiedlichen Skalierung im Saal. `web/main.js` zeichnet Blickrichtung und Schrittanimation der Spielfigur, eine leichte Bewegung der NPCs innerhalb ihres bisherigen Interaktionsfelds sowie Begrenzungen des Saalbodens. UI-Akzente wurden kräftiger gestaltet.
- **Prüfung:** Node `--test`: 10 Tests bestanden, darunter Geschwindigkeitsvergleich auf beiden Achsen. Im Browser wurden Saal, Pfeiltasten und Blickrichtung geprüft. NPCs wechseln ihre Position noch nicht zwischen Spielfeldern; mobiler Gerätetest steht aus.

### 2026-11-12 – Wandkollision und Figuren überarbeiten

- **Beteiligte:** Nutzerauftrag und Codex; Teamreview steht aus.
- **Umsetzung:** Die Grenze der Bilderwand sperrt alle Felder oberhalb des begehbaren Saals; Spielstände in diesem Bereich werden beim Laden auf das nächste begehbare Feld gesetzt. Die Spielfigur hat deutlich schwingende Beine, der Wachmann Augen und Mund. Ein vorgeschlagener neuer Cartoon-Hintergrund wurde auf ausdrücklichen Wunsch nicht verwendet.
- **Prüfung:** Node `--test`: 10 Tests bestanden, darunter Wandfelder zwischen den Bildern. Im Browser wurde die Pfeiltaste nach oben gehalten und die Figur blieb unterhalb der Bildwand stehen. Die Animationen benötigen noch menschliches Feedback.

### 2026-11-12 – New York und Figuren

- **Beteiligte:** Nutzerauftrag, Codex und ImageGen; Teamreview steht aus.
- **Umsetzung:** `web/assets/great-hall-nyc.png` ist eine neue, generierte Variante der bisherigen Halle mit New Yorker Skyline in den Fenstern; die abgelehnte Cartoon-Variante wurde nicht eingebaut. Die Spielfigur erhielt ausgeprägteres blaues Haar, größere Augen, ein blaues Hemd und einen offenen weißen Kittel.
- **Prüfung:** Node `--test`: 10 Tests bestanden. Die Fenster, Bilderrahmen und Figuren wurden im Browser visuell überprüft.

### 2026-11-12 – Wächter-Rundgang und Figurenreferenz

- **Beteiligte:** Nutzerauftrag und Codex; Teamreview steht aus. Figurenreferenz: https://cdna.artstation.com/p/assets/images/images/025/720/998/large/manellopgar-manuel-lopez-manellopgar-manuel-lopez-rick-turnarround.jpg?1586723290
- **Umsetzung:** Die Spielfigur erhielt längere braune Hosenbeine, einen offenen Kittel und schmale Arme nach der Referenz. Der Wachmann wählt begehbare Nachbarfelder und unterschiedlich lange Pausen, läuft langsamer und blickt in seine Laufrichtung. Kollisionen und Interaktion berücksichtigen seine Position; beim Gespräch pausiert er.
- **Prüfung:** Node `--test`: 12 Tests bestanden, einschließlich beweglicher Wächterposition und Wegauswahl. Browser: Wächterbewegung und Positionswechsel beobachtet. Eine längere manuelle Prüfung aller vier Laufrichtungen steht noch aus.

### 2026-11-12 – Kontinuierliche Bewegung und höher aufgelöster Saal

- **Beteiligte:** Nutzerauftrag und Codex; Teamreview steht aus.
- **Ausgangslage und Ziel:** Bisher lief ein Raster-Schritt nach Loslassen zu Ende und das Canvas streckte die Halle. Gewünscht waren sofortiges Stoppen, klare Figuransichten und eine scharfe, unverzerrte Darstellung.
- **Umsetzung:** Die Spielerposition ist jetzt kontinuierlich und wird mit Teilfeldwerten gespeichert. Tastatur und Bildschirmtasten bewegen nur während des Haltens; Bewegung, Wände und Wächter verwenden dieselbe aktuelle Position. Der Wächter vermeidet sichtbare Überschneidungen. Das Canvas rendert doppelt so hoch aufgelöst, das Seitenverhältnis bleibt erhalten und die Kamera folgt im Saal. Figuren haben Seiten- und Rückansicht sowie bewegte Arme und Beine. Dateien: `web/main.js`, `web/motion.js`, `web/engine.js`, `web/guard.js`, `web/index.html`, `web/style.css` und `web/motion.test.js`.
- **Prüfung:** `node --test` mit der gebündelten Node-Laufzeit: 17 Tests bestanden. Im Browser geprüft: gehaltene und losgelassene Pfeiltaste, gehaltener Bildschirmknopf, gespeicherte Position nach Neuladen, Blickrichtung, Saaldarstellung, Wand und Gespräch mit dem Wächter. Bei einer ersten Prüfung überschnitten sich Figuren sichtbar; der Kollisionsabstand wurde angepasst und durch einen Test abgedeckt. Nach der Kollisionsanpassung wurde erneut ein Gespräch mit dem Wächter im Browser geöffnet; der Bildschirmknopf wurde gehalten und das Stoppen nach Loslassen geprüft. Ein echter Mobilgerätetest steht noch aus.
- **Grenzen:** Das hochauflösende Canvas zeichnet die vorhandene Illustration; es ist kein neu aufgenommenes Foto und die übrigen Räume nutzen weiterhin die ältere Gestaltung.

### 2026-11-12 – Dialoge mit E schließen

- **Beteiligte:** Nutzerauftrag und Codex; Teamreview steht aus.
- **Umsetzung:** `E` schließt offene Dialoge, solange kein freies Textfeld bearbeitet wird. Numerische Codefelder können ebenfalls mit `E` geschlossen werden; `Escape` bleibt verfügbar. Der Hinweis in `web/index.html` erklärt beide Funktionen.
- **Prüfung:** Node `--test`: 17 Tests bestanden. Im Browser wurde der Wachmann-Dialog mit `E` geöffnet und mit erneutem `E` geschlossen. Freitext- und Safe-Code-Fokus wurden nicht manuell geprüft.

### 2026-11-12 – Spieltext auf Englisch umstellen

- **Beteiligte:** Nutzerauftrag und Codex; Nutzer wünscht anschließend den Merge.
- **Umsetzung:** Der vorhandene spielbare Handlungsstrang, die Hinweise, Enden, Bedienelemente und die Landschaftsgalerie wurden ins Englische übersetzt. Spiellogik und gespeicherte IDs bleiben unverändert. Dateien: `web/index.html`, `web/main.js`, `web/engine.js`, `web/minigames/landscape.js` und `web/guard.test.js`.
- **Prüfung:** `node --test`: 17 Tests bestanden. `uv run pytest -q`: 6 Tests bestanden. Im Browser wurden Titel, Missionsbeschreibung, Journal, Steuerung und ein Dialog auf Englisch geprüft. Der gesamte Spielablauf wurde nach der Übersetzung nicht manuell durchgespielt.
- **Grenze:** Übersetzt wurde die bestehende Handlung des Prototyps; das vollständige neuere Nocturne-Konzept ist noch nicht umgesetzt.

### 2026-11-12 – Nocturne-Story ins Hauptspiel eingebunden

- **Beteiligte:** Florian Baumgartl (Auftrag, Absprache mit Fabian), Claude Code (Umsetzung).
- **Umsetzung:** `web/main.js` nutzt den Story-Host aus `web/story/host.js`. `web/engine.js` enthält nur noch Karte und Bewegung; jedes Kartenobjekt sagt als Daten, welche Story-Aktion es auslöst. Die Depottür ist der Safe (Codewort `BILD`). Alte Prototyp-Story samt Tests unverändert in `web/legacy/`. Details: `docs/story/arbeitsprotokoll-florian-b.md`.
- **Prüfung:** `node --test`: 98 Tests bestanden. `uv run pytest -q`: 6 bestanden. Im Browser komplett gespielt (siehe Story-Protokoll).
- **Grenze:** Stationen 2–4 sind Platzhalter an vorhandenen Kartenpunkten, bis eigene Räume und Minispiele existieren.

### 2026-11-13 – Galerie, Kameras und sichtbarer Eingang

- **Beteiligte:** Nutzerauftrag und Codex mit eingebauter Bildgenerierung; menschliches Teamreview steht aus.
- **Ziel:** Die Galerie soll dem gemeinsam gewählten Bildkonzept entsprechen, eine erkennbare New Yorker Aussicht und aktive Kameras zeigen und vom Hauptraum aus als zweiter Raum erkennbar sein. Der vorhandene Spielablauf bleibt bestehen.
- **Gestaltung:** `web/assets/gallery-nocturne-nyc.png` wurde aus dem generierten Konzept weiterentwickelt: Nachtgalerie, Gemälde, rotes Sitzmöbel, Tresor rechts, zwei Kameras und Manhattan im Fenster. `web/assets/great-hall-gallery-door.png` ist eine bearbeitete Version des vorhandenen Saalbilds mit offenem, beleuchtetem Galeriebogen rechts. Die gemalten Hintergrundbilder sind fiktive Dekoration; die echten Met-Werke und Met-Daten bleiben im bestehenden Rätsel. Die Bilder wurden mit dem eingebauten Bildwerkzeug erstellt; Ausgangstext: „detailed pixel-art nighttime museum gallery, dark teal walls, gold-framed landscape paintings, parquet, burgundy benches, left passage, vault on right, New York skyline through window, two cameras“; für den Saal: „add an open sandstone archway on the right with a glimpse into the adjoining teal gallery; preserve the hall and skyline“.
- **Umsetzung:** `web/gallery.js` zeichnet das Hintergrundbild, die Figuren, Aufgaben und blinkenden roten Kameralichter; reduzierte Bewegung hält die Lichter an. `web/gallery-layout.js` beschreibt die sichtbaren Wände und Möbel. `web/engine.js` und `web/motion.js` prüfen die Grenzen und übersetzen den Eingang zwischen beiden Raumansichten. Alte Spielstände in neuen Hindernissen werden sicher versetzt; Story-Fortschritt bleibt erhalten. `web/main.js` und `web/style.css` zeigen den neuen Bogen und halten den Raum vollständig im Fenster. Stationen und Tresor behalten ihre ursprünglichen Story-Aktionen. Die Kameras sind nur optisch und haben keine Alarm- oder Erkennungsfunktion.
- **Prüfung:** `node --test` in `web`: 105 Tests bestanden, darunter Bewegungsgrenzen, beide Richtungen durch den Eingang, Bänke, Tresortür, alte Spielstände und Kamerablinken. Im Browser wurden beide Richtungen durch den neuen Eingang und das Öffnen des Landschaftsrätsels geprüft; der Spielstand überstand einen Serverneustart. Die Galerieansicht und der Hauptsaal wurden sichtbar geprüft. Ein kompletter neuer Durchlauf beider Enden und ein Test auf einem echten Mobilgerät stehen aus.
- **Grenzen:** Die Bildgenerierung wurde an das vorhandene Raster angepasst; die Dekoration ist kein exakter Met-Galerieplan. Menschliches Review und ein GitHub-Merge sind erst nach tatsächlicher Ausführung nachzuweisen.

- **Ergänzung auf Nutzerwunsch:** Der Blick durch den linken Galeriebogen zeigt nun die helle Eingangshalle mit Steinbögen und Marmorboden. Das Bild wurde mit dem eingebauten Bildwerkzeug anhand der vorhandenen Halle überarbeitet; Kameras, New Yorker Fenster, Möbel und Raumgrenzen bleiben an ihren bisherigen Positionen.

### 2026-11-13 – Galerieeingang leichter begehbar machen

- **Beteiligte:** Nutzer meldete den Fehler; Codex analysierte und korrigierte ihn. Menschliches Teamreview steht aus.
- **Ursache und Umsetzung:** Der Galerieeingang ließ beim kontinuierlichen Laufen nur eine sehr schmale Position im Saal zu. `web/engine.js` und `web/motion.js` erlauben nun den Zugang über die Breite der sichtbaren Öffnung, einschließlich der Position direkt an der Rückwand. Die Grenze in `web/main.js` wurde an die Öffnung angepasst; die übrigen Wände und die verschlossene Tresortür bleiben gesperrt.
- **Prüfung:** `node --test` in `web`, einschließlich neuer Tests für mehrere Zugangspositionen und eine gesperrte Wandposition. Im Browser wurde aus dem Saal bis an die Rückwand und dann nach rechts in die Galerie gelaufen.

### 2026-11-13 – Raumwechsel an die sichtbaren Türen legen

- **Beteiligte:** Nutzerfeedback; Codex. Menschliches Teamreview steht aus.
- **Problem und Lösung:** Beim Wechsel musste die Figur zuvor über den Rand laufen und kam am Rand der nächsten Szene an. Der Raumwechsel beginnt jetzt im sichtbaren Durchgang; die Figur erscheint im Durchgang des Zielraums. Ein kurzer Übergang blendet zwischen den Ansichten. Der Saalausschnitt zeigt mehr vom Galeriebogen, und die drei Bilder wurden an den veränderten Ausschnitt angepasst.
- **Technik:** `web/gallery-layout.js` enthält die Eintritts- und Austrittspositionen; `web/motion.js` verwendet sie beim Laufen, ohne die Kollision mit dem Wachmann zu überspringen. `web/main.js` steuert den kurzen Übergang. Die übrigen Kollisionen, der Tresor und bestehende Spielstände bleiben erhalten.
- **Prüfung:** Im Browser beide Richtungen durch den Bogen und die Ankunft in der Galerie geprüft; automatisierte Tests prüfen die Positionen an beiden sichtbaren Türen, die freie Galerieankunft, den alten Spielfortschritt sowie Wände und Tresor. Ein vollständiger menschlicher Durchlauf beider Enden steht aus.

### 2026-11-13 – Raumübergang nach Video verbessern

- **Beteiligte:** Nutzerfeedback und Video; Codex. Menschliches Teamreview steht aus.
- **Problem:** Im Video war zu sehen, dass die Figur zwar vor dem Saalbogen stand, aber zur Seite laufen musste und nach dem Übergang sehr nah am Rand des Galeriebogens erschien.
- **Umsetzung:** `web/gallery-layout.js` erkennt nun auch das Hineingehen nach oben in den Saalbogen. Die Ankunftspunkte liegen auf dem Boden vor dem jeweiligen Durchgang, sodass die Figur sichtbar bleibt und ein Richtungswechsel nicht sofort wieder zurückführt. `web/engine.js` hält die Raster-Navigation für die bestehenden Reichweitentests ganzzahlig; die tatsächliche Bewegung verwendet weiterhin genaue Positionen. Die vorhandene Einblendung und Wandkollision bleiben erhalten.
- **Prüfung:** Im Browser wurde der Bogen nach oben betreten und von der Galerie nach links verlassen; die Figur erschien jeweils auf dem Boden. Automatische Tests prüfen beide Richtungen, die Ankunftsposition und eine gesperrte Wandstelle. Ein vollständiger menschlicher Durchlauf steht aus.


### 2026-11-13 – Separater Sicherheitsraum

- **Beteiligte:** Nutzerauftrag, Codex und eingebaute Bildgenerierung. Vor Beginn war der vorherige Stand `84984dc` auf GitHub/main gemergt. Menschliches Teamreview steht aus.
- **Ziel:** Die Sicherheitsübersicht soll in einem eigenen Raum liegen, statt als kleine Monitore und Dienstplan im Galerieboden zu erscheinen.
- **Umsetzung:** Ein beschrifteter Durchgang unten rechts in der Galerie führt in einen eigenen begehbaren Sicherheitsraum mit neun Monitoren. Drei zeigen illustrative Standbild-Vorschauen von Halle, Galerie und Tresor; sechs zeigen „NO SIGNAL“. Es gibt keine Live-Kameraübertragung. Die bisherigen Story-Aktionen für Monitorwand und Dienstplan sowie vorhandene Aktionen für Funkgerät und Schlüsselbrett sind im Raum über `E` erreichbar. Der untere Ausgang führt zurück. Der eigene Raum und die Position werden lokal gespeichert; vorhandene Spielstände bleiben gültig. Dateien: `web/security-room.js`, `web/engine.js`, `web/motion.js`, `web/main.js`, `web/gallery.js`, `web/gallery-layout.js` und `web/style.css`.
- **Gestaltung:** `web/assets/security-office.png` wurde mit dem eingebauten Bildwerkzeug für einen begehbaren nächtlichen Sicherheitsraum mit Monitorwand und Bodenfläche erstellt. `web/assets/gallery-security-door.png` ist eine bearbeitete Version der Galerie mit einem zusätzlichen Sicherheitseingang. Bestehende Kamera-LEDs und Raumgrenzen wurden erhalten.
- **Prüfung:** `node --test` prüft u. a. Ein- und Ausgang, Raumgrenzen, Aktionen, Speicherstände und den alten Story-Code. Im Browser wurden Eingang, Monitorwand-Dialog, lokales Wiederherstellen nach Neuladen und Ausgang geprüft. Ein kompletter neuer Durchlauf beider Enden und ein Test auf einem echten Mobilgerät stehen aus.

### 2026-11-13 – Sicherheitsraum an den Haupteingang versetzen

- **Beteiligte:** Nutzerfeedback und Bildschirmvideo; Codex und eingebaute Bildgenerierung. Menschliches Teamreview steht aus.
- **Problem:** Der zusätzliche Eingang an der Galeriewand lag optisch über dem Boden und die Figur konnte sich mit dem gemalten Bogen überschneiden. Außerdem sollte die Sicherheitszentrale räumlich am Museumseingang liegen.
- **Umsetzung:** Der Zugang ist jetzt ein beschrifteter, bodenbündiger Bogen links in der Eingangshalle. Dort wird der Raum durch Hineingehen nach oben betreten; unten im Sicherheitsraum geht es zurück in den Saal. Die frühere Galerieillustration und ihre Seitenwand samt Pflanzenkollision sind wiederhergestellt. Der Sicherheitsraum zeigt am Ausgang einen Blick auf den Saal. Die neue Saalillustration wird vollständig und ohne verzerrte Streckung gezeigt; die begehbaren Unter- und Seitenränder halten die Figur innerhalb der sichtbaren Begrenzung. Vorhandene Sicherheitsraum-Spielstände und Hinweise bleiben erhalten. `web/assets/great-hall-security-door.png` und `web/assets/security-office-hall-exit.png` wurden anhand der bestehenden Raumillustrationen mit dem eingebauten Bildwerkzeug bearbeitet.
- **Prüfung:** Automatische Tests prüfen die Durchgänge, die Begrenzungen, den Wachmann, die gespeicherte Position und bestehende Story-Aktionen. Im Browser wurden beide Richtungen am neuen Eingang, die sichtbaren Saalränder und der bestehende Weg zur Galerie geprüft. Ein menschlicher Gesamtdurchlauf beider Enden und echter Mobilgerätetest stehen aus.


### 2026-11-13 – Sichtbare Laufbegrenzung in der Eingangshalle entfernen

- **Beteiligte:** Nutzerauftrag und Codex; menschliches Review steht aus.
- **Umsetzung:** `web/main.js` zeichnet die zusätzliche rechteckige Laufmarkierung nicht mehr. Die Bewegungsgrenzen bleiben bestehen, damit die Figur nicht über den Saalrand läuft. Das Bild mit seinem eigenen Marmorboden wird nicht geändert. `web/motion.js` und `web/security-room.test.js` beschreiben diese unsichtbare Grenze entsprechend.
- **Prüfung:** Die vorhandenen Bewegungstests prüfen weiterhin die Seiten und den unteren Rand des Saals sowie die Zugänge zu Galerie und Sicherheitsraum.
