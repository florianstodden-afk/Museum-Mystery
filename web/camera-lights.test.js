import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraLightOn, drawCameraLights, VAULT_CAMERAS} from './camera-lights.js';
import {GALLERY_CAMERAS} from './gallery-layout.js';

test('all gallery and vault camera lights alternate while active',()=>{
  for(const camera of [...GALLERY_CAMERAS,...VAULT_CAMERAS]){
    assert.notEqual(cameraLightOn(0,camera.phase),cameraLightOn(900,camera.phase));
    assert.equal(cameraLightOn(0,camera.phase),cameraLightOn(1800,camera.phase));
  }
});

test('camera LEDs render their dim and bright states, and respect reduced motion',()=>{
  const colors=[];
  const ctx={save(){},restore(){},fillRect(){},beginPath(){},arc(){},fill(){colors.push(this.fillStyle);}};
  drawCameraLights(ctx,[{x:1,y:1,phase:0}],0);
  drawCameraLights(ctx,[{x:1,y:1,phase:0}],900);
  drawCameraLights(ctx,[{x:1,y:1,phase:0}],900,true);
  assert.deepEqual(colors,['#ff4141','#591d25','#ff4141']);
});
