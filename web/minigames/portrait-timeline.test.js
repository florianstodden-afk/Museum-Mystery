import test from 'node:test';
import assert from 'node:assert/strict';
import { PORTRAIT_IDS, initialTimeline, startTimeline, FLASH_MS, PENALTY_MS } from './portrait-rules.js';
import { PORTRAIT_ARTWORKS, loadPortrait, loadPortraits, verifiedImageUrl } from './portrait-artwork.js';
import { start } from './portrait-timeline.js';
import { installFakeDom, createContainer, findAll, findButton } from '../story/tests/fake-dom.js';

const INGRES = 436703;
const DEGAS = 436121;
const SARGENT = 12127;
const CEZANNE = 435876;
const RIGHT = [INGRES, DEGAS, SARGENT, CEZANNE];
const T0 = 1_000_000;

function timeline(order, extra = {}) {
  return { ...initialTimeline(), order, ...extra };
}

// The rules are tested in portrait-rules.test.js.

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

test('every portrait has a bundled offline copy and the loader returns all four', async () => {
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

// Opens the station with a hand-moved clock: station.clock.ms is "now".
function openStation(savedState, extra = {}, pageFocusesFirstButton = false) {
  installFakeDom();
  const container = createContainer();
  if (pageFocusesFirstButton) queueMicrotask(() => findAll(container, node => node.tagName === 'BUTTON')[0]?.focus());
  const saved = [];
  const solvedReports = [];
  const played = [];
  const clock = { ms: T0 };
  const store = {};
  let closed = 0;
  const cleanup = start(container, {
    state: savedState,
    now: () => clock.ms,
    onChange: state => saved.push(structuredClone(state)),
    onClose: () => closed++,
    playSound: id => played.push(id),
    storage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
    loadPortraits: async () => PORTRAIT_IDS.map(id => ({ id, src: `local-${id}.jpg`, offline: true })),
    ...extra,
  }, report => solvedReports.push(report));
  const faces = () => findAll(container, node => node.className === 'portrait-face');
  const faceFor = id => faces().find(face => face.getAttribute('aria-label').includes(PORTRAIT_ARTWORKS.find(a => a.id === id).artist));
  const chips = () => findAll(container, node => node.className === 'portrait-chip' && !node.hidden).map(node => node.textContent);
  const key = k => document.pressKey(k);
  const text = () => container.textContent;
  return { container, saved, solvedReports, played, clock, store, cleanup, faces, faceFor, chips, key, text, closed: () => closed, last: () => saved[saved.length - 1] };
}
const tick = () => new Promise(resolve => setTimeout(resolve, 150)); // the station redraws every 100 ms

test('intro like L: one task line, the gold speed line, "?", Start ↵ and Back to museum Esc – no cards yet', () => {
  const s = openStation(timeline([INGRES, SARGENT, DEGAS, CEZANNE]));
  assert.match(s.text(), /Memorise the dates, then sort oldest to newest\.Finish within 25 \/ 40 \/ 55 seconds for 15 \/ 10 \/ 5 points\.?/);
  assert.match(findButton(s.container, 'Start').textContent, /Start↵/);
  assert.match(findButton(s.container, 'Back to museum').textContent, /Back to museumEsc/);
  assert.equal(s.faces().length, 0, 'the cards appear after Start, like L’s board');
  s.cleanup();
});

test('opening the station puts the focus on Start, even after the page focuses the first button ("?")', async () => {
  // main.js focuses the first button of a new panel in a microtask; that is the "?" of the intro.
  const s = openStation(timeline([INGRES, SARGENT, DEGAS, CEZANNE]), {}, true);
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(document.activeElement, findButton(s.container, 'Start'));
  s.key('Enter');
  assert.doesNotMatch(s.text(), /Sort the portraits/, 'no help popup');
  assert.notEqual(s.last().startedAt, null, 'the game runs');
  assert.equal(s.chips().length, PORTRAIT_IDS.length, 'the flash shows every date');
  s.cleanup();
});

test('closing the help puts the focus back on Start before the game, on the first card while playing', () => {
  const s = openStation(timeline([INGRES, SARGENT, DEGAS, CEZANNE]));
  findButton(s.container, '?').click();
  s.key('Enter');
  assert.equal(document.activeElement, findButton(s.container, 'Start'));
  s.key('Enter');
  assert.notEqual(s.last().startedAt, null);
  s.cleanup();
});

test('"?" opens the instructions popup; Enter closes it again', () => {
  const s = openStation(timeline([INGRES, SARGENT, DEGAS, CEZANNE]));
  findButton(s.container, '?').click();
  assert.match(s.text(), /Sort the portraits/);
  assert.match(s.text(), /Within 25 s: \+15 points/);
  s.key('Enter');
  assert.doesNotMatch(s.text(), /Sort the portraits/);
  assert.equal(s.last().startedAt, null, 'closing help does not start the clock');
  s.cleanup();
});

test('Enter starts; the dates show for 4 s, then vanish; a wrong check adds 5 s on the bar', async () => {
  const s = openStation(timeline([INGRES, SARGENT, DEGAS, CEZANNE]));
  s.key('Enter');
  assert.equal(s.last().startedAt, T0);
  assert.deepEqual(s.chips(), ['1823', '1883–84', '1865', '1888–90']);
  assert.match(s.text(), /\+15 points\+10 points\+5 points\+0 points/);
  assert.match(s.text(), /Dates vanish in 4 s/);
  s.clock.ms = T0 + FLASH_MS;
  await tick();
  assert.deepEqual(s.chips(), []);
  s.key('Enter');                   // wrong order
  assert.equal(s.last().penaltyMs, PENALTY_MS);
  assert.match(s.text(), /Not yet\. \+5 s/);
  assert.deepEqual(s.played, ['page', 'wrong']);
  s.cleanup();
});

test('a whole run: number keys swap, Enter checks, success popup with letter I and points, Enter returns', () => {
  const s = openStation(timeline([INGRES, SARGENT, DEGAS, CEZANNE]));
  s.key('Enter');
  s.clock.ms = T0 + FLASH_MS + 6000;   // 6 s after the reading time
  s.key('2'); s.key('3');
  assert.deepEqual(s.last().order, RIGHT);
  s.key('Enter');
  assert.equal(s.last().solved, true);
  assert.deepEqual(s.solvedReports, [{ mistakes: 0, hints: 0 }]);
  assert.match(s.text(), /Iadded to journal\+15 points earnedTime 0:06 · New best!/);
  assert.match(s.text(), /21:14 · Cart out – “patron visit, A\. V\.”/);
  s.key('Enter');
  assert.equal(s.closed(), 1, 'Return to museum');
  assert.equal(s.solvedReports.length, 1);
  s.cleanup();
});

test('Escape goes back to the museum, like L', () => {
  const s = openStation(timeline([INGRES, SARGENT, DEGAS, CEZANNE]));
  s.key('Escape');
  assert.equal(s.closed(), 1);
  s.cleanup();
});

test('Peek shows one date for a moment and costs 5 s', () => {
  const s = openStation(timeline([INGRES, SARGENT, DEGAS, CEZANNE]));
  s.key('Enter');
  s.clock.ms = T0 + FLASH_MS + 1000;
  findButton(s.container, 'Peek').click();     // first card: Ingres
  assert.deepEqual(s.chips(), ['1823']);
  assert.equal(s.last().penaltyMs, PENALTY_MS);
  assert.deepEqual(s.played, ['page', 'hint']);
  s.cleanup();
});

test('the drag hint arrow appears once after the flash and goes at the first click', async () => {
  const s = openStation(timeline([INGRES, SARGENT, CEZANNE, DEGAS]));
  const arrow = () => findAll(s.container, node => node.className === 'puzzle-drag-demo')[0];
  s.key('Enter');
  assert.equal(arrow().hidden, true, 'not during the flash');
  s.clock.ms = T0 + FLASH_MS + 1;
  await tick();
  assert.equal(arrow().hidden, false);
  assert.equal(arrow().getAttribute('aria-hidden'), 'true');
  s.faceFor(SARGENT).click();
  assert.equal(arrow().hidden, true);
  assert.equal(s.last().demoDismissed, true, 'it does not come back when the station is reopened');
  s.cleanup();
});

test('click-click swaps and dragging moves a card', () => {
  const s = openStation(timeline([INGRES, SARGENT, CEZANNE, DEGAS]));
  s.key('Enter');
  s.clock.ms = T0 + FLASH_MS;   // cards move only after the reading time
  s.faceFor(SARGENT).click();
  s.faceFor(CEZANNE).click();
  assert.deepEqual(s.last().order, [INGRES, CEZANNE, SARGENT, DEGAS]);
  const cards = () => findAll(s.container, node => node.tagName === 'LI');
  cards()[3].dispatch('dragstart', { dataTransfer: { setData() {} } }); // Degas
  cards()[1].dispatch('drop');
  assert.deepEqual(s.last().order, [INGRES, DEGAS, CEZANNE, SARGENT]);
  s.cleanup();
});

test('reopening keeps the clock running and gives no second flash', async () => {
  const first = openStation(timeline([INGRES, SARGENT, DEGAS, CEZANNE]));
  first.key('Enter');
  first.cleanup();
  const again = openStation(first.last());
  again.clock.ms = T0 + 20000;
  await tick();
  assert.deepEqual(again.chips(), []);
  assert.equal(findButton(again.container, 'Start'), undefined);
  assert.match(again.text(), /Check order/);
  again.cleanup();
});

test('the credit line never shows the years (they are the puzzle)', () => {
  const s = openStation(timeline([INGRES, SARGENT, DEGAS, CEZANNE]));
  s.key('Enter');
  const credit = findAll(s.container, node => node.className === 'story-muted puzzle-credit')[0];
  assert.match(credit.textContent, /Edgar Degas, A Woman Seated beside a Vase of Flowers · .*Public domain · The Metropolitan Museum of Art/);
  assert.doesNotMatch(credit.textContent, /1865|1883|1888/);
  s.cleanup();
});

test('a broken save starts fresh; an old solved save shows the log and reports once', () => {
  const fresh = openStation({ order: [1, 2, 3, 4], solved: true });
  assert.equal(fresh.last().solved, false);
  fresh.cleanup();
  const old = openStation({ order: RIGHT, solved: true, mistakes: 2, hints: 0, revealed: [] });
  assert.match(old.text(), /21:02 · Leon – east wing round/);
  assert.deepEqual(old.solvedReports, [{ mistakes: 2, hints: 0 }]);
  old.cleanup();
});

test('during the 4 s reading time the clock waits and the cards cannot be moved or checked', () => {
  const s = openStation(timeline([INGRES, SARGENT, DEGAS, CEZANNE]));
  s.key('Enter');
  s.clock.ms = T0 + 3000;
  s.key('2'); s.key('3');
  assert.deepEqual(s.last().order, [INGRES, SARGENT, DEGAS, CEZANNE], 'no swapping while reading');
  s.key('Enter');
  assert.equal(s.last().mistakes, 0, 'no checking while reading');
  s.clock.ms = T0 + FLASH_MS;
  s.key('2'); s.key('3');
  assert.deepEqual(s.last().order, RIGHT, 'after the reading time it works');
  s.cleanup();
});

import { ART_NOTES } from './portrait-timeline.js';
import { portraitSpeedPoints } from '../story/scoring.js';
import { elapsedMs } from './portrait-rules.js';

test('art cards: every portrait has artist, title, year and a text of at most 2 sentences and 30 words', () => {
  for (const artwork of PORTRAIT_ARTWORKS) {
    assert.ok(artwork.artist && artwork.shortTitle && /\d{4}/.test(artwork.date), artwork.id);
    const note = ART_NOTES[artwork.id];
    assert.ok(note, `text for ${artwork.id}`);
    assert.ok(note.split(/\s+/).length <= 30, `${artwork.id}: ${note.split(/\s+/).length} words`);
    assert.ok((note.match(/[.!?](\s|$)/g) ?? []).length <= 2, `${artwork.id}: at most two sentences`);
  }
  assert.deepEqual(Object.keys(ART_NOTES).map(Number).sort(), [...PORTRAIT_IDS].sort());
});

function solvedRun() {
  const s = openStation(timeline([INGRES, SARGENT, DEGAS, CEZANNE]));
  s.key('Enter');
  s.clock.ms = T0 + FLASH_MS + 6000;
  s.key('2'); s.key('3'); s.key('Enter');
  return s;
}

test('the success popup has "Learn about the art A"; Enter still returns to the museum', () => {
  const s = solvedRun();
  const learn = findButton(s.container, 'Learn about the art');
  assert.ok(learn, 'second button');
  assert.match(learn.textContent, /A$/);
  assert.notEqual(document.activeElement, learn, 'the focus stays on Return to museum');
  s.key('Enter');
  assert.equal(s.closed(), 1);
  s.cleanup();
});

test('A opens the art cards: ← → browse all four, alt texts, Esc closes; time and points stay the same', () => {
  const s = solvedRun();
  const before = { saves: s.saved.length, state: structuredClone(s.last()), reports: s.solvedReports.length };
  const time = elapsedMs(s.last(), s.clock.ms);
  s.clock.ms += 60_000;   // a minute of reading changes nothing
  s.key('a');
  const card = () => findAll(s.container, n => n.className === 'art-card')[0];
  assert.ok(card(), 'cards are open');
  assert.equal(document.activeElement, card(), 'focus on the first card');
  const seen = [];
  for (let i = 0; i < 4; i++) {
    const img = findAll(card(), n => n.tagName === 'IMG')[0];
    seen.push(img.getAttribute('alt') ?? img.alt);
    s.key('ArrowRight');
  }
  assert.deepEqual(seen, PORTRAIT_ARTWORKS.map(a => `${a.artist}, ${a.shortTitle}`));
  assert.match(s.text(), /1 \/ 4/, 'after four steps it wraps to the first');
  s.key('ArrowLeft');
  assert.match(s.text(), /4 \/ 4/);
  assert.match(s.text(), new RegExp(ART_NOTES[CEZANNE].slice(0, 20)));
  assert.equal(s.saved.length, before.saves, 'no new save');
  assert.deepEqual(s.last(), before.state);
  assert.equal(elapsedMs(s.last(), s.clock.ms), time, 'the clock stays stopped');
  assert.equal(portraitSpeedPoints(elapsedMs(s.last(), s.clock.ms)), 15);
  assert.equal(s.solvedReports.length, before.reports, 'no second report');
  s.key('Escape');
  assert.equal(s.closed(), 1, 'Back to museum');
  s.cleanup();
});
