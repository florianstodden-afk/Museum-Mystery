// Movement duration follows displayed distance, even when the room is stretched to fit the window.
export const PLAYER_SPEED = 220; // screen pixels per second
export function movementDuration(from, to, viewport, room) {
  const horizontal = room === 'hall' ? 896 / 9 : 32;
  const vertical = room === 'hall' ? 14 : 32;
  const dx = (to.x - from.x) * horizontal * viewport.width / 896;
  const dy = (to.y - from.y) * vertical * viewport.height / 576;
  return Math.hypot(dx, dy) / PLAYER_SPEED * 1000;
}
