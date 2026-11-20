import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { localRunsStore, renderLocalRuns, LOCAL_RUNS_KEY } from '../local-runs.js';
import { memoryStorage } from '../host.js';
import { LEADERBOARD_URL } from '../../leaderboard-config.js';
import { installFakeDom, createContainer, findAll } from './fake-dom.js';

const run = (name, points, timeMs, status = 'Won') => ({ name, points, max: 80, timeMs, status });

test('local list: more points first, shorter time on a tie, at most 10 rows', () => {
  const store = localRunsStore(memoryStorage());
  store.add(run('ana', 60, 90000));
  store.add(run('Guest', 70, 50000, 'Lost'));
  store.add(run('ben', 70, 40000));
  store.add(run('cem', 60, null));
  assert.deepEqual(store.top().map(r => r.name), ['ben', 'Guest', 'ana', 'cem']);
  for (let i = 0; i < 15; i++) store.add(run(`p${i}`, i, 1000));
  assert.equal(store.top().length, 10);
  assert.equal(store.top()[0].name, 'ben');
});

test('broken or blocked storage never crashes and broken rows are skipped', () => {
  const storage = memoryStorage();
  storage.setItem(LOCAL_RUNS_KEY, '{oops');
  assert.deepEqual(localRunsStore(storage).top(), []);
  storage.setItem(LOCAL_RUNS_KEY, JSON.stringify([run('ok', 10, 1), { name: 'x', points: '99' }, null, run('', 5, 1)]));
  assert.deepEqual(localRunsStore(storage).top().map(r => r.name), ['ok']);
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.deepEqual(localRunsStore(blocked).top(), []);
  assert.equal(localRunsStore(blocked).add(run('a', 1, 1)), false);
  assert.equal(localRunsStore(null).add(run('a', 1, 1)), false);
});

test('the local table shows place, player, points, time and Won/Lost', () => {
  installFakeDom();
  const box = createContainer();
  renderLocalRuns(box, [run('ben', 70, 61000), run('Guest', 40, null, 'Lost')]);
  const rows = findAll(box, node => node.tagName === 'TR');
  assert.equal(rows.length, 3);
  assert.match(rows[1].textContent, /1ben70 \/ 801:01Won/);
  assert.match(rows[2].textContent, /2Guest40 \/ 80–Lost/);
  renderLocalRuns(box, []);
  assert.match(box.textContent, /No finished runs on this device yet/);
});

test('without LEADERBOARD_URL no online elements are visible', () => {
  assert.equal(LEADERBOARD_URL, '');
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.match(html, /<section id="leaderboard-online"[^>]*\bhidden\b/, 'online section starts hidden');
  assert.match(html, /id="leaderboard-publish"[^>]*\bhidden\b/);
  const main = readFileSync(new URL('../../main.js', import.meta.url), 'utf8');
  assert.match(main, /const ONLINE=Boolean\(LEADERBOARD_URL\)/);
  assert.match(main, /if\(ONLINE\)refreshLeaderboard\(\)/);
  assert.match(main, /leaderboardPublish\.hidden=!ONLINE/);
});
