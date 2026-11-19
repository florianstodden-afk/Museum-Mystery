# Feinschliff des bestehenden Spiels · 19.11.2026

Auftrag von Florian Stodden: Die vorhandenen Teile verbessern, ohne neue Story oder weitere Minispiele. Die Handyansicht ist ausdrücklich **später** dran.

## Was geändert wurde

| Bereich | Vorher | Jetzt |
| --- | --- | --- |
| Station B / Met | Das zweite Werk erschien nur, wenn die Live-API sein Bild lieferte. Bei einem Fehler fehlte es. | Beide echten Met-Werke liegen als öffentliche Kunstbilder im Projekt. Die API prüft weiterhin die Katalogdaten live. Bei Ausfall stehen Bild und gespeicherte Fakten bereit; ein kurzer Status nennt die Quelle. Die feste Lösung bleibt für alle gleich. |
| Erklärungen | Die Zeitwertung war teils nur allgemein beschrieben. | Die Startansichten von I, L und D nennen ihre jeweiligen Zeitgrenzen und Punkte. B nennt die Abzüge für falsche Antworten und Hinweise. Die ausführliche Hilfe von I verwendet dieselben Grenzwerte wie die Wertungsfunktion. |
| Interaktion am Safe | Wenn ein anderer Gegenstand nahe an der geschlossenen Safetür lag, konnte der E-Hinweis dessen Namen zeigen, obwohl E den Safe öffnet. | Der sichtbare Hinweis nennt „Enter vault code“, wenn die verschlossene Tür Vorrang hat. Nach dem Öffnen bleibt E für nahe Objekte frei; durch die Tür geht man weiterhin zu Fuß. |
| Scoreboard | Alte Bestwerte mit 90 möglichen Punkten standen neben neuen mit 85, ohne Erklärung; ein direkter Zahlenvergleich benachteiligte die alte oder neue Skala. | Alte Werte sind als frühere Wertung gekennzeichnet. Für den Vergleich zählt der Anteil der erreichbaren Punkte; bei Gleichstand entscheidet die Zeit. Eine kurze Zeile erklärt die Punktquellen. |
| Endbilder | Die beiden großen PNG-Hintergründe luden zusammen rund 3,8 MB. | Die textfreien Hintergründe liegen als JPG vor und laden zusammen rund 0,46 MB. Die sichtbaren Storytexte bleiben echtes HTML. |

## Wo das im Code passiert

- `web/minigames/landscape.js`: Station B, lokale Bilder und Live-Katalogdaten. `web/assets/met-459193-source.md` dokumentiert das neue Met-Bild.
- `web/minigames/portrait-timeline.js`, `picture-puzzle.js`, `spot-the-forgery.js`, `station-ui.js`: Hinweise der vier bestehenden Rätsel.
- `web/gallery.js` und `web/main.js`: E-Hinweis und Interaktionsvorrang an der Safetür.
- `web/story/scoring.js` und `scoreboard-view.js`: Bestwertvergleich und Anzeige.
- `web/story/story.css`, `web/assets/ending-*.jpg`: Abschlussbilder. `web/index.html` lädt aktualisierte CSS- und Spielversionen.

## Kontrolle

- `cd web && node --test`: **279 bestanden, 0 fehlgeschlagen** (einschließlich der bereits vorbereiteten Änderung an Leon und Imani).
- Im lokalen Browser wurden M's Nachricht, B, I, L und D, das Codewort BILD, die Beweisfrage und beide möglichen Enden durchgespielt. Die beiden Ending-Hintergründe wurden geladen. Für das zweite Ende wurde der gespeicherte Zustand direkt vor der Entscheidung erneut geöffnet.
- `git diff --check`: keine Formatfehler.

## Später

- Handyansicht auf schmalen Bildschirmen prüfen und bei Bedarf verbessern. Sie gehörte ausdrücklich nicht zu diesem Arbeitspaket.
