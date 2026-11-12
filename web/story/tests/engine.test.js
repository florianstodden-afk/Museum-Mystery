import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newGame, readMission, solveStation, addNote, canOpenSafe, tryOpenSafe,
  accuse, chooseEnding, nextStep, isComplete,
} from '../engine.js';

// Small helper: runs an action and fails the test if it was not ok.
function must(result) {
  assert.equal(result.ok, true, result.message);
  return result.state;
}

function withAllStations() {
  let s = must(readMission(newGame()));
  for (const id of ['landscape', 'portraits', 'restoration', 'archive']) s = must(solveStation(s, id, { mistakes: 0, hints: 0 }));
  return s;
}

function atFinalChoice() {
  let s = must(tryOpenSafe(withAllStations(), 'BILD'));
  return must(accuse(s, 'voss'));
}

test('a new game starts empty with four fixed letter slots', () => {
  const s = newGame();
  assert.equal(s.caseVersion, 1);
  assert.equal(s.missionRead, false);
  assert.deepEqual(s.letters, [null, null, null, null]);
  assert.deepEqual(s.evidence, []);
  assert.equal(s.ending, null);
  assert.equal(nextStep(s), 'Read the message from M.');
});

test('stations can only be solved after reading the mission', () => {
  const s = newGame();
  const result = solveStation(s, 'landscape', {});
  assert.equal(result.ok, false);
  assert.equal(result.state, s);
});

test('letters land in their fixed slot regardless of station order', () => {
  let s = must(readMission(newGame()));
  s = must(solveStation(s, 'archive', {}));
  assert.deepEqual(s.letters, [null, null, null, 'D']);
  s = must(solveStation(s, 'portraits', {}));
  assert.deepEqual(s.letters, [null, 'I', null, 'D']);
  assert.deepEqual(s.evidence, ['frame-label', 'shift-log']);
});

test('solving a station twice changes nothing', () => {
  let s = must(readMission(newGame()));
  s = must(solveStation(s, 'landscape', { mistakes: 1, hints: 0 }));
  const again = solveStation(s, 'landscape', { mistakes: 0, hints: 0 });
  assert.equal(again.ok, false);
  assert.equal(again.state, s);
  assert.equal(s.stations.landscape.points, 17);
});

test('actions never change the state object they receive', () => {
  const before = must(readMission(newGame()));
  const snapshot = structuredClone(before);
  solveStation(before, 'landscape', { mistakes: 2, hints: 1 });
  addNote(before, 'transport-cart');
  assert.deepEqual(before, snapshot);
});

test('unknown station, note, suspect and ending are rejected without change', () => {
  const s = atFinalChoice();
  for (const result of [solveStation(s, 'kitchen', {}), addNote(s, 'nope'), chooseEnding(s, 'happy')]) {
    assert.equal(result.ok, false);
    assert.equal(result.state, s);
  }
  const safeOpen = must(tryOpenSafe(withAllStations(), 'BILD'));
  const unknown = accuse(safeOpen, 'imani');
  assert.equal(unknown.ok, false);
  assert.equal(unknown.state, safeOpen);
});

test('a note is added once and gives no letter', () => {
  let s = newGame();
  s = must(addNote(s, 'transport-cart'));
  const twice = addNote(s, 'transport-cart');
  assert.equal(twice.ok, false);
  assert.equal(twice.state, s);
  assert.deepEqual(s.notes, ['transport-cart']);
  assert.deepEqual(s.letters, [null, null, null, null]);
});

test('the safe needs all four stations, even with the right word', () => {
  let s = must(readMission(newGame()));
  for (const id of ['landscape', 'portraits', 'restoration']) s = must(solveStation(s, id, {}));
  assert.equal(canOpenSafe(s), false);
  const result = tryOpenSafe(s, 'BILD');
  assert.equal(result.ok, false);
  assert.equal(result.state, s);
});

test('the safe accepts BILD in any case and with spaces', () => {
  for (const word of ['BILD', 'bild', ' b i l d ', 'Bild']) {
    const result = tryOpenSafe(withAllStations(), word);
    assert.equal(result.ok, true, word);
    assert.equal(result.state.safe.open, true);
    assert.equal(result.state.safe.attempts, 0);
  }
});

test('a wrong word counts as an attempt and can be corrected', () => {
  const s = withAllStations();
  assert.equal(canOpenSafe(s), true);
  const wrong = tryOpenSafe(s, 'DLIB');
  assert.equal(wrong.ok, false);
  assert.equal(wrong.message, 'The lock does not move. Check the order in your journal.');
  assert.equal(wrong.state.safe.attempts, 1);
  assert.equal(s.safe.attempts, 0, 'the old state is untouched');
  const right = must(tryOpenSafe(wrong.state, 'bild'));
  assert.equal(right.safe.open, true);
  assert.equal(right.safe.attempts, 1);
});

test('an empty word is rejected without counting', () => {
  const s = withAllStations();
  const result = tryOpenSafe(s, '   ');
  assert.equal(result.ok, false);
  assert.equal(result.state, s);
});

test('the final question is only possible after the safe is open', () => {
  const s = withAllStations();
  const result = accuse(s, 'voss');
  assert.equal(result.ok, false);
  assert.equal(result.state, s);
});

test('a wrong accusation names the evidence against it and allows a new try', () => {
  const open = must(tryOpenSafe(withAllStations(), 'BILD'));
  const leon = accuse(open, 'leon');
  assert.equal(leon.ok, false);
  assert.match(leon.message, /night-shift log/);
  const vale = accuse(leon.state, 'vale');
  assert.equal(vale.ok, false);
  assert.match(vale.message, /Ordered by: A\. Voss/);
  assert.equal(vale.state.accusation.attempts, 2);
  const voss = must(accuse(vale.state, 'voss'));
  assert.equal(voss.accusation.solved, true);
});

test('endings are only possible after the right answer', () => {
  const open = must(tryOpenSafe(withAllStations(), 'BILD'));
  const early = chooseEnding(open, 'heist');
  assert.equal(early.ok, false);
  assert.equal(early.state, open);
});

test('both endings are reachable', () => {
  const heist = must(chooseEnding(atFinalChoice(), 'heist'));
  const openFile = must(chooseEnding(atFinalChoice(), 'open-file'));
  assert.equal(heist.ending, 'heist');
  assert.equal(openFile.ending, 'open-file');
  assert.equal(isComplete(heist), true);
  assert.equal(isComplete(atFinalChoice()), false);
});

test('after an ending every action is locked until newGame()', () => {
  const done = must(chooseEnding(atFinalChoice(), 'open-file'));
  const attempts = [
    readMission(done), solveStation(done, 'landscape', {}), addNote(done, 'duty-roster'),
    tryOpenSafe(done, 'BILD'), accuse(done, 'voss'), chooseEnding(done, 'heist'),
  ];
  for (const result of attempts) {
    assert.equal(result.ok, false);
    assert.equal(result.state, done);
  }
  assert.equal(newGame().ending, null);
});

test('next step follows the story', () => {
  let s = must(readMission(newGame()));
  assert.match(nextStep(s), /Landscape Gallery, Portrait Hall, Conservation Studio, Frame Archive/);
  s = withAllStations();
  assert.match(nextStep(s), /Open the safe/);
  s = must(tryOpenSafe(s, 'BILD'));
  assert.match(nextStep(s), /final question/);
  s = must(accuse(s, 'voss'));
  assert.match(nextStep(s), /Decide/);
  s = must(chooseEnding(s, 'heist'));
  assert.match(nextStep(s), /Case closed/);
});

test('the right answer explains who M is and why you were sent', () => {
  const open = must(tryOpenSafe(withAllStations(), 'BILD'));
  const result = accuse(open, 'voss');
  assert.match(result.message, /mécène/);
  assert.match(result.message, /sent you/);
});
