// A red status light indicates an active camera in every room.
export const VAULT_CAMERAS = [{x:177,y:74,phase:0}, {x:765,y:74,phase:360}];
export function cameraLightOn(time, phase=0) { return ((time+phase)%1800)<900; }
export function drawCameraLights(ctx,cameras,time,reducedMotion=false){
  for(const camera of cameras){
    const on=reducedMotion || cameraLightOn(time,camera.phase);
    ctx.save();
    // Cover the red light baked into the background, leaving the housing intact.
    ctx.fillStyle='#1c1117';ctx.fillRect(camera.x-3,camera.y-3,6,6);
    ctx.fillStyle=on?'#ff4141':'#591d25';ctx.shadowColor='#ff2626';ctx.shadowBlur=on?8:0;
    ctx.beginPath();ctx.arc(camera.x,camera.y,1.8,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
}
