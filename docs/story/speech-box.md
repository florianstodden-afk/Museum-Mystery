# Sprechblase (Speech Box)

Alle Figuren (Leon, Imani, Dr. Vale) sprechen in einer kleinen Sprechblase unten im Spielfeld, wie in klassischen Konsolen-RPGs. Die Welt bleibt dahinter sichtbar. Vorlage: `docs/screenshots/guard-speech-mockup.png`.

## Drei Teile, drei Dateien

| Datei | Aufgabe | DOM? |
|---|---|---|
| `web/story/dialogues.js` → `conversationFor(id, state)` | **Was** gesagt wird: Leon hat Begrüßung, zwei Fragen und Verabschiedung; Imani und Dr. Vale haben ihre bisherigen Textzeilen. Hängt vom Spielstand ab. | nein |
| `web/story/proximity.js` → `talkPartner(...)`, `shouldCloseTalk(...)` | **Wer** nach `E` spricht und **wann** die Box wieder schließt. | nein |
| `web/story/speech-box.js` → `createSpeechBox(parent, ...)` | **Wie** es aussieht: Namensschild, Textbox, Schreibmaschinen-Effekt, Knöpfe, Tasten. | ja |

Dazu: Styles mit Präfix `speech-` in `web/story/story.css`, Anschluss in `web/story/host.js` (`talkTo` nutzt die Box, wenn es ein Gespräch gibt) und in `web/main.js` (Abstandsprüfung im Spiel-Loop, Figur und Leon pausieren).

## Ablauf

1. Alle Personen (Leon, Imani, Dr. Vale) sprechen nur nach **E**. Über der Person steht dann „E Name“. `main.js` (`handleInteract`) fragt `talkPartner(objekt, PEOPLE)`, welche Figur zum Kartenobjekt gehört, und öffnet ihre Box. Näherkommen allein öffnet nichts.
2. Jedes Bild prüft `main.js` (`checkTalkDistance`), wie weit die Spielfigur von der sprechenden Person entfernt ist. Gemessen wird auf dem Bildschirm (100 Pixel = 1 Schritt), weil der Boden perspektivisch gezeichnet ist.
3. Über **1,5 Schritten** schließt die Box (`shouldCloseTalk`). Man darf also einfach weggehen.
4. Leon bekommt Begrüßung, zwei Fragen und eine freiwillige Verabschiedung. Eine beantwortete Frage verschwindet für das aktuelle Gespräch. Nach der zweiten Antwort endet das Gespräch beim nächsten Weiterklicken automatisch. Bei erneutem **E** sind beide Fragen wieder verfügbar.
5. Imani sagt ihre bisherigen Sätze und schließt nach der letzten Zeile beim nächsten Weiterklicken automatisch. Ein neues **E** beginnt ihr Gespräch erneut. Dr. Vale behält den bisherigen „Goodbye.“-Knopf.

Während eine Person spricht, schaut sie zur Figur (`facingToward`). Leon bleibt dabei stehen. Imani schaut in der Gallery weiter nach vorn, weil `gallery.js` sie zeichnet und dort nicht geändert wurde.

## Bedienung

- Maus/Touch: Knöpfe anklicken, Klick in die Box = weiter.
- Tastatur: `1` `2` `3` wählen, soweit Knöpfe vorhanden sind; `Tab` wechselt zwischen ihnen, `Enter` wählt. Nach Leons erster Frage rückt die andere Frage auf `1`.
- `Leertaste` / `E`: Satz sofort ganz zeigen, dann weiter.
- `Escape`: schließen. Laufen (`W A S D`, Pfeile) geht weiter; wer weggeht, schließt die Box.
- Text erscheint mit 35 Zeichen pro Sekunde; bei `prefers-reduced-motion` sofort ganz. `aria-live="polite"` liest den Text vor.
- Steht die Figur unten im Bild, rückt die Box nach oben (`setPlacement('top')`).

## Eigene Fragen für eine weitere Figur (z. B. Imani)

1. In `dialogues.js` eine Funktion `imaniConversation(state)` schreiben, die `{ greeting, questions, goodbye }` zurückgibt, und sie in `conversationFor` eintragen: `{ leon: leonConversation, imani: imaniConversation }`. Regeln: Fragen klingen wie Smalltalk, höchstens zwei kurze Sätze pro Box, keine Lösung verraten.
2. Tests in `web/story/tests/conversation.test.js` ergänzen.

Eine ganz neue Person kommt in `PEOPLE` in `main.js` dazu (Kartenobjekt → Figur), plus ihr Raum in `personDistance`.
