// Station I (Portrait Hall): pure rules, no DOM.
// The player orders three portrait cards from the oldest to the newest painting.
// A card is identified by its Met object ID.
import { CASE, workById } from '../story/case-1.js';

export const PORTRAIT_IDS = Object.freeze([...CASE.stations.find(station => station.id === 'portraits').metIds]);
export const MAX_HINTS = 2;

// The back of each card: one part of the fictional night-shift log.
// Read in the right order (oldest → newest painting) they form the full log.
export const LOG_BACKS = Object.freeze({
  436121: '21:02–21:18 · Leon – round of the east wing and the east stairs. All doors checked.',
  12127: '21:14 · Delivery bay – transport cart signed out. Booked as: patron visit – A. V.',
  435876: '21:20 · Leon – back at the front desk. Coffee, radio check.',
});

// The correct order comes from the frozen, checked snapshot in case-1.js – never from live data.
// For a date range (e.g. 1883–84) the start year counts. Ties would fall back to end year, then ID.
export function correctOrder(ids = PORTRAIT_IDS, findWork = workById) {
  return [...ids].sort((a, b) => {
    const workA = findWork(a);
    const workB = findWork(b);
    return workA.objectBeginDate - workB.objectBeginDate
      || workA.objectEndDate - workB.objectEndDate
      || a - b;
  });
}

function sameOrder(a, b) {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

// A shuffled start that is never already solved.
export function initialTimeline(random = Math.random) {
  const order = [...PORTRAIT_IDS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (sameOrder(order, correctOrder())) order.push(order.shift());
  return { order, solved: false, mistakes: 0, hints: 0, revealed: [] };
}

function isCount(value) {
  return Number.isInteger(value) && value >= 0;
}

// Checks a saved state. Broken or foreign data returns false and the station starts fresh.
export function validTimeline(state) {
  if (!state || typeof state !== 'object') return false;
  const { order, solved, mistakes, hints, revealed } = state;
  if (!Array.isArray(order) || order.length !== PORTRAIT_IDS.length) return false;
  if (new Set(order).size !== order.length || !order.every(id => PORTRAIT_IDS.includes(id))) return false;
  if (typeof solved !== 'boolean' || !isCount(mistakes) || !isCount(hints) || hints > MAX_HINTS) return false;
  if (solved && !sameOrder(order, correctOrder())) return false;
  // `revealed` lists the cards whose place a hint showed: first the oldest, then the newest.
  if (!Array.isArray(revealed) || revealed.length !== hints) return false;
  return revealed.every((id, index) => id === hintTarget(index));
}

// Which card the n-th hint reveals (0 = oldest, 1 = newest).
function hintTarget(hintIndex) {
  const correct = correctOrder();
  return hintIndex === 0 ? correct[0] : correct[correct.length - 1];
}

// Move one card to a new position; the others shift. Solved timelines stay as they are.
export function moveCard(state, card, toIndex) {
  const from = state.order.indexOf(card);
  if (state.solved || from === -1 || !Number.isInteger(toIndex) || toIndex < 0 || toIndex >= state.order.length) return state;
  if (from === toIndex) return state;
  const order = state.order.filter(id => id !== card);
  order.splice(toIndex, 0, card);
  return { ...state, order };
}

// Swap two cards (click one card, then another).
export function swapCards(state, a, b) {
  const indexA = state.order.indexOf(a);
  const indexB = state.order.indexOf(b);
  if (state.solved || indexA === -1 || indexB === -1 || a === b) return state;
  const order = [...state.order];
  order[indexA] = b;
  order[indexB] = a;
  return { ...state, order };
}

// "Check order": a wrong order counts one mistake and the cards stay movable.
export function checkOrder(state, correct = correctOrder()) {
  if (state.solved) return state;
  if (sameOrder(state.order, correct)) return { ...state, solved: true };
  return { ...state, mistakes: state.mistakes + 1 };
}

// Up to two hints: the first reveals the oldest work, the second the newest.
export function useHint(state) {
  if (state.solved || state.hints >= MAX_HINTS) return state;
  return { ...state, hints: state.hints + 1, revealed: [...state.revealed, hintTarget(state.hints)] };
}

export function isSolved(state) {
  return state.solved === true;
}

// The log, read from the backs of the cards in the player's (correct) order.
export function logEntries(state) {
  return state.order.map(id => LOG_BACKS[id]);
}
