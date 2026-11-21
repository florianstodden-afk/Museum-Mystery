import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, readMission, solveStation, addNote, tryOpenSafe, accuse, chooseEnding } from '../engine.js';
import { hintFor } from '../hints.js';
import { totalScore } from '../scoring.js';

const ALL = ['landscape', 'portraits', 'restoration', 'archive'];

function allSolved() {
  let s = readMission(newGame()).state;
  for (const id of ALL) s = solveStation(s, id, {}).state;
  return s;
}

test('there is a hint for every step of the story', () => {
  let s = newGame();
  const steps = [s];
  s = readMission(s).state; steps.push(s);
  s = allSolved(); steps.push(s);
  s = tryOpenSafe(s, 'OILS').state; steps.push(s);
  s = accuse(s, 'voss').state; steps.push(s);
  s = chooseEnding(s, 'heist').state; steps.push(s);
  for (const step of steps) {
    for (const level of [1, 2]) {
      const h = hintFor(step, level);
      assert.equal(h.from, 'Imani');
      assert.ok(h.text.length > 20);
    }
  }
});

test('the first hint points to M’s message', () => {
  assert.match(hintFor(newGame()).text, /message from M/);
});

test('station hints name the open rooms and become concrete on level 2', () => {
  let s = readMission(newGame()).state;
  s = solveStation(s, 'landscape', {}).state;
  assert.match(hintFor(s, 1).text, /Still open: Portrait Hall; Gallery, left painting; Gallery, frame rack\./);
  assert.match(hintFor(s, 2).text, /shift schedule/);
  s = addNote(s, 'duty-roster').state;
  assert.match(hintFor(s, 2).text, /Portrait Hall: Put the four portraits in the order they were painted/);
});

test('the safe hint gives the letters after two wrong words', () => {
  let s = allSolved();
  assert.doesNotMatch(hintFor(s).text, /O – I – L – S/);
  s = tryOpenSafe(s, 'SLIO').state;
  s = tryOpenSafe(s, 'LIBD').state;
  assert.match(hintFor(s).text, /O – I – L – S/);
});

test('the accusation hint has two levels: line up the evidence, then patron + A. V.', () => {
  const s = tryOpenSafe(allSolved(), 'OILS').state;
  assert.match(hintFor(s, 1).text, /^Line up the four pieces of evidence/);
  assert.doesNotMatch(hintFor(s, 1).text, /A\. V\.|Voss/);
  assert.equal(hintFor(s, 2).text, 'A patron, initials A. V. – who fits both?');
  assert.doesNotMatch(hintFor(s, 2).text, /Voss/);
});

test('asking for a hint never changes state or score', () => {
  const s = allSolved();
  const before = structuredClone(s);
  hintFor(s, 2);
  assert.deepEqual(s, before);
  assert.equal(totalScore(s), 60); // B gives 20; I, L and D give 15 each
});
