// Station I (Portrait Hall): pure rules, no DOM.
// Speedrun: press Start, memorise the dates during the "catalogue flash",
// then put the portraits in order, oldest first. Mistakes and peeks cost time, not points.
// A card is identified by its Met object ID.
import { CASE, workById } from '../story/case-1.js';

export const PORTRAIT_IDS = Object.freeze([...CASE.stations.find(station => station.id === 'portraits').metIds]);

export const FLASH_MS = 4000;     // reading time after Start: task and dates show, the clock waits
export const PEEK_MS = 1500;      // how long one date shows after Peek
export const PENALTY_MS = 5000;   // added to the clock for a peek or a wrong check

// The back of each card: one short line of the fictional night-shift log.
// Read in the right order (oldest → newest painting) they form the log.
export const LOG_BACKS = Object.freeze({
  436703: '20:48 · Shift change – Leon on duty',
  436121: '21:02 · Leon – east wing round',
  12127: '21:14 · Cart out – “patron visit, A. V.”',
  435876: '21:20 · Leon – back at the desk',
});

/** The correct order, from the frozen snapshot in case-1.js (start year first, then end year, then ID). */
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

/** A shuffled, never-solved start with the clock not yet running. */
export function initialTimeline(random = Math.random) {
  const order = [...PORTRAIT_IDS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (sameOrder(order, correctOrder())) order.push(order.shift());
  return { order, solved: false, mistakes: 0, hints: 0, startedAt: null, finishedAt: null, penaltyMs: 0, flashUntil: null, peek: null };
}

const isCount = value => Number.isInteger(value) && value >= 0;
const isTime = value => value === null || (Number.isFinite(value) && value >= 0);

/** Brings a save from before the speedrun up to date (missing time fields become "not started"). */
export function upgradeTimeline(saved) {
  if (!saved || typeof saved !== 'object') return saved;
  const { revealed, ...rest } = saved;   // `revealed` belonged to the old hint system
  return { startedAt: null, finishedAt: null, penaltyMs: 0, flashUntil: null, peek: null, ...rest };
}

/** Checks a (possibly old) saved state. Broken or foreign data returns false and the station starts fresh. */
export function validTimeline(saved) {
  const state = upgradeTimeline(saved);
  if (!state || typeof state !== 'object') return false;
  const { order, solved, mistakes, hints, startedAt, finishedAt, penaltyMs, flashUntil, peek } = state;
  if (!Array.isArray(order) || order.length !== PORTRAIT_IDS.length) return false;
  if (new Set(order).size !== order.length || !order.every(id => PORTRAIT_IDS.includes(id))) return false;
  if (typeof solved !== 'boolean' || !isCount(mistakes) || !isCount(hints) || !isCount(penaltyMs)) return false;
  if (!isTime(startedAt) || !isTime(finishedAt) || !isTime(flashUntil)) return false;
  if (finishedAt !== null && (startedAt === null || finishedAt < startedAt || !solved)) return false;
  if (peek !== null && (typeof peek !== 'object' || !PORTRAIT_IDS.includes(peek.id) || !isTime(peek.until))) return false;
  return !solved || sameOrder(order, correctOrder());
}

/** Start: all dates show for FLASH_MS (reading time), then the clock runs. Pressing it again (or reopening) changes nothing. */
export function startTimeline(state, now = Date.now()) {
  if (state.startedAt !== null || state.solved) return state;
  // An old save may already hold the right order; then the cards are mixed again, so there is always something to sort.
  const order = sameOrder(state.order, correctOrder()) ? [...state.order.slice(1), state.order[0]] : state.order;
  return { ...state, order, startedAt: now, flashUntil: now + FLASH_MS };
}

const playing = state => state.startedAt !== null && !state.solved;

/** Peek: shows one date for PEEK_MS and costs PENALTY_MS. Not needed (and not allowed) during the flash. */
export function peekDate(state, id, now = Date.now()) {
  if (!playing(state) || !PORTRAIT_IDS.includes(id) || now < state.flashUntil) return state;
  return { ...state, hints: state.hints + 1, penaltyMs: state.penaltyMs + PENALTY_MS, peek: { id, until: now + PEEK_MS } };
}

/** The cards whose date is visible right now. */
export function revealedDates(state, now = Date.now()) {
  if (state.solved) return [...PORTRAIT_IDS];
  if (state.flashUntil !== null && now < state.flashUntil) return [...PORTRAIT_IDS];
  if (state.peek && now < state.peek.until) return [state.peek.id];
  return [];
}

/** Moves one card to a new position; the others shift. Only while the clock runs. */
export function moveCard(state, card, toIndex) {
  const from = state.order.indexOf(card);
  if (!playing(state) || from === -1 || !Number.isInteger(toIndex) || toIndex < 0 || toIndex >= state.order.length) return state;
  if (from === toIndex) return state;
  const order = state.order.filter(id => id !== card);
  order.splice(toIndex, 0, card);
  return { ...state, order };
}

/** Swaps two cards (click one, then another, or press two numbers). */
export function swapCards(state, a, b) {
  const indexA = state.order.indexOf(a);
  const indexB = state.order.indexOf(b);
  if (!playing(state) || indexA === -1 || indexB === -1 || a === b) return state;
  const order = [...state.order];
  order[indexA] = b;
  order[indexB] = a;
  return { ...state, order };
}

/** "Check order" (after the reading time): right stops the clock; wrong counts a mistake and adds PENALTY_MS. */
export function checkOrder(state, now = Date.now(), correct = correctOrder()) {
  if (!playing(state) || now < state.flashUntil) return state;   // no checking during the reading time
  if (sameOrder(state.order, correct)) return { ...state, solved: true, finishedAt: Math.max(now, state.startedAt), peek: null };
  return { ...state, mistakes: state.mistakes + 1, penaltyMs: state.penaltyMs + PENALTY_MS };
}

/** Time on the clock: from the end of the reading time (flash) until now, plus all penalties. Stops when solved. */
export function elapsedMs(state, now = Date.now()) {
  if (!state || state.startedAt == null) return 0;
  const clockStart = state.flashUntil ?? state.startedAt;   // the reading time does not count
  return Math.max(0, (state.finishedAt ?? now) - clockStart) + (state.penaltyMs ?? 0);
}

/** True once the right order was checked. */
export function isSolved(state) {
  return state.solved === true;
}

/** The log, read from the backs of the cards in the player's (correct) order. */
export function logEntries(state) {
  return state.order.map(id => LOG_BACKS[id]);
}
