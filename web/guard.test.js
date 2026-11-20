import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, nearbyObject, move } from './engine.js';
import { guardOptions, chooseGuardAction } from './guard.js';
test('moving guard collision and interaction use his current position',()=>{
  const s={...initialState(),player:{x:4,y:6}}; const guard={x:5,y:6};
  assert.equal(nearbyObject(s,guard).id,'guard');
  assert.equal(move(s,1,0,guard),s);
  assert.match(nearbyObject(s,guard).label,/Leon/);
  assert.notEqual(nearbyObject(s,{x:7,y:6})?.id,'guard');
});
test('patrol stays in room and avoids player and occupied tiles',()=>{
  const s={...initialState(),player:{x:4,y:8}}, guard={x:5,y:8};
  const options=guardOptions(s,guard);
  assert.ok(options.length); assert.ok(options.every(p=>!(p.x===4&&p.y===8)));
  assert.equal(chooseGuardAction(s,guard,()=>0).kind,'wait');
  assert.equal(chooseGuardAction(s,guard,()=>0.8).kind,'walk');
});

import { OBJECTS as MAP_OBJECTS, canEnter as canStep } from './engine.js';
import { frontOfStation } from './guard.js';
test('Station I hangs on the hall wall: reachable from the floor, Leon never blocks that spot', () => {
  const station = MAP_OBJECTS.find(o => o.id === 'ledger');
  assert.equal(station.label, 'Portraits · Station I');
  assert.ok(station.x < 9 && station.y === 3, 'on the hall wall row');
  const world = { room: 'museum', player: { x: station.x, y: station.y + 2 }, doorOpen: false };
  assert.equal(canStep(world, station.x, station.y + 1, { x: 2, y: 12 }), true, 'the spot in front is floor');
  assert.equal(canStep(world, station.x, station.y, { x: 2, y: 12 }), false, 'the painting itself is wall');
  assert.equal(frontOfStation({ x: station.x, y: station.y + 1 }), true);
  for (const guard of [{ x: station.x, y: station.y + 2 }, { x: station.x - 1, y: station.y + 1 }, { x: station.x + 1, y: station.y + 1 }]) {
    const options = guardOptions({ ...world, player: { x: 2, y: 14 } }, guard);
    assert.equal(options.some(p => p.x === station.x && p.y === station.y + 1), false, JSON.stringify(guard));
  }
});

test('in front of Station I, E opens the station even when Leon stands one step away', () => {
  const station = MAP_OBJECTS.find(o => o.id === 'ledger');
  const s = { ...initialState(), player: { x: station.x, y: station.y + 1 } };
  assert.equal(nearbyObject(s, { x: station.x - 1, y: station.y + 2 }).id, 'ledger');
});

test('Leon patrols away from Station I and never takes its interaction', () => {
  const player = {x: 4, y: 4.1};
  const world = {...initialState(), player};
  for(let x=2;x<=7;x++) for(let y=8;y<=14;y++) {
    assert.equal(nearbyObject(world,{x,y})?.id,'ledger');
    for (const next of guardOptions(world,{x,y})) assert.ok(next.y>=8);
  }
});
