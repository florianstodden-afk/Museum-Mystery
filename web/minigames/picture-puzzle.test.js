import test from 'node:test';
import assert from 'node:assert/strict';
import { initialPuzzle, shuffledPieces, validPuzzle, startPuzzle, placePiece, elapsedMs } from './picture-rules.js';
import { ARTWORK, verifiedImageUrl, loadArtwork } from './picture-artwork.js';
import { start } from './picture-puzzle.js';
import { installFakeDom, createContainer, findAll, findButton } from '../story/tests/fake-dom.js';

test('shuffle always contains all eight pieces and never starts in solution order', () => {
  for (const random of [() => 0, () => .999999, Math.random]) {
    for (let n = 0; n < 100; n++) {
      const order = shuffledPieces(random);
      assert.deepEqual([...order].sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
      assert.notDeepEqual(order, [0, 1, 2, 3, 4, 5, 6, 7]);
    }
  }
});

test('placements can be corrected, moved and returned; invalid moves are unchanged', () => {
  const fresh = initialPuzzle();
  assert.equal(placePiece(fresh, 0, 0), fresh);
  let s = startPuzzle(fresh, 1000);
  assert.equal(startPuzzle(s, 2000), s);
  s = placePiece(s, 0, 5);
  for (const [piece, target] of [[1, 5], [8, 1], [1, -1], ['1', 1], [1, '1']]) assert.equal(placePiece(s, piece, target), s);
  s = placePiece(s, 0, 3);
  assert.equal(s.slots[5], null);
  s = placePiece(s, 0, null);
  assert.deepEqual(s.slots, Array(8).fill(null));
  assert.equal(s.mistakes, 0);
  for (let i = 0; i < 8; i++) s = placePiece(s, i, (i + 1) % 8);
  assert.equal(s.solved, false, 'a full but incorrect board does not finish');
});

test('only the final correct placement freezes time and solved puzzles cannot change', () => {
  let s = startPuzzle(initialPuzzle(), 1000);
  for (let i = 0; i < 8; i++) s = placePiece(s, i, i, 2000 + i);
  assert.equal(s.finishedAt, 2007);
  assert.equal(s.solved, true);
  assert.equal(elapsedMs(s, 999999), 1007);
  assert.equal(placePiece(s, 0, null), s);
  assert.equal(validPuzzle(JSON.parse(JSON.stringify(s))), true);
});

test('saved progress retains order, slots and clock; malformed arrangements are rejected', () => {
  const s = placePiece(startPuzzle(initialPuzzle(), 1000), 3, 6);
  const restored = JSON.parse(JSON.stringify(s));
  assert.deepEqual(restored, s);
  assert.equal(validPuzzle(restored), true);
  assert.equal(elapsedMs(restored, 45000), 44000);
  assert.equal(validPuzzle({ ...s, order: Array(8).fill(1) }), false);
  assert.equal(validPuzzle({ ...s, slots: Array(8).fill(1) }), false);
  assert.equal(validPuzzle({ solved: true }), false);
});

const remote = 'https://images.metmuseum.org/CRDImages/rl/web-large/DT3130.jpg';
const metadata = { objectID: 459111, title: 'Sea and Cliffs', artistDisplayName: 'Auguste Renoir', isPublicDomain: true, primaryImageSmall: remote, primaryImage: remote.replace('web-large', 'original') };
const image = async src => ({ src, width: 600, height: 511 });
const response = async () => ({ ok: true, json: async () => metadata });
test('artwork checks identity, public domain and image host, preferring the smaller image', () => {
  assert.equal(verifiedImageUrl(metadata), remote);
  assert.equal(verifiedImageUrl({ ...metadata, primaryImageSmall: '' }), metadata.primaryImage);
  for (const changed of [{ objectID: 1 }, { title: 'Another painting' }, { isPublicDomain: false }, { primaryImageSmall: 'https://example.com/art.jpg' }]) {
    assert.throws(() => verifiedImageUrl({ ...metadata, ...changed }));
  }
});

test('API errors, invalid metadata and remote image failure use the bundled Met copy', async () => {
  assert.equal((await loadArtwork({ fetchData: response, readImage: image })).src, remote);
  const fail = async () => { throw new Error('offline'); };
  for (const fetchData of [fail, async () => ({ ok: false }), async () => ({ ok: true, json: async () => ({ ...metadata, isPublicDomain: false }) })]) {
    const result = await loadArtwork({ fetchData, readImage: image });
    assert.equal(result.src, ARTWORK.local); assert.equal(result.offline, true);
  }
  const result = await loadArtwork({ fetchData: response, readImage: src => src === remote ? fail() : image(src) });
  assert.equal(result.src, ARTWORK.local);
  await assert.rejects(loadArtwork({ fetchData: fail, readImage: fail }), /bundled copy/);
});

const flush = () => new Promise(resolve => setImmediate(resolve));
async function puzzlePage(t, overrides = {}) {
  installFakeDom();
  const root = createContainer(), saves = [], completions = [];
  const cleanup = start(root, { onChange: s => saves.push(structuredClone(s)), now: () => 1000,
    loadArtwork: () => image(remote), ...overrides }, result => completions.push(result));
  t.after(cleanup);
  await flush();
  return { root, saves, completions };
}
const slots = root => findAll(root, n => n.className === 'puzzle-slot');
const pieces = root => findAll(root, n => n.className === 'puzzle-piece');

test('native buttons provide keyboard activation, visible selection and focus after placement', async t => {
  const { root, saves, completions } = await puzzlePage(t);
  assert.equal(findButton(root, 'Show reference'), undefined);
  assert.equal(saves.at(-1).startedAt, null);
  findButton(root, 'Start puzzle').click();
  assert.equal(findButton(root, 'Show reference'), undefined);
  assert.equal(findAll(root, node => node.tagName === 'IMG').length, 0);
  assert.equal(slots(root).length, 8);
  assert.ok(slots(root).every(node => node.textContent === ''), 'slots have no visible marks');
  assert.equal(pieces(root).length, 8);
  for (const node of [...slots(root), ...pieces(root)]) {
    assert.equal(node.tagName, 'BUTTON');
    assert.equal(node.getAttribute('type'), 'button');
    assert.ok(node.getAttribute('aria-label'));
  }
  // Enter/Space on a native button dispatch click in the browser; no pointer-only handler.
  for (let i = 0; i < 8; i++) {
    pieces(root).find(n => n.getAttribute('data-piece') === String(i)).click();
    assert.equal(document.activeElement.getAttribute('aria-pressed'), 'true');
    slots(root)[i].click();
    if (i < 7) assert.equal(document.activeElement, slots(root)[i]);
  }
  assert.equal(saves.at(-1).solved, true);
  assert.equal(completions.length, 1);
  slots(root)[0].click();
  assert.equal(completions.length, 1);
  assert.match(root.textContent, /hidden “V”/);
});

test('dragging rejects occupied targets and external text, and returns pieces to the tray', async t => {
  const { root, saves } = await puzzlePage(t);
  findButton(root, 'Start puzzle').click();
  const dataTransfer = { value: '', setData(type, value) { this.value = value; }, getData() { return this.value; } };
  slots(root)[0].dispatch('drop', { dataTransfer });
  assert.deepEqual(saves.at(-1).slots, Array(8).fill(null));
  pieces(root)[0].dispatch('dragstart', { dataTransfer });
  slots(root)[0].dispatch('drop', { dataTransfer });
  assert.equal(pieces(root).length, 7);
  const before = saves.at(-1);
  pieces(root)[0].dispatch('dragstart', { dataTransfer });
  slots(root)[0].dispatch('drop', { dataTransfer });
  assert.deepEqual(saves.at(-1), before);
  slots(root)[0].dispatch('dragstart', { dataTransfer });
  findAll(root, n => n.className === 'puzzle-tray')[0].dispatch('drop', { dataTransfer });
  assert.equal(pieces(root).length, 8);
});

test('both image sources failing gives Retry; retry does not start the clock', async t => {
  let attempts = 0;
  const { root, saves } = await puzzlePage(t, { loadArtwork: async () => {
    if (++attempts === 1) throw new Error('The painting could not be loaded online or from the bundled copy. Please retry.');
    return image(remote);
  } });
  assert.match(root.textContent, /could not be loaded/);
  assert.equal(findButton(root, 'Start puzzle'), undefined);
  findButton(root, 'Retry').click(); await flush();
  assert.ok(findButton(root, 'Start puzzle'));
  assert.equal(saves.at(-1).startedAt, null);
});

test('opening screen keeps details behind help and has no board, timer or credit', async t => {
  const { root, saves } = await puzzlePage(t);
  assert.match(root.textContent, /30 \/ 45 \/ 60 seconds for 15 \/ 10 \/ 5 points/);
  assert.equal(slots(root).length, 0);
  assert.equal(findAll(root, n => n.getAttribute('role') === 'progressbar').length, 0);
  assert.doesNotMatch(root.textContent, /Public domain|Wrong placements/);
  findButton(root, '?').click();
  assert.match(root.textContent, /Wrong placements are free/);
  assert.equal(findAll(root, n => n.getAttribute('role') === 'dialog').length, 1);
  findButton(root, 'Back to puzzle').click();
  assert.equal(saves.at(-1).startedAt, null);
  assert.equal(findAll(root, n => n.getAttribute('role') === 'dialog').length, 0);
});

test('eight persistent tray slots allow returning a board piece to any empty tray slot', async t => {
  const { root, saves } = await puzzlePage(t);
  findButton(root, 'Start puzzle').click();
  const first = Number(pieces(root)[0].getAttribute('data-piece'));
  pieces(root)[0].click(); slots(root)[0].click();
  const second = Number(pieces(root)[0].getAttribute('data-piece'));
  pieces(root)[0].click(); slots(root)[1].click();
  const tray = () => findAll(root, n => n.className === 'puzzle-tray')[0];
  assert.equal(tray().children.length, 8);
  const destination = saves.at(-1).order.indexOf(second);
  slots(root)[0].click(); tray().children[destination].click();
  assert.equal(saves.at(-1).slots[0], null);
  assert.equal(tray().children[destination].getAttribute('data-piece'), String(first));
  assert.equal(findButton(root, 'Return selected piece to tray'), undefined);
  assert.equal(findAll(root, n => n.className === 'puzzle-drag-demo')[0].hidden, true);
});

test('Enter starts, help traps Escape, and completion Enter closes with a frozen reward', async t => {
  installFakeDom();
  let handler, removed = false, closed = 0, time = 1000;
  document.addEventListener = (type, listener) => { handler = listener; };
  document.removeEventListener = (type, listener) => { removed = listener === handler; };
  const root = createContainer();
  const cleanup = start(root, { now: () => time, onChange() {}, onClose: () => closed++, loadArtwork: () => image(remote) }, () => {});
  t.after(cleanup); await flush();
  const key = key => handler({ key, target: root, preventDefault() {}, stopImmediatePropagation() {} });
  key('Enter');
  assert.equal(slots(root).length, 8);
  findButton(root, '?').click(); key('Escape');
  assert.equal(closed, 0);
  time = 46000;
  for (let i=0;i<8;i++) { pieces(root).find(n => n.getAttribute('data-piece') === String(i)).click(); slots(root)[i].click(); }
  assert.match(root.textContent, /\+10 points earned/);
  assert.equal(findAll(root, n => n.getAttribute('role') === 'dialog').length, 1);
  assert.match(document.activeElement.textContent, /Return to museum/);
  time = 999999;
  assert.match(root.textContent, /\+10 points earned/);
  key('Enter'); assert.equal(closed, 1);
  cleanup(); assert.equal(removed, true);
});

test('time bar includes an unlabelled zero-point tail beyond 60 seconds', async t => {
  const { root } = await puzzlePage(t, { state: startPuzzle(initialPuzzle(), 1000), now: () => 66000 });
  const meter = findAll(root, n => n.getAttribute('role') === 'progressbar')[0];
  assert.equal(meter.getAttribute('aria-valuemax'), '70');
  assert.equal(meter.getAttribute('aria-valuenow'), '65');
  assert.match(meter.getAttribute('aria-valuetext'), /0 points on completion/);
  assert.equal(findAll(root, n => n.className === 'puzzle-time-fill')[0].style.width, `${65 / 70 * 100}%`);
  const marks = findAll(root, n => n.className === 'puzzle-time-marks')[0];
  assert.equal(marks.textContent, '0s30s45s60s');
  assert.match(root.textContent, /\+0 points/);
});

test('drag guide follows tray and empty board slot centers when the layout resizes', async t => {
  const doc = installFakeDom();
  const createElement = doc.createElement;
  let trayLeft = 560;
  let resize;
  doc.createElement = tag => {
    const node = createElement(tag);
    node.getBoundingClientRect = () => ({
      'puzzle-layout': { left: 100, top: 150 },
      'puzzle-piece': { left: trayLeft, top: 160, width: 90, height: 130 },
      'puzzle-slot': { left: 105, top: 153, width: 100, height: 140 },
    }[node.className]);
    return node;
  };
  const OriginalResizeObserver = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    constructor(callback) { resize = callback; }
    observe() {}
    disconnect() {}
  };
  t.after(() => { globalThis.ResizeObserver = OriginalResizeObserver; });
  const root = createContainer();
  const cleanup = start(root, { onChange() {}, loadArtwork: () => image(remote) }, () => {});
  t.after(cleanup);
  await flush();
  findButton(root, 'Start puzzle').click();
  const guide = findAll(root, n => n.className === 'puzzle-drag-demo')[0];
  assert.equal(guide.style['--drag-start-x'], '505px');
  assert.equal(guide.style['--drag-start-y'], '75px');
  assert.equal(guide.style['--drag-end-x'], '55px');
  assert.equal(guide.style['--drag-end-y'], '73px');
  trayLeft = 290;
  resize();
  assert.equal(guide.style['--drag-start-x'], '235px');
  pieces(root)[0].click();
  assert.equal(guide.hidden, true);
});
