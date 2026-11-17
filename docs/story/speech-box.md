# Sprechblase (Speech Box)

Alle Figuren (Leon, Imani, Dr. Vale) sprechen in einer kleinen Sprechblase unten im Spielfeld, wie in klassischen Konsolen-RPGs. Die Welt bleibt dahinter sichtbar. Vorlage: `docs/screenshots/guard-speech-mockup.png`.

## Drei Teile, drei Dateien

| Datei | Aufgabe | DOM? |
|---|---|---|
| `web/story/dialogues.js` → `conversationFor(id, state)` | **Was** gesagt wird: Begrüßung, zwei Fragen mit Antworten, Verabschiedung. Hängt vom Spielstand ab. | nein |
| `web/story/proximity.js` → `shouldOpenTalk(...)` | **Wann** das Gespräch von selbst startet und wieder endet. | nein |
| `web/story/speech-box.js` → `createSpeechBox(parent, ...)` | **Wie** es aussieht: Namensschild, Textbox, Schreibmaschinen-Effekt, Knöpfe, Tasten. | ja |

Dazu: Styles mit Präfix `speech-` in `web/story/story.css`, Anschluss in `web/story/host.js` (`talkTo` nutzt die Box, wenn es ein Gespräch gibt) und in `web/main.js` (Abstandsprüfung im Spiel-Loop, Figur und Leon pausieren).

## Ablauf

1. Jedes Bild prüft `main.js` (`checkAutoTalk`): Wie weit ist die Spielfigur von jeder Person im selben Raum entfernt? Gemessen wird auf dem Bildschirm (100 Pixel = 1 Schritt), weil der Boden perspektivisch gezeichnet ist und ein Feld nach unten viel kürzer aussieht als ein Feld nach rechts.
2. Unter **0,8 Schritten** öffnet sich die Box von selbst (`shouldOpenTalk`). Ein `E` ist dafür nicht nötig, und über Personen steht kein „E“ mehr.
3. Über **1,3 Schritten** schließt sie sich wieder (`shouldCloseTalk`). Man darf also einfach weggehen. Die Lücke zwischen 0,8 und 1,3 verhindert Flackern am Rand.
4. Nach „Goodbye“ oder `Escape` öffnet sie erst wieder, wenn man einmal weggegangen ist.
5. Leon bekommt Begrüßung, zwei Fragen und Verabschiedung. Imani und Dr. Vale sagen ihre bisherigen Sätze, darunter steht „Goodbye.“

Während Leon spricht, bleibt er stehen und schaut zur Figur.

## Bedienung

- Maus/Touch: Knöpfe anklicken, Klick in die Box = weiter.
- Tastatur: `1` `2` `3` wählen, `Tab` wechselt zwischen den Knöpfen, `Enter` wählt.
- `Leertaste` / `E`: Satz sofort ganz zeigen, dann weiter.
- `Escape`: schließen. Laufen (`W A S D`, Pfeile) geht weiter; wer weggeht, schließt die Box.
- Text erscheint mit 35 Zeichen pro Sekunde; bei `prefers-reduced-motion` sofort ganz. `aria-live="polite"` liest den Text vor.
- Steht die Figur unten im Bild, rückt die Box nach oben (`setPlacement('top')`).

## Eigene Fragen für eine weitere Figur (z. B. Imani)

1. In `dialogues.js` eine Funktion `imaniConversation(state)` schreiben, die `{ greeting, questions, goodbye }` zurückgibt, und sie in `conversationFor` eintragen: `{ leon: leonConversation, imani: imaniConversation }`. Regeln: Fragen klingen wie Smalltalk, höchstens zwei kurze Sätze pro Box, keine Lösung verraten.
2. Tests in `web/story/tests/conversation.test.js` ergänzen.

Eine ganz neue Person kommt in `PEOPLE` in `main.js` dazu (Kartenobjekt → Figur), plus ihr Raum in `personDistance`.
