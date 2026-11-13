import { GALLERY, galleryFootprintFits, galleryDoorTransition } from './gallery-layout.js';
// Movement duration follows displayed distance, even when the room is stretched to fit the window.
export const PLAYER_SPEED = 220; // screen pixels per second
export function movementDuration(from, to, viewport, room) {
  const horizontal = room === 'hall' ? 896 / 9 : room === 'gallery' ? GALLERY.stepX : 32;
  const vertical = room === 'hall' ? 14 : room === 'gallery' ? GALLERY.stepY : 32;
  const dx = (to.x - from.x) * horizontal * viewport.width / 896;
  const dy = (to.y - from.y) * vertical * viewport.height / 576;
  return Math.hypot(dx, dy) / PLAYER_SPEED * 1000;
}

// Move in small increments so fast frames cannot skip through a wall or person.
export function advancePlayer(state, direction, milliseconds, viewport, guards, canEnter) {
  if (!direction || state.ending || milliseconds <= 0) return state;
  const room=state.player.x<9?'hall':state.player.x<18?'gallery':'storage';
  const sx=(room==='hall'?896/9:room==='gallery'?GALLERY.stepX:32)*viewport.width/896;
  const sy=(room==='hall'?14:room==='gallery'?GALLERY.stepY:32)*viewport.height/576;
  const distance=PLAYER_SPEED*milliseconds/1000;
  const dx=direction[0]*distance/sx, dy=direction[1]*distance/sy;
  const count=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/0.04));
  let x=state.player.x,y=state.player.y;
  for(let i=0;i<count;i++){
    const nx=x+dx/count, ny=y+dy/count;
    const landing=galleryDoorTransition({x,y},{x:nx,y:ny});
    const crossedDoor=landing.x!==nx || landing.y!==ny;
    if(crossedDoor){
      // The hall guard can still block the entrance; a portal never bypasses them.
      if(room==='hall' && guards.some(g=>Math.abs(g.x-nx)<0.45 && Math.abs(g.y-ny)<2.4)) break;
      x=landing.x;y=landing.y;break;
    }
    const cx=Math.round(nx),cy=Math.round(ny);
    if(!canEnter(state,cx,cy,guards[0])) break;
    // Use the same gallery footprint on both sides of a doorway. A centre-only
    // check would let shoulders/feet cross walls before the next tile is entered.
    if(nx >= 8.5 && nx <= 18.5 && !(room === 'hall' && ny >= 3.5 && ny < 7.5)) {
      const corners=[[-.18,-.32],[.18,-.32],[-.18,.32],[.18,.32]];
      if(corners.some(([ox,oy])=>!canEnter(state,Math.round(nx+ox),Math.round(ny+oy),guards[0]))) break;
    }
    if(guards.some(g=>Math.abs(g.x-nx)<(room==='hall'?0.45:0.56) && Math.abs(g.y-ny)<(room==='hall'?2.4:0.56))) break;
    if(nx>=9&&nx<18&&!galleryFootprintFits(nx,ny)) break;
    x=nx;y=ny;
  }
  if(x===state.player.x && y===state.player.y)return state;
  const crossed=Math.round(x)!==Math.round(state.player.x)||Math.round(y)!==Math.round(state.player.y);
  return {...state,player:{x,y},steps:state.steps+(crossed?1:0)};
}
