// One clock rule for all four stations (Auftrag Punkt 1):
// the clock starts with "Start" (not when the station opens), keeps running while the player is away
// (leaving, reload, browser back all just close the station), a reopened station goes straight back
// into the game with the elapsed time, and a solved station never changes its time again.
import test from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom, createContainer, findAll, findButton } from '../story/tests/fake-dom.js';
import { CLOCK_NOTE, SPEED_TEXT } from './station-ui.js?v=clock-note-1';
import * as portrait from './portrait-timeline.js';
import * as picture from './picture-puzzle.js';
import * as catalogue from './curators-catalogue.js';
import * as forgery from './spot-the-forgery.js';
import { PORTRAIT_IDS, correctOrder, checkOrder, FLASH_MS } from './portrait-rules.js';
import { placePiece } from './picture-rules.js';
import { placeLabel } from './catalogue-rules.js';
import { guess, regions } from './forgery-rules.js';
import { CATALOGUE_ARTWORKS } from './catalogue-data.js';

const flush = () => new Promise(resolve => setImmediate(resolve));

// For each station: its module, what it needs to load in the fake DOM, and how to solve a saved state.
const STATIONS = [
  { name: 'Station 1 (portraits)', module: portrait, readingMs: FLASH_MS,
    caseData: () => ({ storage: { getItem: () => null, setItem() {} }, loadPortraits: async () => PORTRAIT_IDS.map(id => ({ id, src: `local-${id}.jpg` })) }),
    solve: (state, now) => checkOrder({ ...state, order: correctOrder() }, now) },
  { name: 'Station 2 (picture puzzle)', module: picture, readingMs: 0,
    caseData: () => ({ loadArtwork: async () => ({ src: 'renoir.jpg', width: 600, height: 511 }) }),
    solve: (state, now) => [0, 1, 2, 3, 4, 5, 6, 7].reduce((s, piece) => placePiece(s, piece, piece, now), state) },
  { name: 'Station 3 (catalogue)', module: catalogue, readingMs: 0,
    caseData: () => ({ loadArtwork: async () => CATALOGUE_ARTWORKS.map(w => ({ id: w.id, src: w.image, width: 500, height: 600 })) }),
    solve: (state, now) => [0, 1, 2, 3].reduce((s, label) => placeLabel(s, label, label, now), state) },
  { name: 'Station 4 (forgery)', module: forgery, readingMs: 0,
    caseData: () => ({}),
    solve: (state, now) => [0, 1, 2].reduce((s, id) => guess(s, regions[id].x, regions[id].y, now), state) },
];

// Opens a station like the host does: saved progress in, every change out.
async function open(station, clock, saved) {
  const doc = installFakeDom();
  const create = doc.createElement;
  doc.createElement = tag => {   // Station 4 waits until both paintings decode
    const node = create(tag);
    if (tag === 'img') node.decode = async () => {};
    return node;
  };
  const root = createContainer();
  const page = { root, saved, closed: 0, solved: 0 };
  page.cleanup = station.module.start(root, {
    ...station.caseData(), state: saved ?? undefined, now: () => clock.ms,
    onChange: state => { page.saved = structuredClone(state); }, onClose: () => { page.closed++; },
  }, () => { page.solved++; });
  await flush(); await flush();
  return page;
}

const shownSeconds = root => {
  const bar = findAll(root, node => node.getAttribute('role') === 'progressbar')[0];
  return bar ? Number(bar.getAttribute('aria-valuenow')) : null;
};
const startButton = root => findAll(root, node => node.tagName === 'BUTTON' && /^Start/.test(node.textContent))[0];

for (const station of STATIONS) {
  test(`${station.name}: intro tells the player the clock keeps running`, async t => {
    const page = await open(station, { ms: 1000 }, null);
    t.after(() => page.cleanup());
    const intro = findAll(page.root, node => node.className === 'puzzle-intro')[0];
    const lines = findAll(intro, node => node.tagName === 'P').map(node => node.textContent);
    assert.deepEqual(lines.slice(1, 3), [SPEED_TEXT, CLOCK_NOTE], 'same two lines, same order in every station');
    assert.ok(CLOCK_NOTE.split(' ').length <= 8);
  });

  test(`${station.name}: opening does not start the clock, Start does`, async t => {
    const clock = { ms: 1000 };
    const page = await open(station, clock, null);
    t.after(() => page.cleanup());
    clock.ms = 60000;   // looking at the intro for a minute costs nothing
    assert.ok(startButton(page.root), 'the intro waits for Start');
    assert.equal(page.saved?.startedAt ?? null, null);
    startButton(page.root).click();
    assert.equal(page.saved.startedAt, 60000);
  });

  test(`${station.name}: leaving does not pause; reopening continues without a second Start; solved freezes`, async t => {
    const clock = { ms: 1000 };
    let page = await open(station, clock, null);
    startButton(page.root).click();
    const started = page.saved;
    page.cleanup();   // leave the station (also what reload and browser back do)

    clock.ms = 1000 + station.readingMs + 20000;   // 20 s on the clock while the player was away
    page = await open(station, clock, started);
    assert.equal(startButton(page.root), undefined, 'no new intro, no second Start');
    page.cleanup();   // the station's own timer would otherwise keep running
    assert.equal(shownSeconds(page.root), 20, 'the elapsed time is shown at once');
    assert.equal(page.saved.startedAt, started.startedAt, 'reopening never restarts the clock');

    const solved = station.solve(page.saved, clock.ms + 5000);
    assert.equal(solved.solved, true);
    clock.ms += 600000;   // ten minutes later
    page = await open(station, clock, solved);
    page.cleanup();
    assert.equal(shownSeconds(page.root), 25, 'a solved station keeps its finishing time');
    assert.equal(page.saved?.finishedAt ?? solved.finishedAt, solved.finishedAt);
  });
}
