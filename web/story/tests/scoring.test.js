import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, readMission, solveStation, tryOpenSafe, accuse, chooseEnding, recordStationProgress } from '../engine.js';
import { stationPoints, safePoints, accusationPoints, totalScore, scoreBreakdown, MAX_SCORE, puzzleTimePenalty, synchronizeScore } from '../scoring.js';
import { initialPuzzle, startPuzzle, placePiece } from '../../minigames/picture-rules.js';
import { deserialize, serialize } from '../save.js';

const STATIONS = ['landscape', 'portraits', 'restoration', 'archive'];

// Plays a whole game. `results` gives { mistakes, hints } per station.
function play({ results = {}, wrongWords = 0, wrongSuspects = [] } = {}) {
  let s = readMission(newGame()).state;
  for (const id of STATIONS) s = solveStation(s, id, results[id] ?? { mistakes: 0, hints: 0 }).state;
  for (let i = 0; i < wrongWords; i++) s = tryOpenSafe(s, 'LIBD').state;
  s = tryOpenSafe(s, 'BILD').state;
  for (const suspect of wrongSuspects) s = accuse(s, suspect).state;
  s = accuse(s, 'voss').state;
  return chooseEnding(s, 'open-file').state;
}

test('station points: 20 minus 3 per mistake and 5 per hint, at least 5', () => {
  assert.equal(stationPoints(0, 0), 20);
  assert.equal(stationPoints(1, 0), 17);
  assert.equal(stationPoints(0, 1), 15);
  assert.equal(stationPoints(2, 1), 9);
  assert.equal(stationPoints(5, 0), 5);
  assert.equal(stationPoints(10, 3), 5);
});

test('safe and final question: 10 at first try, 5 after a mistake', () => {
  assert.equal(safePoints(0), 10);
  assert.equal(safePoints(1), 5);
  assert.equal(safePoints(4), 5);
  assert.equal(accusationPoints(0), 10);
  assert.equal(accusationPoints(2), 5);
});

test('a perfect game scores exactly 100', () => {
  assert.equal(MAX_SCORE, 100);
  assert.equal(totalScore(play()), 100);
});

test('mistakes, hints and wrong answers are deducted correctly', () => {
  const s = play({
    results: { landscape: { mistakes: 1, hints: 1 }, portraits: { mistakes: 9, hints: 0 } },
    wrongWords: 1,
    wrongSuspects: ['leon'],
  });
  // 12 + 5 (minimum) + 20 + 20 + safe 5 + question 5 = 67
  assert.equal(totalScore(s), 67);
  const rows = scoreBreakdown(s);
  assert.deepEqual(rows.map(row => row.deduction), [8, 15, 0, 0, 0, 5, 5]);
});

test('a new game starts at 100 and successful actions never add points', () => {
  let s = readMission(newGame()).state;
  assert.equal(totalScore(s), 100);
  s = recordStationProgress(s, 'landscape', { mistakes: 1, hints: 1 });
  assert.equal(totalScore(s), 92, 'deductions happen before completion');
  for (const id of STATIONS) {
    s = solveStation(s, id, { mistakes: 0, hints: 0 }).state;
    assert.equal(totalScore(s), 92, 'completion cannot refund prior deductions');
  }
  s = tryOpenSafe(s, 'WRONG').state;
  assert.equal(totalScore(s), 87);
  s = tryOpenSafe(s, 'BILD').state;
  assert.equal(totalScore(s), 87);
  s = accuse(s, 'leon').state;
  assert.equal(totalScore(s), 82);
  s = accuse(s, 'voss').state;
  assert.equal(totalScore(s), 82);
  assert.equal(totalScore(chooseEnding(s, 'heist').state), 82);
  assert.equal(totalScore(chooseEnding(s, 'open-file').state), 82);
});

test('exact puzzle boundaries and the millisecond after each use the specified tiers', () => {
  for (const [elapsed, deduction] of [[0,0],[29999,0],[30000,0],[30001,5],[45000,5],[45001,10],[60000,10],[60001,15],[86400000,15]]) {
    assert.equal(puzzleTimePenalty(elapsed), deduction, `${elapsed} ms`);
  }
});

test('highest time tier is a total, survives saves, and cannot be charged twice', () => {
  let s = readMission(newGame()).state;
  let puzzle = startPuzzle(initialPuzzle(), 1000);
  for (const [now, score] of [[31000,100],[31001,95],[46000,95],[46001,90],[61000,90],[61001,85],[999999,85]]) {
    s = synchronizeScore(s, { restoration: puzzle }, now);
    assert.equal(totalScore(s), score);
    s = deserialize(serialize(s));
    assert.equal(totalScore(synchronizeScore(s, { restoration: puzzle }, now)), score);
  }
  assert.equal(totalScore(synchronizeScore(s, { restoration: puzzle }, 1000)), 85, 'a clock change does not refund penalties');
  for (let i=0;i<8;i++) puzzle = placePiece(puzzle,i,i,999999);
  s = solveStation(s,'restoration').state;
  assert.equal(totalScore(synchronizeScore(s,{ restoration: puzzle },9999999)),85);
});

test('old recorded points and counts migrate, while an old completed L stays untimed', () => {
  const old = readMission(newGame()).state;
  delete old.penalties;
  old.stations.restoration = { solved: true, mistakes: 0, hints: 0, points: 12 };
  old.letters[2] = 'L'; old.evidence = ['hidden-mark'];
  const s = deserialize(JSON.stringify(old));
  assert.equal(totalScore(s),92,'preserve a recorded deduction even without matching counts');
  const pendingPuzzle = startPuzzle(initialPuzzle(),1000);
  assert.equal(totalScore(synchronizeScore(s,{ restoration: pendingPuzzle },1000000)),92);
});
