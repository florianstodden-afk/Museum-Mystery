import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, move, canEnter, nearbyObject, restoreState, validState, atVaultDoor, OBJECTS, START, VAULT_DOOR } from './engine.js';
import { STATION_IDS } from './story/case-1.js';
import { CHARACTERS } from './story/dialogues.js';
import { INTERACTION_POINTS } from './story/security-office/interactions.js';

function at(state,x,y){return {...state,player:{x,y}};}

// Breadth-first search: walks tile by tile until standing next to the object.
function walkToObject(state,id){
  const target=OBJECTS.find(object=>object.id===id);
  const queue=[state];const seen=new Set();
  while(queue.length){
    const current=queue.shift();const key=`${current.player.x},${current.player.y}`;
    if(seen.has(key))continue;seen.add(key);
    if(Math.abs(current.player.x-target.x)+Math.abs(current.player.y-target.y)===1)return current;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const next=move(current,dx,dy);
      if(next!==current)queue.push(next);
    }
  }
  throw new Error(`${id} cannot be reached`);
}

test('walls and the closed vault door block movement',()=>{
  const s=initialState();
  assert.equal(move(at(s,8,8),1,0).player.x,8);
  assert.equal(move(at(s,17,9),1,0).player.x,17);
  assert.equal(canEnter(s,9,9),true);
  assert.equal(canEnter({...s,doorOpen:true},VAULT_DOOR.x,VAULT_DOOR.y),true);
});

test('the visible Great Hall back wall blocks the player',()=>{
  const state=initialState();
  for (const x of [1, 3, 4, 6, 8]) assert.equal(canEnter(state,x,3),false);
  const byWall=at(state,4,4);
  assert.equal(move(byWall,0,-1),byWall);
});

test('every story station lies exactly once on the map',()=>{
  const stationsOnMap=OBJECTS.filter(o=>o.story.station).map(o=>o.story.station).sort();
  assert.deepEqual(stationsOnMap,[...STATION_IDS].sort());
});

test('every map object points to a story action that exists',()=>{
  const people=CHARACTERS.map(c=>c.id);
  const points=INTERACTION_POINTS.map(p=>p.id);
  for(const object of OBJECTS){
    const { station, talk, examine, vault } = object.story;
    assert.ok(STATION_IDS.includes(station) || people.includes(talk) || points.includes(examine) || vault===true, object.id);
  }
});

test('all gallery objects can be reached on foot; storage only with the door open',()=>{
  const start=initialState();
  for(const object of OBJECTS.filter(o=>o.x<VAULT_DOOR.x)) assert.ok(walkToObject(start,object.id));
  assert.throws(()=>walkToObject(start,'vault'),/cannot be reached/);
  const open={...start,doorOpen:true};
  assert.ok(walkToObject(open,'vault'));
  assert.ok(walkToObject(open,'curator'));
});

test('the nearest object is found and labelled for the player',()=>{
  const s=at(initialState(),14,5);
  assert.equal(nearbyObject(s).id,'painting');
  assert.match(nearbyObject(s).label,/Station B/);
  assert.equal(nearbyObject(at(initialState(),3,9)),null);
});

test('standing in front of the vault door is detected',()=>{
  assert.equal(atVaultDoor(at(initialState(),17,9)),true);
  assert.equal(atVaultDoor(at(initialState(),16,9)),false);
});

test('old saves keep position and steps but nothing from the old story',()=>{
  const old={player:{x:12,y:9},clues:['ledger'],pass:true,vaultOpen:true,ending:null,steps:40};
  assert.equal(validState(old),true);
  assert.deepEqual(restoreState(old,false),{player:{x:12,y:9},steps:40,doorOpen:false});
});

test('a save inside the locked storage room starts outside again',()=>{
  const inside={player:{x:22,y:9},steps:3};
  assert.deepEqual(restoreState(inside,false).player,START);
  assert.deepEqual(restoreState(inside,true).player,{x:22,y:9});
  assert.deepEqual(restoreState('broken',false),initialState());
});

test('state can be saved as JSON and restored',()=>{
  const s=move(initialState(),1,0);
  assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
});
