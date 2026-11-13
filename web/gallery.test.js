import test from 'node:test';
import assert from 'node:assert/strict';
import { GALLERY, GALLERY_BENCHES, GALLERY_OBSTACLES, galleryFootprintFits, galleryPosition, cameraLightOn } from './gallery-layout.js';
import { initialState, canEnter, restoreState, nearbyObject } from './engine.js';
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
  for(const [start,direction] of [[at(12,4),[-1,0]],[at(16,5),[1,0]],[at(12,3),[0,-1]],[at(13,16),[0,1]]]){
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
  assert.ok(returned.player.x<9);assert.equal(returned.player.y,4);
});
test('back-wall artwork remains reachable, old saves in new obstacles recover safely',()=>{
  assert.equal(nearbyObject(at(14,4)).id,'painting');
  assert.equal(nearbyObject(at(16,4)).id,'frames');
  for(const p of [{x:16,y:2},...GALLERY_BENCHES,{x:10,y:14}]){
    const saved=at(p.x,p.y);saved.steps=42;
    const restored=restoreState(saved,false);
    assert.deepEqual(restored.player,{x:11,y:6});assert.equal(restored.steps,42);
    assert.deepEqual(restoreState(JSON.parse(JSON.stringify(restored)),false),restored);
  }
});
test('camera status repeats slowly through both red-light states',()=>{
  assert.equal(cameraLightOn(0),true);assert.equal(cameraLightOn(899),true);
  assert.equal(cameraLightOn(900),false);assert.equal(cameraLightOn(1799),false);
  assert.equal(cameraLightOn(1800),true);assert.equal(cameraLightOn(600,360),false);
});
