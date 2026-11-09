# Aufgabe: Begehbares Museum Mystery

## Warum?

Der erste Prototyp war ein statisches Bilderrätsel und für die Gruppe zu einfach und langweilig. Das gewünschte Spielgefühl ist eine eigenständige 2D-Draufsicht mit Bewegung durch ein Museum, einer Mystery-Quest und mindestens zwei unterschiedlichen Enden. Harvest Moon und Pokémon dienen nur als Orientierung für Perspektive und Steuerung; wir verwenden keine Grafiken oder Figuren dieser Spiele.

## Kleinster spielbarer Rundgang

Die Spielfigur bewegt sich mit WASD oder Pfeiltasten durch Empfang, Galerie und Restaurierungsraum. `E` untersucht ein Objekt oder spricht mit einer nahen Person. Die Journalanzeige nennt das nächste Ziel. Die Spielerin sammelt drei Belege: ein verdächtiges Besucherprotokoll, eine Beobachtung am ausgetauschten Gemälde und eine Restaurierungsnotiz. Nach dem Protokoll gibt der Wachmann einen Zugangsausweis. Nur mit drei Belegen und Ausweis öffnet sich die Tür zum Depot. Dort wird das Original entdeckt.

Am Ende entscheidet die Spielerin zwischen zwei **verschiedenen, erreichbaren** Ausgängen: Das Original still zurückbringen oder die Fälschung öffentlich aufdecken. Der Abspann nennt die Konsequenz der Wahl. Ein Neustart setzt den Fall zurück. Ein Spielstand wird im Browser gespeichert, damit ein Neuladen nicht alles löscht.

Das ausgestellte Bild und überprüfbare Werkangaben stammen aus der Met Collection API für Objekt 436535, *Wheat Field with Cypresses*. Nur öffentlich freigegebene Bilddaten werden verwendet. Bei Netzfehlern bleibt das Spiel mit einer Textdarstellung spielbar. Die Kunstquelle wird sichtbar genannt.

## Regeln und Grenzen

- Bewegung nur auf begehbaren Feldern; Wände und Depot-Tür blockieren den Weg.
- Interaktion nur mit einem Objekt direkt neben der Spielfigur.
- Belege zählen je nur einmal; der Wachmann gibt den Ausweis nach dem Fund des Protokolls.
- Die Depot-Tür öffnet nur mit drei Belegen und Ausweis.
- Eine Endentscheidung ist erst beim Original im Depot möglich.
- Zwei Enden müssen in einem vollständigen Durchgang auswählbar sein.
- Keine echten Konten, gemeinsamen Online-Spielstände, Gegner, Kämpfe oder weiteren Räume in dieser Aufgabe.

## Fertig, wenn …

- Bewegungs-, Interaktions- und Türregeln automatisiert getestet sind.
- Beide Enden durch Tests erreichbar sind.
- Der Browser das Museum mit Spielfigur, Objekten, Dialog und Journal zeigt.
- Met-Daten geladen werden oder ein verständlicher Offline-Ersatz erscheint.
- Neuladen einen laufenden Fall wiederherstellt und „Neues Spiel“ zurücksetzt.
- Ein Mensch den gesamten Spielweg selbst durchläuft und die Lesbarkeit bewertet.

## Verständnispfad

`web/engine.js` enthält reine Regeln und speicherbaren Zustand. `web/main.js` zeichnet das Museum, verarbeitet Tasten und ruft die Met API ab. `web/index.html` und `web/style.css` sind Aufbau und Gestaltung. `web/engine.test.js` prüft die Regeln mit Node. Dieser Browser-Prototyp ist eine Richtungsänderung; die frühere Streamlit-Version bleibt als Zwischenstand im Repository und ist nicht die neue Startseite.
