import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, readMission, solveStation } from '../engine.js';
import { scoreboard, betterRun, bestRunStore, totalScore, MAX_SCORE } from '../scoring.js';
import { memoryStorage } from '../host.js';

const fresh = () => readMission(newGame()).state;

test('an empty run: four open stations, 0 points, no time', () => {
  const board = scoreboard(fresh());
  assert.deepEqual(board.stations.map(row => row.letter), ['B', 'I', 'L', 'D']);
  assert.ok(board.stations.every(row => !row.solved && row.points === 0 && row.timeMs === null));
  assert.equal(board.points, 0);
  assert.equal(board.max, MAX_SCORE);
  assert.equal(board.timeMs, null);
  assert.equal(board.finished, false);
});

test('mid-game: solved stations show their points, the total matches totalScore', () => {
  let state = solveStation(fresh(), 'landscape', { mistakes: 1, hints: 0 }).state;
  state = solveStation(state, 'portraits', { mistakes: 0, hints: 0 }).state;
  state = { ...state, stations: { ...state.stations, portraits: { ...state.stations.portraits, timeMs: 18000 } } };
  const board = scoreboard(state);
  assert.equal(board.stations[0].solved, true);
  assert.equal(board.stations[0].timeMs, null, 'B has no clock');
  assert.equal(board.stations[1].timeMs, 18000);
  assert.equal(board.points, totalScore(state));
  assert.equal(board.points, board.stations.reduce((sum, row) => sum + row.points, 0));
  assert.equal(board.timeMs, 18000);
});

test('the better run: more points first, then less time; broken data never wins', () => {
  const a = { points: 70, timeMs: 60000 };
  const b = { points: 80, timeMs: 90000 };
  const c = { points: 80, timeMs: 50000 };
  assert.equal(betterRun(a, b), b);
  assert.equal(betterRun(b, c), c);
  assert.equal(betterRun(c, b), c);
  assert.equal(betterRun(null, a), a);
  assert.equal(betterRun(a, { points: '99', timeMs: 1 }), a);
  assert.equal(betterRun({ points: 999, timeMs: 1 }, a), a);
});

test('the best run survives in storage and broken storage gives "no best run"', () => {
  const storage = memoryStorage();
  const store = bestRunStore(storage);
  assert.equal(store.get(), null);
  store.record({ points: 60, timeMs: 40000 });
  store.record({ points: 50, timeMs: 10000 });
  assert.deepEqual(bestRunStore(storage).get(), { points: 60, timeMs: 40000 });
  storage.setItem('museum-nocturne-best-run-v1', '{oops');
  assert.equal(store.get(), null);
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(bestRunStore(blocked).get(), null);
  assert.deepEqual(bestRunStore(blocked).record({ points: 10, timeMs: null }), { points: 10, timeMs: null });
});

test('the scoreboard view shows one row per station and the best run', async () => {
  const { installFakeDom, createContainer, findAll } = await import('./fake-dom.js');
  const { renderScoreboard } = await import('../scoreboard-view.js');
  installFakeDom();
  const box = createContainer();
  const state = solveStation(fresh(), 'landscape', { mistakes: 0, hints: 0 }).state;
  renderScoreboard(box, scoreboard(state), { points: 75, timeMs: 61000 });
  const rows = findAll(box, node => node.tagName === 'TR');
  assert.equal(rows.length, 5, 'header + B, I, L, D');
  assert.match(rows[1].textContent, /B · .*Solved.*20 \/ 20/);
  assert.match(rows[2].textContent, /Open/);
  assert.match(box.textContent, /Current run: 20 \/ 85 points/);
  assert.match(box.textContent, /Best run: 75 \/ 90 points · time 1:01/);
});

test('Forgery time and reward appear on the scoreboard and legacy best runs retain their scale', async () => {
  const { synchronizeScore, validRun } = await import('../scoring.js');
  const { initialForgery, guess, regions } = await import('../../minigames/forgery-rules.js');
  const { startPuzzle } = await import('../../minigames/picture-rules.js');
  let progress = startPuzzle(initialForgery(), 1000);
  for (const region of regions.slice(0, 3)) progress = guess(progress, region.x, region.y, 32000);
  const state = synchronizeScore(solveStation(fresh(), 'archive').state, { archive: progress });
  const board = scoreboard(state, { archive: progress });
  assert.equal(board.stations[3].timeMs, 31000);
  assert.equal(board.stations[3].points, 10);
  assert.equal(board.stations[3].max, 15);
  assert.equal(board.timeMs, 31000);
  assert.equal(board.max, 85);
  assert.equal(validRun({ points: 90, timeMs: 1000 }), true);
  assert.equal(validRun({ points: 90, timeMs: 1000, max: 85 }), false);
  assert.equal(validRun({ points: 85, timeMs: 1000, max: 85 }), true);
});
