import { canEnter } from './engine.js';

// Choose a nearby reachable tile. Random pauses and choices make the patrol less predictable.
export function guardOptions(state, guard) {
  return [[0,-1],[1,0],[0,1],[-1,0]].map(([dx,dy]) => ({x:guard.x+dx,y:guard.y+dy}))
    .filter(p => p.x >= 2 && p.x <= 7 && p.y >= 4 && p.y <= 14)
    .filter(p => !(Math.abs(p.x - state.player.x) < 0.45 && Math.abs(p.y - state.player.y) < 2.4))
    .filter(p => canEnter(state,p.x,p.y,guard));
}
export function chooseGuardAction(state, guard, random=Math.random) {
  const options=guardOptions(state,guard);
  if (!options.length || random() < 0.3) return {kind:'wait',duration:1200+random()*2600};
  return {kind:'walk',target:options[Math.floor(random()*options.length)],pause:500+random()*2000};
}
