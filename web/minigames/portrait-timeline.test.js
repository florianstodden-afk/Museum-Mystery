import test from 'node:test';
import assert from 'node:assert/strict';
import { PORTRAIT_IDS, initialTimeline, startTimeline, FLASH_MS, PENALTY_MS } from './portrait-rules.js';
import { PORTRAIT_ARTWORKS, loadPortrait, loadPortraits, verifiedImageUrl } from './portrait-artwork.js';
import { start } from './portrait-timeline.js';
import { installFakeDom, createContainer, findAll, findButton } from '../story/tests/fake-dom.js';

const DEGAS = 436121;
const SARGENT = 12127;
const CEZANNE = 435876;
const RIGHT = [DEGAS, SARGENT, CEZANNE];
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

// Opens the station with a hand-moved clock: station.clock.ms is "now".
function openStation(savedState, extra = {}) {
  installFakeDom();
  const container = createContainer();
  const saved = [];
  const solvedReports = [];
  const played = [];
  const clock = { ms: T0 };
  const store = {};
  const cleanup = start(container, {
    state: savedState,
    now: () => clock.ms,
    onChange: state => saved.push(structuredClone(state)),
    playSound: id => played.push(id),
    storage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } },
    loadPortraits: async () => PORTRAIT_IDS.map(id => ({ id, src: `local-${id}.jpg`, offline: true })),
    ...extra,
  }, report => solvedReports.push(report));
  const faces = () => findAll(container, node => node.className === 'portrait-face');
  const faceFor = id => faces().find(face => face.getAttribute('aria-label').includes(PORTRAIT_ARTWORKS.find(a => a.id === id).artist));
  const chips = () => findAll(container, node => node.className === 'portrait-chip' && !node.hidden).map(node => node.textContent);
  const time = () => findAll(container, node => node.className === 'portrait-time')[0].textContent;
  const key = k => findAll(container, node => node.className === 'portrait-timeline')[0].dispatch('keydown', { key: k });
  return { container, saved, solvedReports, played, clock, store, cleanup, faces, faceFor, chips, time, key, last: () => saved[saved.length - 1] };
}

test('before Start: no clock, no dates, cards locked, one short task line', () => {
  const s = openStation(timeline([SARGENT, DEGAS, CEZANNE]));
  assert.equal(s.time(), '0:00');
  assert.deepEqual(s.chips(), []);
  assert.match(s.container.textContent, /Memorise the dates, then sort oldest to newest\./);
  assert.match(s.container.textContent, /<0:20 = 15 pts/);
  s.faces()[0].click();
  assert.equal(s.last().startedAt, null);
  s.cleanup();
});

test('Start runs the clock and flashes all dates for 3 s, then they vanish', () => {
  const s = openStation(timeline([SARGENT, DEGAS, CEZANNE]));
  findButton(s.container, 'Start').click();
  assert.equal(s.last().startedAt, T0);
  assert.deepEqual(s.chips(), ['1883–84', '1865', '1888–90']);
  assert.match(s.container.textContent, /dates vanish in 3 s/);
  s.clock.ms = T0 + FLASH_MS;
  findButton(s.container, 'Check order').click(); // wrong order: +5 s
  assert.deepEqual(s.chips(), []);
  assert.equal(s.time(), '0:08');
  assert.match(s.container.textContent, /Not yet\. \+5 s/);
  s.cleanup();
});

test('a whole run: Start, number keys to swap, Enter to check – onSolved once, log on the backs', () => {
  const s = openStation(timeline([SARGENT, DEGAS, CEZANNE]));
  s.key('Enter');                   // Enter = Start
  s.clock.ms = T0 + 6000;
  s.key('1'); s.key('2');           // swap places 1 and 2
  assert.deepEqual(s.last().order, RIGHT);
  s.key('Enter');                   // check
  assert.equal(s.last().solved, true);
  assert.deepEqual(s.solvedReports, [{ mistakes: 0, hints: 0 }]);
  assert.match(s.container.textContent, /Solved in 0:06 · \+15 · Letter I in your journal · New best!/);
  assert.match(s.container.textContent, /21:14 · Cart out – “patron visit, A\. V\.”/);
  s.key('Enter');
  assert.deepEqual(s.solvedReports.length, 1);
  assert.deepEqual(s.played, ['page', 'click', 'click', 'flip']);
  assert.equal(s.store['museum-nocturne-portrait-best-v1'], '6000');
  s.cleanup();
});

test('Peek shows one date for a moment and costs 5 s', () => {
  const s = openStation(timeline([SARGENT, DEGAS, CEZANNE]));
  findButton(s.container, 'Start').click();
  s.clock.ms = T0 + 4000;
  findButton(s.container, 'Peek').click();     // first card: Sargent
  assert.deepEqual(s.chips(), ['1883–84']);
  assert.equal(s.last().penaltyMs, PENALTY_MS);
  assert.equal(s.time(), '0:09');
  assert.deepEqual(s.played, ['page', 'hint']);
  s.cleanup();
});

test('click-click swaps and dragging moves a card', () => {
  const s = openStation(timeline([SARGENT, CEZANNE, DEGAS]));
  findButton(s.container, 'Start').click();
  s.faceFor(SARGENT).click();
  s.faceFor(CEZANNE).click();
  assert.deepEqual(s.last().order, [CEZANNE, SARGENT, DEGAS]);
  const cards = () => findAll(s.container, node => node.tagName === 'LI');
  cards()[2].dispatch('dragstart', { dataTransfer: { setData() {} } }); // Degas
  cards()[0].dispatch('drop');
  assert.deepEqual(s.last().order, [DEGAS, CEZANNE, SARGENT]);
  s.cleanup();
});

test('reopening keeps the clock running and gives no second flash', async () => {
  const first = openStation(timeline([SARGENT, DEGAS, CEZANNE]));
  findButton(first.container, 'Start').click();
  first.cleanup();
  const again = openStation(first.last());
  again.clock.ms = T0 + 20000;
  await new Promise(resolve => setTimeout(resolve, 150)); // the station redraws its clock every 100 ms
  assert.equal(again.time(), '0:20');
  assert.deepEqual(again.chips(), []);
  assert.equal(findButton(again.container, 'Start').hidden, true);
  again.cleanup();
});

test('a broken save starts fresh; an old solved save shows the log and reports once', () => {
  const fresh = openStation({ order: [1, 2, 3], solved: true });
  assert.equal(fresh.last().solved, false);
  fresh.cleanup();
  const old = openStation({ order: RIGHT, solved: true, mistakes: 2, hints: 0, revealed: [] });
  assert.match(old.container.textContent, /21:02 · Leon – east wing round/);
  assert.deepEqual(old.solvedReports, [{ mistakes: 2, hints: 0 }]);
  old.cleanup();
});

test('a broken best-time store does not break the station', () => {
  const s = openStation(timeline(RIGHT.slice().reverse()), { storage: { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } } });
  findButton(s.container, 'Start').click();
  s.key('1'); s.key('3');
  s.key('Enter');
  assert.equal(s.last().solved, true);
  s.cleanup();
});
