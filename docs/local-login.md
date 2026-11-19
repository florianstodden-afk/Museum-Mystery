# Lokale Profile: Anmeldung und Spielstart

**Stand: 19.11.2026, Branch `codex/local-login-screens`.** Dieser Text beschreibt die Änderung für den Pull Request. Auf der veröffentlichten Seite gilt sie erst nach dem Merge und der Veröffentlichung durch GitHub Pages.

## Ablauf für Spieler

1. Beim Öffnen erscheint die Auswahl **Log In** / **Sign Up** auf der bisherigen Bildvorlage.
2. **Sign Up** zeigt Florians neues Sign-Up-Bild mit echten Eingabefeldern für Benutzername und Passwort. Der Benutzername besteht aus 3 bis 24 Buchstaben, Zahlen, `_` oder `-`. Das Passwort hat 8 bis 128 Zeichen. **SUBMIT** erstellt ein Profil in diesem Browser und öffnet den Home Screen.
3. **Log In** zeigt die separate Log-In-Bildvorlage. **SUBMIT** prüft die auf diesem Gerät gespeicherten Daten und öffnet den Home Screen. Ein falsches Passwort lässt den Spieler auf dem Formular.
4. Im Home Screen startet **Start New Game** den Fall mit Ms Nachricht; **Resume Game** setzt einen vorhandenen Spielstand dieses Profils fort. Unter **Settings → Switch profile** gelangt man zur Anmeldung zurück.
5. **Continue as guest** ist weiterhin möglich. Gäste verwenden den bisherigen gemeinsamen lokalen Gast-Spielstand.

## Wo die Daten liegen und was nicht möglich ist

Die Profile liegen im `localStorage` dieses Browsers. Das Passwort wird vor dem Speichern mit PBKDF2/SHA-256 und einem zufälligen Salt in einen Prüfwert umgewandelt; der Klartext wird nicht gespeichert. Die aktive Profilauswahl liegt im `sessionStorage`. Jeder Benutzername erhält einen separaten lokalen Spielstand, eine separate Position und einen separaten Bestwert. Sound- und Musikeinstellungen gelten für den Browser.

Diese Lösung ist **nur eine lokale Spielprofil-Funktion, kein Online-Login**. Sie bietet keine Konten auf mehreren Geräten, keine zentrale Passwort-Zurücksetzung und keinen gemeinsamen Multiplayer-Spielstand. Browserdaten löschen oder ein anderes Gerät verwenden entfernt beziehungsweise verbirgt die lokalen Profile und Spielstände. **Forgot Password?** erklärt im Spiel, dass eine automatische Wiederherstellung nicht möglich ist. Benutzer sollten kein wichtiges Passwort wiederverwenden.

GitHub Pages liefert statische Dateien aus. Die Seite kann neue Registrierungen nicht direkt in das GitHub-Repository schreiben. Es wurden deshalb keine Zugangsdaten in GitHub eingecheckt. Ein geräteübergreifendes Konto oder eine echte gemeinsame Rangliste erfordert später einen Dienst mit Datenbank und serverseitiger Anmeldung.

## Umsetzung

| Datei | Aufgabe |
| --- | --- |
| `web/assets/login-form-reference.jpg`, `web/assets/signup-screen-reference.jpg` | Von Florian Stodden bereitgestellte Bildvorlagen für die beiden Formulare. |
| `web/index.html`, `web/style.css` | Formularfelder und Knöpfe über den Bildern; auf kleinen Bildschirmen eine lesbare, bedienbare Formularkarte. |
| `web/local-auth.js` | Lokale Konten anlegen und prüfen, Passwort-Prüfwerte speichern, Speicher-Schlüssel je Profil bilden. |
| `web/main.js` | Auswahl → Formular → Home Screen → Spiel, Profilwechsel und getrennte Spielstände. |
| `web/local-auth.test.js` | Prüft Registrierung, Anmeldung, falsche Daten und getrennte Profil-Schlüssel. |

## Prüfung vor dem Pull Request

- Im lokalen Browser: Sign Up → Home Screen, Profilwechsel → Log In, falsches Passwort, korrektes Passwort → Home Screen.
- Beide bereitgestellten Formulargrafiken bei Desktopgröße visuell geprüft.
- `cd web && node --test`, `node --check web/main.js` und `git diff --check` geprüft; endgültige Testzahl steht im Pull Request.
