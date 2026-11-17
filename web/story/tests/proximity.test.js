import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldOpenTalk, distanceBetween, NEAR, FAR, COOLDOWN_MS } from '../proximity.js';

const fresh = { wasNear: false, lastClosedAt: -Infinity, now: 1000, blocked: false };

test('opens when the player comes close', () => {
  assert.deepEqual(shouldOpenTalk({ ...fresh, distance: 1.0 }), { open: true, wasNear: true });
  assert.equal(shouldOpenTalk({ ...fresh, distance: NEAR + 0.1 }).open, false);
  assert.equal(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});

test('does not open again while the player stays close', () => {
  const after = { ...fresh, wasNear: true, lastClosedAt: 0, now: 60000 };
  assert.equal(shouldOpenTalk({ ...after, distance: 0.5 }).open, false);
  assert.equal(shouldOpenTalk({ ...after, distance: 2.0 }).wasNear, true, 'between NEAR and FAR counts as still near');
});

test('opens again only after walking away AND the cooldown', () => {
  let s = { ...fresh, wasNear: true, lastClosedAt: 10000, now: 11000 };
  // walks away, but too early
  s.wasNear = shouldOpenTalk({ ...s, distance: FAR + 0.5 }).wasNear;
  assert.equal(s.wasNear, false);
  assert.equal(shouldOpenTalk({ ...s, distance: 0.8 }).open, false, 'cooldown not over yet');
  // cooldown over, but never walked away
  const stayed = { ...fresh, wasNear: true, lastClosedAt: 10000, now: 10000 + COOLDOWN_MS + 1 };
  assert.equal(shouldOpenTalk({ ...stayed, distance: 0.8 }).open, false);
  // both
  assert.equal(shouldOpenTalk({ ...s, now: 10000 + COOLDOWN_MS, distance: 0.8 }).open, true);
});

test('never opens while something else is open', () => {
  const r = shouldOpenTalk({ ...fresh, distance: 0.3, blocked: true });
  assert.deepEqual(r, { open: false, wasNear: false }, 'it can still open once the window is closed');
});
