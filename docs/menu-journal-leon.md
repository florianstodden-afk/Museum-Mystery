# Menü, Journal und Leon – Überarbeitung vom 17.11.2026

Auftrag: Florian Stodden. Umsetzung mit Codex auf `codex/menu-journal-leon`, ausgehend vom gemergten PR #18. Die zwei Gemini-Bilder wurden als **Gestaltungsideen** verwendet, nicht als festes Hintergrundbild mit eingebrannten Knopftexten. So können „Sound on/off“ und „Music on/off“ live wechseln.

## Bedienung

| Ort | Aktion | Ergebnis |
|---|---|---|
| Spiel | `Esc` oder Zahnrad | Spielmenü öffnen; Bewegung pausiert. `Esc` erneut schließt es. |
| Spiel | `J` oder Journal-Knopf oben | Journal über dem Museum öffnen. `J`, `Esc` oder × schließt es. |
| Home Screen | Journal-Knopf oder `J` | Journal öffnen und wieder zum Home Screen zurückkehren, ohne die Mission zu starten. Auch „Read M’s message“ führt nach dem Schließen zurück zum Home Screen. |
| Spiel nahe Leon | `E` | Transparentes Gespräch mit Leon öffnen. Er beginnt nicht mehr von selbst beim Näherkommen. Seit `feature/npc-e-and-signs` gilt das auch für Imani und Dr. Vale. |

## Wo passiert was?

- `web/index.html`: Journal-Knöpfe für Spiel und Home Screen sowie das zweispaltige Journal-Fenster mit Mission, Beweisen, Notizen, vier Buchstaben, Statistik und Met-Quellen. Das Fenster liegt außerhalb der Spielszene, damit es auch vom Home Screen erreichbar ist.
- `web/main.js`: Tastenkürzel, Öffnen/Schließen der Fenster, Pausieren, Fokus und Rückkehr zum richtigen Bildschirm. Leons E-Interaktion nutzt dieselbe bestehende Geschichte und dieselben zwei Fragen wie zuvor.
- `web/style.css`: Messingrahmen und dunkle Karten nach den Vorlagen, mit echten HTML-Knöpfen und responsiver Anordnung.
- `web/story/journal.js`: Bestehende Journal-Daten werden für die zwei Buchseiten getrennt angezeigt. Die Datenregeln bleiben unverändert.
- `web/story/story.css`: Leons Sprechbox erhält einen durchscheinenden Hintergrund mit heller Schrift.

Die Spielstände, Punktregeln und vier Minispiele wurden nicht geändert. Ein neues Spiel startet weiter nur auf dem Home Screen.

## Prüfung

- `node --test` im Ordner `web`: 217 bestanden, 0 fehlgeschlagen.
- `node --check main.js` und `git diff --check`: ohne Fehler.
- Lokaler Browser: Home Screen → Journal → schließen → Home Screen; `J` auf dem Home Screen; im Spiel `Esc` → Menü mit dynamischen Ton-/Musiktexten; Menü → Journal; `J` im Spiel; Home Journal → „Read M’s message“ → Schließen → Home Screen. Menü und Journal wurden als Desktop-Ansichten visuell mit den Vorlagen verglichen.
- Noch von der Gruppe durchzuspielen: Gespräch mit Leon per `E` an seiner Position, vollständige Spielrunde und Ansicht auf einem echten Smartphone.

**Nachtrag vor dem Merge:** Zwischenzeitlich wurde PR #19 mit weiteren Änderungen an Station I nach `main` gemergt. Dieser Branch wurde darauf aktualisiert; anschließend bestanden **227 Tests**. Die Funktionen aus PR #19 bleiben erhalten.

Danach wurde auch PR #21 (kein „Nothing nearby“-Dialog mehr) gemergt. Der Branch enthält beide Änderungen; nach dem erneuten Abgleich bestanden **231 Tests**.
