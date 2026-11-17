// When should a character's speech box open or close? Pure logic, no DOM, easy to test.
//
// The box opens when the player comes closer than NEAR tiles
// and closes again when the player walks further away than FAR tiles.
// The gap between NEAR and FAR (hysteresis) stops the box from flickering at the edge.
// After "Goodbye" the player has to walk away once before the box opens again.

export const NEAR = 1.0;
export const FAR = 1.5;

// distance: tiles between player and character
// wasNear: true after a talk opened, until the player walks away
// blocked: another window or minigame is open
// → { open, wasNear }: open = start talking now; wasNear = value for the next frame
export function shouldOpenTalk({ distance, wasNear, blocked = false }) {
  const stillNear = wasNear && distance <= FAR;
  const open = !stillNear && !blocked && distance < NEAR;
  return { open, wasNear: open || stillNear };
}

// The open box closes as soon as the player is far enough away.
export function shouldCloseTalk(distance) {
  return distance > FAR;
}

// Straight-line distance in tiles.
export function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
