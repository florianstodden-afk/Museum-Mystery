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
