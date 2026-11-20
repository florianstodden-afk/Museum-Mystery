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
  s = tryOpenSafe(s, 'OILS').state;
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

test('a perfect game scores exactly 80 (four speedrun stations with 15 each)', () => {
  assert.equal(MAX_SCORE, 80);
  assert.equal(totalScore(play()), 80);
});

test('mistakes, hints and wrong answers are deducted correctly', () => {
  const s = play({
    results: { landscape: { mistakes: 1, hints: 1 }, portraits: { mistakes: 9, hints: 0 } },
    wrongWords: 1,
    wrongSuspects: ['leon'],
  });
  // 15 + 5 + 15 + 15 + safe 5 + question 5 = 60; B has no count deductions
  assert.equal(totalScore(s), 60);
  const rows = scoreBreakdown(s);
  assert.deepEqual(rows.map(row => row.points), [15, 5, 15, 15, 5, 5]);
  assert.equal(rows.reduce((sum, row) => sum + row.max, 0), 80);
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

import { portraitSpeedPoints, PORTRAIT_UNTIMED_POINTS, formatClock } from '../scoring.js';
import { initialTimeline, startTimeline, checkOrder, correctOrder, peekDate, FLASH_MS } from '../../minigames/portrait-rules.js';

// Station I solved after `ms` (plus penalties), as the station saves it.
function portraitRun(ms, { wrong = 0, peeks = 0 } = {}) {
  let t = startTimeline({ ...initialTimeline(), order: [...correctOrder()].reverse() }, 1000);
  const clockStart = 1000 + FLASH_MS;   // the clock starts after the reading time
  for (let i = 0; i < wrong; i++) t = checkOrder(t, clockStart);
  for (let i = 0; i < peeks; i++) t = peekDate(t, correctOrder()[0], clockStart);
  return checkOrder({ ...t, order: correctOrder() }, clockStart + ms);
}
function solvedWith(timeline) {
  const state = solveStation(readMission(newGame()).state, 'portraits', { mistakes: 0, hints: 0 }).state;
  return synchronizeScore(state, { portraits: timeline });
}

test('Station I speed boundaries: ≤20 s → 15, ≤35 s → 10, ≤50 s → 5, else 0', () => {
  for (const [ms, points] of [[0, 15], [25000, 15], [25001, 10], [40000, 10], [40001, 5], [55000, 5], [55001, 0]]) {
    assert.equal(portraitSpeedPoints(ms), points, String(ms));
    assert.equal(totalScore(solvedWith(portraitRun(ms))), points, `game ${ms}`);
  }
});

test('Station I penalties count: 17 s + one wrong check + one peek = 27 s → 10 points', () => {
  const state = solvedWith(portraitRun(17000, { wrong: 1, peeks: 1 }));
  assert.equal(state.stations.portraits.points, 10);
  assert.equal(state.stations.portraits.timeMs, 27000);
  const row = scoreBreakdown(state).find(r => r.id === 'portraits');
  assert.equal(row.detail, 'Portrait timeline time 0:27');
  assert.equal(row.max, 15);
});

test('an old save with Station I solved but no time gets 5 points and does not crash', () => {
  const old = { order: correctOrder(), solved: true, mistakes: 0, hints: 0, revealed: [] };
  assert.equal(solvedWith(old).stations.portraits.points, PORTRAIT_UNTIMED_POINTS);
  assert.equal(solvedWith(null).stations.portraits.points, PORTRAIT_UNTIMED_POINTS);
  assert.equal(solvedWith('broken').stations.portraits.points, PORTRAIT_UNTIMED_POINTS);
  assert.match(scoreBreakdown(solvedWith(old)).find(r => r.id === 'portraits').detail, /not recorded/);
});

test('the clock shows minutes and seconds', () => {
  assert.equal(formatClock(0), '0:00');
  assert.equal(formatClock(9999), '0:09');
  assert.equal(formatClock(75000), '1:15');
});
