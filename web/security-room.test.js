import test from 'node:test';
import assert from 'node:assert/strict';
import { SECURITY_OBJECTS, OFFICE_START, GALLERY_RETURN, canEnterOffice, officePortal } from './security-room.js';
import { initialState, nearbyObject, restoreState, canEnter } from './engine.js';
import { advancePlayer } from './motion.js';
import { INTERACTION_POINTS } from './story/security-office/interactions.js';
const viewport={width:896,height:576};
const gallery={...initialState(),player:{x:16.88,y:14}};
test('gallery door enters security and exits onto the gallery floor',()=>{
  const entered=advancePlayer(gallery,[1,0],16,viewport,[],canEnter);
  assert.equal(entered.room,'security');assert.deepEqual(entered.player,OFFICE_START);
  const exiting={...entered,player:{x:4.5,y:9.69}};
  const returned=advancePlayer(exiting,[0,1],16,viewport,[],canEnter);
  assert.equal(returned.room,'museum');assert.deepEqual(returned.player,GALLERY_RETURN);
  assert.equal(officePortal(gallery,{x:16.88,y:10},{x:16.91,y:10}),null);
  assert.ok(officePortal(gallery,{x:16.88,y:15.4},{x:16.91,y:15.4}));
});
test('office boundaries and furniture block movement',()=>{
  for(const [x,y] of [[0,4],[9,4],[4,0],[4,11],[2,1],[4,1],[6,1],[7,1]]) assert.equal(canEnterOffice(x,y),false);
  assert.equal(canEnterOffice(4,2),true);assert.equal(canEnterOffice(3,1),false);
});
test('office stations reuse the real security story actions',()=>{
  for(const obj of SECURITY_OBJECTS) assert.ok(INTERACTION_POINTS.some(p=>p.id===obj.story.examine));
  const s={...gallery,room:'security',player:{x:4,y:2}};
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
