# Security Office – was davon im Spiel steckt

**Stand 15.11.2026.** Den begehbaren Sicherheitsraum im Hauptspiel hat Fabian gebaut (`web/security-room.js`, Hintergrundbild `web/assets/security-office-hall-exit.png`, Eingang links in der Great Hall). Von der Story-Logik nutzt der Raum **die Interaktionen**, nicht die Zeichnung.

## Im Spiel benutzt: `web/story/security-office/interactions.js`

Jedes Objekt in Fabians Raum hat ein `story`-Feld wie die Objekte auf der Karte, z. B. `{ examine: 'monitor-wall' }`. Beim Drücken von **E** ruft `main.js` den Story-Host auf (`story.examine(id)`), und der Host nutzt `examine(state, id)` aus `interactions.js`.

| Objekt in Fabians Raum | id | Wirkung |
|---|---|---|
| Camera overview | `monitor-wall` | Leon sah um 21:14 einen Transportwagen am Lieferausgang, Inhalt nicht erkennbar → Notiz `transport-cart` |
| Shift schedule | `shift-schedule` | Wer Dienst hatte, „21:00 – patron visit“ → Notiz `duty-roster` (löst Station I **nicht**) |
| Walkie-talkie | `radio` | nur Atmosphäre |
| Key cabinet | `key-cabinet` | nur Atmosphäre (Schlüssel zum Lieferausgang fehlt) |

Eine Notiz wird genau einmal freigeschaltet; zweites Untersuchen zeigt denselben Text und „This note is already in your journal.“ Tests: `web/story/tests/security-office.test.js`.

## Nur Prototyp: `web/story/security-office/security-office.js`

`drawSecurityOffice(ctx, …)` zeichnet einen Raum mit 3×3-Monitorwand komplett per Code. Das war der Entwurf, bevor es ein gemaltes Bild gab. **Das Hauptspiel benutzt diese Zeichnung nicht**; sie läuft nur in der Vorschau `web/dev/security-office.html`. Die Klickbereiche in `interactions.js` (`LAYOUT`) stammen aus dieser Datei, deshalb ist sie noch im Projekt.

Wenn das Team später Live-Kamerabilder auf Fabians Monitore legen will, lässt sich daraus `monitorLayout()` und das „NO SIGNAL“-Rauschen übernehmen. Sonst kann die Zeichnung (und die Vorschau-Seite) nach Absprache entfernt werden; dann müssten die Bereiche aus `LAYOUT` direkt in `interactions.js` stehen.
