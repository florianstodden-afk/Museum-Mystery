# Login und Registrierung für Museum Mystery

**Stand 17.11.2026:** Die neue Eingangsseite und zwei getrennte Ansichten sind im Branch `codex/login-signup` vorbereitet. Ein echtes Konto kann noch nicht angelegt werden, denn das Team hat noch kein Clerk-Projekt. Diese Änderung bleibt zunächst getrennt vom öffentlichen Spiel.

## Spielweg

1. Beim Öffnen erscheint das vom Team bereitgestellte Bild mit **Log In** und **Sign Up**.
2. Der gewählte Knopf öffnet die entsprechende Ansicht. Die Zugangsdaten werden vom Anmeldedienst geprüft und gespeichert. Das Spiel speichert **kein Passwort**.
3. Nach erfolgreicher Anmeldung erscheint der Home Screen.
4. **Start New Game** öffnet das Museum mit Ms Missionsnachricht. **Resume Game** setzt einen begonnenen Lauf fort.
5. Unter **Settings → Log out** kann man das Konto wechseln.

Ein bestehender Anmeldestatus kann beim nächsten Besuch direkt zum Home Screen führen. Das ist die normale „eingeloggt bleiben“-Funktion.

## Was wo gespeichert wird

| Daten | Ort | Bedeutung |
| --- | --- | --- |
| Benutzername, Passwortprüfung, Sitzung | Clerk | Konto auf mehreren Geräten nutzbar; Passwort kommt nicht in GitHub oder `localStorage`. |
| Spielstand, Position, beste Porträtzeit | Browser des jeweiligen Geräts, getrennt nach Clerk-Nutzer-ID | Zwei Konten am selben Gerät sehen getrennte Spielstände. Ein Spielstand wird noch **nicht** zwischen Geräten synchronisiert. |
| Gemeinsame Bestenliste | Noch nicht vorhanden | Der aktuelle Scoreboard-Knopf zeigt weiterhin nur den lokalen Spielstand. |

## Warum die Spielerkonten nicht im GitHub-Repository liegen

GitHub Pages veröffentlicht HTML, CSS und JavaScript als statische Website. Es führt keinen Anmeldeserver aus, der Passwörter vertraulich prüfen und Konten verwalten könnte. Eine Passwortdatei im Repository wäre für andere lesbar; auch nach dem Löschen kann sie in der Git-Historie verbleiben. Die Warnung „Bitte kein wichtiges Passwort verwenden“ macht das nicht sicher. **Daher werden keine Spielerpasswörter ins Repository geschrieben.**

„Mit GitHub anmelden“ wäre eine andere Möglichkeit. Dabei hätte jeder Spieler ein eigenes GitHub-Konto und würde sich über GitHub ausweisen. Das erfüllt den Wunsch nach einem eigenen Benutzernamen und Passwort **im Spiel** nicht. GitHub bleibt für Code, Dokumentation und die Website zuständig; Clerk soll die Spielerkonten verwalten.

Quellen: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [GitHubs Hinweise zu offengelegten Zugangsdaten](https://docs.github.com/en/code-security/concepts/secret-security/secret-leakage-risks).

## Einrichtung durch ein Teammitglied

1. Bei [Clerk](https://dashboard.clerk.com/sign-up) zunächst ein **Verwaltungskonto** anlegen. Clerk fragt dafür aktuell E-Mail und Passwort ab oder bietet GitHub/Google an. Dieses persönliche Verwaltungskonto ist **nicht** die spätere Anmeldung der Spieler. Zugangsdaten und etwaige Bestätigung selbst im Clerk-Browserfenster eingeben; nicht im Chat oder GitHub veröffentlichen.
2. Im Clerk-Dashboard ein Projekt „Museum Mystery“ anlegen.
3. Unter **User & authentication** nur **Username** und **Password** aktivieren. E-Mail, Telefonnummer und soziale Anmeldungen deaktivieren. Prüfen, ob die Registrierungsmaske tatsächlich nur Benutzername und Passwort verlangt.
4. Unter **API keys** den **Publishable Key** (`pk_test_…`) kopieren und in [`web/auth-config.js`](../web/auth-config.js) zwischen die Anführungszeichen eintragen. **Niemals** den Secret Key (`sk_…`) in Dateien, Chat oder GitHub veröffentlichen.
5. Lokal mit einem Webserver öffnen: im Ordner `web` `uv run --no-project --python 3.14 python -m http.server 8000`, dann `http://localhost:8000`. Mit zwei Testkonten registrieren, ausloggen, wieder einloggen und getrennte Spielstände prüfen.
6. Für den Online-Test eine **separate Vorschau-URL** für diesen Branch bereitstellen. Die bestehende GitHub-Pages-Einstellung veröffentlicht nur `main`; ein Branch ist dort nicht automatisch als Vorschau erreichbar. Registrierung und Anmeldung auf der Vorschau-URL prüfen, weil `localhost` allein den Online-Betrieb nicht belegt.
7. Erst wenn die Vorschau funktioniert, Pull Request prüfen und mergen. Danach die öffentliche Spiel-URL erneut testen. In `docs/arbeitsprotokoll.md` Datum, Person, Test und Ergebnis ergänzen.

Clerks Development-Instanz ist für einen **Kurstest** gedacht, hat laut Anbieter eine Grenze von 100 Nutzern und ist nicht für einen dauerhaften Produktivbetrieb vorgesehen. Eine Clerk-Produktivinstanz benötigt eine eigene Domain mit DNS-Zugang; die bisherige `github.io`-Adresse allein genügt dafür nicht. Wenn das Team eine dauerhafte öffentliche Version will, muss es diese Hosting-Entscheidung separat treffen.

**Wichtig bei nur Benutzername + Passwort:** Ohne E-Mail gibt es keinen automatischen Weg, ein vergessenes Passwort per Mail zurückzusetzen. Das Team muss Konten dann bei Bedarf im Anbieter-Dashboard verwalten.

## Code für die Erklärung im Kurs

- [`web/index.html`](../web/index.html): Bilder, Knöpfe und Bereiche für Login, Home und Spiel.
- [`web/style.css`](../web/style.css): Position der klickbaren Knöpfe über dem bereitgestellten Bild und Layout für kleine Bildschirme.
- [`web/entry.js`](../web/entry.js): Lädt Clerk, zeigt Login oder Registrierung und lädt `main.js` erst nach erfolgreicher Anmeldung.
- [`web/account.js`](../web/account.js): Trennt lokale Speicher-Schlüssel anhand der Nutzer-ID.
- [`web/main.js`](../web/main.js): Home Screen, Spielstart und kontogetrennte Spielstände.
- [`web/story/host.js`](../web/story/host.js): Übergibt den kontogetrennten Speicher auch an die Porträtzeit.

Die Anmeldung allein ist **kein Multiplayer-Spiel**. Sie ermöglicht eigene Identitäten. Eine für alle sichtbare Bestenliste braucht zusätzlich eine Online-Datenbank und eine serverseitige Prüfung, welcher Nutzer welchen Punktestand einreicht.
