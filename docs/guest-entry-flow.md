# Gast-Einstieg vor dem Home Screen

**Historischer Stand vom 17.11.2026.** Für den später ergänzten lokalen Profilzugang siehe [Lokale Profile: Anmeldung und Spielstart](local-login.md). Die folgenden Angaben dokumentieren die damalige Umsetzung und beschreiben nicht mehr den aktuellen Anmeldebildschirm.

**Stand: 17.11.2026, Branch `codex/guest-entry-flow`.** Dies ist der vorbereitete Ablauf für den nächsten Pull Request. Bis zum Merge startet das öffentliche Spiel weiterhin direkt im Home Screen.

## Ablauf für Spieler

1. Beim Öffnen erscheint Florians Bildvorlage mit den gezeichneten Knöpfen **Log In** und **Sign Up**. Die echte Klickfläche liegt genau darüber; auf kleinen Bildschirmen werden die Knöpfe zusätzlich lesbar dargestellt.
2. Beide Knöpfe öffnen jeweils eine eigene Zwischenansicht mit passender Überschrift. Dort steht ausdrücklich, dass Konten noch nicht verfügbar sind. **Continue as guest** führt ohne Benutzername oder Passwort weiter. **Back** führt zur Auswahl zurück.
3. Der vorhandene Home Screen erscheint. **Start New Game** öffnet das Museum und zeigt Ms Missionsnachricht. Bei einem begonnenen Fall ist **Resume Game** möglich.
4. Im Spiel führt **Home** zurück zum Home Screen. Beim erneuten Laden der Seite erscheint die Eingangsseite wieder.

**Es findet keine Anmeldung statt.** Die Spielstände bleiben wie bisher nur im Browser dieses Geräts gespeichert. Alle Gäste auf demselben Browser nutzen denselben lokalen Spielstand. Der Scoreboard-Knopf zeigt keinen gemeinsamen Online-Vergleich.

## Was im Code geschieht

| Datei | Aufgabe |
| --- | --- |
| `web/assets/login-screen-reference.jpg` | Von Florian bereitgestellte Bildvorlage für den ersten Bildschirm. |
| `web/index.html` | Eingangsseite, zwei Zwischenansichten und der vorhandene Home Screen. Der Home Screen ist bis **Continue as guest** nicht bedienbar. |
| `web/style.css` | Klickflächen über den gezeichneten Knöpfen, Zwischenansicht und mobiles Layout. |
| `web/main.js` | Verbindet die Klicks: Auswahl → Zwischenansicht → Home Screen. Das Spiel und Ms Nachricht starten weiterhin erst über den Home Screen. |

Es wurde **kein** Clerk-, GitHub- oder anderer Anmeldedienst eingebaut. Eine spätere Anmeldung kann an der Stelle von **Continue as guest** angeschlossen werden; dafür braucht das Team erneut eine bewusste technische Entscheidung.

## Prüfung

- `node --test` im Ordner `web`: 217 bestanden, 0 fehlgeschlagen.
- `node --check main.js` und `git diff --check`: ohne Fehler.
- Lokaler Browserdurchlauf: **Log In → Continue as guest → Home → Start New Game → „A message from M“**. **Sign Up** und **Back** ebenfalls geprüft.
- Die erste Ansicht und die Sign-Up-Zwischenansicht wurden im Browser mit Florians Vorlage verglichen. Ein Test der fertigen GitHub-Pages-Version folgt nach dem Merge.
