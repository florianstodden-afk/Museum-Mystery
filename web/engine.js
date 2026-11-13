import { galleryWalkable, galleryFootprintFits, galleryDoorTransition, GALLERY_HALL_ROW } from './gallery-layout.js';
// The walkable map: size, walls, objects, movement and "what is nearby".
// The story itself (stations, safe, endings) lives in web/story/. The old prototype story is in web/legacy/.
export const WIDTH = 28;
export const HEIGHT = 18;
export const START = { x: 3, y: 9 };

// Every object on the map. `story` says what pressing E there does:
//   { station: id } opens a mini-game, { talk: id } a conversation,
//   { examine: id } looks at something, { vault: true } continues at the safe.
// Stations 2–4 use existing spots until their own rooms exist.
export const OBJECTS = [
  { id: "guard", x: 5, y: 5, label: "Leon (night guard)", story: { talk: "leon" } },
  { id: "ledger", x: 5, y: 12, label: "Night-shift log · Station I", story: { station: "portraits" } },
  { id: "painting", x: 14, y: 3, label: "Wall label · Station B", story: { station: "landscape" } },
  { id: "frames", x: 16, y: 3, label: "Frame rack · Station D", story: { station: "archive" } },
  { id: "restorer", x: 15, y: 12, label: "Imani (conservator)", story: { talk: "imani" } },
  { id: "note", x: 12, y: 13, label: "Transport slip · Station L", story: { station: "restoration" } },
  { id: "monitors", x: 11, y: 15, label: "Security monitors", story: { examine: "monitor-wall" } },
  { id: "roster", x: 12, y: 15, label: "Shift schedule", story: { examine: "shift-schedule" } },
  { id: "vault", x: 23, y: 5, label: "The original painting", story: { vault: true } },
  { id: "curator", x: 21, y: 12, label: "Dr. Vale (curator)", story: { talk: "vale" } },
];

// The door between gallery and storage. It is the safe: it opens with the code word.
export const VAULT_DOOR = { x: 18, y: 9 };

// doorOpen mirrors the story: it is true once the safe has been opened.
export function initialState() {
  return { player: { ...START }, steps: 0, doorOpen: false };
}

// Old saves contain more fields (clues, pass, …); only position and steps matter here.
export function validState(value) {
  return Boolean(value) && Number.isFinite(value.player?.x) && Number.isFinite(value.player?.y)
    && value.player.x >= 0.5 && value.player.x < WIDTH - 1.5 && value.player.y >= 0.5 && value.player.y < HEIGHT - 1.5
    && Number.isInteger(value.steps) && value.steps >= 0;
}

// Turns a saved value into a map state. The door is set from the story afterwards.
export function restoreState(saved, doorOpen) {
  if (!validState(saved)) return { ...initialState(), doorOpen };
  const state = { player: { x: saved.player.x, y: saved.player.y }, steps: saved.steps, doorOpen };
  // Someone saved inside the storage room but the safe is closed in the new story: start outside.
  if (!doorOpen && state.player.x >= VAULT_DOOR.x) state.player = { ...START };
  // New furniture/walls must not trap a position from an older save.
  if (!canEnter(state, Math.round(state.player.x), Math.round(state.player.y))
      || (state.player.x >= 9 && state.player.x < 18 && !galleryFootprintFits(state.player.x,state.player.y))) {
    state.player = state.player.x >= 9 && state.player.x < 18 ? { x: 11, y: 6 } : { ...START };
  }
  return state;
}

function objectsWithGuard(guardPosition) {
  return guardPosition ? OBJECTS.map(object => object.id === "guard" ? {...object, ...guardPosition} : object) : OBJECTS;
}

export function canEnter(state, x, y, guardPosition) {
  if (x <= 0 || y <= 0 || x >= WIDTH - 1 || y >= HEIGHT - 1) return false;
  if (x < 9 && y < 4) return false; // Keep the player below the full-height picture wall.
  if (x > 9 && x < 18 && y < 3) return false;
  if (x > 9 && x < 18 && !galleryWalkable(x,y)) return false;
  if (x === 9 && (state.player.x < 9 ? y !== 4 : Math.abs(y-GALLERY_HALL_ROW)>1)) return false;
  if (x === 18 && y !== 9) return false;
  if (x === VAULT_DOOR.x && y === VAULT_DOOR.y && !state.doorOpen) return false;
  if (objectsWithGuard(guardPosition).some(object => object.x === x && object.y === y)) return false;
  return true;
}

export function move(state, dx, dy, guardPosition) {
  if (Math.abs(dx) + Math.abs(dy) !== 1) return state;
  const x = state.player.x + dx;
  const y = state.player.y + dy;
  if (!canEnter(state, x, y, guardPosition)) return state;
  return { ...state, player: galleryDoorTransition(state.player, { x, y }), steps: state.steps + 1 };
}

// Standing on the tile in front of the vault door (gallery side).
export function atVaultDoor(state) {
  return Math.abs(state.player.x - (VAULT_DOOR.x - 1)) < 0.55 && Math.abs(state.player.y - VAULT_DOOR.y) < 0.55;
}

function interactionDistance(player, object) {
  // Hall characters are tall on screen, while the underlying vertical grid is compressed.
  if (object.id === 'guard' && player.x < 9) {
    const dx=Math.abs(object.x-player.x), dy=Math.abs(object.y-player.y);
    return dx <= 1.1 && dy <= 3.5 ? Math.max(dx,dy/3.5) : Infinity;
  }
  return Math.abs(object.x-player.x)+Math.abs(object.y-player.y) <= 1.15 ?
    Math.abs(object.x-player.x)+Math.abs(object.y-player.y) : Infinity;
}
export function nearbyObject(state, guardPosition) {
  return objectsWithGuard(guardPosition).map(object => ({object, distance:interactionDistance(state.player,object)}))
    .filter(item => Number.isFinite(item.distance)).sort((a,b)=>a.distance-b.distance)[0]?.object ?? null;
}
