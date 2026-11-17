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


### 2026-11-13 – Raumnamen in Steinoptik

- **Beteiligte:** Nutzerauftrag und Codex; menschliches Review steht aus.
- **Umsetzung:** Die schwarzen Schilder über den beiden Saalbögen wurden durch helle Sandsteinplatten ersetzt. `web/main.js` zeichnet die Raumnamen mit Schatten- und Lichtkante als eingemeißelte Schrift auf die steinfarbenen, mittig über den Durchgängen angebrachten Platten. Raumzugänge und Bewegung bleiben unverändert.
- **Prüfung:** Die Spielansicht wurde im Browser geprüft; alle 115 vorhandenen automatisierten Tests bestehen.

### 2026-11-13 – Raumschilder in die Architektur einpassen

- **Beteiligte:** Nutzerauftrag und Codex; menschliches Review steht aus.
- **Umsetzung:** Die mittig über den Durchgängen liegenden Schilder verwenden nun eine Steintextur aus dem Saalbild, dezente eingetiefte Kanten und lesbare Schrift. Die auffälligen dunklen Rahmen wurden entfernt.
- **Prüfung:** Die Saalansicht wurde im Browser geprüft; die vorhandenen automatisierten Tests wurden ausgeführt.

### 2026-11-15 – Station I: Porträt-Zeitleiste (Branch `feature/portrait-timeline`)

- **Beteiligte:** Florian Baumgartl (Auftrag, Konzept-Vorgaben), Claude Code (Umsetzung). Qualitätsmaßstab: Leopolds Station L (Branch `feature/renoir-picture-puzzle`, nur gelesen, nicht gemergt).
- **Ziel:** Station I aus dem Team-Konzept bauen: drei echte Porträts der Met vom ältesten zum jüngsten Werk ordnen; bei richtiger Folge drehen sich die Karten um und ergeben das Nachtschichtprotokoll („Leon was elsewhere; booked as patron visit – A. V.“).
- **Entscheidungen:**
  - Drei Dateien wie Station L: `web/minigames/portrait-rules.js` (reine Regeln), `portrait-artwork.js` (Met-API mit Zeitlimit und Prüfung von ID, Gemeinfreiheit, Titel, Künstler und Bild-Host; sonst lokale Kopie), `portrait-timeline.js` (Oberfläche, Vertrag `start(container, caseData, onSolved)`, gibt eine Aufräumfunktion zurück).
  - Richtige Reihenfolge aus dem eingefrorenen Snapshot `objectBeginDate`/`objectEndDate` in `web/story/case-1.js` (Prüfdatum 15.11.2026); bei einem Bereich zählt das Anfangsjahr. Live-Daten laden nur Bilder.
  - Jahreszahlen stehen nicht auf der Karte, nicht im Alt-Text und nicht in der Quellenzeile, nur im aufklappbaren „Catalogue entry“. Die Rückseiten mit den Uhrzeiten existieren erst nach der Lösung im Dokument, damit sie die Reihenfolge nicht verraten.
  - `revealed` im Zustand = Karten, deren Platz ein Hinweis verraten hat (1. Hinweis ältestes, 2. jüngstes Werk). Fehlermeldung nennt nicht, wie viele Karten richtig liegen. Keine Uhr (Konzept: keine Zeitwertung).
  - Eigene CSS-Datei `portrait-timeline.css`, die die Station selbst einbindet, damit keine gemeinsame CSS-Datei geändert werden muss.
  - Bedienung: Klick-Klick tauscht, Ziehen mit der Maus (natives Drag & Drop wie Station L), Tippen-Tippen auf Touch, Tastatur (Enter/Leertaste nehmen/ablegen, Pfeiltasten verschieben).
  - Station D nutzt nun 435882 statt 436121 (Degas gehört zu Station I). Label in der Great Hall: „Portrait timeline · Station I“.
- **Dateien:** neu `web/minigames/portrait-rules.js`, `portrait-artwork.js`, `portrait-timeline.js`, `portrait-timeline.css`, `portrait-timeline.test.js`, `web/assets/met-435876.jpg`, `web/assets/met-435876-source.md`, `met-436121-source.md`, `met-12127-source.md`, `docs/screenshots/station-i-*.png`; geändert `web/story/case-1.js` (Station I/D, Met-Daten), je ein Import und ein Eintrag in `web/main.js` und `web/dev/story-preview.js`, das Label in `web/engine.js`, datenabhängige Tests (`hints.test.js`, `stations.test.js`, `save-and-case.test.js`, `engine.test.js`), README, Minispiel-Vertrag.
- **Prüfungen (tatsächlich ausgeführt):**
  - Met-API für 436121, 12127, 435876, 435882 abgefragt: alle gemeinfrei, Daten 1865 / 1883–84 / 1888–90. Vorhandene `met-436121.jpg` und `met-12127.jpg` sind byte-gleich mit dem aktuellen `primaryImageSmall` (SHA-256 verglichen); `met-435876.jpg` unverändert heruntergeladen.
  - `cd web && node --test`: Ausgangslage 115 bestanden; nach allen Meilensteinen **136 bestanden, 0 fehlgeschlagen** (18 neue Tests für Station I, dazu Daten- und Label-Tests). Hinweis: Regeln und Tests wurden zusammen geschrieben; eine sichtbare Rot-Phase gab es nicht.
  - Hauptspiel im Browser: Figur am Pult in der Great Hall, `E` → Station I → einmal falsch („Not quite …“), ein Hinweis (Degas als „Oldest“ markiert), per Klick-Klick richtig geordnet → Karten drehen sich um, Protokoll erscheint, Journal zeigt I und 12 Punkte (20 − 3 − 5). Seite neu geladen: Stand erhalten. Bei 1440 × 900 passt der Dialog vor und nach der Lösung ohne inneres Scrollen.
  - Vorschau `web/dev/story.html`: Station nur mit Tastatur gelöst (einzelne Tasten; beim ersten Versuch gingen schnell hintereinander gesendete Testtasten verloren). Escape schließt, Fokus auf der Seite.
  - Handy 390 × 844: Karten untereinander, Tippen-Tippen tauscht, kein seitliches Scrollen. Met-API per blockiertem `fetch` simuliert: lokale Kopien + „Using the bundled Met images.“
  - Ganzes Spiel in der Vorschau bis zum Abspann: Zeile „Portrait Hall (I) · 1 mistake(s), 1 hint(s) · 12 / 20“, gesamt 92 / 100. Konsole ohne Fehler.
- **Offene Punkte:** Reduced Motion nur per CSS-Regel umgesetzt, nicht im Browser emuliert. Im Hauptspiel springt der Fokus nach dem Schließen des Dialogs nicht zurück (Fokus-Rückgabe ist in Leopolds noch offenem Branch für `main.js` vorgesehen). Station L (Leopold) ersetzt in seinem Branch das Werk 435882 → beim Merge 435882 in `works` behalten, sonst bricht Station D.

### 2026-11-15 – Schneller laden und aufräumen (Branch `feature/faster-load-and-storage-room`)

- **Beteiligte:** Florian Baumgartl (Auftrag), Claude Code (Umsetzung). Bilder und `main.js` sind Fabians Bereich; Absprache mit Fabian vor dem Merge.
- **Bilder:** Die vier benutzten PNG-Hintergründe wurden als JPG gespeichert (Qualität 88, Galerie 93). Abweichung zum Original pixelweise gemessen: im Schnitt unter 3 von 255, PSNR 34,9–40,6 dB (mit bloßem Auge nicht sichtbar). Sieben nicht mehr benutzte PNGs entfernt (bleiben in der Git-Historie). Start-Download im Browser gemessen: **9,9 MB → 3,0 MB**. `web/assets`: rund 22 MB → 4,8 MB.
- **`main.js`:** Das Journal wird nur noch neu aufgebaut, wenn sich der Story-Zustand ändert (vorher beim Laufen mehrmals pro Sekunde; gemessen: jetzt 1 Neuaufbau beim Annehmen des Auftrags, 0 beim Laufen). Die Abfrage der Met-API beim Start entfällt; das kleine Van-Gogh-Bild im Depot kommt aus der lokalen Kopie. Ungenutzte Variablen entfernt.
- **Verworfen:** Ein per Code gezeichnetes Depot wurde gebaut, passte aber optisch nicht zu den gemalten Räumen und wurde wieder zurückgenommen. Besser: ein gemaltes Depot-Bild im Stil der anderen Räume.
- **Prüfungen:** `cd web && node --test` und `uv run pytest` (Ergebnis siehe Commit); im Browser: Great Hall, Galerie und Sicherheitsraum sehen unverändert aus, Konsole ohne Fehler.

### 2026-11-16 – Klänge für Story-Momente (Branch `feature/sound`)

- **Beteiligte:** Florian Baumgartl (Auftrag), Claude Code (Umsetzung).
- **Umsetzung:** Neue Datei `web/story/sound.js` erzeugt kurze Klänge mit der Web Audio API, ohne Audiodateien: Papier (Auftrag, Notiz), Akkord (neuer Buchstabe, richtige Anklage), Fehlerton, Riegel und Tür (Safe), Glocke (Hinweis), Kartenumdrehen (Station I), je ein Schlussakkord für beide Enden. Drei Teile: `soundFor()` wählt den Klang zu einer Engine-Aktion (falsche Antwort = Zustand geändert, abgelehnte Aktion = gleicher Zustand und still), `recipe()` beschreibt jeden Klang als Liste von Tönen, `createSoundPlayer()` spielt sie leise ab und merkt sich „stumm“ in `localStorage`. Der Story-Host spielt die Klänge in `act()` und beim Hinweis; Stationen können über `caseData.playSound` eigene kleine Klänge auslösen (Station I: Klick, Fehler, Umdrehen). Knopf „🔊 Sound / 🔇 Muted“ in `web/index.html` und der Vorschau.
- **Prüfungen:** `cd web && node --test`: **144 bestanden** (8 neue: Zuordnung, Stille bei abgelehnten Aktionen, Länge/Lautstärke aller Klänge, „stumm“ erzeugt keine Töne, Speichern der Wahl, ohne Web Audio kein Absturz, Host-Ablauf, Station I). Im Browser mitgezählt: Auftrag annehmen → 1 Ton, Hinweis → 2 Töne, stumm → 0 Töne; Konsole ohne Fehler.
- **Grenze:** Ob die Klänge gut klingen, kann nur ein Mensch beurteilen; Lautstärke und Töne stehen in `recipe()` und sind leicht anzupassen. Browser spielen Ton erst nach dem ersten Klick oder Tastendruck.
- **Nachtrag (gleicher Branch): Schritte und Musik.** Schritte beim Laufen, alle 0,36 s, mit eigenem Klang je Boden (Marmor Great Hall, Holz Galerie, Teppich Sicherheitsraum, Stein Depot). Musik: Recherche ergab, dass große Kunstmuseen in den Galerien in der Regel keine Hintergrundmusik spielen; Musik gibt es eher in einzelnen Ausstellungen oder zum Zuschalten (z. B. LACMA). Deshalb ist die Musik eine leise, vom Browser laufend erzeugte Melodie in d-Moll-Pentatonik mit tiefem Grundton, **standardmäßig aus**, mit eigenem Knopf „♪ Music“; die Wahl wird gespeichert. Tests: `node --test` **147 bestanden** (3 neue: Schritt-Klang je Raum, Melodie bleibt in der Tonleiter mit kleinen Schritten, Musik an/aus/gespeichert mit nachgemachtem Timer). Im Browser mitgezählt: Musik an → 2 Noten in 4,5 s, aus → keine Töne mehr. Schritte im Browser nicht prüfbar, weil das App-Fenster ausgeblendet war (keine Animation).
- **Nachtrag: Schritte überarbeitet** (Rückmeldung von Florian: „klingt nicht nach echtem Laufen, zu laut“). Neu: jeder Schritt = tiefes Fersen-Aufsetzen (Sinuston 80–115 Hz, der schnell abfällt) + leises Abrollen der Sohle (tiefes Rauschen); keine hellen Klicks mehr. Jeder Schritt schwankt leicht in Tonhöhe (±6 %) und Lautstärke (±15 %), linker und rechter Fuß klingen etwas verschieden. Schritte laufen über einen eigenen Kanal mit etwa einem Drittel der Lautstärke, Tempo 0,42 s. Tests: **150 bestanden** (3 neue). Im Browser mit echtem Web Audio ohne Fehler erzeugt; Klang muss ein Mensch beurteilen.
- **Nachtrag: Schritte als Absatzschuhe** (Rückmeldung: „soll klingen wie Absätze in einer Halle“). Jeder Schritt ist jetzt ein sehr kurzes, hartes „Klack“ (Hochpass-Rauschen ≈ 12 ms + heller, schnell verklingender Ton um 1,4–1,7 kHz) mit künstlichem Raumhall (`ConvolverNode` mit abklingendem Rauschen als Raumantwort): Great Hall 1,6 s, Depot 0,9 s, Galerie (Holz, tieferes „Tock“) 0,6 s, Sicherheitsraum (Teppich) fast ohne Klack und Hall. Tests: **150 bestanden** (Schritt-Test an die neue Vorgabe angepasst). Im Browser mit echtem Web Audio ohne Fehler erzeugt, inklusive Hall.


## 2026-11-16: Integration Renoir und aktualisiertes main
Porträt-Zeitleiste, Sound und JPG-Hintergründe integriert. Beide Kunstwerke (Station D Cézanne und L Renoir) bleiben erhalten. Punkte werden wieder verdient: Renoir 15/10/5/0 bei <=30/45/60/>60 Sekunden; Gesamtmaximum 95. Kein Referenzbild, Hover-Zoom oder Slot-Markierungen; native Tastaturbedienung. Browser-Playthrough erfolgreich abgeschlossen.

### 2026-11-17 – Statuslichter der Überwachungskameras

- **Auftrag:** Aktive Kameras sollen allgemein durch ein blinkendes rotes Licht erkennbar sein.
- **Umsetzung:** Galerie und Tresorraum nutzen dieselbe Blinklogik; die Kameraansichten auf der Monitorwand verwenden sie ebenfalls. Bei reduzierter Bewegung bleibt das Licht dauerhaft sichtbar. Die Vorgabe für neue Räume ist in der README dokumentiert.
- **Prüfung:** Tresorraum im Browser angesehen; automatisierte Prüfungen für Blinkphasen und reduzierte Bewegung ergänzt.

### 2026-11-17 – Wachmann Leon spricht in einer Sprechblase (Branch `feature/guard-speech-box`)

- **Beteiligte:** Florian Baumgartl (Auftrag `claude-code-guard-dialog-auftrag.md`), Claude Code (Umsetzung). `main.js` ist Fabians Bereich: dort nur Abstandsprüfung, Pausieren von Figur und Leon und Leons Blickrichtung im Gespräch.
- **Ziel:** Gespräch mit Leon startet von selbst in einer RPG-Sprechblase mit zwei Smalltalk-Fragen, deren Antworten zum Spielstand passen und helfen, ohne Lösungen zu verraten.
- **Entscheidungen:** Text (`dialogues.js`), Zeitpunkt (`proximity.js`) und Anzeige (`speech-box.js`) sind getrennt, damit Text und Zeitpunkt ohne Browser testbar sind. Lange Antworten sind auf mehrere Boxen verteilt (höchstens zwei Sätze je Box). Frage 2 nennt immer die erste offene Station in Reihenfolge B-I-L-D. Leon erwähnt nie Safe, Code, Jahreszahl oder Voss vor der Anklage. Das Gespräch ändert den Spielstand nicht. Andere Figuren nutzen weiter das große Fenster.
- **Dateien:** neu `web/story/speech-box.js`, `web/story/proximity.js`, `docs/story/speech-box.md`, Tests `conversation`, `proximity`, `speech-box`; geändert `dialogues.js`, `host.js`, `story.css`, `main.js`, `index.html` (nur Cache-Version), `tests/fake-dom.js` (`classList`).
- **Prüfungen:** `cd web && node --test`: **197 bestanden** (vorher 178; 19 neue). Im Browser (App-Fenster ausgeblendet, deshalb Animation per Timer angetrieben): zu Leon gelaufen → Box öffnet sich selbst; Frage 1 per Taste `1` mit Schreibmaschine, Leertaste, vier Boxen, zurück zu den Knöpfen; Frage 2 per Pfeil + Enter und per Mausklick; „Goodbye“ → „Mind the cameras.“ → geschlossen; in der Nähe bleibt sie zu; nach Weglaufen und 8 s öffnet sie wieder. Handy 390×844: Box passt ohne Scrollen, Figur sichtbar. Konsole ohne Fehler. Screenshots `docs/screenshots/guard-speech-*.png`.
- **Nicht geprüft:** Box oben bei tief stehender Figur nur im Unit-Test (Leon läuft zufällig, die Stelle war im Browser schwer zu treffen).
- **Nachtrag (Rückmeldung von Florian: „bei allen, öffnen in der Nähe, zu beim Weggehen, ohne E“):** Gilt jetzt für Leon, Imani und Dr. Vale (es gibt nur einen Wächter). Box öffnet unter 1,2 und schließt über 1,8 Schritten; die Figur darf während des Gesprächs laufen; Wartezeit von 8 s entfernt; kein „E“-Schild und keine `E`-Aktion mehr bei Personen. Fund im Browser: In der Great Hall ist ein Feld nach unten nur 14 px hoch, nach rechts aber 100 px; deshalb wird der Abstand jetzt auf dem Bildschirm gemessen. Tests: `node --test` **198 bestanden**. Browser: zu Leon gegangen → Box auf, 3 s stehen → bleibt offen, weggehen → nach 10 kurzen Schritten zu. Imani/Vale nur über Unit-Test geprüft (Weg in die Galerie im automatischen Test nicht gefunden).
- **Nachtrag:** Auf Wunsch näher heran: öffnet jetzt unter 0,8 statt 1,2 Schritten, schließt über 1,3 statt 1,8. Tests: 198 bestanden.

### 2026-11-17 – Station I als Speedrun (Branch `feature/portrait-speedrun`)

- **Anlass:** Feedback des Professors zu allen Minispielen: muss in den Rahmen passen (kein Scrollen), schneller zu verstehen (weniger Text), schneller zu spielen (Speedrun mit sichtbarem Timer). Auftrag `claude-code-station-I-speedrun-auftrag.md`.
- **Umsetzung:** Neue Mechanik „Catalogue Flash“: „Start“ startet die Uhr und zeigt 3 s alle Daten; danach sortieren (Klick-Klick, Ziehen, Tasten 1/2/3, Enter prüft). „Peek“ zeigt ein Datum 1,5 s für +5 s, falsches Prüfen +5 s. Neuöffnen gibt keinen zweiten Flash. Nach dem Lösen drehen sich die Karten (600 ms) mit je einer kurzen Logzeile, Ergebnis „Solved in 0:08 · +15“, ein Knopf „Continue“. Bestzeit in eigenem Speicherschlüssel. Klänge über `sound.js` (Start, Klick, Fehler, Peek, Umdrehen).
- **Punkte:** `portraitSpeedPoints` 15/10/5/0 bei ≤ 20/35/50 s. **Gesamtmaximum sinkt von 95 auf 90** (Station I max 15 statt 20, wie L). Alte Spielstände ohne Zeit: 5 Punkte. Abspann zeigt „Portrait timeline time 0:22“.
- **Entscheidungen:** Station-I-Regeln bleiben DOM-frei (`portrait-rules.js`), die Ansicht ist in `portrait-view.js` ausgelagert. Der Host-Knopf „Back to the museum“ und die Host-Notiz werden nur für Station I per CSS ausgeblendet; „Continue“ drückt den Host-Knopf. So bleibt `host.js` unverändert. Die Engine ruft `synchronizeScore` ohne Fortschritt auf; Station-I-Zeitpunkte werden nur gesetzt, wenn der Host den Fortschritt mitgibt.
- **Messwerte (Story-Vorschau, `scrollHeight`/`clientHeight` des Dialogs):** vorher 1280×720 **716/686 (Scrollen)**, 1440×900 716/716; nachher 1280×720 539/539 (Start, nach Fehler, gelöst), 1440×900 562/562, 390×844 549/549 bzw. 574/574 (gelöst). Sichtbare Wörter im Startzustand (ohne Künstler/Titel): **vorher 158, nachher 15**.
- **Tempo:** Durchlauf im Browser per Skript (Start, Daten lesen, ein absichtlich falscher Check, 1–2 Tausch, Enter): **0:08 auf der Uhr inklusive 5 s Strafe**, also rund 3 s ohne Fehler.
- **Tests:** `cd web && node --test`: **206 bestanden** (vorher 198). Angepasst mit Begründung: Punktetests (Station I max 15, Summe 90), alte UI-Tests ersetzt (Hinweis-Knopf und Katalog-Einträge gibt es nicht mehr).
- **Nicht geprüft / offen:** Das Playwright-Skript `web/dev/e2e-station-i.mjs` ist geschrieben, aber nicht ausgeführt (Playwright und Node sind auf diesem Rechner nicht installiert); dieselben Schritte liefen per Skript im eingebauten Browser. Dialog im Hauptspiel nicht direkt gemessen (Spielschleife im ausgeblendeten Browserfenster angehalten); Platz dort 688 px, Station braucht 539 px. Keine Hervorhebung des Belegs im Journal (würde `journal.js` ändern, außerhalb des Auftrags). Barrierefreiheit von Hand geprüft (Rollen `timer`/`status`, `aria-live`, Labels an Karten, Peek und Links, sichtbarer Fokus, dunkle Schrift auf Gold); kein Lighthouse/axe-Lauf.
- **Nachtrag (Rückmeldung von Florian):** Sprechblase öffnet wieder etwas früher (unter 1,0 statt 0,8 Schritten, schließt über 1,5). Station I: Lag ein alter Spielstand schon in der richtigen Reihenfolge, mischt „Start“ die Karten neu. Tests: 207 bestanden.

### 2026-11-17 – Galeriegrenzen und Tresortür

- **Auftrag:** Die im Video gezeigten Galeriegrenzen verbessern und die unterschiedlichen Positionen der geschlossenen und geöffneten Tresortür berücksichtigen. Figuren dürfen hinter Pflanzen und Möbeln teilweise verdeckt sein.
- **Umsetzung:** Die Türgrenze folgt nun abhängig vom Türzustand dem geschlossenen Türblatt beziehungsweise dem in den Raum geschwenkten Türblatt. Der Abstand zur Rückwand wurde angepasst; Pflanzenbasen bleiben Hindernisse und die Blätter werden bei Figuren dahinter im Vordergrund gezeichnet.
- **Prüfung:** Geschlossene Tür und Durchgang zum geöffneten Tresor im Browser geprüft; 209 Node-Tests bestanden, darunter Türzustände, Durchgänge und Pflanzen-Vordergrund.

### 2026-11-17 – Renoir-Bilderpuzzle: Bedienung und Anzeige

- **Start und Hilfe:** Reduzierter Startbildschirm mit Hilfe-Popup. Tastenkürzel für Enter und Esc werden als Tasten angezeigt. Der goldene Fokusrahmen entspricht den übrigen Spiel-Dialogen.
- **Ablage und Bedienung:** Acht feste Ablageplätze stehen im 4×2-Raster neben dem Bild. Teile lassen sich per Tastatur oder Drag-and-drop zurücklegen. Der animierte Mauszeiger führt von einem Teil in der Ablage zu einem leeren Platz im Bildrahmen.
- **Zeit und Abschluss:** Der Zeitbalken zeigt die Punkte bei 30, 45 und 60 Sekunden. Danach läuft er bis 70 Sekunden aus und zeigt +0 Punkte ohne zusätzliche Zeitmarke. Nach dem Lösen leuchtet der Rahmen, und das Abschlussfenster zeigt den Journalbuchstaben L und die verdienten Punkte.
- **Prüfung:** Auf Basis von `main` (`2aff91c`) bestanden alle 214 JavaScript-Tests.

### 2026-11-17 – Pflanzenumriss und Weg zum Tresor

- **Auftrag:** Pflanzenumrisse genauer zeichnen und die unsichtbare Sperre zwischen rechter Pflanze und Tresor entfernen.
- **Umsetzung:** Die Pflanzen im Vordergrund werden entlang eines nachgezeichneten Umrisses ausgeschnitten. Für die kontinuierliche Bewegung prüft die Galerie die sichtbare Bodenform und Hindernisse statt zusätzlicher gerundeter Rastergrenzen; der offene Tresor ist auch von rechts vorne erreichbar.
- **Prüfung:** Den Weg von der rechten Pflanze zur Tür und anschließend in den geöffneten Tresor im Browser geprüft; alle 216 Node-Tests bestehen.

### 2026-11-17 - Home Screen und zwei klare Endansichten (Branch `codex/home-and-end-screen`)

- **Ausgangslage:** Nach Rückmeldung des Professors wird das bestehende Spiel fertiggestellt. Auf `main` waren Leon mit zwei Fragen (PR #13), Station I als Speedrun (PR #14), das Renoir-Interface (PR #15) und mehrere Korrekturen der Galerieränder bereits vorhanden. Ein Home Screen fehlte. Zwei Enden waren spielbar, ihre Texte und Auswahl passten noch nicht zur neuen Teamformulierung.
- **Umsetzung mit KI-Unterstützung:** Ein Home Screen vor dem Spiel bietet Start/Fortsetzen, bestätigten Neustart sowie gespeicherte Schalter für Sounds und Musik. Das Spiel beginnt erst nach dem Start-Klick; die Welt pausiert im Menü. Die bestehenden Endzustände `heist` und `open-file` bleiben gespeichert, werden aber als „Steal the artwork / I am a thief“ und „Quit the mission / I am not a thief“ gezeigt. Der Endbildschirm zeigt Kunstwerk, kurze Folge und Punkte; Beweiskette und Punktdetails sind ausklappbar. Vom Ende führt ein Knopf zurück zum Home Screen. Betroffen sind `web/index.html`, `web/main.js`, `web/style.css`, `web/story/endings.js`, `web/story/host.js` und `web/story/story.css`.
- **Prüfung:** `node --test` im Ordner `web`: 217 bestanden, 0 fehlgeschlagen. Die Tests für Endtexte und Endauswahl wurden passend zur neuen Entscheidung aktualisiert. Eine Browser-Vorschau konnte in dieser Sitzung nicht geöffnet werden; deshalb ist der visuelle Durchlauf vor dem Merge noch offen.
- **Offen:** Ein „Speedrun“-Ende als eigener Spielmodus ist damit nicht gebaut; das Stehlen bleibt die vorhandene Endentscheidung nach dem Fall. Login und Online-Leaderboard sind ebenfalls nicht Teil dieses Branches. Ein anderes Teammitglied soll Menü, Fortsetzen, Neustart und beide Enden im Browser prüfen und den Code erklären.

### 2026-11-17 - Home Screen nach Bildvorlage

- **Vorlage:** Florian Stodden stellte `Gemini_Generated_Image_lnvg82lnvg82lnvg - Copy.jpg` als gewünschte Home-Screen-Ansicht bereit. Die Datei wurde als `web/assets/home-screen-reference.jpg` ins Projekt kopiert; die Illustration enthält Titel und Schaltflächen bereits im Bild. Die gezeichneten Werke sind Dekoration; untersuchte Kunstwerke im Spiel bleiben echte Met-Bilder.
- **Umsetzung:** Über den vier gezeichneten Schaltflächen liegen echte HTML-Buttons mit Tastaturfokus. „Resume Game“ ist ohne gespeicherten Fall deaktiviert; „Start New Game“ startet dann direkt und fragt bei vorhandenem Fortschritt vor dem Zurücksetzen. Settings schaltet die vorhandenen gespeicherten Sounds und Musik. Scoreboard zeigt ausdrücklich nur den Spielstand dieses Geräts; ein gemeinsames Online-Leaderboard mit Login existiert noch nicht. Auf schmalen Bildschirmen werden lesbare echte Schaltflächen vor dem Bild gezeigt.
- **Prüfung:** 217 Node-Tests bestanden; `node --check web/main.js` und `git diff --check` ohne Fehler. Die Desktop-Ansicht wurde im lokalen Chrome visuell mit der Vorlage verglichen. Das Klicken durch die Menüs konnte über die Browsersteuerung nicht verlässlich geprüft werden und bleibt Teil des Team-Reviews vor dem Merge.

### 2026-11-17 - Login-Idee pausiert; öffentliches Spiel bleibt ohne Anmeldung

- **Ablauf:** Florian wünschte zunächst einen Login mit Benutzername und Passwort vor dem Home Screen. Auf dem separaten Branch `codex/login-signup` entstand dafür eine Oberfläche nach seiner Bildvorlage; ein echter Kontodienst war noch nicht verbunden. Nach der Frage, ob Passwörter im GitHub-Projekt liegen könnten, wurde erklärt und dokumentiert, dass das öffentliche Repository und GitHub Pages dafür keinen vertraulichen Anmeldeserver bieten. Florian wählte kurz GitHub-Anmeldung, wollte dann ausdrücklich **kein Clerk** und entschied schließlich: **vorerst ohne Login**.
- **Aktuelle Entscheidung:** Der Entwurfs-Branch wird nicht nach `main` gemergt. Das öffentliche Spiel bleibt direkt über den Home Screen zugänglich. Es gibt weder Spielerkonten noch ein gemeinsames Online-Leaderboard; der Scoreboard-Knopf zeigt nur lokale Ergebnisse.
- **GitHub-Stand:** `codex/login-signup` bleibt als getrennte, pausierte Entwurfshistorie auf GitHub. Dieser Dokumentations-Eintrag beschreibt die aktuelle Entscheidung in `main`. Es wurden keine Clerk- oder GitHub-OAuth-App und keine Spielerkonten angelegt. Die bisherige Spielimplementierung wird durch diesen Eintrag nicht geändert.
- **Quelle für die technische Entscheidung:** [GitHub Pages ist statisches Hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages); [Passwörter im Repository können in der Git-Historie verbleiben](https://docs.github.com/en/code-security/concepts/secret-security/secret-leakage-risks).

### 2026-11-17 – Station I im Look & Feel von Station L (Branch `feature/station-i-look-like-l`)

- **Auftrag:** `claude-code-station-I-wie-L-auftrag.md`. Station I soll sich wie Leopolds Station L anfühlen; die Mechanik „Catalogue Flash“ bleibt.
- **Umsetzung:** Neue gemeinsame Bausteine `web/minigames/station-ui.js` (`introPopup`, `speedBar`, `showPopup`, `successPopup`, `creditLine`, `shortcutButton`) mit L’s CSS-Klassen. Die Wurzel von Station I trägt zusätzlich die Klasse `picture-puzzle`, damit L’s vorhandene Regeln greifen; nur drei Zusatzregeln in `station-ui.css` (eigene Strichmarken der Punkte-Leiste). `picture-puzzle.js` und L’s CSS sind unverändert.
- **Ablauf wie L:** Intro (Aufgabe, goldene Zeile „Points are given based on speed“, runder „?“) → „Start ↵“ → Flash 3 s → Sortieren mit Punkte-Leiste +15/+10/+5/+0 bei 0/20/35/50 s → Erfolgs-Popup mit Buchstabe I „added to journal“ und „+X points earned“ → „Return to museum ↵ Esc“. Esc geht jederzeit zurück ins Museum. Strafen (+5 s) und `portraitSpeedPoints` unverändert.
- **Karten:** drei gleich große Karten im 3-px-Goldrahmen wie das L-Brett, Bild mit `object-fit: cover`; die schwarzen Ränder der Met-Fotos werden durch leichtes Vergrößern abgeschnitten, bei Degas bleibt das Gesicht rechts im Bild. Zieh-Pfeil wie L (`puzzle-drag-demo`): nach dem Flash einmal von der letzten Karte zu Platz 1, verschwindet beim ersten Klick/Ziehen, kommt beim Neuöffnen nicht wieder; bei reduzierter Bewegung kurz ohne Animation.
- **Entscheidung:** Die Credit-Zeile von I zeigt keine Jahreszahlen (anders als L), weil die Jahre die Lösung sind. Der Pfeil startet an der letzten statt an der ersten Karte, weil die erste Karte schon auf Platz 1 liegt.
- **Messwerte (Story-Vorschau, Inhalt/Platz des Dialogs):** 1280×720 Intro 207/207, Spiel 677/677, gelöst 640/640; 1440×900 Intro 207/207, Spiel 745/745, gelöst 707/707 (vor der letzten Kartenverkleinerung gemessen); 390×844 Intro 221/221, Spiel 686/686, gelöst 653/653. Sichtbare Wörter: Intro 15, Spiel 21–25.
- **Tests:** `cd web && node --test`: **226 bestanden** (6 neue in `station-ui.test.js`, UI-Tests von Station I auf den neuen Ablauf umgeschrieben).
- **Vergleich:** `web/dev/station-compare.html` zeigt L und I nebeneinander im Spieldialog; Bilder in `web/dev/shots/` (Übersicht `index.html`), aufgenommen im eingebauten Browser statt mit Playwright.
- **Offen:** Playwright ist auf diesem Rechner nicht installiert; `web/dev/e2e-station-i.mjs` ist auf den neuen Ablauf angepasst, aber nicht ausgeführt. Hauptspiel-Dialog nicht direkt gemessen.

### 2026-11-17 - Gast-Einstieg als Vorbereitung auf späteren Login

- **Auftrag:** Florian möchte bereits jetzt die Bildvorlage als ersten Bildschirm, dann einen Klick durch eine vorläufige Anmeldeansicht zum Home Screen und erst danach ins Spiel mit Ms Missionsnachricht. Die echte Anmeldung soll später entstehen; er möchte einen fertigen Pull Request zum Mergen.
- **Umsetzung mit KI-Unterstützung:** Die bereitgestellte Bilddatei `Gemini_Generated_Image_keehk8keehk8keeh.jpg` wurde als `web/assets/login-screen-reference.jpg` eingebunden. „Log In“ und „Sign Up“ sind echte Tastatur- und Mausknöpfe über dem Bild und öffnen getrennte Gast-Ansichten. Diese erklären, dass Konten noch nicht verfügbar sind. **Continue as guest** öffnet den bestehenden Home Screen; dort startet das Spiel wie bisher. Kein Konto, Passwort oder Online-Dienst wurde hinzugefügt. Details: `docs/guest-entry-flow.md`.
- **Prüfung:** 217 Node-Tests bestanden, Syntax und Diff ohne Fehler. Im lokalen Browser beide Einstiege, Back, Übergang zum Home Screen und **Start New Game → Ms Nachricht** geprüft. Erste Ansicht und Sign-Up-Ansicht visuell geprüft.
- **Offen:** Nach dem Merge die öffentliche GitHub-Pages-Seite einmal vollständig durchklicken. Eine echte Anmeldung und gemeinsame Bestenliste bleiben spätere Entscheidungen.

### 2026-11-17 - Ruhige Spielansicht mit Zahnrad-Menü

- **Beteiligte:** Florian Stodden (Auftrag und Bildreferenz), Codex (Umsetzung), Branch `codex/in-game-menu`.
- **Ausgangslage:** Auf `main` war der Gast-Einstieg aus PR #17 bereits vorhanden. Während des Spiels waren Titel, Steuerungshinweis und mehrere Aktionen dauerhaft über dem Museum eingeblendet.
- **Entscheidung:** Die Szene zeigt nur ein Zahnrad. Sound, Music, Hint, Journal, Resume Game und Exit to Main Menu stehen im neuen Menü. Die Steuerungsanleitung und New Game sind dort bewusst nicht enthalten; ein Neustart bleibt auf dem Home Screen. Die tatsächlichen Touchknöpfe bleiben für Handys. Die Bilddatei `Gemini_Generated_Image_wqqnhqwqqnhqwqqn.jpg` diente nur als Vorlage.
- **Umsetzung:** `web/index.html` enthält den Zahnradknopf und das Menü, `web/style.css` gestaltet beides, `web/main.js` steuert Öffnen, Schließen, Pause, Tastaturfokus und Übergänge. [Details und Klickfolge](in-game-menu.md).
- **Prüfung:** 217 Node-Tests bestanden. Im lokalen Browser wurden Gast-Einstieg, Missionsstart, Zahnrad, Sound/Music, Hint, Journal, Resume und Exit zum Home Screen durchgeklickt. Syntax- und Diff-Prüfung ohne Fehler.
- **Offen:** Merge durch die Gruppe; anschließend öffentliche GitHub-Pages-Version und echtes Smartphone prüfen. Eine vollständige Runde bis zu beiden Enden wurde für diese Oberflächenänderung nicht erneut gespielt.
- **Nachtrag (Rückmeldung von Florian):** Lesephase von 3 auf 8 Sekunden verlängert, damit man auch die Aufgabe lesen kann. Die Uhr läuft dabei weiter. Tests: 226 bestanden.
