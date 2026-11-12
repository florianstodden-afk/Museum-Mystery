import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, nearbyObject, interact, move } from './engine.js';
import { guardOptions, chooseGuardAction } from './guard.js';
test('moving guard collision and interaction use his current position',()=>{
  const s={...initialState(),player:{x:4,y:6}}; const guard={x:5,y:6};
  assert.equal(nearbyObject(s,guard).id,'guard');
  assert.equal(move(s,1,0,guard),s);
  assert.match(interact(s,'guard',guard).text,/Security guard/);
  assert.notEqual(nearbyObject(s,{x:7,y:6})?.id,'guard');
});
test('patrol stays in room and avoids player and occupied tiles',()=>{
  const s={...initialState(),player:{x:4,y:5}}, guard={x:5,y:5};
  const options=guardOptions(s,guard);
  assert.ok(options.length); assert.ok(options.every(p=>!(p.x===4&&p.y===5)));
  assert.equal(chooseGuardAction(s,guard,()=>0).kind,'wait');
  assert.equal(chooseGuardAction(s,guard,()=>0.8).kind,'walk');
});
