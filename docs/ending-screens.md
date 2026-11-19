# Die beiden Ending Screens

**Stand: 19.11.2026, Branch `codex/ending-screen-art`.** Die Änderung gilt im öffentlichen Spiel erst nach dem Merge des Pull Requests und der Veröffentlichung durch GitHub Pages.

## Weg zum Ende

1. M verlangt zu Beginn das Van-Gogh-Gemälde *Wheat Field with Cypresses* aus dem Museum.
2. Vier Stationen liefern die Buchstaben B–I–L–D. Mit dem Codewort öffnet der Spieler den Safe.
3. Die Beweise zeigen, dass Voss die Fälschung und den Transport geplant hat. Nach der richtigen Antwort entscheidet der Spieler selbst.
4. **Steal the artwork:** Der Spieler gibt das Original an Voss. Die Fälschung bleibt an der Wand. Der nächtliche Ending Screen zeigt „I am a thief“.
5. **Quit the mission:** Der Spieler gibt das Original an Dr. Vale zurück. Die Beweise entlarven Voss. Der Ending Screen mit Morgenlicht zeigt „I am not a thief“.

Die Entscheidung, Punkteberechnung, Beweiskette, Speicherung und Knöpfe für Home oder ein neues Spiel bleiben in der bestehenden Story-Logik. Ein gespeicherter abgeschlossener Fall öffnet beim Fortsetzen wieder sein gewähltes Ende.

## Warum die Bilder angepasst wurden

Florian Stodden ließ zwei Abschlussbilder erstellen. Der Satz „The mystery remains“ auf dem ursprünglichen Nicht-Dieb-Bild widersprach der bestehenden Auflösung: Voss ist zu diesem Zeitpunkt bereits entlarvt. Deshalb wurden von beiden Bildern textfreie Varianten erstellt. Ihre Museumsszenen und ornamentalen Tafeln blieben erhalten; Titel und kurze, zur Entscheidung passende Folgen stehen nun als echte HTML-Texte darüber. Damit bleiben Text und Vorlesbarkeit unabhängig vom Bild.

Die Bilder liegen als `web/assets/ending-thief-background.jpg` und `web/assets/ending-not-thief-background.jpg` im Repository. Sie zeigen **kein erfundenes Van-Gogh-Motiv**. Auf beiden Ending Screens erscheint das echte Met-Werk als kleine Bildkarte mit Quellenlink. Die Beweise und die genaue Punkteverteilung sind über **View evidence and score details** erreichbar.

## Technische Stellen

| Datei | Aufgabe |
| --- | --- |
| `web/story/endings.js` | Ordnet jedem gewählten Ende die passende Geschichte zu und setzt Bildkarte, Punkte und Knöpfe zusammen. |
| `web/story/story.css` | Zeigt je nach Ende den passenden Hintergrund und ordnet die Spieltexte darüber an. |
| `web/index.html` | Lädt die neue CSS-Version, damit GitHub Pages keinen alten Stil aus dem Browsercache zeigt. |
| `web/story/tests/content.test.js` | Prüft den Bezug zu Voss und Dr. Vale sowie das echte Met-Bild im Ergebnis. |

## Prüfung

- Beide Ending Screens im lokalen Browser bei 1280 × 720 angesehen; Text, Met-Werk, Punkte und Knöpfe waren sichtbar.
- Die ausklappbare Beweis- und Punkteansicht im Browser geöffnet und geprüft.
- `cd web && node --test`: 276 Tests bestanden. `git diff --check`: ohne Fehler.
- Eine echte Handyansicht und der vollständige Spieldurchlauf sollten nach dem Merge noch geprüft werden.
