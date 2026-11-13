import test from 'node:test';
import assert from 'node:assert/strict';
import { SECURITY_OBJECTS, OFFICE_START, HALL_RETURN, canEnterOffice, officePortal } from './security-room.js';
import { initialState, nearbyObject, restoreState, canEnter } from './engine.js';
import { advancePlayer } from './motion.js';
import { INTERACTION_POINTS } from './story/security-office/interactions.js';
const viewport={width:896,height:576};
const hall={...initialState(),player:{x:1.25,y:4.1}};
test('hall doorway enters security and exits onto the hall floor',()=>{
  const entered=advancePlayer(hall,[0,-1],16,viewport,[],canEnter);
  assert.equal(entered.room,'security');assert.deepEqual(entered.player,OFFICE_START);
  const exiting={...entered,player:{x:4.5,y:9.69}};
  const returned=advancePlayer(exiting,[0,1],16,viewport,[],canEnter);
  assert.equal(returned.room,'museum');assert.deepEqual(returned.player,HALL_RETURN);
  assert.equal(officePortal(hall,{x:2.5,y:4.1},{x:2.5,y:3.9}),null);
  assert.equal(officePortal(hall,{x:16.88,y:14},{x:16.91,y:14}),null);
  const guard={x:1.3,y:4};
  assert.equal(advancePlayer(hall,[0,-1],16,viewport,[guard],canEnter),hall);
});
test('office boundaries and furniture block movement',()=>{
  for(const [x,y] of [[0,4],[9,4],[4,0],[4,11],[2,1],[4,1],[6,1],[7,1]]) assert.equal(canEnterOffice(x,y),false);
  assert.equal(canEnterOffice(4,2),true);assert.equal(canEnterOffice(3,1),false);
});
test('office stations reuse the real security story actions',()=>{
  for(const obj of SECURITY_OBJECTS) assert.ok(INTERACTION_POINTS.some(p=>p.id===obj.story.examine));
  const s={...hall,room:'security',player:{x:4,y:2}};
  assert.equal(nearbyObject(s).story.examine,'monitor-wall');
});
test('security room positions survive save and invalid positions recover safely',()=>{
  const saved={room:'security',player:{x:4.2,y:6.2},steps:30};
  assert.deepEqual(restoreState(JSON.parse(JSON.stringify(saved)),false),{...saved,doorOpen:false});
  const blocked={...saved,player:{x:4,y:1}};
  assert.deepEqual(restoreState(blocked,false).player,OFFICE_START);
  const old={player:{x:13,y:10},steps:12};
  assert.deepEqual(restoreState(old,false),{...old,doorOpen:false});
});

test('hall floor border stops movement below the visible floor',()=>{
  const start={...initialState(),player:{x:3,y:15}};
  const stopped=advancePlayer(start,[0,1],2000,viewport,[],canEnter);
  assert.ok(stopped.player.y<15.5);
  assert.equal(canEnter(start,3,16),false);
});

test('the full character stays inside the visible hall side rails',()=>{
  const left=advancePlayer({...initialState(),player:{x:1,y:10}},[-1,0],5000,viewport,[],canEnter);
  const right=advancePlayer({...initialState(),player:{x:7,y:10}},[1,0],5000,viewport,[],canEnter);
  assert.ok((left.player.x+.5)*896/9-17>=86);
  assert.ok((right.player.x+.5)*896/9+17<=864);
});
