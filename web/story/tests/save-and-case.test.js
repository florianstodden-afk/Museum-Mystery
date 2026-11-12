import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, readMission, solveStation, addNote } from '../engine.js';
import { serialize, deserialize } from '../save.js';
import { CASE, STATION_IDS, CODEWORD, workById } from '../case-1.js';

test('a saved game comes back exactly the same', () => {
  let s = readMission(newGame()).state;
  s = solveStation(s, 'portraits', { mistakes: 1, hints: 1 }).state;
  s = addNote(s, 'transport-cart').state;
  assert.deepEqual(deserialize(serialize(s)), s);
});

test('broken or foreign text is rejected', () => {
  for (const text of ['', 'not json', 'null', '42', '[]', '{"a":1}', undefined]) {
    assert.equal(deserialize(text), null, String(text));
  }
});

test('an old case version is rejected', () => {
  const old = { ...newGame(), caseVersion: 0 };
  assert.equal(deserialize(JSON.stringify(old)), null);
});

test('impossible states are rejected', () => {
  const cheat = newGame();
  cheat.letters = ['B', null, null, null]; // letter without a solved station
  assert.equal(deserialize(JSON.stringify(cheat)), null);

  const earlySafe = newGame();
  earlySafe.safe.open = true; // safe open without stations
  assert.equal(deserialize(JSON.stringify(earlySafe)), null);

  const badEnding = newGame();
  badEnding.ending = 'heist'; // ending without an answer
  assert.equal(deserialize(JSON.stringify(badEnding)), null);

  const badNote = newGame();
  badNote.notes = ['transport-cart', 'transport-cart'];
  assert.equal(deserialize(JSON.stringify(badNote)), null);

  const negative = newGame();
  negative.stations.landscape.mistakes = -1;
  assert.equal(deserialize(JSON.stringify(negative)), null);
});

test('case data: four stations spell BILD in the fixed order', () => {
  assert.deepEqual(CASE.stations.map(s => s.id), STATION_IDS);
  assert.equal(CASE.stations.map(s => s.letter).join(''), CODEWORD);
  assert.equal(Object.isFrozen(CASE.stations[0]), true);
});

test('case data: every station artwork exists in the work list', () => {
  for (const station of CASE.stations) {
    for (const id of station.metIds) assert.ok(workById(id), `missing work ${id}`);
  }
  assert.equal(CASE.works.length, 6);
  assert.equal(workById(436535).date, '1889');
});
