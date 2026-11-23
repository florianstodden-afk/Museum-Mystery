# Contract for stations (mini-games) – Museum Nocturne

> **Historical station integration plan.** The station numbers, room names and example files below belong to an earlier design. The [current play guide](../../README.md#how-to-play) lists the four released stations in walking order.

This contract applies to stations 2–4 (**Portrait Hall**, **Conservation Studio**, **Frame Archive**) and describes how each station is connected to the story engine in `web/story/`. Station 1 (`web/minigames/landscape.js`) already fulfils it.

## In short

1. Your file lives in `web/minigames/<name>.js` (e.g. `portraits.js`, `restoration.js`, `archive.js`). These names belong to you; the story logic does not create them.
2. It exports **one** function:

   ```js
   export function start(container, caseData, onSolved) { … }
   ```

3. When the station is solved, you call **once**:

   ```js
   onSolved({ mistakes, hints });
   ```

   That is all. **The engine hands out the letter, evidence and points**, not the station. If you also send `letter`, `evidence` or `points`, they are ignored.

## What you get

| Parameter | Meaning |
|---|---|
| `container` | An empty HTML element. Draw your station only into it (`container.replaceChildren(…)`). |
| `caseData.stationId` | `"portraits"`, `"restoration"` or `"archive"`. |
| `caseData.state` | Your saved progress, or `undefined` on the first start. |
| `caseData.onChange(progress)` | Call this after **every** change (wrong try, hint). The host saves `progress`. Recommended format: `{ mistakes, hints, solved }`. |
| `onSolved(result)` | Call once when the station is solved. |

## What you should NOT do

- no `localStorage` – the host saves through `onChange`;
- no points calculation that is counted somewhere else (a display “−3 points” for players is fine);
- no changes to elements outside `container`;
- no own windows/overlays – the host already opens the station in a dialog.

## Minimal example

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

## Trying it out without the main game

In `web/dev/story.html`, stations 2–4 open with the placeholder `web/story/placeholder-station.js`. To test your station there, one line in `web/dev/story-preview.js` is enough: import your module and add it to `createStoryHost({ stations: { … } })`, e.g. `stations: { landscape: landscapeStation, archive: archiveStation }`. Stations without an entry automatically get the placeholder.

The adapter `openStation` in `web/story/stations.js` translates your report. It accepts:

- **Target format:** `onSolved({ mistakes, hints })`
- **Old format** (like `landscape.js`): `onSolved({ letter, evidence, points })` + progress through `caseData.onChange({ mistakes, hints, … })`

A second call of `onSolved` is ignored.

## Checklist “When is my station done?”

- [ ] The file exports `start(container, caseData, onSolved)`.
- [ ] The rules (right/wrong, hint) are **pure functions** without DOM and have tests in `web/minigames/<name>.test.js`; `cd web && node --test` is green.
- [ ] `caseData.onChange(progress)` is called after every wrong try and hint.
- [ ] Saved progress from `caseData.state` is shown again at the start.
- [ ] `onSolved({ mistakes, hints })` is called exactly once.
- [ ] Nobody can get stuck for good (e.g. hint button, unlimited tries).
- [ ] All texts in English; art data comes from the Met (ID in `web/story/case-1.js`).
- [ ] The station works in a narrow container (phone width, about 360 px).
- [ ] Usable with the keyboard (buttons are real `<button>`, forms real `<label>`).
- [ ] Played through once in `web/dev/story.html`: the letter appears in the right place in the journal.

## Content of the stations (from the concept)

| Station | id | Letter | Evidence (handed out by the engine) | Works (Met ID) |
|---|---|---|---|---|
| Portrait Hall | `portraits` | I | Night-shift log: Leon was on the east stairs at 21:14, when the cart left. The cart was booked as a ‘patron visit’. | 436121, 12127, 435876 (**done:** `web/minigames/portrait-timeline.js`) |
| Gallery, left painting | `restoration` | L | Hidden mark “V” on the fake transport slip. | 435882 |
| Gallery, frame rack | `archive` | D | Frame label: “Ordered by: A. V.” | 435882 (since 15.11.2026; before that 436121, which Station I now uses) |

Station I (Portrait Hall) fulfils this contract as the second example after Station B: three files (`portrait-rules.js` pure rules, `portrait-artwork.js` Met API with checks and offline copy, `portrait-timeline.js` interface) plus `portrait-timeline.test.js`. The right order comes from the frozen fields `objectBeginDate`/`objectEndDate` in `case-1.js`, never from live data.

**Note for Station L:** Station D now uses 435882 (Cézanne, Still Life). If Station L gets its own work, please **add** the new work to `works` and leave 435882 there. Otherwise Station D points to nothing; the test “every station artwork exists in the work list” reports that.

The assignment of works to stations 2–4 is an assumption of the story logic (the concept only names the list of works). If you use other works, please adjust `metIds` in `web/story/case-1.js`.


Station L integration: host preserves cleanup and saved progress. Renoir completion time awards 15 (<=30s), 10 (<=45s), 5 (<=60s), or 0 points. Other stations keep standard scoring; total maximum is 90 (since Station I is timed too). Saved completed legacy L rewards are capped at 15; unfinished puzzles award nothing.

**Station I as a speedrun (17.11.2026):** Like Station L, Station I only reports `onSolved({ mistakes, hints })` and saves its time in the progress (`startedAt`, `finishedAt`, `penaltyMs`). `synchronizeScore` in `scoring.js` sets the points from this time: `portraitSpeedPoints` gives 15 (≤ 20 s), 10 (≤ 35 s), 5 (≤ 50 s) or 0. Solved without a saved time (old save) → 5. The clock starts with “Start”, keeps running when closed and stops when solved; Peek and a wrong check cost 5 s each. `hints` counts the peeks.
