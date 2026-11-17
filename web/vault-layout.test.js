import test from 'node:test';
import assert from 'node:assert/strict';
import { vaultFloorContains, vaultPosition } from './vault-layout.js';
import { advancePlayer } from './motion.js';
import { canEnter, initialState } from './engine.js';

const viewport = {width:896,height:576};
function moveFor(state,direction,frames=300){
  for(let i=0;i<frames;i++) state=advancePlayer(state,direction,16,viewport,[],canEnter);
  return state;
}
test('vault boundaries keep the player on the visible floor in all four directions',()=>{
  const center={...initialState(),doorOpen:true,player:{x:23,y:10}};
  for(const direction of [[-1,0],[1,0],[0,-1],[0,1]]){
    const moved=moveFor(center,direction);
    assert.equal(vaultFloorContains(moved.player.x,moved.player.y),true);
    assert.ok(moved.player.x >= 18);
    const p=vaultPosition(moved.player.x,moved.player.y);
    assert.ok(p.x>=105&&p.x<=825&&p.y>=330&&p.y<=548);
  }
});
