import test from 'node:test';
import assert from 'node:assert/strict';
import { guess, initialForgery, regions, validForgery } from './forgery-rules.js';
import { elapsedMs, startPuzzle } from './picture-rules.js';
import { start } from './spot-the-forgery.js';
import { newGame, readMission, solveStation } from '../story/engine.js';
import { scoreBreakdown, synchronizeScore } from '../story/scoring.js';
import { journalModel } from '../story/journal.js';
import { createStoryHost, memoryStorage } from '../story/host.js';
import { installFakeDom, createContainer, findAll, findButton } from '../story/tests/fake-dom.js';

const hit = (state, id, time) => guess(state, regions[id].x, regions[id].y, time);
const started = () => startPuzzle(initialForgery(), 1000);
const flush = () => new Promise(resolve => setImmediate(resolve));

test('all 60 discovery orders finish on the third distinct hit and freeze there', () => {
  for (const first of regions.keys()) for (const second of regions.keys()) for (const third of regions.keys()) {
    if (new Set([first, second, third]).size !== 3) continue;
    let s = started();
    for (const [index, id] of [first, second, third].entries()) {
      s = hit(s, id, 1100 + index);
      assert.equal(hit(s, id, 9000), s);
      assert.equal(s.solved, index === 2);
      assert.equal(validForgery(s), true);
    }
    assert.deepEqual(s.found, [first, second, third]);
    assert.equal(elapsedMs(s, 999999), 102);
    assert.equal(guess(s, .01, .99, 999999), s);
  }
});

test('misses survive reopening, block until exactly five seconds and keep the main clock running', () => {
  const fresh = initialForgery();
  assert.equal(hit(fresh, 0, 500), fresh);
  let s = hit(started(), 3, 3000);
  s = JSON.parse(JSON.stringify(guess(s, .01, .99, 4000)));
  assert.equal(validForgery(s), true);
  assert.equal(hit(s, 1, 8999), s);
  assert.equal(guess(s, .01, .99, 7000), s);
  assert.equal(elapsedMs(s, 8999), 7999);
  assert.deepEqual(hit(s, 1, 9000).found, [3, 1]);
  assert.equal(s.mistakes, 1);
  assert.equal(validForgery({ ...s, found: [1, 1] }), false);
  assert.equal(validForgery({ ...s, found: [5] }), false);
});

test('D uses L’s inclusive scoring boundaries, even after a miss', () => {
  const story = solveStation(readMission(newGame()).state, 'archive').state;
  for (const [ms, points] of [[30000,15],[30001,10],[45000,10],[45001,5],[60000,5],[60001,0]]) {
    const missed = guess(started(), 0, 0, 1001);
    const s = hit(hit(hit(missed, 2, 6001), 4, 6100), 3, 1000 + ms);
    const outcome = synchronizeScore(story, { archive: s });
    assert.deepEqual(journalModel(outcome).score, { total: points, max: 85 });
    const row = scoreBreakdown(outcome).find(r => r.id === 'archive');
    assert.equal(row.max, 15);
    assert.equal(row.points, points);
    assert.match(row.detail, /Forgery time/);
  }
});

test('the host recovers a final find once, and keeps legacy placeholder points and evidence', () => {
  const storage = memoryStorage(), storageKey = 'test';
  const story = readMission(newGame()).state;
  const complete = hit(hit(hit(started(), 4, 1001), 3, 1002), 0, 1003);
  storage.setItem(storageKey, JSON.stringify({ story: JSON.stringify(story), progress: { archive: complete } }));
  for (let i = 0; i < 2; i++) {
    const host = createStoryHost({ storage, storageKey });
    assert.deepEqual(host.state.evidence, ['frame-label']);
    assert.deepEqual(host.state.letters, [null, null, null, 'D']);
    assert.equal(host.state.stations.archive.points, 15);
  }
  const legacy = solveStation(story, 'archive').state;
  legacy.stations.archive.points = 20;
  storage.setItem(storageKey, JSON.stringify({ story: JSON.stringify(legacy), progress: { archive: { solved: true } } }));
  const restored = createStoryHost({ storage, storageKey }).state;
  assert.deepEqual(journalModel(restored).score, { total: 20, max: 90 });
  assert.deepEqual(restored.evidence, ['frame-label']);
});

test('both paintings must decode before Start, and resized pointer hits and marks use the same painting bounds', async t => {
  const doc = installFakeDom(), originalCreate = doc.createElement;
  const pending = [], saves = [], awards = [], root = createContainer();
  doc.createElement = tag => {
    const node = originalCreate(tag);
    if (tag === 'img') node.decode = () => new Promise(resolve => pending.push(resolve));
    return node;
  };
  let time = 1000;
  const cleanup = start(root, { now: () => time, onChange: s => saves.push(s) }, result => awards.push(result));
  t.after(cleanup);
  pending[0](); await flush();
  assert.equal(findButton(root, 'Start'), undefined);
  pending[1](); await flush();
  assert.equal(saves.length, 0);
  time = 5000;
  findButton(root, 'Start').click();
  const [original, forgery] = findAll(root, n => n.tagName === 'IMG');
  assert.match(original.src, /DT1946_original/);
  assert.match(forgery.src, /DT1946_v2_forgery/);
  original.click();
  assert.equal(saves.length, 1);
  const target = findAll(root, n => n.className === 'forgery-target')[0];
  for (const [order, width] of [460, 145, 320].entries()) {
    const id = [4, 1, 2][order], region = regions[id];
    const box = { left: width + 18, top: 100, width, height: width * 3040 / 3811 };
    target.getBoundingClientRect = () => box;
    const coords = { detail: 1, clientX: box.left + region.x * width, clientY: box.top + region.y * box.height };
    target.dispatch('click', coords);
    target.dispatch('click', coords);
    const marks = findAll(root, n => n.className === 'forgery-mark');
    assert.equal(marks.length, order + 1);
    assert.equal(marks[order].style.left, region.x * 100 + '%');
    assert.equal(marks[order].textContent, String(order + 1));
  }
  assert.equal(awards.length, 1);
  assert.equal(saves.at(-1).finishedAt, 5000);
  assert.match(root.textContent, /\+15 points earned/);
});
