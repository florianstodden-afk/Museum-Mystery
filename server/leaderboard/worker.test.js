import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { ranked, validSubmission } from './worker.js';

const origin = 'https://florianstodden-afk.github.io';
const run = { playerId: '2b41111a-aaaa-4bbb-8ccc-123456789abc', name: 'Player_1', points: 70, max: 80, ending: 'heist' };
const env = { ALLOWED_ORIGINS: origin };

test('submissions require a completed current-scale score and a safe public name', () => {
  assert.equal(validSubmission(run), true);
  assert.equal(validSubmission({ ...run, points: 81 }), false);
  assert.equal(validSubmission({ ...run, max: 90 }), false);
  assert.equal(validSubmission({ ...run, name: '<script>' }), false);
  assert.equal(validSubmission({ ...run, ending: 'invented' }), false);
});

test('equal points share a place; time never changes rank', () => {
  const rows = [80, 70, 70, 55].map((points, index) => ({ player_id: String(index), display_name: `Player${index}`, points, max_points: 80, ending: 'heist' }));
  assert.deepEqual(ranked(rows).map(entry => entry.rank), [1, 2, 2, 3]);
});

test('worker rejects untrusted origins and invalid results before database writes', async () => {
  const request = (body, from = origin) => new Request('https://example.workers.dev/runs', { method: 'POST', headers: { Origin: from }, body: JSON.stringify(body) });
  assert.equal((await worker.fetch(request(run, 'https://other.example'), env)).status, 403);
  assert.equal((await worker.fetch(request({ ...run, points: 100 }), env)).status, 503);
  const fakeDb = { prepare() { throw new Error('A rejected run must not reach the database'); } };
  assert.equal((await worker.fetch(request({ ...run, points: 100 }), { ...env, DB: fakeDb })).status, 400);
});

test('worker returns shared scores and stores one validated run', async () => {
  let bound = null;
  const fakeDb = { prepare(sql) { return {
    all: async () => ({ results: [{ player_id: run.playerId, display_name: run.name, points: run.points, max_points: 80, ending: run.ending }] }),
    bind: (...values) => { bound = values; return { run: async () => ({ success: true }) }; },
  }; } };
  const config = { ...env, DB: fakeDb };
  const get = await worker.fetch(new Request('https://example.workers.dev/runs', { headers: { Origin: origin } }), config);
  assert.equal(get.status, 200);
  assert.equal((await get.json()).entries[0].name, run.name);
  const post = await worker.fetch(new Request('https://example.workers.dev/runs', { method: 'POST', headers: { Origin: origin }, body: JSON.stringify(run) }), config);
  assert.equal(post.status, 200);
  assert.deepEqual(bound, [run.playerId, run.name, run.points, 80, run.ending]);
});
