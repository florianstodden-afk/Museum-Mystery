// World coordinates mapped to the visible vault floor in the 896×576 scene.
export const VAULT_STEP_X = 90;
export const VAULT_STEP_Y = 21;
export function vaultPosition(x,y) {
  return { x: 60 + (x-18)*VAULT_STEP_X, y: 330 + (y-5)*VAULT_STEP_Y };
}
// Bound the character's feet inside the floor, allowing space for the sprite at the edges.
export function vaultFloorContains(x,y) {
  const p=vaultPosition(x,y);
  return p.x >= 105 && p.x <= 825 && p.y >= 330 && p.y <= 548;
}
