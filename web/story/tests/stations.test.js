import test from 'node:test';
import assert from 'node:assert/strict';
import { openStation, toEngineResult } from '../stations.js';
import * as placeholder from '../placeholder-station.js';
import { newGame, readMission, solveStation } from '../engine.js';
import { installFakeDom, createContainer, findButton, findAll } from './fake-dom.js';

// A fake station in the old progress format: progress through onChange,
// then onSolved({ letter, evidence, points }). One wrong answer, one hint, then solved.
const landscapeLike = {
  start(container, caseData, onSolved) {
    caseData.onChange({ ...(caseData.state || {}), mistakes: 1, hints: 0, solved: false });
    caseData.onChange({ mistakes: 1, hints: 1, solved: false });
    caseData.onChange({ mistakes: 1, hints: 1, solved: true });
    onSolved({ letter: 'O', evidence: 'The false wall label was approved by a patron – not by museum staff.', points: 12 });
    onSolved({ letter: 'O', evidence: 'twice', points: 12 }); // a buggy second call
  },
};

// A fake station in the target format.
const targetFormat = {
  start(container, caseData, onSolved) {
    onSolved({ mistakes: 2, hints: 1, letter: 'X', points: 999 });
  },
};

test('adapter reads mistakes and hints from station progress', () => {
  const progressLog = [];
  const solved = [];
  openStation(landscapeLike, createContainer(), {
    stationId: 'landscape',
    onProgress: p => progressLog.push(p),
    onSolved: r => solved.push(r),
  });
  assert.equal(progressLog.length, 3);
  assert.deepEqual(solved, [{ mistakes: 1, hints: 1 }], 'only one result, without letter or points');
});

test('adapter passes saved progress to the station', () => {
  let seen;
  const spy = { start(container, caseData) { seen = caseData.state; } };
  openStation(spy, createContainer(), { stationId: 'landscape', savedProgress: { mistakes: 2, hints: 0, solved: false }, onSolved() {} });
  assert.deepEqual(seen, { mistakes: 2, hints: 0, solved: false });
});

test('adapter accepts the target format and ignores letter and points', () => {
  let result;
  openStation(targetFormat, createContainer(), { stationId: 'landscape', onSolved: r => { result = r; } });
  assert.deepEqual(result, { mistakes: 2, hints: 1 });
  // The engine owns the reward; B starts at 15 until the host synchronizes its saved time.
  const s = solveStation(readMission(newGame()).state, 'landscape', result).state;
  assert.equal(s.stations.landscape.points, 15);
  assert.equal(s.letters[0], 'O');
});

test('adapter falls back to zero for unknown reports', () => {
  assert.deepEqual(toEngineResult({ points: 20 }, null), { mistakes: 0, hints: 0 });
  assert.deepEqual(toEngineResult(undefined, { mistakes: 3, hints: 1 }), { mistakes: 3, hints: 1 });
  assert.deepEqual(toEngineResult({ mistakes: -4, hints: 1 }, null), { mistakes: 0, hints: 1 });
});

test('adapter refuses a module without start()', () => {
  assert.throws(() => openStation({}, createContainer(), { stationId: 'portraits', onSolved() {} }), /no start/);
});

test('placeholder shows the station and reports zero mistakes and hints', () => {
  installFakeDom();
  const container = createContainer();
  let result;
  openStation(placeholder, container, { stationId: 'portraits', onSolved: r => { result = r; } });
  assert.match(container.textContent, /PORTRAIT HALL/);
  assert.equal(findAll(container, node => node.tagName === 'IMG').length, 4);
  findButton(container, 'Solve station (placeholder)').click();
  assert.deepEqual(result, { mistakes: 0, hints: 0 });
});
