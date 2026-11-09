# Museum Mystery

Ein gemeinsames Spielprojekt für **Introduction to Programming (Nova SBE, 2026/27)**. Diese README ist unser Einstiegspunkt für Teammitglieder und neue KI-Chats. **Vor jeder Aufgabe zuerst diese Datei und den aktuellen Code lesen.** Danach den Stand auf GitHub prüfen. Ein Chat kennt spätere Änderungen nicht automatisch.

**Stand: 9. November 2026.** Das GitHub-Repository enthält bisher nur diese Dokumentation; eine lauffähige App, Tests, Login und Datenbank sind noch nicht umgesetzt. Beschreibungen des Spiels und der Technik unten sind Vorschläge, bis wir sie als Team entscheiden und im Code nachweisen.

Repository: <https://github.com/florianstodden-afk/Museum-Mystery>

Kurs: <https://nova-sbe-introduction-to-programming.github.io/intro-to-programming-2026/index.html>

Ideenvergleich: <https://chatgpt.com/share/6aedc9ea-ef64-83eb-9a0e-0dd42623f0f8>

## Unser Ziel im Kurs

Wir entwickeln eine funktionierende App beziehungsweise ein Spiel mit KI-Unterstützung. Entscheidend ist, dass **jedes Teammitglied das gemeinsam abgegebene Ergebnis erklären kann**, auch Code, den jemand anderes oder eine KI geschrieben hat. Wir halten die Lösung daher klein, lesbar und überprüfbar. Unverstandene Funktionen werden erklärt, vereinfacht oder entfernt, bevor wir sie übernehmen.

Die [offizielle Bewertungsseite](https://nova-sbe-introduction-to-programming.github.io/intro-to-programming-2026/evaluation.html) nennt für das Teamprojekt eine Präsentation mit **Live-Demo an einer bereitgestellten URL und Code-Walkthrough** (40 % der Kursnote). Jedes Mitglied kann zu fremdem Code befragt werden. Die Kriterien sind Funktion, Design, Umfang/Ambition, Überprüfung und Erklärung. Die schriftliche Prüfung (60 %) betrifft teilweise das **eigene Solo-Projekt** und allgemeines Lesen von Code; diese beiden Leistungen sollten wir nicht verwechseln. Laut Kursseite lebt die Arbeit auf GitHub, nicht als Moodle-Dateiupload.

Der [Kursüberblick](https://nova-sbe-introduction-to-programming.github.io/intro-to-programming-2026/index.html) beschreibt das Teamprojekt für Wochen 8–10 und die Präsentationen für Wochen 11–12. Er spricht davon, das Beste aus Solo-Projekten weiterzuentwickeln. **Museum Mystery ist unser gewähltes Teamthema.** Ob und welche Ideen aus Solo-Projekten einfließen, entscheidet das Team ausdrücklich. Das separate Solo-Repository **Plot Twist** wird nicht als Git-Remote dieses Projekts verwendet.

## Was wir bauen wollen

**Museum Mystery** ist als kurzes Detektivspiel mit echten Kunstwerken gedacht. In einem Fall ist ein Werk gesucht. Spielerinnen und Spieler sehen mehrere Kandidaten, vergleichen Bild und sachliche Angaben, kaufen bei Bedarf Hinweise und geben einen begrenzten Tipp ab. Die [Collection API des Metropolitan Museum of Art](https://metmuseum.github.io/) soll Bilder und überprüfbare Werkdaten liefern. Die API ist damit Teil des Rätsels und nicht bloß eine dekorative Zusatzfunktion.

Der [geteilte Ideenvergleich](https://chatgpt.com/share/6aedc9ea-ef64-83eb-9a0e-0dd42623f0f8) verglich zwölf Spielideen und empfahl Museum Mystery als Balance aus anschaulicher Demo, klaren Regeln und machbarer Umsetzung für Anfänger. Dort wurden **3–4 Personen, 4–6 Wochen und fast kein Budget nur angenommen**. Diese Zahlen sind keine bestätigten Teamdaten. Ein Quiz war die risikoärmere Alternative; ein Wetter-Festival die ambitioniertere. Wir haben Museum Mystery als Thema gewählt.

### Vorläufiger, noch nicht implementierter Spielentwurf

- Zuerst **drei sorgfältig geprüfte Fälle** mit ungefähr 24 kuratierten Kunstwerken; kein unbegrenzter Zufallsgenerator.
- Ein Fall zeigt sechs mögliche Werke, Werkansichten mit überprüfbaren Angaben und einen kostenlosen Anfangshinweis.
- Start mit 100 Punkten. Bis zu drei zusätzliche Hinweise kosten je 15 Punkte. Ein erster falscher Tipp kostet 25 Punkte und scheidet den Kandidaten aus. Ein zweiter falscher Tipp beendet den Versuch. Ein richtiger Tipp löst den Fall.
- Hinweise müssen anhand der sichtbaren Werkdaten auf **genau eine Lösung** führen. Fehlende API-Felder oder Bilder dürfen keinen unlösbaren Fall erzeugen.
- Eigene Konten und gespeicherte Spielstände; perspektivisch Fallhistorie und Bestenliste. Getrennte Konten bedeuten **nicht** automatisch gleichzeitiges Mehrspieler-Spiel.
- Für eine faire Bestenliste wurde im Ideenvergleich **ein gewerteter Versuch pro Konto und Fall**, daneben ein Übungsmodus, vorgeschlagen.

Diese Punkte sind ein **Designvorschlag aus dem Ideenvergleich**, keine bestätigte Kursvorschrift und keine vorhandene Funktion. Vor dem Programmieren legt das Team die endgültigen Regeln, den kleinsten spielbaren Umfang und die erwarteten Ergebnisse schriftlich fest. Die genaue Login-, Speicher- und Hosting-Lösung ist noch offen. Ein früher Vorschlag nannte einen verwalteten Login- und Datenbankdienst; die bisherige README empfahl Python, Streamlit, SQLite und pytest. Wir entscheiden die Kombination erst nach Abgleich mit Kursanforderungen, Teamkenntnissen und dem Bedarf an echten getrennten Online-Konten. Eine lokale SQLite-Datei allein ist keine fertige gemeinsame Online-Anmeldung.

Bewusst zunächst außerhalb des Umfangs: 3D-Museum, Live-Multiplayer, freie Texteingaben als Anschuldigung, ungeprüft KI-generierte Rätsel und beliebige API-Werksuche. Erst drei zuverlässige Fälle, dann mögliche Extras.

## So arbeiten wir bei jeder Aufgabe

1. **Stand lesen:** README, relevante Dateien, `git status` und jüngste Commits prüfen. Bei neuen Chats diese README nennen und die konkrete Aufgabe abgrenzen.
2. **Aufgabe beschreiben:** In wenigen Sätzen festhalten: *Warum? Was genau? Was ausdrücklich nicht? Woran erkennen wir, dass es fertig ist?* Mindestens einen erlaubten, einen abgelehnten und gegebenenfalls einen Neustart-Fall formulieren.
3. **Erst verstehen, dann bauen:** KI darf einen Vorschlag für Dateien, Datenfluss, Regeln und Tests machen. Ein Mensch prüft die erwarteten Ergebnisse. Falsche Tests werden gegen die beschlossenen Regeln korrigiert, nicht bloß für grüne Ausgabe abgeschwächt.
4. **Klein umsetzen:** Eine überschaubare Aufgabe pro Branch. Spiellogik von Bildschirm und Speicherung trennen, damit wir Regeln ohne Klicks testen können. Keine unnötigen Dienste oder komplizierten Abstraktionen einführen.
5. **Selbst prüfen:** Tests ausführen, die App durchklicken, einen ungültigen Zug ausprobieren und gespeicherten Fortschritt nach einem echten App-Neustart prüfen. Ein Browser-Refresh allein ist kein Neustart-Test.
6. **Erklären und dokumentieren:** Vor dem Commit festhalten, welche Dateien geändert wurden, was jede Änderung bewirkt, wer die Idee/Umsetzung lieferte, welche KI beteiligt war, welche Tests tatsächlich liefen und welches Ergebnis sie hatten. Behauptungen durch Commit, Pull Request, Testausgabe oder Screenshot belegbar machen.
7. **Gemeinsam prüfen:** Branch pushen, Pull Request nach `main` öffnen, eine andere Person den Code und die Erklärung lesen lassen, Fragen klären, dann mergen. Anschließend `main` lokal aktualisieren und die README bei geänderten Entscheidungen ergänzen.

**Verständnis-Check für jedes Mitglied:** Wo startet die Aktion? Welche Eingabe wird geprüft? Welche Regel entscheidet? Welche Daten ändern sich? Wo werden sie gespeichert? Was passiert bei ungültiger Eingabe oder fehlender API-Antwort? Welcher Test belegt das? Wenn wir das nicht in einfachen Worten beantworten können, ist die Aufgabe noch nicht abgeschlossen.

## Dokumentationsregel: jede relevante Aktion nachvollziehbar machen

Git speichert **welche Dateien** sich wann durch einen Commit änderten. Es erklärt nicht automatisch **warum**, was eine KI vorschlug, welche Alternativen verworfen wurden oder wie ein Test manuell verlief. Deshalb dokumentieren wir Entscheidungen und Prüfungen zusätzlich. Für jede Aufgabe gehört eine kurze, dauerhaft im Repository gespeicherte Notiz in `docs/arbeitsprotokoll.md` (Datei bei der ersten Implementierungsaufgabe anlegen). Ein Link auf einen Chat ist ergänzende Quelle, kein Ersatz für die Zusammenfassung: Links können unzugänglich werden oder spätere Nachrichten nicht enthalten.

Vorlage für einen Eintrag:

```markdown
### YYYY-MM-DD – Kurzer Titel
- Beteiligte: Namen/Initialen; KI-Werkzeug und Chat-Link, falls verwendet
- Ausgangslage und Ziel: Was war vorher vorhanden? Was sollte sich ändern?
- Entscheidung und Grund: Welche Regel, Technik oder Gestaltung wurde gewählt? Was wurde verworfen?
- Umsetzung: Branch/PR/Commit und betroffene Dateien; was passiert dort in einfachen Worten?
- Prüfung: genauer Befehl oder Klickfolge, tatsächliches Ergebnis, Fehler und Korrektur
- Verständnis: Wer hat die Änderung erklärt oder gegengeprüft? Offene Fragen?
```

Dokumentiert auch GitHub-Aktionen (Repository angelegt, Branch gepusht, PR geprüft/gemergt), Beiträge anderer Teammitglieder, Datenquellen und Lizenzen, Hosting-Änderungen sowie Hilfe durch KI. **Nichts rückwirkend erfinden.** Unbekannte Zeitpunkte, Beteiligte oder Testergebnisse als „nicht dokumentiert“ markieren und nachfragen. Vor jedem Merge prüfen, ob die Notiz und README zum tatsächlichen Stand passen. Kurze Notizen nach jeder Aufgabe sind zuverlässiger als ein Rekonstruktionsversuch am Semesterende.

### Bisher nachvollziehbare Projektgeschichte

| Zeitpunkt/Beleg | Was geschah | Was wir daraus wissen |
|---|---|---|
| [Ideenvergleich](https://chatgpt.com/share/6aedc9ea-ef64-83eb-9a0e-0dd42623f0f8) | Zwölf Konzepte verglichen; Museum Mystery empfohlen. | Spielregeln, Met-API und Login waren Vorschläge, kein implementierter Code. |
| 09.11.2026 · [Initial commit](https://github.com/florianstodden-afk/Museum-Mystery/commit/aaf0940) | GitHub-Repository `Museum-Mystery` entstand mit einer kurzen README. | Die exakte Einrichtung durch die anlegende Person ist hier nicht weiter dokumentiert. |
| 09.11.2026 · [Dokumentations-Commit](https://github.com/florianstodden-afk/Museum-Mystery/commit/070fe3c) | Dieser lokale Gruppenordner wurde über **HTTPS** mit dem bestehenden Repository verbunden; eine ausführliche deutsche Setup-README entstand im Branch `docs/project-readme`. | SSH war mangels hinterlegtem öffentlichem Schlüssel nicht eingerichtet; `gh` war lokal nicht installiert. Normales Git über HTTPS funktionierte. |
| 09.11.2026 · [Pull Request #1](https://github.com/florianstodden-afk/Museum-Mystery/pull/1) / [Merge-Commit](https://github.com/florianstodden-afk/Museum-Mystery/commit/0c4cf0a) | Die README wurde in `main` übernommen; danach wurde `main` lokal aktualisiert und der erledigte **lokale** Dokumentations-Branch gelöscht. | Der Remote-Branch existierte bei der letzten Prüfung noch. Ob er später gelöscht wurde, muss aktuell geprüft werden. |
| Diese README-Überarbeitung | Kursziel, Museum-Mystery-Entwurf und Dokumentationsablauf werden an einem Ort erklärt. | Dieser Eintrag beschreibt die aktuelle Arbeit und braucht nach einem späteren Commit den zugehörigen Beleg. |

Der geteilte Chat ist eine Momentaufnahme der **Ideenwahl**. Er dokumentiert keine danach erfolgte Implementierung. Für neue Änderungen gilt immer der aktuelle Repository-Stand.

## Git und GitHub in einfachen Worten

`main` ist die gemeinsame Hauptversion. Ein **Branch** ist ein eigener Arbeitszweig für eine Aufgabe. Ein **Commit** speichert einen benannten Stand zunächst lokal. **Push** lädt Commits zu GitHub hoch. **Pull** holt neue Änderungen von GitHub herunter. Ein **Pull Request (PR)** schlägt vor, den Arbeitszweig nach Prüfung in `main` zu übernehmen; **Merge** führt ihn dort tatsächlich zusammen. Ein Push allein ändert `main` nicht.

```text
GitHub/main → pull → eigener Computer → Branch → ändern und testen
                                                   → commit → push → PR → Review → Merge nach main
```

Im Projektordner vor einer neuen Aufgabe:

```powershell
git switch main
git pull --ff-only origin main
git switch -c feature/kurzer-name
```

Nach Änderungen:

```powershell
git status
git diff
git add README.md
git commit -m "Explain project workflow"
git push -u origin feature/kurzer-name
```

`git add README.md` ist nur ein Beispiel: immer die **tatsächlich geänderten Dateien** auswählen. Auf GitHub den PR von diesem Branch nach `main` öffnen, die Änderung und die Prüfung erklären und nach Review mergen. Danach:

```powershell
git switch main
git pull --ff-only origin main
```

Bei einem Konflikt nicht blind überschreiben oder `--force` verwenden; gemeinsam die betroffenen Zeilen und Absichten klären. Vor dem ersten Push `git remote -v` prüfen: `origin` muss `https://github.com/florianstodden-afk/Museum-Mystery.git` sein.

Weitere Teammitglieder klonen über HTTPS:

```powershell
git clone https://github.com/florianstodden-afk/Museum-Mystery.git
cd Museum-Mystery
```

Das vorhandene Repository wird nicht noch einmal mit `git init` begonnen. `gh repo clone ...` wäre nur mit installierter und angemeldeter GitHub-CLI nötig; normales `git clone` genügt. Eine SSH-Adresse (`git@github.com:...`) setzt einen im GitHub-Konto hinterlegten SSH-Schlüssel voraus.

## Technischer Start und aktueller Zustand

Die [Kurs-Einrichtung](https://nova-sbe-introduction-to-programming.github.io/intro-to-programming-2026/setup.html) verwendet **uv, Python, Codex und Streamlit**. Die [Solo-Projekt-Anleitung](https://nova-sbe-introduction-to-programming.github.io/intro-to-programming-2026/weeks/week-05/index.html) nennt für eine erste App Python, Streamlit, SQLite und pytest sowie die Trennung von Oberfläche, Regeln, Speicherung und Tests. Wir können diese vertraute Struktur als Ausgangspunkt nehmen, sofern sie zu unserem Teamprojekt passt.

**Noch nicht vorhanden:** `app.py`, `pyproject.toml`, `uv.lock`, `.gitignore`, `tests/`, Datenbank und Deployment. Deshalb funktionieren Start- und Testbefehle derzeit noch nicht. Erst nach der technischen Entscheidung und dem Anlegen der Dateien gilt beispielsweise:

```powershell
uv sync
uv run streamlit run app.py
uv run pytest
```

Eine spätere `.gitignore` soll `.venv/`, Python-Caches, lokale SQLite-Dateien (`*.db`, `*.sqlite*`) und Geheimnisse ausschließen. `pyproject.toml` und `uv.lock` gehören dagegen ins Repository. Beispieldaten und reproduzierbare Initialisierung können versioniert werden; persönliche oder lokale Datenbanken nicht. API-Bilder und Metadaten müssen auf Eignung, Quellenangabe und Nutzungsrechte geprüft werden. Die im Ideenvergleich genannten API-Bedingungen waren eine Prüfung vom **6. November 2026** und sind vor dem konkreten Einsatz erneut anhand der [offiziellen Met-Dokumentation](https://metmuseum.github.io/) zu prüfen.

## Nächste gemeinsame Entscheidungen

1. Teamgröße, Zeitplan und genaue Anforderungen der Lehrperson bestätigen; insbesondere klären, ob Login und API-Integration Pflicht sind oder aus unserem eigenen Ideenkonzept stammen. Die öffentlich erreichbare Bewertungsseite nennt diese beiden Punkte nicht ausdrücklich.
2. Den kleinsten vollständigen Fall spezifizieren: Kandidaten, eindeutig lösbare Hinweise, gültige und ungültige Aktionen, Punkte und Neustart-Verhalten. Die erwarteten Tests vor dem Code besprechen.
3. Technische Lösung für getrennte Konten, gemeinsame gespeicherte Ergebnisse und öffentliche Demo-URL wählen und verständlich begründen.
4. Ein erstes vollständiges Spielstück mit wenigen kuratierten Werken bauen, testen und durchklicken. Danach erst auf drei Fälle erweitern.
5. Nach **jeder** Aufgabe Protokoll, README und PR-Erklärung aktualisieren. Vor der Präsentation lässt jedes Mitglied eine fremde Funktion und den gesamten Spielweg erklären.

## Für einen neuen KI-Chat

Kopiere als Auftrag: „Lies zuerst die README und den aktuellen Stand des Repositories Museum Mystery. Nenne mir in einfachen Worten, was bereits umgesetzt ist und was nur geplant ist. Bearbeite dann ausschließlich **[konkrete Aufgabe]** auf einem eigenen Branch. Erkläre jede Änderung, prüfe sie und ergänze die Dokumentation so, dass jedes Teammitglied sie später erklären kann.“

**Regel für KI und Team:** Behauptungen über erledigte Arbeit nur mit Datei, Commit, PR oder tatsächlichem Prüfergebnis belegen. Wenn eine Quelle nicht zugänglich ist, die Lücke nennen. Keine Funktion als fertig bezeichnen, nur weil sie in dieser README als Idee steht.
