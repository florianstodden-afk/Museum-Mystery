// Punkt 2: one position rule for game (loading) and server (saving).
import test from 'node:test';
import assert from 'node:assert/strict';
import { validPosition, nearestValidPosition, restoreState, OBJECTS, START } from '../web/engine.js';
import { GALLERY_BENCHES } from '../web/gallery-layout.js';
import { validSave } from '../api/_service.js';
import { newGame, readMission } from '../web/story/engine.js';

const story = { story: JSON.stringify(readMission(newGame()).state), progress: {} };   // safe closed
const serverAccepts = walk => validSave({ story, walk });
const gameKeeps = walk => { const s = restoreState(walk, false); return s.player.x === walk.player.x && s.player.y === walk.player.y; };

const CASES = [
  ['hall floor', { x: 3, y: 9 }, true],
  ['gallery floor', { x: 11, y: 6 }, true],
  ['outer edge', { x: 0, y: 9 }, false],
  ['far outside', { x: 40, y: -3 }, false],
  ['not a number', { x: NaN, y: 4 }, false],
  ['hall picture wall', { x: 4, y: 2 }, false],
  ['hall wall between rooms', { x: 9, y: 2 }, false],
  ['gallery bench', GALLERY_BENCHES[0], false],
  ['bust / station object', OBJECTS.find(o => o.id === 'painting'), false],
  ['locked storage room', { x: 22, y: 9 }, false],
  ['security office', { x: 4, y: 6, room: 'security' }, true],
  ['security office wall', { x: 4, y: 1, room: 'security' }, false],
  ['unknown room', { x: 4, y: 6, room: 'attic' }, false],
];

test('server and game decide the same for every edge case', () => {
  for (const [name, point, expected] of CASES) {
    const walk = { player: { x: point.x, y: point.y }, steps: 5, ...(point.room ? { room: point.room } : {}) };
    assert.equal(validPosition({ x: point.x, y: point.y, ...(point.room ? { room: point.room } : {}) }, false), expected, `rule: ${name}`);
    assert.equal(serverAccepts(walk), expected, `server: ${name}`);
    if (Number.isFinite(point.x) && point.room !== 'attic') assert.equal(gameKeeps(walk), expected, `game: ${name}`);
  }
});

test('every tile of the map: the server accepts exactly what the game keeps', () => {
  for (let x = -1; x <= 28; x++) for (let y = -1; y <= 18; y++) for (const room of [undefined, 'security']) {
    const walk = { player: { x, y }, steps: 0, ...(room ? { room } : {}) };
    assert.equal(serverAccepts(walk), gameKeeps(walk), `${room ?? 'museum'} ${x},${y}`);
  }
});

test('an invalid save lands on the nearest walkable spot in the same room, progress kept', () => {
  const restored = restoreState({ player: { x: 4, y: 2 }, steps: 77 }, false);
  assert.deepEqual(restored.player, { x: 4, y: 4 });
  assert.equal(restored.steps, 77);
  const bench = nearestValidPosition(GALLERY_BENCHES[1], false);
  assert.ok(validPosition(bench, false) && bench.x > 9 && bench.x < 18);
  assert.deepEqual(nearestValidPosition({ x: NaN, y: 1 }, false), START);
});
