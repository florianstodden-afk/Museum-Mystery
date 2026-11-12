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
  s = tryOpenSafe(s, 'BILD').state; steps.push(s);
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
  assert.match(hintFor(s, 1).text, /Portrait Hall, Conservation Studio, Frame Archive/);
  assert.match(hintFor(s, 2).text, /shift schedule/);
  s = addNote(s, 'duty-roster').state;
  assert.match(hintFor(s, 2).text, /Portrait Hall: Read the night-shift log/);
});

test('the safe hint gives the letters after two wrong words', () => {
  let s = allSolved();
  assert.doesNotMatch(hintFor(s).text, /B – I – L – D/);
  s = tryOpenSafe(s, 'DLIB').state;
  s = tryOpenSafe(s, 'LIBD').state;
  assert.match(hintFor(s).text, /B – I – L – D/);
});

test('the accusation hint points to the frame label after two wrong answers', () => {
  let s = tryOpenSafe(allSolved(), 'BILD').state;
  assert.doesNotMatch(hintFor(s).text, /frame label/);
  s = accuse(s, 'leon').state;
  s = accuse(s, 'vale').state;
  assert.match(hintFor(s).text, /frame label/);
});

test('asking for a hint never changes state or score', () => {
  const s = allSolved();
  const before = structuredClone(s);
  hintFor(s, 2);
  assert.deepEqual(s, before);
  assert.equal(totalScore(s), 80);
});
