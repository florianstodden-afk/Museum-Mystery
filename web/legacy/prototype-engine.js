// LEGACY: the first prototype story (three clues, guard pass, code 2114, two endings).
// It is no longer used by the game. The story now lives in web/story/ and the map in web/engine.js.
// Kept unchanged so its tests still document how the prototype worked (see docs/story/integration-plan.md).

export const WIDTH = 28;
export const HEIGHT = 18;
export const START = { x: 3, y: 9 };
export const EVIDENCE = ["ledger", "painting", "note"];

export const OBJECTS = [
  { id: "guard", x: 5, y: 5, label: "Security guard" },
  { id: "ledger", x: 5, y: 12, label: "Visitor log" },
  { id: "painting", x: 14, y: 4, label: "Replaced painting" },
  { id: "restorer", x: 15, y: 12, label: "Conservator" },
  { id: "note", x: 12, y: 13, label: "Conservation note" },
  { id: "vault", x: 23, y: 5, label: "Hidden original" },
];

export function initialState() {
  return { player: { ...START }, clues: [], pass: false, vaultOpen: false,
    ending: null, steps: 0 };
}

export function validState(value) {
  return value && Number.isFinite(value.player?.x) && Number.isFinite(value.player?.y) && value.player.x >= 0.5 && value.player.x < WIDTH-1.5 && value.player.y >= 0.5 && value.player.y < HEIGHT-1.5
    && Array.isArray(value.clues) && value.clues.every(c => EVIDENCE.includes(c))
    && typeof value.pass === "boolean" && typeof value.vaultOpen === "boolean"
    && (value.ending === null || ["restore", "expose"].includes(value.ending))
    && Number.isInteger(value.steps) && value.steps >= 0;
}

export function hasAllEvidence(state) {
  return EVIDENCE.every(id => state.clues.includes(id));
}

function objectsWithGuard(guardPosition) {
  return guardPosition ? OBJECTS.map(object => object.id === "guard" ? {...object, ...guardPosition} : object) : OBJECTS;
}

export function canEnter(state, x, y, guardPosition) {
  if (x <= 0 || y <= 0 || x >= WIDTH - 1 || y >= HEIGHT - 1) return false;
  if (x < 9 && y < 4) return false; // Keep the player below the full-height picture wall.
  if (x === 9 && y !== 9) return false;
  if (x === 18 && y !== 9) return false;
  if (x === 18 && y === 9 && !state.vaultOpen) return false;
  if (objectsWithGuard(guardPosition).some(object => object.x === x && object.y === y)) return false;
  return true;
}

export function move(state, dx, dy, guardPosition) {
  if (state.ending || Math.abs(dx) + Math.abs(dy) !== 1) return state;
  const x = state.player.x + dx;
  const y = state.player.y + dy;
  if (!canEnter(state, x, y, guardPosition)) return state;
  return { ...state, player: { x, y }, steps: state.steps + 1 };
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

export function interact(state, id, guardPosition) {
  const object = objectsWithGuard(guardPosition).find(item => item.id === id);
  if (!object || !Number.isFinite(interactionDistance(state.player,object))) {
    return { state, text: "Move closer to the object." };
  }
  if (state.ending) return { state, text: "The case is closed. Start a new game." };
  if (EVIDENCE.includes(id)) {
    if (state.clues.includes(id)) return { state, text: "This evidence is already in your journal." };
    const texts = {
      ledger: "Visitor log: An unknown courier was recorded at the side entrance at 21:14.",
      painting: "The signature matches, but the varnish looks unusually fresh: the painting on the wall is a forgery.",
      note: "Conservation note: The original was secretly moved to storage before the gala. Why?",
    };
    return { state: { ...state, clues: [...state.clues, id] }, text: texts[id], artwork: id === "painting" };
  }
  if (id === "guard") {
    if (!state.clues.includes("ledger")) return { state, text: "Security guard: First find the visitor log at reception. I need evidence before I can help." };
    if (state.pass) return { state, text: "Security guard: You already have my storage pass. Keep looking for evidence." };
    return { state: { ...state, pass: true }, text: "Security guard: 21:14? That was after closing. Here is my storage pass. Find out what is in there." };
  }
  if (id === "restorer") return { state, text: "Conservator: Look at the varnish and the note by my workbench. The storage door needs a pass and three pieces of evidence." };
  if (id === "vault") {
    if (!state.vaultOpen) return { state, text: "The storage room is still locked." };
    return { state, text: "The original painting is in storage. Museum management covered up the swap. What will you do?", choice: true };
  }
  return { state, text: "There is nothing to discover here." };
}

export function openVault(state, code) {
  if (state.ending || Math.abs(state.player.x - 17) > 0.55 || Math.abs(state.player.y - 9) > 0.55
      || !state.pass || !hasAllEvidence(state)) {
    return { state, text: "Storage is locked: you need three clues and the security guard’s pass." };
  }
  if (code !== "2114") {
    return { state, text: "That code is wrong. What time was recorded in the visitor log?" };
  }
  return { state: { ...state, vaultOpen: true }, text: "The pass clicks into place. The storage door is open!" };
}

export function chooseEnding(state, ending) {
  if (!state.vaultOpen || !hasAllEvidence(state) || !["restore", "expose"].includes(ending)
      || Math.abs(state.player.x - 23) + Math.abs(state.player.y - 5) > 1.15) {
    return state;
  }
  return { ...state, ending };
}
