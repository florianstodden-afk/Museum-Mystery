import test from 'node:test';
import assert from 'node:assert/strict';
import { GALLERY, GALLERY_BENCHES, GALLERY_OBSTACLES, galleryFootprintFits, galleryPosition, galleryVaultDoorBlocks, cameraLightOn } from './gallery-layout.js';
import { createGalleryRenderer } from './gallery.js';
import { initialState, atVaultDoor, canEnter, restoreState, nearbyObject } from './engine.js';
import { advancePlayer } from './motion.js';
const viewport={width:896,height:576};
const at=(x,y,doorOpen=false)=>({...initialState(),player:{x,y},doorOpen});
const walk=(state,direction,ms=4000)=>{
  for(let elapsed=0;elapsed<ms;elapsed+=16)state=advancePlayer(state,direction,Math.min(16,ms-elapsed),viewport,[],canEnter);
  return state;
};

test('gallery drawing borders are exactly the collision tile edges',()=>{
  assert.equal(galleryPosition(9.5,3).x,GALLERY.left);
  assert.equal(galleryPosition(17.5,3).x,GALLERY.right);
  assert.equal(galleryPosition(10,2.5).y,GALLERY.top);
  assert.equal(galleryPosition(10,16.5).y,GALLERY.bottom);
});
test('continuous movement keeps the footprint inside the artwork perspective walls',()=>{
  for(const [start,direction] of [[at(12,4),[-1,0]],[at(16,5),[1,0]],[at(12,4),[0,-1]],[at(13,16),[0,1]]]){
    const stopped=walk(start,direction);
    assert.ok(stopped.player.x>=9&&stopped.player.x<18);
    assert.ok(galleryFootprintFits(stopped.player.x,stopped.player.y));
    assert.deepEqual(walk(stopped,direction).player,stopped.player);
  }
});
test('the full painted benches block from each side and leave routes around them',()=>{
  for(const [i,b] of GALLERY_BENCHES.entries()){
    const bounds=GALLERY_OBSTACLES[i];
    assert.equal(canEnter(at(11,6),b.x,b.y),false);
    const left=walk(at(b.x-1,b.y),[1,0]),right=walk(at(b.x+1,b.y),[-1,0]);
    const above=walk(at(b.x,b.y-2),[0,1]),below=walk(at(b.x,b.y+2),[0,-1]);
    assert.ok(galleryPosition(left.player.x+.18,b.y).x<bounds.left);
    assert.ok(galleryPosition(right.player.x-.18,b.y).x>bounds.right);
    assert.ok(galleryPosition(b.x,above.player.y+.32).y<bounds.top);
    assert.ok(galleryPosition(b.x,below.player.y-.32).y>bounds.bottom);
    assert.ok(walk(at(b.x-1,b.y+2),[1,0],800).player.x>b.x);
  }
});
test('hall doorway works in both directions, vault blocks until opened',()=>{
  assert.ok(walk(at(8,4),[1,0],1200).player.x>10);
  assert.ok(walk(at(10,6),[-1,0],1200).player.x<9);
  assert.ok(walk(at(17,9),[1,0]).player.x<=17.32);
  assert.ok(walk(at(17,9,true),[1,0],1000).player.x>18);
  assert.ok(walk(at(19,9,true),[-1,0],500).player.x<18);
});
test('gallery archway accepts a slightly off-centre approach',()=>{
  const returned=walk(at(10,6.4),[-1,0],1200);
  assert.ok(returned.player.x<9);assert.equal(returned.player.y,5.5);
});
test('back-wall artwork remains reachable, old saves in new obstacles recover safely',()=>{
  assert.equal(nearbyObject(at(12,4)).id,'note');
  assert.equal(nearbyObject(at(14,4)).id,'painting');
  assert.equal(nearbyObject(at(16,4)).id,'frames');
  for(const p of [{x:16,y:2},...GALLERY_BENCHES,{x:10,y:14}]){
    const saved=at(p.x,p.y);saved.steps=42;
    const restored=restoreState(saved,false);
    assert.deepEqual(restored.player,{x:11,y:6});assert.equal(restored.steps,42);
    assert.deepEqual(restoreState(JSON.parse(JSON.stringify(restored)),false),restored);
  }
});

test('Station L is left of B and D and each station has an independent walking approach',()=>{
  // Start in the clear corridor above the benches and approach each wall marker.
  for(const [x,id] of [[12,'note'],[14,'painting'],[16,'frames']]) {
    const approached=walk(at(x,6),[0,-1],400);
    assert.equal(nearbyObject(approached)?.id,id);
  }
  assert.equal(nearbyObject(at(12,13)),null,'the transport slip no longer opens Station L here');
});
test('camera status repeats slowly through both red-light states',()=>{
  assert.equal(cameraLightOn(0),true);assert.equal(cameraLightOn(899),true);
  assert.equal(cameraLightOn(900),false);assert.equal(cameraLightOn(1799),false);
  assert.equal(cameraLightOn(1800),true);assert.equal(cameraLightOn(600,360),false);
});

// Approaches that actually occur when a player holds a direction, including the
// closest point to the back wall and positions across the visible doorway.
test('enter the gallery from the full hall doorway without pixel-perfect alignment',()=>{
  for(const y of [3.5,3.65,4,4.3,5,6,7,7.45]){
    const entered=walk(at(8,y),[1,0],1200);
    assert.ok(entered.player.x>9, `blocked at hall y=${y}, x=${entered.player.x}`);
    assert.equal(entered.player.y,8.2);
  }
  assert.ok(walk(at(8,8),[1,0],1200).player.x<9);
});

test('walking toward the hall arch enters on the gallery floor',()=>{
  const entering=advancePlayer(at(7.45,4.1),[0,-1],16,viewport,[],canEnter);
  assert.deepEqual(entering.player,{x:10.6,y:8.2});
  const arrival=galleryPosition(entering.player.x,entering.player.y);
  assert.ok(arrival.x>=140 && arrival.x<=180 && arrival.y>=350 && arrival.y<=390);
  assert.ok(galleryFootprintFits(entering.player.x,entering.player.y));
});
test('the gallery exit returns to the hall floor with room to move',()=>{
  const returning=advancePlayer(at(10.11,8.2),[-1,0],16,viewport,[],canEnter);
  assert.deepEqual(returning.player,{x:7.45,y:5.5});
  assert.ok(canEnter(returning,7,6));
});
test('walking toward the back wall away from the arch stays in the hall',()=>{
  const stopped=walk(at(6,5),[0,-1],500);
  assert.ok(stopped.player.x<9);
  assert.ok(stopped.player.y>=3.5);
});


test('vault doorway keeps a locked player outside and allows walking both ways after unlocking', () => {
  const locked = walk(at(16.5,9),[1,0],1200);
  assert.equal(galleryVaultDoorBlocks(locked.player.x,locked.player.y,false),false);
  assert.equal(atVaultDoor(locked), true);
  const entered = walk(at(16.5,9,true),[1,0],1200);
  assert.ok(entered.player.x >= 19);
  const returned = walk(entered,[-1,0],2200);
  assert.ok(returned.player.x < 18);
});

test('walking toward the open vault from the front enters while the locked door blocks', () => {
  const locked = walk(at(16.5,9),[0,-1],800);
  assert.ok(locked.player.x < 18);
  assert.equal(galleryVaultDoorBlocks(locked.player.x,locked.player.y,false),false);
  const entered = walk(at(16.5,9,true),[0,-1],800);
  assert.ok(entered.player.x >= 19);
  const besideDoor = walk(at(16.1,9,true),[0,-1],800);
  assert.equal(galleryVaultDoorBlocks(besideDoor.player.x,besideDoor.player.y,true),false);
  const side = walk(at(15.7,7.8,true),[1,0],800);
  assert.ok(galleryPosition(side.player.x,side.player.y).x < 696);
});


test('vault exit works along the visible arch, including a forward approach', () => {
  for(const y of [5.5,6.5,7.5,8.5,9.3]) {
    const exited=walk(at(19.3,y,true),[-1,0],500);
    assert.ok(exited.player.x<18, `left exit at row ${y}`);
  }
  const forward=walk(at(19.4,6,true),[0,-1],64);
  assert.ok(forward.player.x<18, 'walk forward through the arch');
  const closed=walk(at(19.3,7,false),[-1,0],500);
  assert.ok(closed.player.x>=18, 'locked vault does not bypass the door');
});

test('vault door collision follows the visible closed face or swung-open panel',()=>{
  // The open door swings into the room; the same floor is clear when closed.
  assert.equal(galleryVaultDoorBlocks(16.15,7.7,false),false);
  assert.equal(galleryVaultDoorBlocks(16.15,7.7,true),true);
  // The closed face is solid, while the open doorway can be crossed.
  assert.equal(galleryVaultDoorBlocks(16.7,7.5,false),true);
  assert.equal(galleryVaultDoorBlocks(16.7,9,true),false);
  const freeWithClosedDoor=walk(at(15.9,7.7,false),[1,0],300);
  const blockedByOpenDoor=walk(at(15.9,7.7,true),[1,0],300);
  assert.ok(freeWithClosedDoor.player.x>blockedByOpenDoor.player.x);
});

test('plant foliage is drawn in front of someone standing behind its base',()=>{
  const oldImage=globalThis.Image;
  globalThis.Image=class {constructor(){this.complete=true;this.naturalWidth=1536;this.naturalHeight=1024;}};
  try {
    const events=[];
    const ctx=new Proxy({}, {get(target,key){
      if(key==='drawImage') return (...args)=>{if(args.length===9)events.push({kind:'crop',destX:args[5],destY:args[6]});};
      return target[key] ?? (()=>{});
    },set(target,key,value){target[key]=value;return true;}});
    createGalleryRenderer()(ctx,{time:0,state:{doorOpen:false},player:{x:10.7,y:3.7},objects:[],target:null,facing:'down',moving:false,drawPerson(){events.push({kind:'person'});},vaultNearby:false,reducedMotion:false});
    const actorIndex=events.findIndex(event=>event.kind==='person');
    const foliageIndex=events.findIndex(event=>event.kind==='crop'&&event.destX===133&&event.destY===185);
    assert.ok(actorIndex>=0 && foliageIndex>actorIndex);
  } finally {globalThis.Image=oldImage;}
});

test('lower plant foliage can be walked behind while the pots remain solid',()=>{
  for(const [x,y] of [[9.77,12.7],[17.28,12.7]]){
    assert.equal(galleryFootprintFits(x,y),true,`foliage should not block ${x}`);
    const potY=14.5;
    assert.equal(galleryFootprintFits(x,potY),false,`pot should block ${x}`);
  }
});
