import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, move, interact, openVault, chooseEnding, hasAllEvidence, canEnter, OBJECTS } from './engine.js';

function at(state,x,y){return {...state,player:{x,y}};}

test('walls and locked depot block movement',()=>{
  const s=initialState();
  assert.equal(move(at(s,8,8),1,0).player.x,8);
  assert.equal(move(at(s,17,9),1,0).player.x,17);
  assert.equal(canEnter(s,9,9),true);
});

test('evidence can be collected only nearby and only once',()=>{
  let s=initialState();
  assert.equal(interact(s,'ledger').state,s);
  s=interact(at(s,5,11),'ledger').state;
  assert.deepEqual(s.clues,['ledger']);
  assert.deepEqual(interact(s,'ledger').state.clues,['ledger']);
});

test('guard gives pass after ledger; depot needs all three clues',()=>{
  let s=initialState();
  assert.equal(interact(at(s,5,6),'guard').state.pass,false);
  s=interact(at(s,5,11),'ledger').state;
  s=interact(at(s,5,6),'guard').state;
  assert.equal(s.pass,true);
  assert.equal(openVault(s).state.vaultOpen,false);
  s=interact(at(s,14,5),'painting').state;
  s=interact(at(s,12,12),'note').state;
  assert.equal(hasAllEvidence(s),true);
  assert.equal(openVault(s).state.vaultOpen,false);
  s=at(s,17,9);
  assert.equal(openVault(s,'0000').state.vaultOpen,false);
  s=openVault(s,'2114').state;
  assert.equal(s.vaultOpen,true);
  assert.equal(move(at(s,17,9),1,0).player.x,18);
});

test('two distinct endings unlock only by the original in the depot',()=>{
  let s=initialState();
  s={...s,clues:['ledger','painting','note'],pass:true,vaultOpen:true};
  assert.equal(chooseEnding(s,'restore').ending,null);
  const byPainting=at(s,23,6);
  assert.equal(chooseEnding(byPainting,'restore').ending,'restore');
  assert.equal(chooseEnding(byPainting,'expose').ending,'expose');
  assert.equal(chooseEnding(byPainting,'unknown').ending,null);
});

test('state can be saved as JSON and restored',()=>{
  const s=interact(at(initialState(),5,11),'ledger').state;
  assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
});

test('a real walking route reaches both endings',()=>{
  function walkToObject(state,id){
    const target=OBJECTS.find(object=>object.id===id);
    const queue=[[state,[]]];const seen=new Set();
    while(queue.length){
      const [current,path]=queue.shift();const key=`${current.player.x},${current.player.y}`;
      if(seen.has(key))continue;seen.add(key);
      if(Math.abs(current.player.x-target.x)+Math.abs(current.player.y-target.y)===1)return current;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const next=move(current,dx,dy);
        if(next!==current)queue.push([next,path]);
      }
    }
    throw new Error(`${id} ist nicht erreichbar`);
  }
  let state=initialState();
  for(const id of ['ledger','guard','painting','note']){
    state=walkToObject(state,id);
    state=interact(state,id).state;
  }
  assert.equal(hasAllEvidence(state),true);
  assert.equal(state.pass,true);
  // Von der Galerie aus ist das Depot erst nach Interaktion an der Tür erreichbar.
  state=at(state,17,9);
  assert.equal(move(state,1,0),state);
  assert.equal(openVault(state,'0000').state.vaultOpen,false);
  state=openVault(state,'2114').state;
  state=move(state,1,0);
  state=walkToObject(state,'vault');
  assert.equal(chooseEnding(state,'restore').ending,'restore');
  assert.equal(chooseEnding(state,'expose').ending,'expose');
});

test('the visible Great Hall back wall blocks the player',()=>{
  const state=initialState();
  assert.equal(canEnter(state,4,1),false);
  const byWall=at(state,4,2);
  assert.equal(move(byWall,0,-1),byWall);
});
