// Punkt 6: wherever Leon is on his patrol, Station 1 (Portrait Hall wall) stays reachable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, canEnter, nearbyObject, START } from './engine.js';
import { guardOptions } from './guard.js';

const ZONE = { x: 4, y: 4 };   // the tile in front of the middle painting
// Same blocking rule as motion.js uses in the hall (Leon is tall on screen).
const blockedBy = (g, p) => Math.abs(g.x - p.x) < 0.45 && Math.abs(g.y - p.y) < 2.4;

// Every tile Leon can ever stand on, found by following his own patrol rule from his start tiles,
// plus the halfway points while he walks between two tiles.
function leonPositions() {
  const seen = new Map(), queue = [{ x: 5, y: 8 }, { x: 7, y: 8 }, { x: 2, y: 12 }];
  const far = { ...initialState(), player: { x: -100, y: -100 } };
  while (queue.length) {
    const p = queue.shift(), key = `${p.x},${p.y}`;
    if (seen.has(key)) continue;
    seen.set(key, p);
    for (const next of guardOptions(far, p)) { queue.push(next); seen.set(`${(p.x + next.x) / 2},${(p.y + next.y) / 2}`, { x: (p.x + next.x) / 2, y: (p.y + next.y) / 2 }); }
  }
  return [...seen.values()];
}

function reachable(from, to, guard) {
  const free = p => canEnter({ ...initialState(), player: p }, p.x, p.y, guard) && !blockedBy(guard, p) && p.x < 9;
  const seen = new Set(), queue = [from];
  while (queue.length) {
    const p = queue.shift(), key = `${p.x},${p.y}`;
    if (seen.has(key) || !free(p)) continue;
    if (p.x === to.x && p.y === to.y) return true;
    seen.add(key);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) queue.push({ x: p.x + dx, y: p.y + dy });
  }
  return false;
}

test('Station 1 is reachable and usable for every position on Leon’s walk', () => {
  const positions = leonPositions();
  assert.ok(positions.length > 10, 'the patrol was explored');
  for (const guard of positions) {
    assert.ok(!blockedBy(guard, ZONE), `Leon at ${guard.x},${guard.y} stands in the station zone`);
    assert.equal(nearbyObject({ ...initialState(), player: ZONE }, guard)?.story?.station, 'portraits', `E opens Station 1 with Leon at ${guard.x},${guard.y}`);
    // From any free hall tile (including the start) the player can walk to the zone.
    for (let x = 1; x <= 8; x++) for (let y = 4; y <= 15; y++) {
      const from = { x, y };
      if (!canEnter({ ...initialState(), player: from }, x, y, guard) || blockedBy(guard, from)) continue;
      assert.ok(reachable(from, ZONE, guard), `from ${x},${y} with Leon at ${guard.x},${guard.y}`);
    }
  }
  assert.ok(reachable(START, ZONE, { x: 5, y: 8 }));
});
