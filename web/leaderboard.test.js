import test from 'node:test';
import assert from 'node:assert/strict';
import { canPublish, publicPlayer } from './leaderboard.js';

test('only completed runs with the current 80-point scale can be published', () => {
  assert.equal(canPublish({ finished: true, points: 72, max: 80 }), true);
  assert.equal(canPublish({ finished: false, points: 72, max: 80 }), false);
  assert.equal(canPublish({ finished: true, points: 87, max: 90 }), false);
});

test('a player has a stable anonymous ID per local profile', () => {
  const entries = new Map();
  const storage = { getItem: key => entries.get(key) || null, setItem: (key, value) => entries.set(key, value) };
  const first = publicPlayer(storage, 'flori');
  assert.deepEqual(publicPlayer(storage, 'flori'), first);
  assert.notEqual(publicPlayer(storage, 'guest').playerId, first.playerId);
});
