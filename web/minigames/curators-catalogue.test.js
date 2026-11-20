import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initialCatalogue, validCatalogue, startCatalogue, placeLabel, elapsedMs } from './catalogue-rules.js';
import { CATALOGUE_ARTWORKS as works } from './catalogue-data.js';
import { loadCatalogue } from './catalogue-artwork.js';
import { start } from './curators-catalogue.js';
import { newGame, readMission, solveStation } from '../story/engine.js';
import { createStoryHost, memoryStorage } from '../story/host.js';
import { pictureSpeedPoints, synchronizeScore, scoreboard, maximumScore, validRun } from '../story/scoring.js';
import { installFakeDom, createContainer, findAll, findButton } from '../story/tests/fake-dom.js';

const fresh = () => startCatalogue(initialCatalogue(), 1000);
const finish = ms => [0, 1, 2, 3].reduce((s, id) => placeLabel(s, id, id, 1000 + ms), fresh());
const images = async () => works.map(w => ({ id: w.id, src: w.image, width: 500, height: 600 }));
const flush = () => new Promise(resolve => setImmediate(resolve));
const slots = root => findAll(root, n => n.getAttribute('data-slot') !== null);
const cards = root => findAll(root, n => n.className === 'catalogue-card');
const card = (root, id) => cards(root).find(n => n.getAttribute('data-label') === String(id));
async function page(t, extra = {}) {
  installFakeDom();
  const root = createContainer(), saves = [], awards = [];
  const cleanup = start(root, { now: () => 1000, onChange: s => saves.push(structuredClone(s)), loadArtwork: images, ...extra }, r => awards.push(r));
  t.after(cleanup); await flush();
  return { root, saves, awards, cleanup };
}

test('four distinct labels are shuffled without ever losing one or starting in solution order', () => {
  for (const random of [() => 0, () => .99999, Math.random]) for (let i = 0; i < 50; i++) {
    const s = initialCatalogue(random);
    assert.deepEqual([...s.order].sort(), [0, 1, 2, 3]);
    assert.notDeepEqual(s.order, [0, 1, 2, 3]);
    assert.equal(validCatalogue(s), true);
  }
});

test('incorrect placements move, swap and return; correct labels cannot move or be displaced', () => {
  let s = fresh();
  s = placeLabel(s, 0, 2); s = placeLabel(s, 1, 3);
  s = placeLabel(s, 0, 3);
  assert.deepEqual(s.slots, [null, null, 1, 0]);
  s = placeLabel(s, 2, 3);
  assert.deepEqual(s.slots, [null, null, 1, 2]);
  s = placeLabel(s, 2, null);
  assert.deepEqual(s.slots, [null, null, 1, null]);
  s = placeLabel(s, 0, 0);
  assert.equal(placeLabel(s, 0, null), s);
  assert.equal(placeLabel(s, 0, 1), s);
  assert.equal(placeLabel(s, 1, 0), s);
  assert.equal(validCatalogue(s), true);
});

test('returning into any empty tray space saves that position, including tray-to-tray moves', () => {
  let s = placeLabel(placeLabel(fresh(), 0, 2), 1, 3);
  const destination = s.order.indexOf(1);
  s = placeLabel(s, 0, null, 1200, destination);
  assert.equal(s.order[destination], 0);
  assert.deepEqual(s.slots, [null, null, null, 1]);
  const empty = s.order.indexOf(1);
  s = placeLabel(s, 2, null, 1300, empty);
  assert.equal(s.order[empty], 2);
  assert.equal(validCatalogue(s), true);
  assert.equal(placeLabel(s, 3, null, 1400, empty), s, 'occupied tray space is not a destination');
});

test('invalid moves and unstarted moves do nothing; full wrong boards do not finish', () => {
  const initial = initialCatalogue();
  assert.equal(placeLabel(initial, 0, 0), initial);
  let s = fresh();
  for (const [label, target] of [[4, 0], [0, 4], ['0', 0], [0, -1], [0, '0']]) assert.equal(placeLabel(s, label, target), s);
  for (let i = 0; i < 4; i++) s = placeLabel(s, i, (i + 1) % 4);
  assert.equal(s.solved, false);
  assert.equal(s.finishedAt, null);
  for (let i = 0; i < 4; i++) s = placeLabel(s, i, i, 1500);
  assert.equal(s.solved, true);
  assert.equal(s.finishedAt, 1500);
  assert.equal(placeLabel(s, 0, null), s);
  assert.equal(elapsedMs(s, 999999), 500);
});

test('saved order, placements and running clock round-trip; malformed saves are rejected', () => {
  const s = placeLabel(fresh(), 3, 0);
  const restored = JSON.parse(JSON.stringify(s));
  assert.equal(validCatalogue(restored), true);
  assert.deepEqual(restored, s);
  assert.equal(elapsedMs(restored, 47000), 46000);
  assert.equal(startCatalogue(restored, 90000), restored);
  for (const changes of [{ version: 2 }, { artworkIds: [1, 2, 3, 4] }, { order: [0, 0, 2, 3] }, { slots: [1, 1, null, null] }, { startedAt: null }, { startedAt: -1 }, { finishedAt: 500 }, { solved: true }, { hints: -1 }]) {
    assert.equal(validCatalogue({ ...s, ...changes }), false, JSON.stringify(changes));
  }
});

test('B shares L’s exact inclusive boundaries and scoreboard freezes the completion time', () => {
  for (const [ms, points] of [[0,15],[29999,15],[30000,15],[30001,10],[45000,10],[45001,5],[60000,5],[60001,0]]) {
    const progress = finish(ms);
    let story = readMission(newGame()).state;
    assert.equal(synchronizeScore(story, { landscape: fresh() }).stations.landscape.points, 0);
    story = synchronizeScore(solveStation(story, 'landscape').state, { landscape: progress });
    assert.equal(story.stations.landscape.points, pictureSpeedPoints(ms));
    assert.equal(story.stations.landscape.points, points);
    const board = scoreboard(story);
    assert.equal(board.stations.find(row => row.id === 'landscape').timeMs, ms);
    assert.equal(board.stations.find(row => row.id === 'landscape').max, 15);
    assert.equal(board.max, 80);
    assert.equal(synchronizeScore(story, { landscape: progress }, 99999999), story);
  }
});

test('all selected works have exact checked Met metadata, distinct fields and bundled JPEGs', async () => {
  const previous = [436535, 459193, 436703, 436121, 12127, 435876, 435882, 459111, 437998];
  for (const work of works) {
    assert.ok(!previous.includes(work.id));
    const record = JSON.parse(await readFile(new URL(`../assets/catalogue/met-${work.id}.json`, import.meta.url)));
    for (const field of ['title', 'artistDisplayName', 'culture', 'medium']) {
      assert.ok(work[field].trim()); assert.equal(work[field], record[field]);
    }
    assert.equal(record.isPublicDomain, true);
    assert.equal(work.image, record.primaryImageSmall);
    const bytes = await readFile(new URL(`../assets/catalogue/met-${work.id}.jpg`, import.meta.url));
    assert.equal(bytes.readUInt16BE(0), 0xffd8);
  }
  assert.equal(new Set(works.map(w => w.medium)).size, 4);
});

test('bundled art works offline, a missing local image falls back, any unavailable work rejects the set', async () => {
  const readImage = async src => ({ src, width: 500, height: 600 });
  const local = await loadCatalogue({ readImage });
  assert.ok(local.every(w => w.src.includes('/assets/catalogue/')));
  const fallback = await loadCatalogue({ readImage: async src => {
    if (src.includes('/assets/')) throw Error('missing');
    return readImage(src);
  } });
  assert.ok(fallback.every(w => w.src.startsWith('https://images.metmuseum.org/')));
  await assert.rejects(loadCatalogue({ readImage: async src => {
    if (src.includes('met-9485') || src === works[1].image) throw Error('unavailable');
    return readImage(src);
  } }), /All four artworks/);
  await assert.rejects(loadCatalogue({ readImage: async src => ({ src, width: 0, height: 600 }) }), /All four artworks/);
});

test('loading and failure block Start; retry and instructions never start the clock', async t => {
  let release;
  const p = await page(t, { loadArtwork: () => new Promise(resolve => { release = resolve; }) });
  assert.equal(findButton(p.root, 'Start'), undefined);
  document.pressKey('Enter');
  assert.equal(p.saves.at(-1).startedAt, null);
  release(await images()); await flush();
  findButton(p.root, '?').click(); document.pressKey('Escape');
  assert.equal(p.saves.at(-1).startedAt, null);
  assert.equal(slots(p.root).length, 0);
  assert.equal(findAll(p.root, n => n.getAttribute('role') === 'progressbar').length, 0);
  findButton(p.root, 'Start').click();
  assert.equal(slots(p.root).length, 4);
  assert.equal(p.saves.at(-1).startedAt, 1000);
});

test('missing art shows Retry and a successful retry stays untimed until Start', async t => {
  let tries = 0;
  const p = await page(t, { loadArtwork: async () => ++tries === 1 ? (await images()).slice(0, 3) : images() });
  assert.equal(findButton(p.root, 'Start'), undefined);
  assert.match(p.root.textContent, /All four artworks/);
  findButton(p.root, 'Retry').click(); await flush();
  assert.ok(findButton(p.root, 'Start'));
  assert.equal(p.saves.at(-1).startedAt, null);
});

test('only label slots are interactive; incorrect labels return to an empty tray slot', async t => {
  const p = await page(t); findButton(p.root, 'Start').click();
  const guide = findAll(p.root, n => n.className === 'puzzle-drag-demo')[0];
  assert.equal(guide.hidden, false);
  assert.equal(findButton(p.root, 'Return selected label'), undefined);
  assert.doesNotMatch(p.root.textContent, /of 4 matched/);
  assert.ok(findAll(p.root, n => n.tagName === 'FIGURE').length === 4);
  card(p.root, 0).click(); slots(p.root)[2].click();
  assert.equal(guide.hidden, true);
  assert.equal(document.activeElement, slots(p.root)[2]);
  card(p.root, 1).click(); slots(p.root)[3].click();
  slots(p.root)[2].click(); slots(p.root)[3].click();
  assert.deepEqual(p.saves.at(-1).slots, [null, null, 1, 0]);
  const empty = p.saves.at(-1).order.indexOf(1);
  slots(p.root)[3].click();
  findAll(p.root, n => n.getAttribute('data-tray') === String(empty))[0].click();
  assert.deepEqual(p.saves.at(-1).slots, [null, null, 1, null]);
  assert.equal(p.saves.at(-1).order[empty], 0);
  assert.equal(document.activeElement, card(p.root, 0));
  card(p.root, 0).click(); slots(p.root)[0].click();
  assert.equal(slots(p.root)[0].disabled, true);
  assert.ok(slots(p.root)[0].className.includes('is-correct'));
  assert.equal(slots(p.root)[0].draggable, undefined);
  assert.ok(document.activeElement !== slots(p.root)[0], 'focus moves to an editable control');
});

test('internal dragging returns to a specific tray space; locked matches reject all drops', async t => {
  const p = await page(t); findButton(p.root, 'Start').click();
  const dataTransfer = { value: '0', setData(type, value) { this.value = value; }, getData() { return this.value; } };
  const drop = (from, to) => { from.dispatch('dragstart', { dataTransfer }); to.dispatch('drop', { dataTransfer }); };
  slots(p.root)[0].dispatch('drop', { dataTransfer });
  assert.deepEqual(p.saves.at(-1).slots, [null, null, null, null]);
  drop(card(p.root, 0), slots(p.root)[2]);
  drop(slots(p.root)[2], findAll(p.root, n => n.className === 'catalogue-card is-empty')[0]);
  assert.deepEqual(p.saves.at(-1).slots, [null, null, null, null]);
  drop(card(p.root, 0), slots(p.root)[0]);
  drop(card(p.root, 1), slots(p.root)[0]);
  assert.deepEqual(p.saves.at(-1).slots, [0, null, null, null]);
});

test('completion reports once, displays the O clue, and freezes reward', async t => {
  let time = 1000, closed = 0;
  const p = await page(t, { now: () => time, onClose: () => closed++ });
  document.pressKey('Enter'); time = 46000;
  for (let id = 0; id < 4; id++) { card(p.root, id).click(); slots(p.root)[id].click(); }
  assert.equal(p.awards.length, 1);
  assert.match(p.root.textContent, /Voss approved the false wall label/);
  assert.match(p.root.textContent, /Oadded to journal/);
  assert.match(p.root.textContent, /\+10 points earned/);
  slots(p.root)[0].click(); time = 999999;
  assert.equal(p.awards.length, 1);
  document.pressKey('Enter'); assert.equal(closed, 1);
});

test('closing during loading cannot render or save after cleanup', async t => {
  let release;
  const p = await page(t, { loadArtwork: () => new Promise(resolve => { release = resolve; }) });
  p.cleanup(); const before = p.root.textContent, saves = p.saves.length;
  release(await images()); await flush();
  assert.equal(p.root.textContent, before); assert.equal(p.saves.length, saves);
});

test('host persists unfinished matches, elapsed time and a single award across new instances', async t => {
  installFakeDom();
  const storage = memoryStorage(), root = createContainer(); let time = 1000;
  storage.setItem('test', JSON.stringify({ story: JSON.stringify(readMission(newGame()).state), progress: {} }));
  const opts = { storage, storageKey: 'test', now: () => time, openPanel: () => root, closePanel() {},
    stations: { landscape: { start: (c, data, done) => start(c, { ...data, loadArtwork: images }, done) } } };
  let host = createStoryHost(opts); t.after(() => host.leaveStation());
  host.openStation('landscape'); await flush(); findButton(root, 'Start').click();
  assert.equal(findAll(root, n => n.tagName === 'BUTTON' && /Back to.*museum/.test(n.textContent)).length, 1);
  card(root, 0).click(); slots(root)[2].click();
  const before = JSON.parse(storage.getItem('test')).progress.landscape;
  host.leaveStation(); time = 32000;
  host = createStoryHost(opts); host.openStation('landscape'); await flush();
  const after = JSON.parse(storage.getItem('test')).progress.landscape;
  assert.deepEqual(after, before); assert.equal(elapsedMs(after, time), 31000);
  slots(root)[2].click(); slots(root)[0].click();
  for (const id of [1, 2, 3]) { card(root, id).click(); slots(root)[id].click(); }
  assert.equal(host.state.stations.landscape.points, 10);
  assert.deepEqual(host.state.letters, ['O', null, null, null]);
  assert.deepEqual(host.state.evidence, ['false-label']);
  host.leaveStation(); time = 999999;
  host = createStoryHost(opts); host.openStation('landscape');
  assert.match(root.textContent, /Already solved/);
  assert.equal(host.state.stations.landscape.points, 10);
  assert.deepEqual(host.state.evidence, ['false-label']);
});

test('host recovers an interrupted final match exactly once and retains every legacy B reward', () => {
  const storage = memoryStorage(), storageKey = 'test';
  const story = readMission(newGame()).state;
  storage.setItem(storageKey, JSON.stringify({ story: JSON.stringify(story), progress: { landscape: finish(60001) } }));
  for (let i = 0; i < 2; i++) {
    const host = createStoryHost({ storage, storageKey });
    assert.deepEqual(host.state.evidence, ['false-label']);
    assert.equal(host.state.stations.landscape.points, 0);
    assert.equal(host.state.letters[0], 'O');
  }
  for (const points of [5, 12, 15, 17, 20]) {
    const legacy = solveStation(story, 'landscape').state;
    legacy.stations.landscape = { solved: true, mistakes: 1, hints: 1, points };
    storage.setItem(storageKey, JSON.stringify({ story: JSON.stringify(legacy), progress: { landscape: { solved: true, mistakes: 1, hints: 1 } } }));
    const host = createStoryHost({ storage, storageKey });
    assert.equal(host.state.stations.landscape.points, points);
    assert.equal(scoreboard(host.state).stations.find(row => row.id === 'landscape').points, points);
    assert.equal(maximumScore(host.state), 85);
    assert.deepEqual(host.state.evidence, ['false-label']);
  }
  for (const max of [80, 85, 90]) assert.equal(validRun({ points: max, max, timeMs: 1000 }), true);
});

test('old unfinished wall-label counts survive the replacement and do not start a timer', async t => {
  const p = await page(t, { state: { solved: false, mistakes: 3, hints: 1 } });
  assert.equal(p.saves.at(-1).mistakes, 3); assert.equal(p.saves.at(-1).hints, 1);
  assert.equal(p.saves.at(-1).startedAt, null);
  assert.equal(validCatalogue(p.saves.at(-1)), true);
});


test('a correct match from an existing partial save is locked without resetting its timer', async t => {
  const saved = placeLabel(fresh(), 0, 0, 5000);
  const p = await page(t, { state: saved, now: () => 12000 });
  assert.equal(slots(p.root)[0].disabled, true);
  assert.equal(p.saves.at(-1).startedAt, 1000);
  card(p.root, 1).click(); slots(p.root)[0].click();
  assert.deepEqual(p.saves.at(-1).slots, [0, null, null, null]);
});

test('before solving, the credits name no answer: only "Artwork 1 ↗" links to the Met pages', async t => {
  const { root } = await page(t, { state: fresh() });   // started, nothing placed yet
  const credit = findAll(root, n => (n.className ?? '').includes('catalogue-credits'))[0];
  assert.ok(credit, 'credit area');
  for (const work of works) {
    for (const answer of [work.date, work.medium, work.culture, work.artistDisplayName, work.title]) {
      assert.equal(credit.textContent.includes(answer), false, `credits must not show "${answer}"`);
    }
  }
  const links = findAll(credit, n => n.tagName === 'A');
  assert.deepEqual(links.map(a => a.textContent), ['Artwork 1 ↗', 'Artwork 2 ↗', 'Artwork 3 ↗', 'Artwork 4 ↗']);
  assert.deepEqual(links.map(a => a.href), works.map(w => w.url));
  assert.ok(links.every(a => a.target === '_blank' && a.rel.includes('noopener')));
});

test('after solving, the full credit line appears', async t => {
  const { root } = await page(t, { state: finish(5000) });
  const credit = findAll(root, n => (n.className ?? '').includes('catalogue-credits'))[0];
  for (const work of works) assert.ok(credit.textContent.includes(work.artistDisplayName), work.artistDisplayName);
});
