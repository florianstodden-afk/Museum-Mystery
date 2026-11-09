# Museum Mystery

**Gruppenprojekt im Kurs Introduction to Programming**

Dieses Repository ist für das gemeinsam programmierte Spiel **Museum Mystery** vorgesehen. Es ist ein eigenständiges Gruppenprojekt und darf nicht mit dem Solo-Projekt **Plot Twist** vermischt werden.

GitHub-Repository: <https://github.com/florianstodden-afk/Museum-Mystery>

## 1. Voraussetzungen

Empfohlen werden:

- Python 3.11 oder neuer
- [uv](https://docs.astral.sh/uv/) für Python-Version, virtuelle Umgebung und Pakete
- Git
- ein GitHub-Konto
- ein Code-Editor, zum Beispiel Visual Studio Code

Installation prüfen:

```powershell
python --version
uv --version
git --version
```

Fehlt `uv`, kann es unter Windows in PowerShell installiert werden:

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Danach PowerShell neu öffnen und `uv --version` erneut ausführen.

## 2. Empfohlener Projektaufbau

Für ein kleines Spiel mit Streamlit, SQLite und pytest eignet sich zum Beispiel:

```text
Group Project/
├── app.py
├── game/
│   ├── __init__.py
│   ├── logic.py
│   └── database.py
├── tests/
│   └── test_logic.py
├── data/
│   └── .gitkeep
├── .gitignore
├── pyproject.toml
├── uv.lock
└── README.md
```

- `app.py`: Einstiegspunkt der Streamlit-App
- `game/`: Spiellogik und Datenbankzugriff, getrennt von der Oberfläche
- `tests/`: automatisierte Tests
- `data/`: lokale Laufzeitdaten; Datenbankdateien werden nicht committed
- `pyproject.toml`: Projekt- und Paketdefinition
- `uv.lock`: festgeschriebene Paketversionen; diese Datei wird committed

Der Aufbau kann angepasst werden, sobald die Spielidee und die Anforderungen feststehen.

## 3. Aktueller GitHub-Stand

Das gemeinsame Repository wurde bereits auf GitHub angelegt. Die Verbindung verwendet HTTPS:

```text
https://github.com/florianstodden-afk/Museum-Mystery.git
```

SSH wird derzeit nicht benötigt. Die Adresse `git@github.com:florianstodden-afk/Museum-Mystery.git` funktioniert erst, nachdem im GitHub-Konto ein öffentlicher SSH-Schlüssel hinterlegt wurde.

Weitere Teammitglieder klonen das Repository wie in Abschnitt 8 beschrieben. Sie führen in ihrem geklonten Ordner **nicht** zusätzlich `git init` aus.

## 4. Python-Projekt mit uv einrichten

Diese Schritte werden einmalig ausgeführt, nachdem geklärt ist, welcher lokale Ordner das gemeinsame Repository sein soll:

```powershell
uv init
uv add streamlit
uv add --dev pytest
```

`sqlite3` gehört bereits zur Python-Standardbibliothek und wird nicht separat installiert.

Nach einem Klonen oder Pull installiert beziehungsweise synchronisiert jedes Teammitglied die festgelegten Abhängigkeiten mit:

```powershell
uv sync
```

Alle Befehle sollten aus dem Projektordner ausgeführt werden. `uv run` verwendet automatisch die passende virtuelle Umgebung; eine manuelle Aktivierung ist normalerweise nicht nötig.

## 5. App starten und Tests ausführen

Streamlit-App starten:

```powershell
uv run python -m streamlit run app.py
```

Tests ausführen:

```powershell
uv run python -m pytest
```

Ausführlichere Testausgabe:

```powershell
uv run python -m pytest -v
```

Auf manchen Windows-Rechnern blockiert die Anwendungssteuerung den Python-Starter in `.venv`. Falls das passiert: zuerst `uv sync`, dann den installierten Python-Interpreter mit den Paketen der Projektumgebung verwenden. Die Python-Version in der folgenden Zeile muss zur Version der `.venv` passen:

```powershell
$env:PYTHONPATH = (Join-Path (Get-Location) '.venv\Lib\site-packages')
$python = uv python find --no-project --managed-python --system 3.14
& $python -m streamlit run app.py
# Für Tests: & $python -m pytest
```

Falls das Projekt am Ende keine Streamlit-Oberfläche oder keine SQLite-Datenbank benötigt, können diese Teile entfallen. Die Kernlogik sollte trotzdem möglichst unabhängig von der Oberfläche testbar bleiben.

## 6. `.gitignore` und lokale Datenbanken

Eine passende `.gitignore` sollte mindestens Folgendes enthalten:

```gitignore
# Virtuelle Python-Umgebung
.venv/

# Python-Zwischendateien
__pycache__/
*.py[cod]
.pytest_cache/

# Lokale Einstellungen und Geheimnisse
.env
.streamlit/secrets.toml

# Lokale SQLite-Datenbanken und Begleitdateien
*.db
*.sqlite
*.sqlite3
*.db-journal
*.db-shm
*.db-wal

# Betriebssystem und Editor
.DS_Store
Thumbs.db
.vscode/
.idea/
```

Grundregeln:

- `.venv/` niemals committen; sie wird mit `uv sync` neu erstellt.
- `pyproject.toml` und `uv.lock` committen, damit alle dieselben Abhängigkeiten verwenden.
- Lokale SQLite-Datenbanken nicht committen. Binäre Datenbankdateien führen schnell zu Merge-Konflikten und können persönliche Testdaten enthalten.
- Falls die App Startdaten braucht, stattdessen ein kleines SQL-Skript, JSON/CSV-Testdaten oder eine Initialisierungsfunktion committen.
- Passwörter, Tokens und API-Schlüssel niemals in Git speichern.
- Wurde eine Datenbank bereits committed, reicht ein Eintrag in `.gitignore` allein nicht; sie muss zusätzlich einmal aus dem Git-Index entfernt werden, zum Beispiel mit `git rm --cached data/game.db`. Vorher Dateiname und Pfad genau prüfen.

## 7. GitHub-Verbindung prüfen

Der ursprüngliche lokale Projektordner wird einmalig per HTTPS mit GitHub verbunden:

```powershell
git init
git branch -M main
git remote add origin https://github.com/florianstodden-afk/Museum-Mystery.git
git fetch origin main
```

Vor jedem ersten Push kontrollieren:

```powershell
git remote -v
git status
```

Als `origin` muss eindeutig `florianstodden-afk/Museum-Mystery` angezeigt werden, nicht **Plot Twist** oder ein anderes Repository.

## 8. Repository für weitere Teammitglieder klonen

Jedes weitere Teammitglied öffnet den gewünschten übergeordneten Ordner und klont über HTTPS:

```powershell
git clone https://github.com/florianstodden-afk/Museum-Mystery.git
cd Museum-Mystery
uv sync
uv run python -m pytest
uv run python -m streamlit run app.py
```

Falls `pyproject.toml`, Tests oder `app.py` noch nicht angelegt wurden, sind die letzten drei Befehle erst nach der entsprechenden Projekteinrichtung verfügbar.

## 9. Empfohlener täglicher Git-Ablauf

### 1. Vor der Arbeit aktualisieren

```powershell
git switch main
git pull --ff-only origin main
```

### 2. Einen eigenen Branch anlegen

Ein Branch sollte genau eine überschaubare Aufgabe enthalten:

```powershell
git switch -c feature/kurze-beschreibung
```

Beispiele: `feature/start-screen`, `feature/score-system`, `fix/database-path`.

### 3. Arbeiten und regelmäßig prüfen

```powershell
uv run python -m pytest
git status
git diff
```

### 4. Änderungen committen

```powershell
git add <GEAENDERTE-DATEIEN>
git commit -m "Add score calculation"
```

Nach Möglichkeit nur die tatsächlich zusammengehörenden Dateien hinzufügen. `git add .` ist bequem, sollte aber erst nach `git status` verwendet werden.

### 5. Aktuellen Stand von `main` übernehmen

```powershell
git fetch origin
git merge origin/main
```

Bei einem Konflikt die betroffenen Dateien gemeinsam prüfen, Konfliktmarkierungen entfernen, Tests ausführen und dann fortsetzen:

```powershell
git add <GELOESTE-DATEIEN>
git merge --continue
```

Falls der Merge abgebrochen werden soll:

```powershell
git merge --abort
```

### 6. Branch pushen

```powershell
git push -u origin feature/kurze-beschreibung
```

Bei diesem Ablauf ist kein Force-Push nötig. Falls Git dennoch einen Force-Push verlangt, zuerst im Team klären, warum die Branch-Historie abweicht.

### 7. Pull Request erstellen

Auf GitHub einen Pull Request vom eigenen Branch nach `main` öffnen:

- kurze, verständliche Beschreibung ergänzen
- erklären, wie die Änderung getestet wurde
- mindestens eine andere Person um Review bitten
- offene Kommentare klären
- erst mergen, wenn die Tests erfolgreich sind
- danach den Feature-Branch löschen

Danach lokal wieder aktualisieren:

```powershell
git switch main
git pull --ff-only origin main
git branch -d feature/kurze-beschreibung
```

## 10. Teamregeln, die Konflikte vermeiden

- Nicht direkt auf `main` arbeiten oder pushen.
- Pro Aufgabe einen kleinen Branch und einen überschaubaren Pull Request verwenden.
- Vor Arbeitsbeginn pullen und vor dem Push Tests ausführen.
- Nicht gleichzeitig dieselben großen Codebereiche bearbeiten, ohne sich abzusprechen.
- Datenbankdateien, virtuelle Umgebungen und Geheimnisse nicht committen.
- Keine Änderungen aus dem Solo-Projekt **Plot Twist** kopieren oder dessen Git-Remote verwenden, außer das Team und die Kursregeln erlauben ausdrücklich die Wiederverwendung einzelner eigener Inhalte.
- Commit-Nachrichten kurz und konkret im Imperativ formulieren, zum Beispiel `Add player validation`.

## 11. Typische Fehler und Lösungen

### `uv` wird nicht gefunden

PowerShell nach der Installation neu starten. Danach `uv --version` prüfen. Falls nötig, die offizielle uv-Installationsanleitung verwenden.

### `No such file or directory: app.py`

Der Befehl wurde wahrscheinlich im falschen Ordner ausgeführt oder die App-Datei heißt anders. Mit `Get-Location` und `Get-ChildItem` prüfen.

### `ModuleNotFoundError`

Zuerst `uv sync` ausführen. Prüfen, ob das Paket in `pyproject.toml` steht und ob der Befehl mit `uv run ...` gestartet wurde.

### SQLite meldet `database is locked`

Andere laufende App- oder Python-Prozesse schließen. Lange Schreibvorgänge vermeiden und Datenbankverbindungen zuverlässig schließen. Eine SQLite-Datei nicht über Git zwischen mehreren Personen synchronisieren.

### `failed to push some refs`

Der entfernte Branch enthält neue Änderungen. Nicht sofort erzwingen. Zuerst:

```powershell
git fetch origin
git merge origin/main
uv run python -m pytest
```

Danach den eigenen Feature-Branch erneut pushen.

### Merge- oder Rebase-Konflikt

Nicht raten und keine fremden Änderungen löschen. Konfliktmarkierungen (`<<<<<<<`, `=======`, `>>>>>>>`) sorgfältig auflösen, bei Unklarheit die betroffene Person fragen und danach alle Tests ausführen.

### Falsches Remote verbunden

Vor jedem ersten Push `git remote -v` prüfen. Falls noch nichts gepusht wurde, kann die Adresse nach sorgfältiger Kontrolle geändert werden:

```powershell
git remote set-url origin <ECHTE-GRUPPEN-REPO-URL>
```

Für dieses Projekt lautet der vollständige Befehl:

```powershell
git remote set-url origin https://github.com/florianstodden-afk/Museum-Mystery.git
```

### Eine ignorierte Datei erscheint weiterhin in Git

`.gitignore` wirkt nicht rückwirkend auf bereits getrackte Dateien. Mit `git status` und `git ls-files` prüfen und nur die konkrete Datei mit `git rm --cached <DATEI>` aus dem Index entfernen. Die lokale Datei bleibt dabei erhalten.

## 12. Vor dem ersten gemeinsamen Commit klären

- Wer hat Schreibzugriff beziehungsweise wurde als Collaborator eingeladen?
- Welche Python-Version verwendet der Kurs verbindlich?
- Ist Streamlit für die Oberfläche vorgesehen?
- Welche Daten sollen in SQLite gespeichert werden?
- Welche Mindesttests und Abgabekriterien verlangt der Kurs?
- Soll `main` auf GitHub durch Pull Requests und Reviews geschützt werden?
