import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldOpenTalk, shouldCloseTalk, distanceBetween, NEAR, FAR } from '../proximity.js';

test('opens as soon as the player comes close', () => {
  assert.deepEqual(shouldOpenTalk({ distance: NEAR - 0.1, wasNear: false }), { open: true, wasNear: true });
  assert.equal(shouldOpenTalk({ distance: NEAR + 0.1, wasNear: false }).open, false);
  assert.equal(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});

test('closes as soon as the player walks away', () => {
  assert.equal(shouldCloseTalk(FAR + 0.1), true);
  assert.equal(shouldCloseTalk((NEAR + FAR) / 2), false, 'a small step does not close it (no flicker)');
});

test('after goodbye it stays closed while near, and opens again after walking away and back', () => {
  assert.equal(shouldOpenTalk({ distance: 0.5, wasNear: true }).open, false);
  const away = shouldOpenTalk({ distance: FAR + 0.5, wasNear: true });
  assert.equal(away.wasNear, false);
  assert.equal(shouldOpenTalk({ distance: NEAR - 0.1, wasNear: away.wasNear }).open, true, 'no waiting time');
});

test('never opens while something else is open', () => {
  assert.deepEqual(shouldOpenTalk({ distance: 0.3, wasNear: false, blocked: true }), { open: false, wasNear: false });
});
