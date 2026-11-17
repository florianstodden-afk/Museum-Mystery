# Sprechblase (Speech Box)

Leon, der Nachtwächter, spricht in einer kleinen Sprechblase unten im Spielfeld, wie in klassischen Konsolen-RPGs. Die Welt bleibt dahinter sichtbar. Vorlage: `docs/screenshots/guard-speech-mockup.png`.

## Drei Teile, drei Dateien

| Datei | Aufgabe | DOM? |
|---|---|---|
| `web/story/dialogues.js` → `conversationFor(id, state)` | **Was** gesagt wird: Begrüßung, zwei Fragen mit Antworten, Verabschiedung. Hängt vom Spielstand ab. | nein |
| `web/story/proximity.js` → `shouldOpenTalk(...)` | **Wann** das Gespräch von selbst startet. | nein |
| `web/story/speech-box.js` → `createSpeechBox(parent, ...)` | **Wie** es aussieht: Namensschild, Textbox, Schreibmaschinen-Effekt, Knöpfe, Tasten. | ja |

Dazu: Styles mit Präfix `speech-` in `web/story/story.css`, Anschluss in `web/story/host.js` (`talkTo` nutzt die Box, wenn es ein Gespräch gibt) und in `web/main.js` (Abstandsprüfung im Spiel-Loop, Figur und Leon pausieren).

## Ablauf

1. Jedes Bild prüft `main.js`: Wie weit ist die Spielfigur von Leon entfernt?
2. `shouldOpenTalk` sagt „öffnen“, wenn der Abstand unter **1,2 Feldern** liegt, kein anderes Fenster offen ist und die Abklingzeit vorbei ist.
3. Danach öffnet es erst wieder, wenn die Figur **über 2,5 Felder** weg war (Hysterese) **und** seit dem Schließen **8 Sekunden** vergangen sind. Sonst ginge die Box bei jedem Schritt neu auf.
4. Die Box zeigt die Begrüßung, dann die Knöpfe. Eine Frage spielt ihre Antwort Box für Box (▼ = es geht weiter) und kehrt zu den Knöpfen zurück. „Goodbye“ zeigt einen Satz und schließt.

Während des Gesprächs stehen Spielfigur und Leon still, und Leon schaut zur Figur.

## Bedienung

- Maus/Touch: Knöpfe anklicken, Klick in die Box = weiter.
- Tastatur: `1` `2` `3` wählen, Pfeiltasten wechseln zwischen den Knöpfen, `Enter` wählt.
- `Leertaste` / `E`: Satz sofort ganz zeigen, dann weiter.
- `Escape` oder `W A S D`: schließen (Laufen startet gleich mit).
- Text erscheint mit 35 Zeichen pro Sekunde; bei `prefers-reduced-motion` sofort ganz. `aria-live="polite"` liest den Text vor.
- Steht die Figur unten im Bild, rückt die Box nach oben (`setPlacement('top')`).

## Eine weitere Figur hinzufügen (z. B. Imani)

1. In `dialogues.js` eine Funktion `imaniConversation(state)` schreiben, die `{ greeting, questions, goodbye }` zurückgibt, und sie in `conversationFor` eintragen: `{ leon: leonConversation, imani: imaniConversation }`. Regeln: Fragen klingen wie Smalltalk, höchstens zwei kurze Sätze pro Box, keine Lösung verraten.
2. In `main.js` die Figur in die Liste schreiben: `const AUTO_TALK = ['leon', 'imani'];` und in `checkAutoTalk` den Abstand zu ihr prüfen (Position wie bei Leon).
3. Tests in `web/story/tests/conversation.test.js` ergänzen (Antworten je Spielstand, keine Lösungswerte).

Ohne Schritt 2 spricht die Figur trotzdem in der Box, sobald man `E` drückt, denn `host.talkTo` nimmt die Box für jede Figur, die ein Gespräch hat.
