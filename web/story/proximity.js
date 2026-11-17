// When should a character start talking by itself? Pure logic, no DOM, easy to test.
//
// Hysteresis: the talk opens when the player comes closer than NEAR tiles.
// It can only open again after the player went further away than FAR tiles
// AND COOLDOWN_MS passed since the box closed. So it never pops up again and again.

export const NEAR = 1.2;
export const FAR = 2.5;
export const COOLDOWN_MS = 8000;

// distance: tiles between player and character
// wasNear: true after a talk opened, until the player walks far away
// lastClosedAt: time (ms) the box last closed, -Infinity if never
// now: current time (ms)
// blocked: another window or minigame is open
// → { open, wasNear }: open = start talking now; wasNear = value for the next frame
export function shouldOpenTalk({ distance, wasNear, lastClosedAt = -Infinity, now, blocked = false }) {
  const stillNear = wasNear && distance <= FAR;
  const cooledDown = now - lastClosedAt >= COOLDOWN_MS;
  const open = !stillNear && !blocked && distance < NEAR && cooledDown;
  return { open, wasNear: open || stillNear };
}

// Straight-line distance in tiles.
export function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
