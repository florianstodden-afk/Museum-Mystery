# GitHub-Anmeldung für Museum Mystery

**Stand 17.11.2026:** Florian entschied nach Prüfung der Passwortspeicherung im Repository: Spieler sollen sich mit ihrem eigenen GitHub-Konto anmelden. Die Eingangsseite und die zwei Ansichten sind im Branch `codex/login-signup` vorbereitet. Ein echter Login ist noch nicht möglich, denn das Team hat noch kein Clerk-Projekt. Die Änderung bleibt zunächst getrennt vom öffentlichen Spiel.

## Spielweg

1. Beim Öffnen erscheint das vom Team bereitgestellte Bild mit **Log In** und **Sign Up**.
2. Der gewählte Knopf öffnet eine passende Ansicht mit **Continue with GitHub**. Bei GitHub-Anmeldung sind „Log In“ und „Sign Up“ technisch derselbe Vorgang: Beim ersten Mal entsteht ein Spielerkonto, später wird es wiedererkannt. Jeder Spieler braucht ein eigenes GitHub-Konto. GitHub prüft die Zugangsdaten; das Spiel speichert **kein Passwort**.
3. Nach erfolgreicher Anmeldung erscheint der Home Screen.
4. **Start New Game** öffnet das Museum mit Ms Missionsnachricht. **Resume Game** setzt einen begonnenen Lauf fort.
5. Unter **Settings → Log out** kann man das Konto wechseln.

Ein bestehender Anmeldestatus kann beim nächsten Besuch direkt zum Home Screen führen. Das ist die normale „eingeloggt bleiben“-Funktion.

## Was wo gespeichert wird

| Daten | Ort | Bedeutung |
| --- | --- | --- |
| GitHub-Konto und Passwort | GitHub | Spieler melden sich auf GitHub an; das Spiel erhält das Passwort nie. |
| Verknüpftes Spielerkonto und Sitzung | Clerk | Clerk erkennt den Spieler nach GitHub-Anmeldung wieder und liefert eine stabile Nutzer-ID. |
| Spielstand, Position, beste Porträtzeit | Browser des jeweiligen Geräts, getrennt nach Clerk-Nutzer-ID | Zwei Konten am selben Gerät sehen getrennte Spielstände. Ein Spielstand wird noch **nicht** zwischen Geräten synchronisiert. |
| Gemeinsame Bestenliste | Noch nicht vorhanden | Der aktuelle Scoreboard-Knopf zeigt weiterhin nur den lokalen Spielstand. |

## Warum die Spielerkonten nicht im GitHub-Repository liegen

GitHub Pages veröffentlicht HTML, CSS und JavaScript als statische Website. Es führt keinen Anmeldeserver aus, der Passwörter vertraulich prüfen und Konten verwalten könnte. Eine Passwortdatei im Repository wäre für andere lesbar; auch nach dem Löschen kann sie in der Git-Historie verbleiben. Die Warnung „Bitte kein wichtiges Passwort verwenden“ macht das nicht sicher. **Daher werden keine Spielerpasswörter ins Repository geschrieben.**

**Entscheidung vom 17.11.2026:** Florian wählte stattdessen „Mit GitHub anmelden“. Jeder Spieler weist sich über sein eigenes GitHub-Konto aus. GitHub bleibt für Code, Dokumentation, Website und Passwortprüfung zuständig; Clerk verwaltet die Verknüpfung mit dem Spielerkonto und die Sitzung. Museum Mystery zeigt nach Möglichkeit den GitHub-Namen, trennt Spielstände aber anhand der stabilen Clerk-Nutzer-ID.

Quellen: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [GitHubs Hinweise zu offengelegten Zugangsdaten](https://docs.github.com/en/code-security/concepts/secret-security/secret-leakage-risks).

## Einrichtung durch ein Teammitglied

1. Bei [Clerk](https://dashboard.clerk.com/sign-up) zunächst ein **Verwaltungskonto** über **GitHub** anlegen. GitHub-Anmeldung und eine mögliche Freigabe selbst im Browser durchführen; keine Zugangsdaten oder Codes im Chat oder GitHub veröffentlichen.
2. Im Clerk-Dashboard ein Projekt „Museum Mystery“ anlegen.
3. Unter **SSO connections → Add connection → For all users → GitHub** GitHub für Anmeldung und Registrierung aktivieren. In einer Clerk-Development-Instanz sind dafür laut Clerk bereits geteilte OAuth-Zugangsdaten eingerichtet. Kein eigener GitHub-OAuth-Client und keine zusätzlichen Berechtigungen für private Repositories nötig.
4. Andere Anmeldewege für **Spieler** abschalten, insbesondere Passwort, Telefonnummer und weitere soziale Anbieter. Prüfen, ob in beiden Ansichten nur GitHub angeboten wird.
5. Unter **API keys** den **Publishable Key** (`pk_test_…`) kopieren und in [`web/auth-config.js`](../web/auth-config.js) zwischen die Anführungszeichen eintragen. **Niemals** den Secret Key (`sk_…`) in Dateien, Chat oder GitHub veröffentlichen.
6. Lokal mit einem Webserver öffnen: im Ordner `web` `uv run --no-project --python 3.14 python -m http.server 8000`, dann `http://localhost:8000`. Mit zwei verschiedenen GitHub-Konten anmelden, ausloggen, wieder einloggen und getrennte Spielstände prüfen.
7. Für den Online-Test eine **separate Vorschau-URL** für diesen Branch bereitstellen. Die bestehende GitHub-Pages-Einstellung veröffentlicht nur `main`; ein Branch ist dort nicht automatisch als Vorschau erreichbar. Anmeldung auf der Vorschau-URL prüfen, weil `localhost` allein den Online-Betrieb nicht belegt.
8. Erst wenn die Vorschau funktioniert, Pull Request prüfen und mergen. Danach die öffentliche Spiel-URL erneut testen. In `docs/arbeitsprotokoll.md` Datum, Person, Test und Ergebnis ergänzen.

Clerks Development-Instanz ist für einen **Kurstest** gedacht, hat laut Anbieter eine Grenze von 100 Nutzern und ist nicht für einen dauerhaften Produktivbetrieb vorgesehen. Eine Clerk-Produktivinstanz benötigt eine eigene Domain mit DNS-Zugang; die bisherige `github.io`-Adresse allein genügt dafür nicht. Wenn das Team eine dauerhafte öffentliche Version will, muss es diese Hosting-Entscheidung separat treffen.

Bei einem späteren Clerk-Produktivbetrieb verlangt GitHub als sozialer Anbieter eigene OAuth-Zugangsdaten; die geteilten Zugangsdaten gelten nur für die Development-Instanz. [Clerk: GitHub-Verbindung](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/github).

## Code für die Erklärung im Kurs

- [`web/index.html`](../web/index.html): Bilder, Knöpfe und Bereiche für Login, Home und Spiel.
- [`web/style.css`](../web/style.css): Position der klickbaren Knöpfe über dem bereitgestellten Bild und Layout für kleine Bildschirme.
- [`web/entry.js`](../web/entry.js): Lädt Clerk, zeigt Login oder Registrierung und lädt `main.js` erst nach erfolgreicher Anmeldung.
- [`web/account.js`](../web/account.js): Trennt lokale Speicher-Schlüssel anhand der Nutzer-ID.
- [`web/main.js`](../web/main.js): Home Screen, Spielstart und kontogetrennte Spielstände.
- [`web/story/host.js`](../web/story/host.js): Übergibt den kontogetrennten Speicher auch an die Porträtzeit.

Die Anmeldung allein ist **kein Multiplayer-Spiel**. Sie ermöglicht eigene Identitäten. Eine für alle sichtbare Bestenliste braucht zusätzlich eine Online-Datenbank und eine serverseitige Prüfung, welcher Nutzer welchen Punktestand einreicht.
