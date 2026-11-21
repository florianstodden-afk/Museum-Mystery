import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseAdapter, ensureSchema } from '../api/_database.js';

test('Vercel database adapter binds values as Postgres parameters', async () => {
  const calls = [];
  const sql = { async query(text, values) { calls.push({ text, values }); return [{ value: 1 }]; } };
  const db = databaseAdapter(sql);
  const result = await db.prepare('SELECT value FROM scores WHERE player_id = ? AND points > ?').bind('github:123', 10).first();
  assert.deepEqual(result, { value: 1 });
  assert.deepEqual(calls, [{ text: 'SELECT value FROM scores WHERE player_id = $1 AND points > $2', values: ['github:123', 10] }]);
});

test('schema creates the identity, save and ranking tables', async () => {
  const calls = [];
  await ensureSchema({ async query(text) { calls.push(text); return []; } });
  assert.ok(calls.some(text => text.includes('CREATE TABLE IF NOT EXISTS saves')));
  assert.ok(calls.some(text => text.includes('CREATE TABLE IF NOT EXISTS sessions')));
  assert.ok(calls.some(text => text.includes('CREATE TABLE IF NOT EXISTS leaderboard')));
  assert.ok(calls.some(text => text.includes('ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS total_time_ms BIGINT')));
});
