import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PORTRAIT_IDS, correctOrder, initialTimeline, validTimeline, moveCard, swapCards,
  checkOrder, useHint, isSolved, logEntries,
} from './portrait-rules.js';
import { PORTRAIT_ARTWORKS, loadPortrait, loadPortraits, verifiedImageUrl } from './portrait-artwork.js';
import { start } from './portrait-timeline.js';
import { installFakeDom, createContainer, findAll, findButton } from '../story/tests/fake-dom.js';

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

// ---------- Station UI (small fake DOM, no browser) ----------

function openStation(savedState) {
  installFakeDom();
  const container = createContainer();
  const saved = [];
  const solvedReports = [];
  const cleanup = start(container, {
    state: savedState,
    onChange: state => saved.push(structuredClone(state)),
    loadPortraits: async () => PORTRAIT_IDS.map(id => ({ id, src: `local-${id}.jpg`, offline: true })),
  }, report => solvedReports.push(report));
  const faces = () => findAll(container, node => node.className === 'portrait-face');
  const faceFor = id => faces().find(face => face.getAttribute('aria-label').startsWith(PORTRAIT_ARTWORKS.find(a => a.id === id).artist));
  return { container, saved, solvedReports, cleanup, faces, faceFor, last: () => saved[saved.length - 1] };
}

test('the station reports onSolved exactly once with mistakes and hints only', () => {
  const station = openStation(timeline([SARGENT, DEGAS, CEZANNE]));
  findButton(station.container, 'Check order').click();
  assert.match(station.container.textContent, /Not quite\. Check the catalogue dates again/);
  assert.equal(station.last().mistakes, 1);
  findButton(station.container, 'Hint').click();
  assert.match(station.container.textContent, /Degas’s “A Woman Seated beside a Vase of Flowers” is the oldest/);
  station.faceFor(SARGENT).click();   // pick up Sargent
  station.faceFor(DEGAS).click();     // swap with Degas
  assert.deepEqual(station.last().order, RIGHT);
  findButton(station.container, 'Check order').click();
  findButton(station.container, 'Check order').click(); // disabled after solving: no second report
  assert.deepEqual(station.solvedReports, [{ mistakes: 1, hints: 1 }]);
  assert.match(station.container.textContent, /Booked as: patron visit – A\. V\./);
  assert.match(station.container.textContent, /The log clears Leon/);
  station.cleanup();
});

test('keyboard: Enter picks a card up and the arrow keys move it', () => {
  const station = openStation(timeline([CEZANNE, SARGENT, DEGAS]));
  station.faceFor(DEGAS).click(); // Enter/Space on a button triggers click
  station.faceFor(DEGAS).dispatch('keydown', { key: 'ArrowLeft' });
  station.faceFor(DEGAS).dispatch('keydown', { key: 'ArrowLeft' });
  assert.deepEqual(station.last().order, [DEGAS, CEZANNE, SARGENT]);
  station.faceFor(DEGAS).dispatch('keydown', { key: 'ArrowLeft' }); // already first: nothing happens
  assert.deepEqual(station.last().order, [DEGAS, CEZANNE, SARGENT]);
  station.faceFor(DEGAS).click(); // put it down
  station.faceFor(SARGENT).dispatch('keydown', { key: 'ArrowLeft' }); // not picked up: no move
  assert.deepEqual(station.last().order, [DEGAS, CEZANNE, SARGENT]);
});

test('dragging a card onto another place moves it there', () => {
  const station = openStation(timeline([SARGENT, CEZANNE, DEGAS]));
  const cardsList = () => findAll(station.container, node => node.tagName === 'LI' && node.className.startsWith('portrait-card'));
  cardsList()[2].dispatch('dragstart', { dataTransfer: { setData() {} } }); // Degas
  cardsList()[0].dispatch('drop');
  assert.deepEqual(station.last().order, [DEGAS, SARGENT, CEZANNE]);
});

test('progress survives closing and reopening the station', () => {
  const first = openStation(timeline([CEZANNE, SARGENT, DEGAS]));
  findButton(first.container, 'Check order').click();
  findButton(first.container, 'Hint').click();
  first.cleanup();
  const again = openStation(first.last());
  assert.match(again.container.textContent, /Incorrect attempts: 1 · Hints: 1/);
  assert.deepEqual(again.last().order, [CEZANNE, SARGENT, DEGAS]);
  assert.equal(again.solvedReports.length, 0);
});

test('a broken saved state starts a fresh shuffle; an already solved one shows the log', () => {
  const fresh = openStation({ order: [1, 2, 3], solved: true });
  assert.equal(validTimeline(fresh.last()), true);
  assert.equal(fresh.last().solved, false);
  const done = openStation(timeline(RIGHT, { solved: true, mistakes: 2 }));
  assert.match(done.container.textContent, /NIGHT-SHIFT LOG/);
  assert.deepEqual(done.solvedReports, [{ mistakes: 2, hints: 0 }]);
});

test('years are hidden on the cards until a catalogue entry is opened', () => {
  const station = openStation(timeline([CEZANNE, SARGENT, DEGAS]));
  assert.doesNotMatch(station.container.textContent, /1865|1883|1888/);
  findButton(station.container, 'Catalogue entry').click();
  assert.match(station.container.textContent, /Date: 1888–90/);
});
