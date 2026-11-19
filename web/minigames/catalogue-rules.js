import { CATALOGUE_ARTWORKS } from './catalogue-data.js';
// Share Station L's saved wall clock: leaving or opening help does not pause it.
export { startPuzzle as startCatalogue, elapsedMs } from './picture-rules.js';

const ids = CATALOGUE_ARTWORKS.map(work => work.id);
const labelId = value => Number.isInteger(value) && value >= 0 && value < ids.length;
const count = value => Number.isInteger(value) && value >= 0;
const timestamp = value => Number.isFinite(value) && value >= 0;

export function initialCatalogue(random = Math.random, previous = null) {
  const order = ids.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (order.every((value, index) => value === index)) order.push(order.shift());
  return { version: 1, artworkIds: [...ids], order, slots: ids.map(() => null),
    startedAt: null, finishedAt: null, solved: false,
    // Retain old wall-label attempt counts for the journal; they do not reduce speed points.
    mistakes: count(previous?.mistakes) ? previous.mistakes : 0,
    hints: count(previous?.hints) ? previous.hints : 0 };
}

export function validCatalogue(state) {
  if (!state || state.version !== 1 || !Array.isArray(state.artworkIds)
    || state.artworkIds.length !== ids.length || !state.artworkIds.every((id, i) => id === ids[i])
    || !Array.isArray(state.order) || state.order.length !== ids.length
    || !state.order.every(labelId) || new Set(state.order).size !== ids.length
    || !Array.isArray(state.slots) || state.slots.length !== ids.length
    || !state.slots.every(value => value === null || labelId(value))
    || !count(state.mistakes) || !count(state.hints)) return false;
  const placed = state.slots.filter(value => value !== null);
  if (new Set(placed).size !== placed.length) return false;
  if (state.startedAt !== null && !timestamp(state.startedAt)) return false;
  if (state.startedAt === null && placed.length) return false;
  const complete = state.slots.every((label, index) => label === index);
  if (state.solved !== complete || (state.finishedAt !== null) !== complete) return false;
  return state.finishedAt === null || (timestamp(state.finishedAt)
    && state.startedAt !== null && state.finishedAt >= state.startedAt);
}

// Correct matches are locked. Other occupied targets swap with a placed source,
// or send the displaced label to the tray. A null target returns to the tray;
// trayIndex selects a particular empty tray space and persists its new order.
export function placeLabel(state, label, target, now = Date.now(), trayIndex = null) {
  if (state.solved || state.startedAt === null || !labelId(label)
    || (target !== null && !labelId(target))) return state;
  const source = state.slots.indexOf(label);
  if (source === label || (target !== null && state.slots[target] === target)) return state;
  if (trayIndex !== null && (target !== null || !labelId(trayIndex)
    || !state.slots.includes(state.order[trayIndex]))) return state;
  if ((target === null && source === -1 && trayIndex === null) || source === target) return state;
  const order = [...state.order];
  if (trayIndex !== null) {
    const oldIndex = order.indexOf(label);
    [order[oldIndex], order[trayIndex]] = [order[trayIndex], order[oldIndex]];
  }
  const slots = [...state.slots];
  if (source !== -1) slots[source] = target === null ? null : slots[target];
  if (target !== null) slots[target] = label;
  const solved = slots.every((value, index) => value === index);
  return { ...state, order, slots, solved, finishedAt: solved ? Math.max(now, state.startedAt) : null };
}
