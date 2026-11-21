import test from 'node:test';
import assert from 'node:assert/strict';
import { figuresBackToFront } from './character-depth.js';

test('a character behind another is painted first, whichever moves', () => {
  const position=(x,y)=>({x,y:y*14});
  const order=(playerY,guardY)=>figuresBackToFront([{kind:'guard',x:4,y:guardY},{kind:'player',x:4,y:playerY}],position).map(x=>x.figure.kind);
  assert.deepEqual(order(5,6),['player','guard']);
  assert.deepEqual(order(7,6),['guard','player']);
  assert.deepEqual(order(6,7),['player','guard']);
});
