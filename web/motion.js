import { VAULT_STEP_X, VAULT_STEP_Y, vaultFloorContains } from './vault-layout.js';
import { officePortal, canEnterOffice, officeFootprintFits } from './security-room.js';
import { GALLERY, galleryFootprintFits, galleryDoorTransition, galleryVaultDoorBlocks } from './gallery-layout.js?v=gallery-route-8';
// Movement duration follows displayed distance, even when the room is stretched to fit the window.
export const PLAYER_SPEED = 220; // screen pixels per second
export function movementDuration(from, to, viewport, room) {
  const horizontal = room === 'hall' ? 896 / 9 : room === 'gallery' ? GALLERY.stepX : room === 'security' ? 100 : VAULT_STEP_X;
  const vertical = room === 'hall' ? 14 : room === 'gallery' ? GALLERY.stepY : room === 'security' ? 20 : VAULT_STEP_Y;
  const dx = (to.x - from.x) * horizontal * viewport.width / 896;
  const dy = (to.y - from.y) * vertical * viewport.height / 576;
  return Math.hypot(dx, dy) / PLAYER_SPEED * 1000;
}

// Move in small increments so fast frames cannot skip through a wall or person.
export function advancePlayer(state, direction, milliseconds, viewport, guards, canEnter) {
  if (!direction || state.ending || milliseconds <= 0) return state;
  const room=state.room==='security'?'security':state.player.x<9?'hall':state.player.x<18?'gallery':'storage';
  const sx=(room==='hall'?896/9:room==='gallery'?GALLERY.stepX:room==='security'?100:VAULT_STEP_X)*viewport.width/896;
  const sy=(room==='hall'?14:room==='gallery'?GALLERY.stepY:room==='security'?20:VAULT_STEP_Y)*viewport.height/576;
  const distance=PLAYER_SPEED*milliseconds/1000;
  const dx=direction[0]*distance/sx, dy=direction[1]*distance/sy;
  const count=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/0.04));
  let x=state.player.x,y=state.player.y;
  for(let i=0;i<count;i++){
    const nx=x+dx/count, ny=y+dy/count;
    const officeLanding=officePortal(state,{x,y},{x:nx,y:ny});
    if(officeLanding){
      if(room==='hall' && guards.some(g=>Math.abs(g.x-nx)<0.45 && Math.abs(g.y-ny)<2.4)) break;
      return {...state,...officeLanding,steps:state.steps+1};
    }
    if(room==='security'){
      if(!canEnterOffice(Math.round(nx),Math.round(ny)) || !officeFootprintFits(nx,ny)) break;
      x=nx;y=ny;continue;
    }
    // Cross at the painted vault doorway only after the story code unlocks it.
    if(state.doorOpen && room==='gallery' && ((direction[0]>0 && nx>=16.58 && ny>=8.6 && ny<=9.4) || (direction[1]<0 && nx>=16.35 && nx<=17.25 && ny<=9.15)))
      return {...state,player:{x:19.3,y:9},steps:state.steps+1};
    // The vault arch is on the left wall. Accept approaches along its full
    // visible floor opening, including walking up into the arch.
    if(state.doorOpen && room==='storage' &&
      ((direction[0]<0 && nx<=19.1 && ny>=5 && ny<=9.5) ||
       (direction[1]<0 && nx>=19 && nx<=19.7 && ny<=5.55)))
      return {...state,player:{x:16.4,y:9.2},steps:state.steps+1};
    const landing=galleryDoorTransition({x,y},{x:nx,y:ny});
    const crossedDoor=landing.x!==nx || landing.y!==ny;
    if(crossedDoor){
      // The hall guard can still block the entrance; a portal never bypasses them.
      if(room==='hall' && guards.some(g=>Math.abs(g.x-nx)<0.45 && Math.abs(g.y-ny)<2.4)) break;
      x=landing.x;y=landing.y;break;
    }
    // The closed door and the swung-open panel occupy different floor areas.
    if(room==='gallery' && galleryVaultDoorBlocks(nx,ny,state.doorOpen)) break;
    // Keep the character inside the hall floor, without drawing a guide over the artwork.
    const hallScreenX=(nx+0.5)*896/9;
    if(room==='hall' && (hallScreenX-17<86 || hallScreenX+17>864)) break;
    if(room==='storage' && !vaultFloorContains(nx,ny)) break;
    const cx=Math.round(nx),cy=Math.round(ny);
    if(!(room==='gallery' && cx>=18) && !canEnter(state,cx,cy,guards[0],room==='gallery')) break;
    // Use the same gallery footprint on both sides of a doorway. A centre-only
    // check would let shoulders/feet cross walls before the next tile is entered.
    if(room!=='gallery' && nx >= 8.5 && nx <= 18.5 && !(room === 'hall' && ny >= 3.5 && ny < 7.5)) {
      const corners=[[-.18,-.32],[.18,-.32],[-.18,.32],[.18,.32]];
      if(corners.some(([ox,oy])=>!canEnter(state,Math.round(nx+ox),Math.round(ny+oy),guards[0]))) break;
    }
    if(guards.some(g=>Math.abs(g.x-nx)<(room==='hall'?0.45:0.56) && Math.abs(g.y-ny)<(room==='hall'?2.4:0.56))) break;
    if(nx>=9&&nx<18&&!galleryFootprintFits(nx,ny,state.doorOpen)) break;
    x=nx;y=ny;
  }
  if(x===state.player.x && y===state.player.y)return state;
  const crossed=Math.round(x)!==Math.round(state.player.x)||Math.round(y)!==Math.round(state.player.y);
  return {...state,player:{x,y},steps:state.steps+(crossed?1:0)};
}
