// Who talks when, and when does the speech box close? Pure logic, no DOM, easy to test.
//
// Every character talks only after E (like Leon). Coming close opens nothing.
// The open box closes when the player walks further away than FAR steps.

export const FAR = 1.5;

// objectId: the map object next to the player when E is pressed
// people: map object id → story character, e.g. { guard: 'leon' }
// → the character to talk to, or null if the object is no person
export function talkPartner(objectId, people) {
  return objectId && Object.hasOwn(people, objectId) ? people[objectId] : null;
}

// The open box closes as soon as the player is far enough away.
export function shouldCloseTalk(distance) {
  return distance > FAR;
}

// Straight-line distance in steps.
export function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Which way a character looks to face the player.
export function facingToward(from, to) {
  const dx = to.x - from.x, dy = to.y - from.y;
  return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
}
