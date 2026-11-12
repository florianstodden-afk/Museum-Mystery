// Points for "Museum Nocturne". Maximum: 4 stations × 20 + safe 10 + final question 10 = 100.
// No time-based scoring. The endings give no extra points.
import { CASE, STATION_IDS } from './case-1.js';

export const STATION_MAX = 20;
export const STATION_MIN = 5;
export const MISTAKE_COST = 3;
export const HINT_COST = 5;
export const SAFE_MAX = 10;
export const ACCUSATION_MAX = 10;
export const POINTS_AFTER_MISTAKE = 5;
export const MAX_SCORE = STATION_IDS.length * STATION_MAX + SAFE_MAX + ACCUSATION_MAX;

// Points for one solved station: 20 − 3 per mistake − 5 per hint, but never less than 5.
export function stationPoints(mistakes, hints) {
  const points = STATION_MAX - mistakes * MISTAKE_COST - hints * HINT_COST;
  return Math.max(STATION_MIN, points);
}

// `attempts` = number of WRONG code words before the safe opened.
export function safePoints(attempts) {
  return attempts === 0 ? SAFE_MAX : POINTS_AFTER_MISTAKE;
}

// `attempts` = number of WRONG answers before the right suspect was named.
export function accusationPoints(attempts) {
  return attempts === 0 ? ACCUSATION_MAX : POINTS_AFTER_MISTAKE;
}

// One row per scoring part, for the journal and the end screen.
export function scoreBreakdown(state) {
  const rows = CASE.stations.map(station => {
    const progress = state.stations[station.id];
    return {
      id: station.id,
      label: `${station.room} (${station.letter})`,
      points: progress.solved ? progress.points : 0,
      max: STATION_MAX,
      detail: progress.solved
        ? `${progress.mistakes} mistake(s), ${progress.hints} hint(s)`
        : 'not solved',
    };
  });
  rows.push({
    id: 'safe',
    label: 'Safe',
    points: state.safe.open ? safePoints(state.safe.attempts) : 0,
    max: SAFE_MAX,
    detail: state.safe.open ? `${state.safe.attempts} wrong word(s)` : 'closed',
  });
  rows.push({
    id: 'accusation',
    label: 'Final question',
    points: state.accusation.solved ? accusationPoints(state.accusation.attempts) : 0,
    max: ACCUSATION_MAX,
    detail: state.accusation.solved ? `${state.accusation.attempts} wrong answer(s)` : 'open',
  });
  return rows;
}

export function totalScore(state) {
  let total = 0;
  for (const row of scoreBreakdown(state)) total += row.points;
  return total;
}
