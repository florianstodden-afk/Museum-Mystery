import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, readMission, solveStation, tryOpenSafe, accuse, chooseEnding } from '../engine.js';
import { stationPoints, safePoints, accusationPoints, totalScore, scoreBreakdown, MAX_SCORE } from '../scoring.js';

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

test('a perfect game scores exactly 95', () => {
  assert.equal(MAX_SCORE, 95);
  assert.equal(totalScore(play()), 95);
});

test('mistakes, hints and wrong answers are deducted correctly', () => {
  const s = play({
    results: { landscape: { mistakes: 1, hints: 1 }, portraits: { mistakes: 9, hints: 0 } },
    wrongWords: 1,
    wrongSuspects: ['leon'],
  });
  // 12 + 5 (minimum) + 20 + 20 + safe 5 + question 5 = 67
  assert.equal(totalScore(s), 62);
  const rows = scoreBreakdown(s);
  assert.deepEqual(rows.map(row => row.points), [12, 5, 15, 20, 5, 5]);
  assert.equal(rows.reduce((sum, row) => sum + row.max, 0), 95);
});

test('unsolved parts give 0 points', () => {
  let s = readMission(newGame()).state;
  assert.equal(totalScore(s), 0);
  s = solveStation(s, 'restoration', { mistakes: 0, hints: 2 }).state;
  assert.equal(totalScore(s), 10);
});

import { pictureSpeedPoints, synchronizeScore } from '../scoring.js';
import { initialPuzzle, startPuzzle, placePiece } from '../../minigames/picture-rules.js';
test('Renoir speed boundaries award only completed puzzles and freeze after completion', () => {
  for (const [ms, points] of [[0,15],[30000,15],[30001,10],[45000,10],[45001,5],[60000,5],[60001,0]]) {
    assert.equal(pictureSpeedPoints(ms), points);
    let puzzle = startPuzzle(initialPuzzle(), 1000);
    let state = readMission(newGame()).state;
    assert.equal(totalScore(synchronizeScore(state, {restoration:puzzle})), 0);
    for(let i=0;i<8;i++) puzzle=placePiece(puzzle,i,i,1000+ms);
    state=solveStation(state,'restoration',{mistakes:0,hints:0}).state;
    state=synchronizeScore(state,{restoration:puzzle});
    assert.equal(totalScore(state),points);
    assert.equal(totalScore(synchronizeScore(state,{restoration:puzzle},99999999)),points);
  }
});
