import test from 'node:test';
import assert from 'node:assert/strict';
import { storagePosition, storageFloorContains, STORAGE, STORAGE_DOOR } from './storage-room.js';
import { canEnter, OBJECTS, VAULT_DOOR } from './engine.js';

const OPEN = { player: { x: 19, y: 9 }, steps: 0, doorOpen: true };

test('every tile you can walk on in the storage room is drawn on the visible floor', () => {
  for (let x = STORAGE.firstX; x <= STORAGE.lastX; x++) {
    for (let y = STORAGE.firstY; y <= STORAGE.lastY; y++) {
      if (!canEnter(OPEN, x, y)) continue;
      const p = storagePosition(x, y);
      assert.ok(storageFloorContains(p.x, p.y), `tile ${x},${y} at ${p.x},${p.y}`);
    }
  }
});

test('the original painting and Dr. Vale stand on the storage floor', () => {
  for (const id of ['vault', 'curator']) {
    const object = OBJECTS.find(o => o.id === id);
    const p = storagePosition(object.x, object.y);
    assert.ok(storageFloorContains(p.x, p.y), id);
  }
});

test('nearer rows are drawn lower on screen, so depth sorting by y works', () => {
  assert.ok(storagePosition(22, 12).y > storagePosition(22, 5).y);
  assert.ok(storagePosition(25, 9).x > storagePosition(20, 9).x);
});

test('the doorway is on the left wall, at the row of the vault door', () => {
  assert.equal(STORAGE_DOOR.y, storagePosition(VAULT_DOOR.x + 1, VAULT_DOOR.y).y);
  assert.ok(STORAGE_DOOR.x < storagePosition(STORAGE.firstX, VAULT_DOOR.y).x);
});

test('walking with the real movement code: through the open vault door, then across the storage room', async () => {
  const { advancePlayer, PLAYER_SPEED } = await import('./motion.js');
  const viewport = { width: 896, height: 576 };
  const walk = (state, direction, ms) => {
    for (let t = 0; t < ms; t += 16) state = advancePlayer(state, direction, 16, viewport, [], canEnter);
    return state;
  };
  let s = { player: { x: 17, y: 9 }, steps: 0, doorOpen: true };
  s = walk(s, [1, 0], 1000);
  assert.ok(s.player.x > 19, `entered storage, x=${s.player.x}`);
  // On screen the player moves at the normal speed (about PLAYER_SPEED pixels per second).
  const before = storagePosition(s.player.x, s.player.y);
  const after = walk(s, [1, 0], 500);
  const pixels = storagePosition(after.player.x, after.player.y).x - before.x;
  assert.ok(Math.abs(pixels - PLAYER_SPEED / 2) < 25, `moved ${pixels}px in 0.5s`);
  // Up towards the painting: the easel blocks the tile it stands on.
  const up = walk({ ...s, player: { x: 23, y: 9 } }, [0, -1], 3000);
  assert.equal(Math.round(up.player.y), 6);
  // With the door closed nobody gets in.
  const locked = walk({ player: { x: 17, y: 9 }, steps: 0, doorOpen: false }, [1, 0], 1000);
  assert.ok(locked.player.x < 18);
});
