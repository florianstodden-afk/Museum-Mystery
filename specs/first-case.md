# Aufgabe 1: Ein vollständiger lokaler Museum-Mystery-Fall

## Warum?

Wir brauchen einen kleinen, durchspielbaren Fall, dessen Regeln jedes Teammitglied erklären kann. Kunstwerke und Bilder sollen aus der Met Collection API kommen; der Spielstand soll einen App-Neustart überstehen.

## Was?

Sechs vorab geprüfte Met-Objekt-IDs: 436535 (Ziel), 437133, 436121, 12127, 10393 und 435876. Alle wurden am 09.11.2026 mit öffentlichem Bild, Künstler, Datum und Medium überprüft. Das Ziel ist *Wheat Field with Cypresses* (1889) von Vincent van Gogh. Bilder und Metadaten werden beim Start über den Objekt-Endpunkt abgefragt und für 24 Stunden im laufenden Streamlit-Prozess zwischengespeichert.

Ein kostenloser Hinweis beschreibt das Werk als Landschaft. Drei weitere Hinweise kosten je 15 von anfänglich 100 Punkten. Ein erster falscher Tipp kostet 25 Punkte und schließt das gewählte Werk aus. Ein zweiter falscher Tipp beendet den Fall; ein richtiger Tipp gewinnt. Ein ungültiger oder wiederholter Tipp sowie Aktionen nach Spielende werden abgelehnt. Der lokale Versuch wird in SQLite gespeichert. Nach Ende darf man einen neuen Übungsversuch beginnen.

## Außerhalb dieser Aufgabe

Echte Benutzerkonten, gewertete Versuche, Bestenliste, mehrere Fälle, Hosting und Live-Multiplayer. Die lokale Datenbank ist ein Demo-Spielstand für **einen** Rechner und keine geteilte Online-Datenbank.

## Fertig, wenn …

- `uv run pytest` die Regeln und einen erneuten Datenbankzugriff prüft.
- Die App sechs echte Met-Bilder mit Quellenlink zeigt und bei API-Ausfall eine verständliche Fehlermeldung liefert.
- Richtiges Raten gewinnt; erster Fehlversuch zieht 25 Punkte ab; zweiter Fehlversuch verliert.
- Bezahlte Hinweise kosten je 15 Punkte und enden nach drei Käufen.
- Ein abgeschlossener Versuch lässt keine weiteren Tipps oder Käufe zu.
- Nach Beenden und Neustarten der App ist der lokale Spielstand noch da; nach „Neuen Übungsversuch starten“ ist er zurückgesetzt.

## Verständnispfad

`app.py` zeigt Werke und Buttons; `game.py` berechnet ausschließlich gültige Zustandsänderungen; `storage.py` speichert und lädt den Zustand in SQLite. `tests/` prüft Regeln und Speicherung. Die Met API liefert Bild und sachliche Werkinformationen. Die Ziel-ID und Hinweise sind kuratiert, damit die Lösung geprüft werden kann.
