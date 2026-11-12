// What the player can examine in the Security Office.
// Positions are relative to the room (0…1), taken from the same LAYOUT the drawing uses.
import { LAYOUT } from './security-office.js';
import { addNote } from '../engine.js';

export const INTERACTION_POINTS = Object.freeze([
  {
    id: 'monitor-wall',
    label: 'Monitor wall',
    area: LAYOUT.monitorWall,
    noteId: 'transport-cart',
    title: 'Monitor wall · CAM 07, 21:14',
    text: 'Leon rewinds the delivery-exit camera. At 21:14 a transport cart rolls past the loading door. ' +
      'Two people in grey coats, a crate under a blanket. Whatever is inside, the camera cannot see it.',
  },
  {
    id: 'shift-schedule',
    label: 'Shift schedule',
    area: LAYOUT.shiftSchedule,
    noteId: 'duty-roster',
    title: 'Shift schedule',
    text: 'Leon: night round, all wings. Imani: studio until 22:00. One line in different ink: ' +
      '“21:00 – patron visit, delivery exit.” The night-shift log in the Portrait Hall should say who booked it.',
  },
  {
    id: 'radio',
    label: 'Walkie-talkie',
    area: LAYOUT.radio,
    noteId: null,
    title: 'Walkie-talkie',
    text: 'Static, then Leon’s voice from somewhere in the east wing: “Round two, all doors closed.” The red light keeps blinking.',
  },
  {
    id: 'key-cabinet',
    label: 'Key cabinet',
    area: LAYOUT.keyCabinet,
    noteId: null,
    title: 'Key cabinet',
    text: 'Brass hooks, numbered by wing. One hook is empty: the key to the delivery exit.',
  },
]);

export function pointById(pointId) {
  return INTERACTION_POINTS.find(point => point.id === pointId) ?? null;
}

// Which point lies under a relative position (e.g. a click at 40 % / 20 % of the room)?
export function pointAt(relX, relY) {
  return INTERACTION_POINTS.find(({ area }) =>
    relX >= area.x && relX <= area.x + area.w && relY >= area.y && relY <= area.y + area.h) ?? null;
}

// Examine a point. Returns { state, ok, title, text, message }.
// Points with a noteId add that note to the journal – exactly once (addNote refuses duplicates).
export function examine(state, pointId) {
  const point = pointById(pointId);
  if (!point) return { state, ok: false, title: '', text: '', message: `Unknown point: ${pointId}.` };
  if (!point.noteId) return { state, ok: true, title: point.title, text: point.text, message: '' };
  const result = addNote(state, point.noteId);
  return { state: result.state, ok: result.ok, title: point.title, text: point.text, message: result.message };
}
