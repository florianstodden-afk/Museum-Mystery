import test from 'node:test';
import assert from 'node:assert/strict';
import { talkPartner, shouldCloseTalk, distanceBetween, facingToward, FAR } from '../proximity.js';
import { OBJECTS, nearbyObject } from '../../engine.js';

const PEOPLE = { guard: 'leon', restorer: 'imani', curator: 'vale' };
const at = (x, y) => ({ room: 'museum', player: { x, y }, doorOpen: false });
const spot = id => OBJECTS.find(o => o.id === id);

test('coming close opens nothing: there is no automatic talk any more', async () => {
  const module = await import('../proximity.js');
  assert.equal('shouldOpenTalk' in module, false);
  assert.equal('NEAR' in module, false);
});

test('E next to Imani, Vale or Leon starts their talk', () => {
  for (const [id, character] of Object.entries(PEOPLE)) {
    const person = spot(id);
    const target = nearbyObject(at(person.x - 1, person.y), { x: spot('guard').x, y: spot('guard').y });
    assert.equal(target?.id, id, `${id} is the E target`);
    assert.equal(talkPartner(target.id, PEOPLE), character);
  }
});

test('E at a station or painting starts no talk', () => {
  for (const id of ['ledger', 'note', 'painting', 'frames', 'vault', null, 'toString']) assert.equal(talkPartner(id, PEOPLE), null, String(id));
});

test('walking away closes the box; a small step does not (no flicker)', () => {
  assert.equal(shouldCloseTalk(FAR + 0.1), true);
  assert.equal(shouldCloseTalk(FAR - 0.5), false);
  assert.equal(shouldCloseTalk(Infinity), true, 'another room is far away');
  assert.equal(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});

test('a talking person turns to the player', () => {
  assert.equal(facingToward({ x: 5, y: 5 }, { x: 3, y: 5 }), 'left');
  assert.equal(facingToward({ x: 5, y: 5 }, { x: 8, y: 5 }), 'right');
  assert.equal(facingToward({ x: 5, y: 5 }, { x: 5, y: 9 }), 'down');
  assert.equal(facingToward({ x: 5, y: 5 }, { x: 5, y: 2 }), 'up');
});
