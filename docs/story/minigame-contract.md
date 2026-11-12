# Vertrag für Stationen (Minispiele) – Museum Nocturne

Dieser Vertrag gilt für die Stationen 2–4 (**Portrait Hall**, **Conservation Studio**, **Frame Archive**) und beschreibt, wie jede Station an die Story-Engine in `web/story/` angeschlossen wird. Station 1 (`web/minigames/landscape.js`) erfüllt ihn bereits.

## Kurz gesagt

1. Deine Datei liegt in `web/minigames/<name>.js` (z. B. `portraits.js`, `restoration.js`, `archive.js`). Diese Namen gehören euch; die Story-Logik legt sie nicht an.
2. Sie exportiert **eine** Funktion:

   ```js
   export function start(container, caseData, onSolved) { … }
   ```

3. Wenn die Station gelöst ist, rufst du **einmal** auf:

   ```js
   onSolved({ mistakes, hints });
   ```

   Das ist alles. **Buchstabe, Beleg und Punkte vergibt die Engine**, nicht die Station. Wenn du zusätzlich `letter`, `evidence` oder `points` mitschickst, werden sie ignoriert.

## Was du bekommst

| Parameter | Bedeutung |
|---|---|
| `container` | Ein leeres HTML-Element. Zeichne deine Station nur hier hinein (`container.replaceChildren(…)`). |
| `caseData.stationId` | `"portraits"`, `"restoration"` oder `"archive"`. |
| `caseData.state` | Dein gespeicherter Zwischenstand oder `undefined` beim ersten Start. |
| `caseData.onChange(progress)` | Rufe das nach **jeder** Änderung auf (Fehlversuch, Hinweis). Der Host speichert `progress`. Empfohlenes Format: `{ mistakes, hints, solved }`. |
| `onSolved(result)` | Einmal aufrufen, wenn die Station gelöst ist. |

## Was du NICHT tun sollst

- kein `localStorage` – das Speichern macht der Host über `onChange`;
- keine Punkte berechnen, die irgendwo anders gezählt werden (eine Anzeige „−3 points“ für Spielende ist in Ordnung);
- keine Elemente außerhalb von `container` verändern;
- keine eigenen Fenster/Overlays öffnen – der Host öffnet die Station bereits in einem Dialog.

## Minimalbeispiel

```js
// web/minigames/archive.js
export function initialArchive() { return { mistakes: 0, hints: 0, solved: false }; }

// Pure rule, easy to test with node --test:
export function checkAnswer(state, answer) {
  if (state.solved) return state;
  if (answer === 'A. Voss') return { ...state, solved: true };
  return { ...state, mistakes: state.mistakes + 1 };
}

export function start(container, caseData, onSolved) {
  let state = caseData.state || initialArchive();
  container.replaceChildren();

  const question = document.createElement('p');
  question.textContent = 'Which name is on the frame label?';
  const choices = ['M. Vale', 'A. Voss', 'Leon'];
  const feedback = document.createElement('p');

  for (const name of choices) {
    const button = document.createElement('button');
    button.textContent = name;
    button.addEventListener('click', () => {
      state = checkAnswer(state, name);
      caseData.onChange(state);              // host saves progress
      if (state.solved) onSolved({ mistakes: state.mistakes, hints: state.hints });
      else feedback.textContent = 'Not quite. Look at the label again.';
    });
    container.append(button);
  }
  container.prepend(question);
  container.append(feedback);
}
```

## Ausprobieren ohne Hauptspiel

In `web/dev/story.html` werden Stationen 2–4 mit dem Platzhalter `web/story/placeholder-station.js` geöffnet. Um deine Station dort zu testen, reicht eine Zeile in `web/dev/story-preview.js`: dein Modul importieren und bei `createStoryHost({ stations: { … } })` eintragen, z. B. `stations: { landscape: landscapeStation, archive: archiveStation }`. Stationen ohne Eintrag bekommen automatisch den Platzhalter.

Der Adapter `openStation` in `web/story/stations.js` übersetzt deine Rückmeldung. Er akzeptiert:

- **Zielformat:** `onSolved({ mistakes, hints })`
- **Altes Format** (wie `landscape.js`): `onSolved({ letter, evidence, points })` + Fortschritt über `caseData.onChange({ mistakes, hints, … })`

Ein zweiter Aufruf von `onSolved` wird ignoriert.

## Checkliste „Wann ist meine Station fertig?“

- [ ] Datei exportiert `start(container, caseData, onSolved)`.
- [ ] Die Regeln (richtig/falsch, Hinweis) sind **reine Funktionen** ohne DOM und haben Tests in `web/minigames/<name>.test.js`; `cd web && node --test` ist grün.
- [ ] Nach jedem Fehlversuch und Hinweis wird `caseData.onChange(progress)` aufgerufen.
- [ ] Ein gespeicherter Zwischenstand aus `caseData.state` wird beim Start wieder angezeigt.
- [ ] `onSolved({ mistakes, hints })` wird genau einmal aufgerufen.
- [ ] Man kann nicht dauerhaft feststecken (z. B. Hinweis-Knopf, unbegrenzte Versuche).
- [ ] Alle Texte auf Englisch; Kunstdaten stammen aus der Met (ID in `web/story/case-1.js`).
- [ ] Die Station funktioniert in einem schmalen Container (Handy-Breite, ca. 360 px).
- [ ] Bedienbar mit Tastatur (Knöpfe sind echte `<button>`, Formulare echte `<label>`).
- [ ] In `web/dev/story.html` einmal durchgespielt: Buchstabe erscheint im Journal an der richtigen Stelle.

## Inhalt der Stationen (aus dem Konzept)

| Station | id | Buchstabe | Beleg (vergibt die Engine) | Werke (Met-ID) |
|---|---|---|---|---|
| Portrait Hall | `portraits` | I | Night-shift log: Leon was elsewhere; the transport was booked as a patron visit. | 12127, 435876 |
| Conservation Studio | `restoration` | L | Hidden mark “V” on the fake transport slip. | 435882 |
| Frame Archive | `archive` | D | Frame label: “Ordered by: A. Voss”. | 436121 |

Die Zuordnung der Werke zu den Stationen 2–4 ist eine Annahme der Story-Logik (das Konzept nennt nur die Werkliste). Wenn ihr andere Werke nehmt, bitte `metIds` in `web/story/case-1.js` anpassen.
