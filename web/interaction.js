// What the interaction key (E / Enter / touch button) does – pure logic, no DOM, easy to test.
// With nothing nearby there is no popup any more: the player only gives a short sideways "shake"
// and a very quiet tap sound (if sound is on). No text, nothing to click away.

export const NUDGE_MS = 200;        // how long the shake lasts
export const NUDGE_TILES = 0.03;    // about 3 px on screen

/** 'vault' at the vault door, 'object' next to something to use, otherwise 'nudge'. */
export function interactionFor({ atVaultDoor, target }) {
  if (atVaultDoor) return 'vault';
  if (target) return 'object';
  return 'nudge';
}

/** Sideways offset (in tiles) `elapsed` ms after the nudge started: two quick swings, then still.
 *  With reduced motion the player does not move at all. */
export function nudgeOffset(elapsed, reducedMotion = false) {
  if (reducedMotion || !(elapsed >= 0) || elapsed >= NUDGE_MS) return 0;
  return Math.sin((elapsed / NUDGE_MS) * Math.PI * 4) * NUDGE_TILES * (1 - elapsed / NUDGE_MS);
}
