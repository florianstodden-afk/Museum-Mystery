# In-game menu: Spielansicht aufräumen

Stand: 17.11.2026. Auftrag von Florian Stodden; Umsetzung mit Codex auf Branch `codex/in-game-menu`. Die Bilddatei `Gemini_Generated_Image_wqqnhqwqqnhqwqqn.jpg` war eine **Gestaltungsreferenz**, kein fertiges Layout. Sie wurde nicht als Spielgrafik kopiert.

## Gewünschter Ablauf

Nach Gast-Einstieg und Home Screen beginnt die Mission mit Ms Nachricht. Während des Spielens sieht man das Museum und oben rechts nur ein Zahnrad. Titel, WASD-Text und die bisherigen Sound-, Music-, Hint- und New-Game-Knöpfe stehen nicht mehr über der Szene. Ein Klick auf das Zahnrad öffnet das In-game-Menü. Dort stehen Sound, Music, Hint, Journal, Resume Game und Exit to Main Menu. Weder eine Steuerungsanleitung noch New Game stehen in diesem Menü. Einen neuen Spielstand startet man weiterhin über den Home Screen mit Bestätigung, falls schon Fortschritt vorhanden ist.

## Welche Datei macht was?

| Datei | Änderung und Grund |
|---|---|
| `web/index.html` | Entfernt die alte Text- und Knopfleiste, setzt den Zahnradknopf vor die Spielszene und enthält das neue Menü als echte HTML-Schaltflächen. Die Schaltflächen behalten ihre IDs; vorhandene Ton- und Storyfunktionen können sie weiter benutzen. |
| `web/style.css` | Zeichnet ein dunkles, halbtransparentes Menü mit Goldrand. Die laufende Museumsszene bleibt dahinter sichtbar. Größe und Abstände passen sich schmalen Bildschirmen an. |
| `web/main.js` | Öffnet und schließt das Menü, hält die Figur währenddessen an, pausiert die Zeichenbewegung und unterbindet Bewegungstasten. Hint und Journal schließen das Menü zuerst. Resume setzt das Spiel fort; Exit öffnet den Home Screen. Das Zahnrad ist während Dialogen und auf den Einstiegsbildschirmen unsichtbar. |

Die Steuerung des Spiels bleibt funktionsfähig. Auf Geräten mit Touch-Eingabe bleiben die tatsächlichen Bewegungsknöpfe erhalten; nur die dauerhafte **Erklärung** der Steuerung in der Spielansicht und im Menü fällt weg. Die Kunstwerkquellen sind weiterhin im Journal aufgeführt.

## So kann die Gruppe es nachvollziehen

1. Spiel öffnen → „Log In“ oder „Sign Up“ → „Continue as guest“ → „Start New Game“ → Ms Nachricht akzeptieren.
2. Prüfen: Im Museum ist nur das Zahnrad zu sehen. Titel, WASD-Hinweis und alte Knopfleiste fehlen.
3. Zahnrad öffnen → Sound und Music umschalten. Die Zustände ändern sich direkt und werden wie bisher lokal gespeichert.
4. Hint öffnen → Hinweisdialog; nach dem Schließen zurück zur Szene. Menü erneut öffnen → Journal → Journal erscheint über der Szene.
5. Zahnrad → Resume Game → weiterlaufen. Zahnrad → Exit to Main Menu → Home Screen mit Resume Game. Ein Neustart bleibt dort möglich.

## Prüfung bei der Umsetzung

- `node --test` im Ordner `web`: 217 bestanden, 0 fehlgeschlagen.
- `node --check main.js` und `git diff --check`: ohne Fehler.
- Lokaler Browser: Gast-Einstieg, Home Screen, Ms Missionsnachricht, Zahnradmenü, Ton- und Musikschalter, Hinweis, Journal, Resume und Exit to Main Menu durchgeklickt. Das Menü zeigte weder Steuerung noch New Game.
- Noch von der Gruppe zu prüfen: vollständiger Spieldurchlauf bis zu beiden Enden und Ansicht auf einem echten Smartphone.
