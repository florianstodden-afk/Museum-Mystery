// Start at 100. Saved deductions only increase; successful actions never add points.
import { CASE, STATION_IDS } from './case-1.js';
import { elapsedMs, validPuzzle } from '../minigames/picture-rules.js';

export const STATION_MAX = 20;
export const STATION_MIN = 5;
export const MISTAKE_COST = 3;
export const HINT_COST = 5;
export const SAFE_MAX = 10;
export const ACCUSATION_MAX = 10;
export const POINTS_AFTER_MISTAKE = 5;
export const MAX_SCORE = 100;

const count = value => Number.isInteger(value) && value >= 0 ? value : 0;
export function stationPenalty(mistakes, hints) {
  return Math.min(STATION_MAX - STATION_MIN, count(mistakes) * MISTAKE_COST + count(hints) * HINT_COST);
}
// Retained for the existing station contract and old saves; these are not awards.
export function stationPoints(mistakes, hints) { return STATION_MAX - stationPenalty(mistakes, hints); }
export function safePoints(attempts) { return attempts === 0 ? SAFE_MAX : POINTS_AFTER_MISTAKE; }
export function accusationPoints(attempts) { return attempts === 0 ? ACCUSATION_MAX : POINTS_AFTER_MISTAKE; }

// Strict boundaries: exactly 30, 45 and 60 seconds stay in the lower tier.
export function puzzleTimePenalty(milliseconds) {
  if (milliseconds > 60000) return 15;
  if (milliseconds > 45000) return 10;
  if (milliseconds > 30000) return 5;
  return 0;
}

export function emptyPenalties() {
  return Object.fromEntries([...STATION_IDS, 'safe', 'accusation', 'picture'].map(id => [id, 0]));
}

// Migrate recorded mistakes, hints and old station points without resetting progress.
// max() makes repeated refreshes and completion callbacks idempotent.
export function penaltiesFor(state, progress = {}, now = Date.now()) {
  const penalties = { ...emptyPenalties(), ...state.penalties };
  for (const id of STATION_IDS) {
    const station = state.stations[id];
    const mistakes = Math.max(count(station.mistakes), count(progress[id]?.mistakes));
    const hints = Math.max(count(station.hints), count(progress[id]?.hints));
    const oldDeduction = station.solved ? Math.min(15, Math.max(0, STATION_MAX - station.points)) : 0;
    penalties[id] = Math.max(penalties[id], stationPenalty(mistakes, hints), oldDeduction);
  }
  penalties.safe = Math.max(penalties.safe, state.safe.attempts > 0 ? 5 : 0);
  penalties.accusation = Math.max(penalties.accusation, state.accusation.attempts > 0 ? 5 : 0);
  const puzzle = progress.restoration;
  // An old solved L has no timed attempt and must never receive a retroactive tier.
  if (validPuzzle(puzzle) && (!state.stations.restoration.solved || puzzle.finishedAt !== null)) {
    penalties.picture = Math.max(penalties.picture, puzzleTimePenalty(elapsedMs(puzzle, now)));
  }
  return penalties;
}

export function synchronizeScore(state, progress = {}, now = Date.now()) {
  const penalties = penaltiesFor(state, progress, now);
  if (state.penalties && Object.keys(penalties).every(id => penalties[id] === state.penalties[id])) return state;
  return { ...state, penalties };
}

export function scoreBreakdown(state) {
  const penalties = penaltiesFor(state);
  const rows = CASE.stations.map(station => ({
    id: station.id,
    label: `${station.room} (${station.letter})`,
    deduction: penalties[station.id],
    detail: `${state.stations[station.id].solved ? 'solved' : 'in progress'} · mistakes and paid hints (maximum −15)`,
  }));
  rows.push(
    { id: 'picture', label: 'Picture puzzle time', deduction: penalties.picture, detail: 'Highest time tier (maximum −15)' },
    { id: 'safe', label: 'Safe', deduction: penalties.safe, detail: `${state.safe.attempts} wrong word(s) (maximum −5)` },
    { id: 'accusation', label: 'Final question', deduction: penalties.accusation, detail: `${state.accusation.attempts} wrong answer(s) (maximum −5)` },
  );
  return rows;
}

export function totalScore(state) {
  return Math.max(0, MAX_SCORE - scoreBreakdown(state).reduce((sum, row) => sum + row.deduction, 0));
}
