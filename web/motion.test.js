import test from 'node:test';
import assert from 'node:assert/strict';
import {movementDuration, PLAYER_SPEED} from './motion.js';
test('horizontal and vertical movement use the same displayed speed', () => {
  const viewport={width:1200,height:700}, from={x:3,y:5};
  for(const room of ['hall','gallery','storage']) {
    for(const to of [{x:4,y:5},{x:3,y:6}]) {
      const distance=room==='hall' ? (to.x!==from.x ? 1200/9 : 14*700/576) : room==='gallery' ? (to.x!==from.x ? 100*1200/896 : 22*700/576) : (to.x!==from.x ? 32*1200/896 : 32*700/576);
      assert.ok(Math.abs(distance/(movementDuration(from,to,viewport,room)/1000)-PLAYER_SPEED)<0.001);
    }
  }
});
import {advancePlayer} from './motion.js';
import {initialState, canEnter, validState} from './engine.js';
test('release stops immediately and fractional position survives a save',()=>{
  const s=initialState(), viewport={width:896,height:576};
  const moved=advancePlayer(s,[1,0],73,viewport,[],canEnter);
  assert.notEqual(moved.player.x,Math.round(moved.player.x));
  assert.equal(advancePlayer(moved,null,500,viewport,[],canEnter),moved);
  assert.equal(validState(JSON.parse(JSON.stringify(moved))),true);
});
test('continuous motion cannot cross the picture wall or a guard',()=>{
  const viewport={width:896,height:576};
  let s={...initialState(),player:{x:3,y:4}};
  s=advancePlayer(s,[0,-1],1000,viewport,[],canEnter);
  assert.ok(s.player.y>=3.5);
  const p={...initialState(),player:{x:4,y:6}};
  const stopped=advancePlayer(p,[1,0],2000,viewport,[{x:5,y:6}],canEnter);
  assert.ok(stopped.player.x<4.5);
});
test('continuous movement covers equal screen distance in each direction',()=>{
  const viewport={width:896,height:576}; const start=initialState();
  const right=advancePlayer(start,[1,0],80,viewport,[],canEnter);
  const up=advancePlayer(start,[0,-1],80,viewport,[],canEnter);
  const xPixels=(right.player.x-start.player.x)*896/9;
  const yPixels=(start.player.y-up.player.y)*14;
  assert.ok(Math.abs(xPixels-yPixels)<0.001);
});
test('continuous movement blocks the guard at an interpolated position',()=>{
  const start={...initialState(),player:{x:4,y:6}};
  const stopped=advancePlayer(start,[1,0],2000,{width:896,height:576},[{x:5.2,y:6}],canEnter);
  assert.ok(5.2-stopped.player.x>=0.45);
});
test('hall characters cannot visually overlap along the compressed vertical axis',()=>{
  const start={...initialState(),player:{x:5,y:10}};
  const stopped=advancePlayer(start,[0,-1],2000,{width:896,height:576},[{x:5,y:5}],canEnter);
  assert.ok(stopped.player.y>=7.4);
});
