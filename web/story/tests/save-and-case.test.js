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
  assert.equal(CASE.works.length, 8);
  assert.equal(workById(436535).date, '1889');
});

import { ROOMS, stationPlace } from '../case-1.js';
test('every station stands in a room that exists in the game, and Gallery stations name their spot', () => {
  for (const station of CASE.stations) assert.ok(ROOMS.includes(station.room), `${station.id}: ${station.room}`);
  assert.deepEqual(CASE.stations.map(stationPlace), ['Gallery, middle painting', 'Portrait Hall', 'Gallery, left painting', 'Gallery, frame rack']);
  const gallery = CASE.stations.filter(s => s.room === 'Gallery');
  assert.equal(new Set(gallery.map(s => s.spot)).size, gallery.length, 'each Gallery station has its own spot');
});

test('case data: Portrait Hall shows Ingres, Degas, Sargent and Cézanne with verified Met dates', () => {
  const portraits = CASE.stations.find(s => s.id === 'portraits');
  assert.deepEqual(portraits.metIds, [436703, 436121, 12127, 435876]);
  const dates = portraits.metIds.map(id => {
    const work = workById(id);
    return [work.objectBeginDate, work.objectEndDate, work.datesChecked];
  });
  assert.deepEqual(dates, [[1823, 1823, '2026-11-18'], [1865, 1865, '2026-11-15'], [1883, 1884, '2026-11-15'], [1888, 1890, '2026-11-15']]);
});

test('case data: Station D no longer repeats a Portrait Hall work', () => {
  const portraits = CASE.stations.find(s => s.id === 'portraits').metIds;
  const archive = CASE.stations.find(s => s.id === 'archive').metIds;
  assert.deepEqual(archive, [435882]);
  assert.equal(archive.some(id => portraits.includes(id)), false);
});
