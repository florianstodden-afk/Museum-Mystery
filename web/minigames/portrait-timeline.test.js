import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PORTRAIT_IDS, correctOrder, initialTimeline, validTimeline, moveCard, swapCards,
  checkOrder, useHint, isSolved, logEntries,
} from './portrait-rules.js';
import { PORTRAIT_ARTWORKS, loadPortrait, loadPortraits, verifiedImageUrl } from './portrait-artwork.js';

const DEGAS = 436121;
const SARGENT = 12127;
const CEZANNE = 435876;
const RIGHT = [DEGAS, SARGENT, CEZANNE];

// A fixed "random" sequence, so a test can produce any shuffle it needs.
function sequence(...values) {
  let i = 0;
  return () => values[i++ % values.length];
}

function timeline(order, extra = {}) {
  return { order, solved: false, mistakes: 0, hints: 0, revealed: [], ...extra };
}

// ---------- Rules ----------

test('the correct order comes from the frozen Met begin dates: Degas, Sargent, Cézanne', () => {
  assert.deepEqual(correctOrder(), RIGHT);
});

test('a date range is sorted by its start year, not its end year', () => {
  const works = {
    1: { objectBeginDate: 1883, objectEndDate: 1899 }, // range that ends late
    2: { objectBeginDate: 1885, objectEndDate: 1885 },
    3: { objectBeginDate: 1883, objectEndDate: 1884 }, // same start, earlier end
  };
  assert.deepEqual(correctOrder([2, 1, 3], id => works[id]), [3, 1, 2]);
});

test('a shuffle is never already solved, whatever the random numbers are', () => {
  for (const randoms of [[0, 0], [0.99, 0.99], [0.5, 0.2], [0.1, 0.9], [0.7, 0.4], [0.34, 0.67]]) {
    const start = initialTimeline(sequence(...randoms));
    assert.notDeepEqual(start.order, RIGHT, String(randoms));
    assert.deepEqual([...start.order].sort(), [...PORTRAIT_IDS].sort());
    assert.equal(validTimeline(start), true);
  }
});

test('moving and swapping cards change only the order', () => {
  let s = timeline([CEZANNE, DEGAS, SARGENT]);
  s = moveCard(s, DEGAS, 0);
  assert.deepEqual(s.order, [DEGAS, CEZANNE, SARGENT]);
  s = swapCards(s, CEZANNE, SARGENT);
  assert.deepEqual(s.order, RIGHT);
  assert.equal(s.mistakes, 0);
  assert.equal(moveCard(s, DEGAS, 7), s, 'an impossible position changes nothing');
  assert.equal(swapCards(s, DEGAS, 999), s, 'an unknown card changes nothing');
});

test('the right order solves the station and turns the log into the right reading order', () => {
  const s = checkOrder(timeline(RIGHT));
  assert.equal(isSolved(s), true);
  assert.equal(s.mistakes, 0);
  assert.deepEqual(logEntries(s), [
    '21:02–21:18 · Leon – round of the east wing and the east stairs. All doors checked.',
    '21:14 · Delivery bay – transport cart signed out. Booked as: patron visit – A. V.',
    '21:20 · Leon – back at the front desk. Coffee, radio check.',
  ]);
});

test('a wrong check counts exactly one mistake and the cards stay movable', () => {
  const wrong = checkOrder(timeline([SARGENT, DEGAS, CEZANNE]));
  assert.equal(wrong.mistakes, 1);
  assert.equal(wrong.solved, false);
  const moved = moveCard(wrong, DEGAS, 0);
  assert.deepEqual(moved.order, RIGHT);
  assert.equal(checkOrder(moved).solved, true);
});

test('after solving, moves, swaps, checks and hints change nothing', () => {
  const solved = checkOrder(timeline(RIGHT));
  assert.equal(moveCard(solved, DEGAS, 2), solved);
  assert.equal(swapCards(solved, DEGAS, SARGENT), solved);
  assert.equal(checkOrder(solved), solved);
  assert.equal(useHint(solved), solved);
});

test('at most two hints: first the oldest work, then the newest', () => {
  let s = timeline([CEZANNE, SARGENT, DEGAS]);
  s = useHint(s);
  assert.deepEqual([s.hints, s.revealed], [1, [DEGAS]]);
  s = useHint(s);
  assert.deepEqual([s.hints, s.revealed], [2, [DEGAS, CEZANNE]]);
  assert.equal(useHint(s), s);
  assert.equal(validTimeline(s), true);
});

test('validTimeline rejects broken, foreign and impossible saved states', () => {
  const bad = [
    null, 'text', {}, timeline([DEGAS, SARGENT]), timeline([DEGAS, DEGAS, CEZANNE]),
    timeline([DEGAS, SARGENT, 459111]), timeline(RIGHT, { mistakes: -1 }), timeline(RIGHT, { hints: 3, revealed: [DEGAS, CEZANNE, DEGAS] }),
    timeline([SARGENT, DEGAS, CEZANNE], { solved: true }), timeline(RIGHT, { hints: 1, revealed: [] }),
    timeline(RIGHT, { hints: 1, revealed: [CEZANNE] }), timeline(RIGHT, { solved: 'yes' }),
  ];
  for (const state of bad) assert.equal(validTimeline(state), false, JSON.stringify(state));
  assert.equal(validTimeline(timeline(RIGHT, { solved: true, mistakes: 2, hints: 1, revealed: [DEGAS] })), true);
});

// ---------- Artwork loader (fake fetch, never the live API) ----------

function metAnswer(artwork, changes = {}) {
  return {
    objectID: artwork.id, isPublicDomain: true, title: artwork.title, artistDisplayName: artwork.artist,
    primaryImageSmall: `https://images.metmuseum.org/CRDImages/test/${artwork.id}.jpg`, ...changes,
  };
}
const okResponse = data => async () => ({ ok: true, json: async () => data });
const readAny = async src => ({ src });

test('the loader uses a checked Met image when the API answer is right', async () => {
  const sargent = PORTRAIT_ARTWORKS.find(a => a.id === SARGENT);
  const result = await loadPortrait(sargent, { fetchData: okResponse(metAnswer(sargent)), readImage: readAny });
  assert.deepEqual(result, { id: SARGENT, src: 'https://images.metmuseum.org/CRDImages/test/12127.jpg', offline: false });
});

test('the loader falls back to the bundled copy on API error, wrong data or a foreign image host', async () => {
  const degas = PORTRAIT_ARTWORKS.find(a => a.id === DEGAS);
  const failures = [
    async () => { throw new Error('network down'); },
    async () => ({ ok: false, json: async () => ({}) }),
    okResponse(metAnswer(degas, { isPublicDomain: false })),
    okResponse(metAnswer(degas, { objectID: 12127 })),
    okResponse(metAnswer(degas, { title: 'A different painting' })),
    okResponse(metAnswer(degas, { primaryImageSmall: 'https://example.com/fake.jpg' })),
    okResponse(metAnswer(degas, { primaryImageSmall: 'http://images.metmuseum.org/insecure.jpg' })),
  ];
  for (const fetchData of failures) {
    const result = await loadPortrait(degas, { fetchData, readImage: readAny });
    assert.equal(result.offline, true);
    assert.match(result.src, /assets\/met-436121\.jpg$/);
  }
  assert.throws(() => verifiedImageUrl(metAnswer(degas, { primaryImageSmall: '' }), degas));
});

test('every portrait has a bundled offline copy and the loader returns all three', async () => {
  const { existsSync } = await import('node:fs');
  for (const artwork of PORTRAIT_ARTWORKS) {
    assert.equal(existsSync(new URL(artwork.local)), true, artwork.local);
    assert.equal(existsSync(new URL(artwork.local.replace('.jpg', '-source.md'))), true);
  }
  const all = await loadPortraits({ fetchData: async () => { throw new Error('offline'); }, readImage: readAny });
  assert.deepEqual(all.map(item => item.id), PORTRAIT_IDS);
  assert.equal(all.every(item => item.offline), true);
});
