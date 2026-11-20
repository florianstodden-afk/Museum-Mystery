# Gemeinsames Leaderboard · 20.11.2026

**Aktueller Stand:** Scoreboard is local to this browser; an online version is prepared in `server/leaderboard` but not deployed. Solange `LEADERBOARD_URL` in `web/leaderboard-config.js` leer ist, zeigt die Tafel nur die lokale Liste (bis zu 10 beendete Läufe aller Profile und Gäste dieses Browsers, sortiert nach Punkten, bei Gleichstand nach kürzerer Zeit, Status Won/Lost). Die Online-Abschnitte, **Refresh** und **Publish finished run** bleiben ausgeblendet. Der folgende Text beschreibt die Online-Version für später.

## Was der Spieler sieht

Im Home Screen öffnet **Scoreboard** eine halbtransparente Museumstafel. Oben steht der eigene laufende Spielstand; darunter erscheinen bis zu 25 veröffentlichte Ergebnisse aller Geräte. Die Schrift für Überschriften und Knöpfe ist dieselbe Fraunces-Schrift wie in den vorhandenen Menüs. Der Hintergrund des Home Screens bleibt sichtbar.

Ein Ergebnis wird **nicht automatisch** gesendet: Erst nach einem Ende erscheint **Publish finished run**. Der Spieler entscheidet dann, ob sein Name, Punktestand und Ende öffentlich auf der Tafel stehen. Passwörter, Spielstände, Notizen, Kunstantworten und Bewegungsdaten werden nicht übertragen. **Refresh** lädt die Liste erneut. Wenn der Dienst fehlt oder ausfällt, bleibt das lokale Scoreboard benutzbar und zeigt eine klare Meldung.

## Regeln

- Die vier Stationen geben zusammen höchstens 60 Punkte, Safe und Schlussfrage je 10: **80 Punkte**.
- Der Server nimmt nur abgeschlossene Ergebnisse auf der aktuellen 80-Punkte-Skala an. Alte Spielstände mit 85/90 möglichen Punkten bleiben lokal sichtbar, werden aber nicht in die gemeinsame Liste gemischt.
- Pro Browser-Profil erzeugt das Spiel eine dauerhafte zufällige Kennung. Der Server behält pro Kennung den **höchsten Punktestand**. Gleiche Punktzahlen teilen sich denselben Platz. Zeit ist kein Sortierkriterium: Wiederholtes Lösen bekannter Rätsel verschafft dadurch keinen direkten Rangvorteil.
- Ein lokaler Profilname wird als Anzeigename verwendet; Gäste erscheinen als `Guest-…`. Diese Namen sind vor der späteren Login-Verknüpfung **nicht verifiziert**.
- **Grenzen:** Namen sind nicht verifiziert, und ein Ergebnis kann über die öffentliche Schnittstelle gefälscht werden. Der Worker prüft aber Format und Punkte-Obergrenze und lehnt alles andere ab.

## Wo es passiert

| Datei | Aufgabe |
| --- | --- |
| `web/index.html`, `web/story/story.css` | Tafel, Knöpfe, transparente Darstellung und Journal-Quellen |
| `web/main.js`, `web/leaderboard.js` | Laden, Anzeigen, freiwilliges Veröffentlichen und lokale Spielerkennung |
| `web/leaderboard-config.js` | Öffentliche URL des Online-Dienstes nach der Bereitstellung |
| `server/leaderboard/worker.js` | Öffentliche Lese- und Schreibschnittstelle, Eingabeprüfung, Platzierung |
| `server/leaderboard/migrations/0001_leaderboard.sql` | Datenbanktabelle, ein Bestwert je Spielerkennung |
| `server/leaderboard/wrangler.jsonc` | Cloudflare-Worker-Konfiguration |

GitHub Pages kann selbst keine gemeinsamen Ergebnisse speichern. Die Datenbank liegt deshalb bei Cloudflare D1 und wird durch einen Worker angesprochen. **Der Worker ist erst online, nachdem jemand mit einem Cloudflare-Konto die folgenden Schritte ausgeführt hat.** Bis dahin meldet die Tafel, dass sie noch nicht verbunden ist. Eine Cloudflare-URL oder Datenbankkennung ist kein Passwort; geheime Zugangsdaten gehören niemals in `web/` oder ins Repository.

## Einmalige Bereitstellung

Die Schritte werden im Ordner `server/leaderboard` ausgeführt. Node.js und ein Cloudflare-Konto sind nötig.

1. `npx wrangler login` öffnet die Cloudflare-Anmeldung.
2. `npx wrangler d1 create museum-mystery-leaderboard` erstellt die Datenbank und zeigt ihre `database_id`. Diese ID in `wrangler.jsonc` statt `REPLACE_WITH_D1_DATABASE_ID` einsetzen.
3. `npx wrangler d1 migrations apply museum-mystery-leaderboard --remote` legt die Tabelle an.
4. `npx wrangler deploy` veröffentlicht den Worker und zeigt eine `https://…workers.dev`-URL.
5. Diese URL als `LEADERBOARD_URL` in `web/leaderboard-config.js` einsetzen und die Änderung über einen Pull Request in `main` bringen. GitHub Pages lädt danach die verbundene Version.
6. Auf zwei Geräten die Seite öffnen. Auf Gerät A einen aktuellen Lauf beenden und veröffentlichen; auf Gerät B **Scoreboard → Refresh** wählen. Das Ergebnis muss dort erscheinen.

Der Worker erlaubt derzeit die GitHub-Pages-Adresse und lokale Entwicklung auf Port 8000. Wird eine andere Spieladresse verwendet, diese in `ALLOWED_ORIGINS` der `wrangler.jsonc` ergänzen und neu deployen. Die Origin-Liste verhindert versehentliche Aufrufe von anderen Webseiten; sie ersetzt **keine Anmeldung**.

## Spätere Login-Verknüpfung

Das jetzige lokale Passwort beweist dem Worker nicht, wer eine Anfrage sendet. Jeder mit Kenntnis der öffentlichen Schnittstelle könnte vor der Login-Verknüpfung einen Namen oder Punktestand vortäuschen. Die Tafel ist deshalb für die Spielgruppe brauchbar, aber noch keine manipulationssichere Wettbewerbswertung. Bei der späteren Anbindung muss der Worker eine serverseitig prüfbare Anmeldung verlangen und die Spielerkennung aus der geprüften Identität ableiten, statt `playerId` und `name` aus der Anfrage zu übernehmen. Erst dann sind Namen eindeutig. Auch ein signierter Login allein beweist noch nicht, dass der Spielstand ehrlich erspielt wurde; falls das wichtig wird, müsste der Server zusätzlich Spielereignisse oder einen plausiblen Ergebnisnachweis prüfen.

## Prüfung

`cd web && node --test` prüft die Spielmodule. `node --test server/leaderboard/worker.test.js` prüft die Regeln und Antworten des Workers ohne Cloudflare-Konto. Der echte Austausch über zwei Geräte kann erst nach Schritt 5 geprüft werden.

Technische Grundlage: [Cloudflare D1 Worker API](https://developers.cloudflare.com/d1/worker-api/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/) und [Wrangler-Konfiguration](https://developers.cloudflare.com/workers/wrangler/configuration/).
