import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PORTRAIT_IDS, FLASH_MS, PEEK_MS, PENALTY_MS, correctOrder, initialTimeline, validTimeline, upgradeTimeline,
  startTimeline, peekDate, revealedDates, moveCard, swapCards, checkOrder, elapsedMs, isSolved, logEntries,
} from './portrait-rules.js';

const DEGAS = 436121;
const SARGENT = 12127;
const CEZANNE = 435876;
const RIGHT = [DEGAS, SARGENT, CEZANNE];
const T0 = 1_000_000;

function sequence(...values) {
  let i = 0;
  return () => values[i++ % values.length];
}

// A timeline in a given order; `started` presses Start at T0.
function timeline(order, extra = {}, started = true) {
  const fresh = { ...initialTimeline(), ...extra };
  return { ...(started ? startTimeline(fresh, T0) : fresh), order, ...extra };
}

test('the correct order comes from the frozen Met begin dates: Degas, Sargent, Cézanne', () => {
  assert.deepEqual(correctOrder(), RIGHT);
});

test('a date range is sorted by its start year, not its end year', () => {
  const works = { 1: { objectBeginDate: 1883, objectEndDate: 1899 }, 2: { objectBeginDate: 1885, objectEndDate: 1885 }, 3: { objectBeginDate: 1883, objectEndDate: 1884 } };
  assert.deepEqual(correctOrder([2, 1, 3], id => works[id]), [3, 1, 2]);
});

test('a shuffle is never already solved and the clock has not started', () => {
  for (const randoms of [[0, 0], [0.99, 0.99], [0.5, 0.2], [0.1, 0.9], [0.7, 0.4], [0.34, 0.67]]) {
    const start = initialTimeline(sequence(...randoms));
    assert.notDeepEqual(start.order, RIGHT);
    assert.equal(start.startedAt, null);
    assert.equal(elapsedMs(start, T0), 0);
    assert.equal(validTimeline(start), true);
  }
});

test('the clock starts only with Start, and Start shows all dates for 8 seconds', () => {
  const before = timeline([CEZANNE, DEGAS, SARGENT], {}, false);
  assert.equal(moveCard(before, DEGAS, 0), before, 'cards stay put before Start');
  assert.equal(checkOrder(before, T0), before);
  const s = startTimeline(before, T0);
  assert.equal(s.flashUntil, T0 + FLASH_MS);
  assert.deepEqual(revealedDates(s, T0 + 100), PORTRAIT_IDS);
  assert.deepEqual(revealedDates(s, T0 + FLASH_MS), [], 'dates vanish after the flash');
  assert.equal(elapsedMs(s, T0 + 7000), 7000);
});

test('reopening (Start again) never gives a second free flash', () => {
  const s = timeline([CEZANNE, DEGAS, SARGENT]);
  assert.equal(startTimeline(s, T0 + 60000), s);
  assert.deepEqual(revealedDates(s, T0 + 60000), []);
});

test('a save with a running flash continues where it was', () => {
  const s = timeline([CEZANNE, DEGAS, SARGENT]);
  const reloaded = JSON.parse(JSON.stringify(s));
  assert.equal(validTimeline(reloaded), true);
  assert.deepEqual(revealedDates(reloaded, T0 + FLASH_MS - 1000), PORTRAIT_IDS, 'still 1 s left');
  assert.deepEqual(revealedDates(reloaded, T0 + FLASH_MS + 500), []);
});

test('peek shows one date for 1.5 s and adds 5 s; two penalties add 10 s', () => {
  const AFTER = T0 + FLASH_MS + 1000;   // one second after the flash
  let s = timeline([CEZANNE, DEGAS, SARGENT]);
  assert.equal(peekDate(s, DEGAS, T0 + 1000), s, 'no peek during the flash');
  s = peekDate(s, DEGAS, AFTER);
  assert.deepEqual(revealedDates(s, AFTER + PEEK_MS - 1), [DEGAS]);
  assert.deepEqual(revealedDates(s, AFTER + PEEK_MS), []);
  assert.equal(s.hints, 1);
  assert.equal(elapsedMs(s, AFTER), AFTER - T0 + PENALTY_MS);
  s = checkOrder(s, AFTER + 1000);            // wrong
  assert.equal(s.mistakes, 1);
  assert.equal(elapsedMs(s, AFTER + 1000), AFTER + 1000 - T0 + 2 * PENALTY_MS);
});

test('moving and swapping change only the order', () => {
  let s = timeline([CEZANNE, DEGAS, SARGENT]);
  s = moveCard(s, DEGAS, 0);
  assert.deepEqual(s.order, [DEGAS, CEZANNE, SARGENT]);
  s = swapCards(s, CEZANNE, SARGENT);
  assert.deepEqual(s.order, RIGHT);
  assert.equal(moveCard(s, DEGAS, 7), s);
  assert.equal(swapCards(s, DEGAS, 999), s);
});

test('the right order stops the clock and turns the log into reading order', () => {
  const s = checkOrder(timeline(RIGHT), T0 + 8000);
  assert.equal(isSolved(s), true);
  assert.equal(s.finishedAt, T0 + 8000);
  assert.equal(elapsedMs(s, T0 + 99999), 8000, 'the clock stopped');
  assert.deepEqual(logEntries(s), ['21:02 · Leon – east wing round', '21:14 · Cart out – “patron visit, A. V.”', '21:20 · Leon – back at the desk']);
  for (const line of logEntries(s)) assert.ok(line.split(/\s+/).length <= 10, line);
});

test('after solving, nothing changes any more', () => {
  const solved = checkOrder(timeline(RIGHT), T0 + 8000);
  assert.equal(moveCard(solved, DEGAS, 2), solved);
  assert.equal(swapCards(solved, DEGAS, SARGENT), solved);
  assert.equal(checkOrder(solved, T0 + 9000), solved);
  assert.equal(peekDate(solved, DEGAS, T0 + 9000), solved);
});

test('old saves without time are still valid: not started, or solved without a time', () => {
  const oldOpen = { order: [CEZANNE, SARGENT, DEGAS], solved: false, mistakes: 1, hints: 1, revealed: [DEGAS] };
  const oldSolved = { order: RIGHT, solved: true, mistakes: 0, hints: 0, revealed: [] };
  assert.equal(validTimeline(oldOpen), true);
  assert.equal(validTimeline(oldSolved), true);
  assert.equal(upgradeTimeline(oldOpen).startedAt, null);
  assert.equal('revealed' in upgradeTimeline(oldOpen), false);
  assert.equal(elapsedMs(upgradeTimeline(oldSolved)), 0);
});

test('validTimeline rejects broken and impossible states', () => {
  const bad = [
    null, 'text', {}, timeline([DEGAS, SARGENT]), timeline([DEGAS, DEGAS, CEZANNE]), timeline([DEGAS, SARGENT, 459111]),
    timeline(RIGHT, { mistakes: -1 }), timeline([SARGENT, DEGAS, CEZANNE], { solved: true }), timeline(RIGHT, { solved: 'yes' }),
    timeline(RIGHT, { penaltyMs: -5 }), timeline(RIGHT, { startedAt: 'soon' }),
    { ...timeline(RIGHT, {}, false), finishedAt: T0, solved: true }, timeline(RIGHT, { peek: { id: 1, until: 0 } }),
  ];
  for (const state of bad) assert.equal(validTimeline(state), false, JSON.stringify(state));
});

test('Start never begins with the cards already in the right order (e.g. an old save)', () => {
  const sorted = { ...initialTimeline(), order: [...RIGHT] };
  const started = startTimeline(sorted, T0);
  assert.notDeepEqual(started.order, RIGHT);
  assert.deepEqual([...started.order].sort(), [...RIGHT].sort());
  const mixed = timeline([CEZANNE, DEGAS, SARGENT], {}, false);
  assert.deepEqual(startTimeline(mixed, T0).order, mixed.order, 'a mixed order stays as it is');
});
