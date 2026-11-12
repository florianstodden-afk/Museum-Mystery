import test from 'node:test';
import assert from 'node:assert/strict';
import {movementDuration, PLAYER_SPEED} from './motion.js';
test('horizontal and vertical movement use the same displayed speed', () => {
  const viewport={width:1200,height:700}, from={x:3,y:5};
  for(const room of ['hall','gallery']) {
    for(const to of [{x:4,y:5},{x:3,y:6}]) {
      const distance=room==='hall' ? (to.x!==from.x ? 1200/9 : 14*700/576) : (to.x!==from.x ? 32*1200/896 : 32*700/576);
      assert.ok(Math.abs(distance/(movementDuration(from,to,viewport,room)/1000)-PLAYER_SPEED)<0.001);
    }
  }
});
