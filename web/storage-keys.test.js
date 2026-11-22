import test from 'node:test';
import assert from 'node:assert/strict';
import { profileStorageKey } from './storage-keys.js';

test('guests keep the base key, so their saves load unchanged', () => {
  assert.equal(profileStorageKey('museum-nocturne-story-v1', null), 'museum-nocturne-story-v1');
  assert.equal(profileStorageKey('museum-mystery-walk-v1', ''), 'museum-mystery-walk-v1');
});

test('each player gets their own key, independent of case and spaces (same format as before)', () => {
  assert.equal(profileStorageKey('game-save', ' Flo '), 'game-save:profile:flo');
  assert.equal(profileStorageKey('game-save', 'FLO'), profileStorageKey('game-save', 'flo'));
  assert.notEqual(profileStorageKey('game-save', 'Flo'), profileStorageKey('game-save', 'Leo'));
});
